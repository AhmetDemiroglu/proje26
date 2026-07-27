import { FieldPath } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { requireAdmin, safeDocument } from "@/lib/admin-api";
import { calculateSubmissionStatistics } from "@/lib/admin-statistics";
import { getAdminDb } from "@/lib/firebase/admin";
import {
  mergeResearchAggregateShards,
  RESEARCH_AGGREGATE_SHARD_COUNT,
} from "@/lib/research-aggregate";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  const url = new URL(request.url);
  const days = Math.min(Math.max(Number(url.searchParams.get("days")) || 30, 7), 90);
  const end = new Date();
  const start = new Date(end.getTime() - (days - 1) * 86_400_000);
  const startKey = start.toLocaleDateString("en-CA", {
    timeZone: "Europe/Istanbul",
  });
  const endKey = end.toLocaleDateString("en-CA", {
    timeZone: "Europe/Istanbul",
  });
  const db = getAdminDb();
  const aggregateRefs = Array.from(
    { length: RESEARCH_AGGREGATE_SHARD_COUNT },
    (_, index) =>
      db.collection("research_aggregate_shards").doc(`2026_${index}`),
  );

  const [
    dailySnapshot,
    aggregateSnapshots,
    submissionCount,
    scholarshipCount,
    donorCount,
    pendingDonorCount,
    activeScholarshipCount,
    recentEvents,
    config,
  ] = await Promise.all([
    db
      .collection("analytics_daily")
      .orderBy(FieldPath.documentId())
      .startAt(startKey)
      .endAt(endKey)
      .get(),
    db.getAll(...aggregateRefs),
    db.collection("submissions").count().get(),
    db.collection("scholarship_profiles").count().get(),
    db.collection("donor_applications").count().get(),
    db
      .collection("donor_applications")
      .where("status", "==", "pending_review")
      .count()
      .get(),
    db
      .collection("scholarship_profiles")
      .where("status", "==", "active")
      .count()
      .get(),
    db
      .collection("analytics_events")
      .orderBy("createdAt", "desc")
      .limit(20)
      .get(),
    db.collection("system_config").doc("scholarship").get(),
  ]);

  const daily: Array<Record<string, unknown> & { day: string }> =
    dailySnapshot.docs.map((document) => ({
      day: document.id,
      ...document.data(),
    }));
  const totals = daily.reduce(
    (sum, row) => ({
      pageViews: sum.pageViews + Number(row.pageViews ?? 0),
      uniqueSessions: sum.uniqueSessions + Number(row.uniqueSessions ?? 0),
      analyzerStarts: sum.analyzerStarts + Number(row.analyzerStarts ?? 0),
      analyzerCompletions:
        sum.analyzerCompletions + Number(row.analyzerCompletions ?? 0),
      scholarshipOptins:
        sum.scholarshipOptins + Number(row.scholarshipOptins ?? 0),
      donorApplications:
        sum.donorApplications + Number(row.donorApplications ?? 0),
    }),
    {
      pageViews: 0,
      uniqueSessions: 0,
      analyzerStarts: 0,
      analyzerCompletions: 0,
      scholarshipOptins: 0,
      donorApplications: 0,
    },
  );

  const cityTotals: Record<string, number> = {};
  for (const row of daily) {
    for (const [city, count] of Object.entries(
      (row.cities as Record<string, number> | undefined) ?? {},
    )) {
      cityTotals[city] = (cityTotals[city] ?? 0) + Number(count);
    }
  }
  const totalSubmissionCount = submissionCount.data().count;
  let submissionStatistics = mergeResearchAggregateShards(
    aggregateSnapshots
      .filter((snapshot) => snapshot.exists)
      .map((snapshot) => snapshot.data() ?? {}),
  );
  let statisticsAreSampled =
    submissionStatistics.sampleSize !== totalSubmissionCount;
  if (statisticsAreSampled) {
    const fallbackSnapshot = await db
      .collection("submissions")
      .orderBy("createdAt", "desc")
      .limit(500)
      .get();
    submissionStatistics = calculateSubmissionStatistics(
      fallbackSnapshot.docs.map((document) => document.data()),
    );
    statisticsAreSampled =
      submissionStatistics.sampleSize !== totalSubmissionCount;
  }

  return NextResponse.json({
    period: { days, start: startKey, end: endKey },
    totals,
    allTime: {
      submissions: submissionCount.data().count,
      scholarshipProfiles: scholarshipCount.data().count,
      activeScholarships: activeScholarshipCount.data().count,
      donorApplications: donorCount.data().count,
      pendingDonors: pendingDonorCount.data().count,
    },
    daily,
    cities: Object.entries(cityTotals)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20),
    submissionStatistics: {
      ...submissionStatistics,
      isSample: statisticsAreSampled,
      totalAvailable: totalSubmissionCount,
    },
    recentEvents: recentEvents.docs.map((document) =>
      safeDocument(document.id, document.data()),
    ),
    config: {
      scholarshipApplicationsEnabled:
        config.exists && config.data()?.enabled === true,
      legalNoticeReady: Boolean(
        process.env.DATA_CONTROLLER_NAME && process.env.DATA_CONTROLLER_EMAIL,
      ),
    },
  });
}
