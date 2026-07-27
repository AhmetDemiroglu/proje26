import { createHmac } from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { z } from "zod";
import { ANALYTICS_EVENTS } from "@/lib/analytics";
import {
  adminIsConfigured,
  getAdminDb,
  verifyOptionalAppCheck,
} from "@/lib/firebase/admin";

export const runtime = "nodejs";

const bodySchema = z.object({
  event: z.enum(ANALYTICS_EVENTS),
  path: z.string().startsWith("/").max(120),
  sessionId: z.string().uuid(),
  resultCount: z.number().int().min(0).max(1000).optional(),
});

const BOT_PATTERN =
  /bot|crawler|spider|headless|lighthouse|preview|facebookexternalhit|slurp|bingpreview|uptimerobot|curl|wget|python-requests/i;

function cleanGeoHeader(value: string | null, fallback: string) {
  if (!value) return fallback;
  try {
    return decodeURIComponent(value).replace(/[^\p{L}\p{N}\s.'-]/gu, "").slice(0, 60) || fallback;
  } catch {
    return fallback;
  }
}

function deviceGroup(userAgent: string) {
  if (/tablet|ipad/i.test(userAgent)) return "tablet";
  if (/mobile|android|iphone/i.test(userAgent)) return "mobile";
  return "desktop";
}

function dayKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export async function POST(request: Request) {
  const salt = process.env.ANALYTICS_HASH_SALT;
  if (!adminIsConfigured() || !salt || salt.length < 32) {
    return new NextResponse(null, { status: 204 });
  }

  const userAgent = request.headers.get("user-agent") ?? "";
  if (!userAgent || BOT_PATTERN.test(userAgent)) {
    return new NextResponse(null, { status: 204 });
  }
  if (!(await verifyOptionalAppCheck(request))) {
    return NextResponse.json({ error: "Uygulama doğrulanamadı." }, { status: 401 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 4_000) {
    return NextResponse.json({ error: "İstek çok büyük." }, { status: 413 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Olay doğrulanamadı." }, { status: 400 });
  }

  const db = getAdminDb();
  const day = dayKey();
  const city = cleanGeoHeader(request.headers.get("x-vercel-ip-city"), "Bilinmiyor");
  const region = cleanGeoHeader(
    request.headers.get("x-vercel-ip-country-region"),
    "Bilinmiyor",
  );
  const sessionHash = createHmac("sha256", salt)
    .update(`${day}:${parsed.data.sessionId}`)
    .digest("hex");
  const sessionRef = db.collection("analytics_sessions").doc(`${day}_${sessionHash}`);
  const dailyRef = db.collection("analytics_daily").doc(day);
  const eventField = {
    page_view: "pageViews",
    analyzer_started: "analyzerStarts",
    analyzer_completed: "analyzerCompletions",
    scholarship_optin: "scholarshipOptins",
    donor_application: "donorApplications",
  }[parsed.data.event];

  await db.runTransaction(async (transaction) => {
    const sessionSnapshot = await transaction.get(sessionRef);
    const dailySnapshot = await transaction.get(dailyRef);
    const existing = dailySnapshot.data() ?? {};
    const cities = {
      ...((existing.cities as Record<string, number> | undefined) ?? {}),
    };
    const devices = {
      ...((existing.devices as Record<string, number> | undefined) ?? {}),
    };
    const device = deviceGroup(userAgent);
    if (parsed.data.event === "page_view") {
      cities[city] = (cities[city] ?? 0) + 1;
      devices[device] = (devices[device] ?? 0) + 1;
    }
    const updates: Record<string, unknown> = {
      day,
      updatedAt: FieldValue.serverTimestamp(),
      [eventField]: Number(existing[eventField] ?? 0) + 1,
      cities,
      devices,
    };

    if (!sessionSnapshot.exists) {
      updates.uniqueSessions = Number(existing.uniqueSessions ?? 0) + 1;
      transaction.create(sessionRef, {
        day,
        sessionHash,
        city,
        region,
        firstSeenAt: FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 95),
      });
    }
    transaction.set(dailyRef, updates, { merge: true });
  });

  if (parsed.data.event !== "page_view") {
    await db.collection("analytics_events").add({
      ...parsed.data,
      sessionId: sessionHash,
      city,
      region,
      device: deviceGroup(userAgent),
      day,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 395),
    });
  }

  return new NextResponse(null, { status: 204 });
}
