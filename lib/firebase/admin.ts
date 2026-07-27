import "server-only";

import {
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app";
import { getAppCheck } from "firebase-admin/app-check";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App | null = null;

function adminEmulatorsEnabled() {
  return process.env.FIREBASE_ADMIN_USE_EMULATORS === "true";
}

function privateKey() {
  return process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
}

export function adminIsConfigured() {
  if (adminEmulatorsEnabled()) {
    return Boolean(process.env.FIREBASE_ADMIN_PROJECT_ID);
  }
  return Boolean(
    process.env.FIREBASE_ADMIN_PROJECT_ID &&
      process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      privateKey(),
  );
}

export function getAdminApp() {
  if (adminApp) return adminApp;
  if (!adminIsConfigured()) {
    throw new Error("Firebase Admin yapılandırması eksik.");
  }

  if (adminEmulatorsEnabled()) {
    adminApp =
      getApps()[0] ??
      initializeApp({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      });
    return adminApp;
  }

  adminApp =
    getApps()[0] ??
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: privateKey(),
      }),
    });
  return adminApp;
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

export async function verifyAdminRequest(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new AdminAuthorizationError("Oturum gerekli.", 401);
  }

  const token = authorization.slice(7);
  let decoded;
  try {
    decoded = await getAuth(getAdminApp()).verifyIdToken(token, true);
  } catch {
    throw new AdminAuthorizationError("Oturum doğrulanamadı.", 401);
  }

  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLocaleLowerCase("tr-TR"))
    .filter(Boolean);
  const email = decoded.email?.toLocaleLowerCase("tr-TR");

  if (!email || !decoded.email_verified || !allowlist.includes(email)) {
    throw new AdminAuthorizationError("Bu hesaba yönetici yetkisi verilmemiş.", 403);
  }

  return { uid: decoded.uid, email };
}

export async function verifyOptionalAppCheck(request: Request) {
  if (process.env.REQUIRE_APP_CHECK !== "true") return true;
  const token = request.headers.get("x-firebase-appcheck");
  if (!token) return false;
  try {
    await getAppCheck(getAdminApp()).verifyToken(token);
    return true;
  } catch {
    return false;
  }
}

export class AdminAuthorizationError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}
