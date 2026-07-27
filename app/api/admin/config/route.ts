import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-api";
import { getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const schema = z.object({
  scholarshipApplicationsEnabled: z.boolean(),
});

export async function PATCH(request: Request) {
  const admin = await requireAdmin(request);
  if (admin instanceof NextResponse) return admin;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Ayar doğrulanamadı." }, { status: 400 });
  }
  if (
    parsed.data.scholarshipApplicationsEnabled &&
    (!process.env.DATA_CONTROLLER_NAME || !process.env.DATA_CONTROLLER_EMAIL)
  ) {
    return NextResponse.json(
      {
        error:
          "Burs başvuruları, veri sorumlusu adı ve iletişim adresi tanımlanmadan açılamaz.",
      },
      { status: 409 },
    );
  }

  const db = getAdminDb();
  const configRef = db.collection("system_config").doc("scholarship");
  const current = await configRef.get();
  const batch = db.batch();
  batch.set(
    configRef,
    {
      enabled: parsed.data.scholarshipApplicationsEnabled,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: admin.email,
    },
    { merge: true },
  );
  batch.set(db.collection("admin_audit_logs").doc(), {
    action: "scholarship.enabled_changed",
    targetType: "system_config",
    targetId: "scholarship",
    beforeEnabled: current.data()?.enabled === true,
    afterEnabled: parsed.data.scholarshipApplicationsEnabled,
    actorUid: admin.uid,
    actorEmail: admin.email,
    createdAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();
  return NextResponse.json({ ok: true });
}

