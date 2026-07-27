import { NextResponse } from "next/server";
import { requireAdmin, safeDocument } from "@/lib/admin-api";
import { getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  const snapshot = await getAdminDb()
    .collection("admin_audit_logs")
    .orderBy("createdAt", "desc")
    .limit(250)
    .get();
  return NextResponse.json({
    rows: snapshot.docs.map((document) =>
      safeDocument(document.id, document.data()),
    ),
    limit: 250,
  });
}

