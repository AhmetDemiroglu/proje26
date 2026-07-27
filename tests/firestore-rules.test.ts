import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { afterAll, beforeAll, describe, it } from "vitest";

let testEnv: RulesTestEnvironment;

const scores = {
  SAY: { rank: 42_680, placementScore: 412.482 },
};

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "demo-tercihce",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("Firestore güvenlik kuralları", () => {
  it("anonim ve şemaya uygun araştırma kaydına izin verir", async () => {
    const db = testEnv
      .authenticatedContext("anonymous-1", {
        firebase: { sign_in_provider: "anonymous" },
      })
      .firestore();

    await assertSucceeds(
      setDoc(doc(db, "submissions", "valid"), {
        schemaVersion: 1,
        examYear: 2026,
        scoreTypes: ["SAY"],
        scores,
        interest: {
          degree: "lisans",
          universityTypes: ["DEVLET"],
          funding: "all",
          cityCount: 1,
          hasProgramQuery: true,
        },
        consentVersion: "2026-1",
        source: "web",
        createdAt: serverTimestamp(),
      }),
    );
  });

  it("ziyaretçinin araştırma kayıtlarını okumasını engeller", async () => {
    const db = testEnv
      .authenticatedContext("anonymous-1", {
        firebase: { sign_in_provider: "anonymous" },
      })
      .firestore();
    await assertFails(getDoc(doc(db, "submissions", "valid")));
  });

  it("ek kişisel veri alanı içeren kaydı reddeder", async () => {
    const db = testEnv
      .authenticatedContext("anonymous-2", {
        firebase: { sign_in_provider: "anonymous" },
      })
      .firestore();
    await assertFails(
      setDoc(doc(db, "submissions", "with-email"), {
        schemaVersion: 1,
        examYear: 2026,
        scoreTypes: ["SAY"],
        scores,
        email: "ogrenci@example.com",
        interest: {
          degree: "all",
          universityTypes: [],
          funding: "all",
          cityCount: 0,
          hasProgramQuery: false,
        },
        consentVersion: "2026-1",
        source: "web",
        createdAt: serverTimestamp(),
      }),
    );
  });

  it("burs profilini özel koleksiyonda tutar ve doğrulanmış e-postayla aktifleştirir", async () => {
    const uid = "scholarship-user";
    const anonymousDb = testEnv
      .authenticatedContext(uid, {
        firebase: { sign_in_provider: "anonymous" },
      })
      .firestore();
    const profileRef = doc(anonymousDb, "scholarship_profiles", uid);
    const profileData = {
      schemaVersion: 1,
      examYear: 2026,
      name: "Deniz",
      email: "deniz@example.com",
      ageGroup: "adult",
      scores,
      preferences: {
        degree: "lisans",
        cities: ["Ankara"],
        universityTypes: ["DEVLET"],
        funding: "all",
        programQuery: "bilgisayar",
      },
      submissionId: null,
      status: "pending_email_verification",
      contactShareMode: "student_approval_required",
      consentVersion: "scholarship-2026-1",
      noticeVersion: "scholarship-2026-1",
      source: "web",
      createdAt: serverTimestamp(),
    };

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "system_config", "scholarship"), {
        enabled: false,
      });
    });
    await assertFails(setDoc(profileRef, profileData));

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "system_config", "scholarship"), {
        enabled: true,
      });
    });
    await assertSucceeds(
      setDoc(profileRef, profileData),
    );

    await assertFails(getDoc(profileRef));

    const verifiedDb = testEnv
      .authenticatedContext(uid, {
        email: "deniz@example.com",
        email_verified: true,
        firebase: { sign_in_provider: "password" },
      })
      .firestore();
    await assertSucceeds(
      updateDoc(doc(verifiedDb, "scholarship_profiles", uid), {
        status: "active",
        verifiedAt: serverTimestamp(),
      }),
    );
  });

  it("destekçi başvurusunu kabul eder fakat istemci okumalarını engeller", async () => {
    const db = testEnv
      .authenticatedContext("donor-user", {
        firebase: { sign_in_provider: "anonymous" },
      })
      .firestore();
    const applicationRef = doc(db, "donor_applications", "valid-donor");

    await assertSucceeds(
      setDoc(applicationRef, {
        schemaVersion: 1,
        donorType: "organization",
        name: "Ayşe Yılmaz",
        organizationName: "Örnek Eğitim Vakfı",
        email: "ayse@example.com",
        supportTypes: ["monthly", "technology"],
        estimatedStudents: 12,
        note: "Öğrencilere düzenli eğitim desteği sunmak istiyoruz.",
        status: "pending_review",
        consentVersion: "donor-2026-1",
        source: "web",
        createdAt: serverTimestamp(),
      }),
    );
    await assertFails(getDoc(applicationRef));
  });

  it("analitik ve sistem belgelerine istemci erişimini reddeder", async () => {
    const db = testEnv
      .authenticatedContext("analytics-user", {
        firebase: { sign_in_provider: "anonymous" },
      })
      .firestore();
    await assertFails(getDoc(doc(db, "analytics_daily", "2026-07-24")));
    await assertFails(
      setDoc(doc(db, "analytics_daily", "2026-07-24"), {
        pageViews: 999999,
      }),
    );
    await assertFails(getDoc(doc(db, "admin_audit_logs", "hidden")));
    await assertFails(getDoc(doc(db, "research_aggregate_shards", "2026_0")));
    await assertFails(getDoc(doc(db, "system_config", "scholarship")));
  });
});
