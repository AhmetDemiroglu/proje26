import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { z } from "zod";
import {
  adminIsConfigured,
  getAdminDb,
  verifyOptionalAppCheck,
} from "@/lib/firebase/admin";
import {
  addSubmissionToResearchAggregate,
  aggregateShardForSubmissionId,
} from "@/lib/research-aggregate";

export const runtime = "nodejs";

const schema = z.object({
  submissionId: z.string().min(10).max(100).regex(/^[A-Za-z0-9_-]+$/),
});

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!adminIsConfigured()) return new NextResponse(null, { status: 204 });
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Geçersiz istek kaynağı." }, { status: 403 });
  }
  if (!(await verifyOptionalAppCheck(request))) {
    return NextResponse.json({ error: "Uygulama doğrulanamadı." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Kayıt kimliği doğrulanamadı." }, { status: 400 });
  }

  const db = getAdminDb();
  const submissionRef = db.collection("submissions").doc(parsed.data.submissionId);
  const shardNumber = aggregateShardForSubmissionId(parsed.data.submissionId);
  const shardRef = db
    .collection("research_aggregate_shards")
    .doc(`2026_${shardNumber}`);
  let alreadyAggregated = false;
  let submissionMissing = false;

  await db.runTransaction(async (transaction) => {
    const submissionSnapshot = await transaction.get(submissionRef);
    if (!submissionSnapshot.exists) {
      submissionMissing = true;
      return;
    }
    if (submissionSnapshot.data()?.aggregatedAt) {
      alreadyAggregated = true;
      return;
    }
    const shardSnapshot = await transaction.get(shardRef);
    const aggregate = addSubmissionToResearchAggregate(
      shardSnapshot.exists ? shardSnapshot.data() : undefined,
      submissionSnapshot.data() ?? {},
    );
    transaction.set(shardRef, {
      ...aggregate,
      shard: shardNumber,
      updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.update(submissionRef, {
      aggregatedAt: FieldValue.serverTimestamp(),
      aggregateShard: shardNumber,
    });
  });

  if (submissionMissing) {
    return NextResponse.json({ error: "Araştırma kaydı bulunamadı." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, alreadyAggregated });
}
