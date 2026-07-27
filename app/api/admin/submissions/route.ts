import { NextResponse } from "next/server";
import { requireAdmin, safeDocument } from "@/lib/admin-api";
import { getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  const url = new URL(request.url);
  const scoreType = url.searchParams.get("scoreType");
  const minRank = Number(url.searchParams.get("minRank")) || 0;
  const maxRank = Number(url.searchParams.get("maxRank")) || 5_000_000;
  const snapshot = await getAdminDb()
    .collection("submissions")
    .orderBy("createdAt", "desc")
    .limit(250)
    .get();

  const rows = snapshot.docs
    .map((document) => safeDocument(document.id, document.data()))
    .filter((row) => {
      const scores = row.scores as
        | Record<string, { rank?: number }>
        | undefined;
      if (!scores) return false;
      const entries = Object.entries(scores).filter(
        ([type]) => !scoreType || type === scoreType,
      );
      return entries.some(
        ([, score]) =>
          score &&
          Number(score.rank) >= minRank &&
          Number(score.rank) <= maxRank,
      );
    });

  return NextResponse.json({ rows, scanned: snapshot.size, limit: 250 });
}
