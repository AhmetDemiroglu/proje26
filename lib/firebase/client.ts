"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  GoogleAuthProvider,
  connectAuthEmulator,
  EmailAuthProvider,
  getAuth,
  isSignInWithEmailLink,
  linkWithCredential,
  onAuthStateChanged,
  sendSignInLinkToEmail,
  signInWithPopup,
  signInWithEmailLink,
  signInAnonymously,
  signOut,
  type Auth,
  type User,
} from "firebase/auth";
import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  doc,
  getFirestore,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Firestore,
} from "firebase/firestore";
import {
  getToken,
  initializeAppCheck,
  ReCaptchaV3Provider,
  type AppCheck,
} from "firebase/app-check";
import { rankBand } from "../scoring";
import type {
  CandidateNets,
  CandidatePreferences,
  CandidateScores,
  MatchBand,
  ProgramRecord,
  ScholarshipProfileInput,
  ScoreType,
} from "../types";

type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  appCheck: AppCheck | null;
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let services: FirebaseServices | null = null;
let emulatorsConnected = false;

export function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId,
  );
}

function getServices(): FirebaseServices {
  if (services) return services;
  if (!isFirebaseConfigured()) {
    throw new Error("Firebase yapılandırması eksik.");
  }

  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const useEmulators =
    process.env.NEXT_PUBLIC_FIREBASE_USE_EMULATORS === "true";

  if (useEmulators && !emulatorsConnected) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    emulatorsConnected = true;
  }

  let appCheck: AppCheck | null = null;
  const siteKey = process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_SITE_KEY;
  if (siteKey && typeof window !== "undefined") {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(siteKey),
      isTokenAutoRefreshEnabled: true,
    });
  }

  services = { app, auth, db, appCheck };
  return services;
}

async function ensureAnonymousSession(auth: Auth) {
  if (auth.currentUser) return auth.currentUser;
  const credential = await signInAnonymously(auth);
  return credential.user;
}

function compactNets(nets: CandidateNets) {
  return Object.fromEntries(
    Object.entries(nets).filter(([, value]) => Number.isFinite(value)),
  );
}

export async function saveAnonymousSubmission(input: {
  scores: CandidateScores;
  nets: CandidateNets;
  preferences: CandidatePreferences;
}) {
  const { auth, db, appCheck } = getServices();
  await ensureAnonymousSession(auth);
  const scoreTypes = Object.keys(input.scores) as ScoreType[];
  const nets = compactNets(input.nets);

  const result = await addDoc(collection(db, "submissions"), {
    schemaVersion: 1,
    examYear: 2026,
    scoreTypes,
    scores: input.scores,
    ...(Object.keys(nets).length ? { nets } : {}),
    interest: {
      degree: input.preferences.degree,
      universityTypes: input.preferences.universityTypes,
      funding: input.preferences.funding,
      cityCount: input.preferences.cities.length,
      hasProgramQuery: Boolean(input.preferences.programQuery.trim()),
    },
    consentVersion: "2026-1",
    source: "web",
    createdAt: serverTimestamp(),
  });
  try {
    const appCheckToken = appCheck
      ? (await getToken(appCheck, false)).token
      : null;
    await fetch("/api/research-aggregate", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(appCheckToken ? { "x-firebase-appcheck": appCheckToken } : {}),
      },
      body: JSON.stringify({ submissionId: result.id }),
      keepalive: true,
    });
  } catch {
    // Kayıt Firestore'a yazılmıştır; toplulaştırma daha sonra yinelenebilir.
  }
  return result.id;
}

export async function saveInterestEvent(input: {
  program: ProgramRecord;
  candidateRank: number;
  band: MatchBand;
}) {
  const { auth, db } = getServices();
  await ensureAnonymousSession(auth);

  await addDoc(collection(db, "interest_events"), {
    schemaVersion: 1,
    examYear: 2026,
    programCode: input.program.code,
    scoreType: input.program.scoreType,
    rankBand: rankBand(input.candidateRank),
    matchBand: input.band,
    source: "web",
    createdAt: serverTimestamp(),
  });
}

