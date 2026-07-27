import { spawn } from "node:child_process";
import process from "node:process";

const projectId = "demo-tercihce-e2e";
const adminEmail = "admin-e2e@example.com";
const adminPassword = "Local-Test-Only-2026!";
const baseUrl = "http://127.0.0.1:3100";
const testEnv = {
  ...process.env,
  FIREBASE_ADMIN_PROJECT_ID: projectId,
  FIREBASE_ADMIN_USE_EMULATORS: "true",
  FIRESTORE_EMULATOR_HOST: "127.0.0.1:8080",
  FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:9099",
  ANALYTICS_HASH_SALT: "tercihce-local-backend-test-secret-2026",
  ADMIN_EMAILS: adminEmail,
  DATA_CONTROLLER_NAME: "Tercihçe E2E",
  DATA_CONTROLLER_EMAIL: "privacy-e2e@example.com",
  REQUIRE_APP_CHECK: "false",
};
for (const [key, value] of Object.entries(testEnv)) {
  if (typeof value === "string") process.env[key] = value;
}

function start(command, args) {
  const logs = [];
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: testEnv,
    detached: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  for (const stream of [child.stdout, child.stderr]) {
    stream.on("data", (chunk) => {
      logs.push(chunk.toString());
      if (logs.length > 200) logs.shift();
    });
  }
  return { child, logs };
}

async function waitForUrl(url, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      await fetch(url);
      return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }
  throw new Error(`${url} zamanında açılmadı.`);
}

async function stop(processInfo) {
  if (!processInfo) return;
  const groupId = -processInfo.child.pid;
  try {
    process.kill(groupId, "SIGTERM");
  } catch {
    processInfo.child.kill("SIGTERM");
  }
  await new Promise((resolve) => setTimeout(resolve, 1_000));
  try {
    process.kill(groupId, "SIGKILL");
  } catch {
    // Süreç grubu normal biçimde kapanmış olabilir.
  }
}

async function jsonRequest(path, token, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`${path} ${response.status}: ${JSON.stringify(payload)}`);
  }
  return payload;
}

let emulators;
let nextServer;

