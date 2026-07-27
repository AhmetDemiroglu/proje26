import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, safeDocument } from "@/lib/admin-api";
import { getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const updateSchema = z.object({
  id: z.string().min(5).max(100),
  status: z.enum(["pending_review", "approved", "rejected", "paused"]),
  reviewNote: z.string().max(1000).optional(),
});

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const snapshot = await getAdminDb()
    .collection("donor_applications")
    .orderBy("createdAt", "desc")
    .limit(250)
    .get();
  const rows = snapshot.docs
    .map((document) => safeDocument(document.id, document.data()))
    .filter((row) => !status || row.status === status);
  return NextResponse.json({ rows, scanned: snapshot.size, limit: 250 });
}

export async function PATCH(request: Request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Güncelleme doğrulanamadı." }, { status: 400 });
  }

  const reference = getAdminDb()
    .collection("donor_applications")
    .doc(parsed.data.id);
  const snapshot = await reference.get();
  if (!snapshot.exists) {
    return NextResponse.json({ error: "Başvuru bulunamadı." }, { status: 404 });
  }

  const db = getAdminDb();
  const batch = db.batch();
  batch.update(reference, {
    status: parsed.data.status,
    reviewNote: parsed.data.reviewNote?.trim() || null,
    reviewedAt: FieldValue.serverTimestamp(),
    reviewedBy: admin.email,
  });
  batch.set(db.collection("admin_audit_logs").doc(), {
    action: "donor.status_changed",
    targetType: "donor_application",
    targetId: parsed.data.id,
    beforeStatus: snapshot.data()?.status ?? null,
    afterStatus: parsed.data.status,
    hasReviewNote: Boolean(parsed.data.reviewNote?.trim()),
    actorUid: admin.uid,
    actorEmail: admin.email,
    createdAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();
  return NextResponse.json({ ok: true });
}