export async function submitDonorApplication(input: {
  donorType: "individual" | "organization";
  name: string;
  organizationName: string;
  email: string;
  supportTypes: string[];
  estimatedStudents: number;
  note: string;
}) {
  const { auth, db } = getServices();
  await ensureAnonymousSession(auth);
  const result = await addDoc(collection(db, "donor_applications"), {
    schemaVersion: 1,
    donorType: input.donorType,
    name: input.name.trim(),
    organizationName: input.organizationName.trim() || null,
    email: input.email.trim().toLocaleLowerCase("tr-TR"),
    supportTypes: input.supportTypes,
    estimatedStudents: input.estimatedStudents,
    note: input.note.trim() || null,
    status: "pending_review",
    consentVersion: "donor-2026-1",
    source: "web",
    createdAt: serverTimestamp(),
  });
  return result.id;
}

const SCHOLARSHIP_EMAIL_KEY = "tercihceScholarshipEmail";

export async function createScholarshipProfile(input: {
  profile: ScholarshipProfileInput;
  scores: CandidateScores;
  preferences: CandidatePreferences;
  submissionId: string | null;
}) {
  const { auth, db } = getServices();
  const user = await ensureAnonymousSession(auth);
  const normalizedEmail = input.profile.email.trim().toLocaleLowerCase("tr-TR");
  const normalizedName = input.profile.name.trim();

  await setDoc(doc(db, "scholarship_profiles", user.uid), {
    schemaVersion: 1,
    examYear: 2026,
    name: normalizedName || null,
    email: normalizedEmail,
    ageGroup: input.profile.ageGroup,
    scores: input.scores,
    preferences: {
      degree: input.preferences.degree,
      cities: input.preferences.cities,
      universityTypes: input.preferences.universityTypes,
      funding: input.preferences.funding,
      programQuery: input.preferences.programQuery.trim() || null,
    },
    submissionId: input.submissionId,
    status: "pending_email_verification",
    contactShareMode: "student_approval_required",
    consentVersion: "scholarship-2026-1",
    noticeVersion: "scholarship-2026-1",
    source: "web",
    createdAt: serverTimestamp(),
  });

  const verificationUrl = `${window.location.origin}/burs-dogrula`;
  await sendSignInLinkToEmail(auth, normalizedEmail, {
    url: verificationUrl,
    handleCodeInApp: true,
  });
  window.localStorage.setItem(SCHOLARSHIP_EMAIL_KEY, normalizedEmail);
}

export function getPendingScholarshipEmail() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(SCHOLARSHIP_EMAIL_KEY) ?? "";
}

export function isScholarshipVerificationLink(url: string) {
  if (!isFirebaseConfigured()) return false;
  return isSignInWithEmailLink(getServices().auth, url);
}

export async function completeScholarshipVerification(
  email: string,
  url: string,
) {
  const { auth, db } = getServices();
  let user = auth.currentUser;

  if (user?.isAnonymous) {
    const credential = EmailAuthProvider.credentialWithLink(email, url);
    const result = await linkWithCredential(user, credential);
    user = result.user;
  } else {
    const result = await signInWithEmailLink(auth, email, url);
    user = result.user;
  }

  await user.getIdToken(true);
  await updateDoc(doc(db, "scholarship_profiles", user.uid), {
    status: "active",
    verifiedAt: serverTimestamp(),
  });
  window.localStorage.removeItem(SCHOLARSHIP_EMAIL_KEY);
}

export async function getAnalyticsAppCheckToken() {
  if (!isFirebaseConfigured()) return null;
  const { appCheck } = getServices();
  if (!appCheck) return null;
  try {
    return (await getToken(appCheck, false)).token;
  } catch {
    return null;
  }
}

export async function signInAdminWithGoogle() {
  const { auth } = getServices();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return (await signInWithPopup(auth, provider)).user;
}

export function observeAdminUser(callback: (user: User | null) => void) {
  if (!isFirebaseConfigured()) {
    callback(null);
    return () => undefined;
  }
  return onAuthStateChanged(getServices().auth, callback);
}

export async function getAdminIdToken() {
  const user = getServices().auth.currentUser;
  if (!user || user.isAnonymous) return null;
  return user.getIdToken();
}

export async function signOutAdmin() {
  await signOut(getServices().auth);
}
