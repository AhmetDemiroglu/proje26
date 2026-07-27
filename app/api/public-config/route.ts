import { NextResponse } from "next/server";
import { adminIsConfigured, getAdminDb } from "@/lib/firebase/admin";

export const runtime = "nodejs";

export async function GET() {
  if (!adminIsConfigured()) {
    return NextResponse.json(
      { scholarshipApplicationsEnabled: false },
      { headers: { "cache-control": "no-store" } },
    );
  }

  const snapshot = await getAdminDb()
    .collection("system_config")
    .doc("scholarship")
    .get();
  return NextResponse.json(
    {
      scholarshipApplicationsEnabled:
        snapshot.exists && snapshot.data()?.enabled === true,
    },
    { headers: { "cache-control": "no-store" } },
  );
}