try {
  emulators = start("npx", [
    "--yes",
    "firebase-tools@14.18.0",
    "emulators:start",
    "--project",
    projectId,
    "--only",
    "auth,firestore",
  ]);
  await waitForUrl("http://127.0.0.1:9099/");

  nextServer = start("npm", ["run", "dev", "--", "--port", "3100"]);
  await waitForUrl(`${baseUrl}/api/public-config`);

  const { initializeApp, deleteApp } = await import("firebase-admin/app");
  const { getAuth } = await import("firebase-admin/auth");
  const { FieldValue, getFirestore } = await import(
    "firebase-admin/firestore"
  );
  const seedApp = initializeApp({ projectId }, "tercihce-e2e-seed");
  const auth = getAuth(seedApp);
  const db = getFirestore(seedApp);

  const existing = await auth.getUserByEmail(adminEmail).catch(() => null);
  if (existing) await auth.deleteUser(existing.uid);
  await auth.createUser({
    email: adminEmail,
    password: adminPassword,
    emailVerified: true,
  });
  const signInResponse = await fetch(
    "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key",
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
        returnSecureToken: true,
      }),
    },
  );
  const signIn = await signInResponse.json();
  if (!signInResponse.ok || !signIn.idToken) {
    throw new Error(`Yönetici test oturumu açılamadı: ${JSON.stringify(signIn)}`);
  }

  const submission = await db.collection("submissions").add({
    scores: {
      SAY: { rank: 42_000, placementScore: 410 },
    },
    interest: {
      degree: "lisans",
      funding: "all",
      universityTypes: ["DEVLET"],
    },
    createdAt: FieldValue.serverTimestamp(),
  });
  const donor = await db.collection("donor_applications").add({
    name: "E2E Destekçi",
    email: "donor-e2e@example.com",
    status: "pending_review",
    createdAt: FieldValue.serverTimestamp(),
  });
  const firstAggregation = await jsonRequest(
    "/api/research-aggregate",
    null,
    {
      method: "POST",
      body: JSON.stringify({ submissionId: submission.id }),
    },
  );
  const secondAggregation = await jsonRequest(
    "/api/research-aggregate",
    null,
    {
      method: "POST",
      body: JSON.stringify({ submissionId: submission.id }),
    },
  );
  if (
    firstAggregation.alreadyAggregated !== false ||
    secondAggregation.alreadyAggregated !== true
  ) {
    throw new Error("Araştırma toplulaştırması idempotent çalışmadı.");
  }

  const sessionId = "80547f5a-7440-4ee8-a3be-0f17a61a4b7c";
  for (const event of [
    "page_view",
    "analyzer_started",
    "analyzer_completed",
  ]) {
    const response = await fetch(`${baseUrl}/api/analytics`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "Mozilla/5.0 TercihceE2E",
        "x-vercel-ip-city": "Istanbul",
        "x-vercel-ip-country-region": "34",
      },
      body: JSON.stringify({
        event,
        path: "/",
        sessionId,
        ...(event === "analyzer_completed" ? { resultCount: 25 } : {}),
      }),
    });
    if (response.status !== 204) {
      throw new Error(`Analitik ${event} isteği ${response.status} döndürdü.`);
    }
  }

  const unauthorized = await fetch(`${baseUrl}/api/admin/overview`);
  if (unauthorized.status !== 401) {
    throw new Error("Yetkisiz yönetim isteği reddedilmedi.");
  }

  const overview = await jsonRequest(
    "/api/admin/overview?days=7",
    signIn.idToken,
  );
  if (
    overview.totals.pageViews !== 1 ||
    overview.totals.uniqueSessions !== 1 ||
    overview.totals.analyzerStarts !== 1 ||
    overview.totals.analyzerCompletions !== 1 ||
    overview.allTime.submissions !== 1 ||
    overview.allTime.donorApplications !== 1 ||
    overview.submissionStatistics.scores.SAY.averagePlacementScore !== 410 ||
    overview.submissionStatistics.isSample !== false
  ) {
    throw new Error(`Yönetim özeti bekleneni vermedi: ${JSON.stringify(overview)}`);
  }

  await jsonRequest("/api/admin/donors", signIn.idToken, {
    method: "PATCH",
    body: JSON.stringify({
      id: donor.id,
      status: "approved",
      reviewNote: "E2E doğrulaması",
    }),
  });
  await jsonRequest("/api/admin/config", signIn.idToken, {
    method: "PATCH",
    body: JSON.stringify({ scholarshipApplicationsEnabled: true }),
  });

  const audit = await jsonRequest("/api/admin/audit", signIn.idToken);
  if (
    audit.rows.length !== 2 ||
    !audit.rows.some((row) => row.action === "donor.status_changed") ||
    !audit.rows.some((row) => row.action === "scholarship.enabled_changed")
  ) {
    throw new Error(`İşlem günlüğü tamamlanmadı: ${JSON.stringify(audit)}`);
  }
  const publicConfig = await jsonRequest("/api/public-config", null);
  if (publicConfig.scholarshipApplicationsEnabled !== true) {
    throw new Error("Burs sistemi genel yapılandırmaya yansımadı.");
  }

  await deleteApp(seedApp);
  console.log(
    "E2E_BACKEND_OK analytics=3 aggregate=idempotent admin_auth=ok stats=exact donor=approved audit=2 config=enabled",
  );
} catch (error) {
  if (emulators) {
    console.error("\nFirebase emulator log:\n", emulators.logs.slice(-40).join(""));
  }
  if (nextServer) {
    console.error("\nNext.js log:\n", nextServer.logs.slice(-40).join(""));
  }
  throw error;
} finally {
  await stop(nextServer);
  await stop(emulators);
}
