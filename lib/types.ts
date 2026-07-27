export const SCORE_TYPES = ["TYT", "SAY", "EA", "SÖZ", "DİL"] as const;

export type ScoreType = (typeof SCORE_TYPES)[number];

export type CandidateScore = {
  rank: number;
  placementScore: number;
};

export type CandidateScores = Partial<Record<ScoreType, CandidateScore>>;

export const NET_FIELDS = [
  "tytTurkce",
  "tytSosyal",
  "tytMatematik",
  "tytFen",
  "aytMatematik",
  "aytFizik",
  "aytKimya",
  "aytBiyoloji",
  "aytEdebiyat",
  "aytTarih1",
  "aytCografya1",
  "aytTarih2",
  "aytCografya2",
  "aytFelsefe",
  "aytDin",
  "ydt",
] as const;

export type NetField = (typeof NET_FIELDS)[number];
export type CandidateNets = Partial<Record<NetField, number>>;

export type DegreePreference = "all" | "lisans" | "onlisans";
export type FundingPreference = "all" | "free" | "scholarship";

export type CandidatePreferences = {
  degree: DegreePreference;
  cities: string[];
  universityTypes: string[];
  funding: FundingPreference;
  programQuery: string;
};

export type ProgramRecord = {
  code: number;
  university: string;
  universityType: string;
  city: string;
  faculty: string;
  program: string;
  programGroup: string;
  degree: "LİSANS" | "ÖNLİSANS" | string;
  duration: number | null;
  scoreType: ScoreType;
  language: string | null;
  funding: string;
  quota2026: number | null;
  score2025: number | null;
  rank2025: number | null;
  score2024: number | null;
  rank2024: number | null;
  accreditation: string | null;
  rankRequirement: number | null;
  conditionCodes: string[];
};

export type MatchBand = "guclu" | "dengeli" | "sinir" | "iddiali";

export type ProgramMatch = ProgramRecord & {
  band: MatchBand;
  ratio: number;
  distance: number;
};

export type SubmissionPayload = {
  scores: CandidateScores;
  nets?: CandidateNets;
  preferences: CandidatePreferences;
};

export type ScholarshipProfileInput = {
  name: string;
  email: string;
  ageGroup: "adult" | "minor";
  consent: boolean;
};

export type AiAdvice = {
  summary: string;
  observations: string[];
  nextSteps: string[];
  caution: string;
};
