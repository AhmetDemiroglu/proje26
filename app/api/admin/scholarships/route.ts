import { NextResponse } from "next/server";
import { requireAdmin, safeDocument } from "@/lib/admin-api";
import { getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const scoreType = url.searchParams.get("scoreType");
  const snapshot = await getAdminDb()
    .collection("scholarship_profiles")
    .orderBy("createdAt", "desc")
    .limit(250)
    .get();

  const rows = snapshot.docs
    .map((document) => safeDocument(document.id, document.data()))
    .filter((row) => {
      if (status && row.status !== status) return false;
      if (
        scoreType &&
        !(scoreType in ((row.scores as Record<string, unknown>) ?? {}))
      ) {
        return false;
      }
      return true;
    });

  return NextResponse.json({ rows, scanned: snapshot.size, limit: 250 });
}

