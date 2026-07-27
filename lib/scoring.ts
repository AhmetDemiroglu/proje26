import type {
  CandidatePreferences,
  MatchBand,
  ProgramMatch,
  ProgramRecord,
  ScoreType,
} from "./types";

export const MATCH_BANDS: Record<
  MatchBand,
  { label: string; description: string }
> = {
  guclu: {
    label: "Güçlü seçenek",
    description: "2025 taban sırasına göre belirgin pay bırakıyor.",
  },
  dengeli: {
    label: "Dengeli seçenek",
    description: "2025 taban sırasına yakın ve gerçekçi aralıkta.",
  },
  sinir: {
    label: "Sınırda",
    description: "Geçen yılın taban sırasının biraz gerisinde.",
  },
  iddiali: {
    label: "İddialı",
    description: "Yukarı yönlü değişim gerektiren bir seçenek.",
  },
};

export function getMatchBand(ratio: number): MatchBand | null {
  if (!Number.isFinite(ratio) || ratio <= 0) return null;
  if (ratio <= 0.76) return "guclu";
  if (ratio <= 0.98) return "dengeli";
  if (ratio <= 1.12) return "sinir";
  if (ratio <= 1.35) return "iddiali";
  return null;
}

function normalize(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function matchesFunding(
  program: ProgramRecord,
  preference: CandidatePreferences["funding"],
) {
  if (preference === "all") return true;
  const funding = normalize(program.funding);
  if (preference === "scholarship") return funding.includes("burslu");
  return (
    funding.includes("ucretsiz") ||
    funding.includes("burslu") ||
    program.universityType === "DEVLET"
  );
}

export function rankPrograms(
  programs: ProgramRecord[],
  candidateRank: number,
  scoreType: ScoreType,
  preferences: CandidatePreferences,
): ProgramMatch[] {
  const query = normalize(preferences.programQuery.trim());
  const selectedCities = new Set(preferences.cities);
  const selectedUniversityTypes = new Set(preferences.universityTypes);

  return programs
    .filter((program) => {
      if (program.scoreType !== scoreType || !program.rank2025) return false;
      if (
        preferences.degree === "lisans" &&
        program.degree !== "LİSANS"
      ) {
        return false;
      }
      if (
        preferences.degree === "onlisans" &&
        program.degree !== "ÖNLİSANS"
      ) {
        return false;
      }
      if (selectedCities.size && !selectedCities.has(program.city)) return false;
      if (
        selectedUniversityTypes.size &&
        !selectedUniversityTypes.has(program.universityType)
      ) {
        return false;
      }
      if (!matchesFunding(program, preferences.funding)) return false;
      if (query) {
        const haystack = normalize(
          `${program.program} ${program.programGroup} ${program.university} ${program.city}`,
        );
        if (!haystack.includes(query)) return false;
      }
      return true;
    })
    .map((program) => {
      const ratio = candidateRank / (program.rank2025 as number);
      const band = getMatchBand(ratio);
      if (!band) return null;
      return {
        ...program,
        band,
        ratio,
        distance: Math.abs(Math.log(ratio)),
      } satisfies ProgramMatch;
    })
    .filter((program): program is ProgramMatch => program !== null)
    .sort((a, b) => {
      const bandOrder: Record<MatchBand, number> = {
        dengeli: 0,
        sinir: 1,
        guclu: 2,
        iddiali: 3,
      };
      const bandDifference = bandOrder[a.band] - bandOrder[b.band];
      if (bandDifference) return bandDifference;
      return a.distance - b.distance;
    });
}

export function groupMatches(matches: ProgramMatch[], limitPerBand = 12) {
  const groups = {
    guclu: [] as ProgramMatch[],
    dengeli: [] as ProgramMatch[],
    sinir: [] as ProgramMatch[],
    iddiali: [] as ProgramMatch[],
  };

  for (const match of matches) {
    if (groups[match.band].length < limitPerBand) {
      groups[match.band].push(match);
    }
  }

  return groups;
}

export function formatRank(value: number | null) {
  if (!value) return "Yeni program";
  return value.toLocaleString("tr-TR");
}

export function formatScore(value: number | null) {
  if (!value) return "Yok";
  return value.toLocaleString("tr-TR", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

export function rankBand(value: number) {
  if (value <= 10_000) return "1-10K";
  if (value <= 25_000) return "10K-25K";
  if (value <= 50_000) return "25K-50K";
  if (value <= 100_000) return "50K-100K";
  if (value <= 250_000) return "100K-250K";
  if (value <= 500_000) return "250K-500K";
  return "500K+";
}
