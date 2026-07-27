import { describe, expect, it } from "vitest";
import { getMatchBand, groupMatches, rankPrograms } from "../lib/scoring";
import type { CandidatePreferences, ProgramRecord } from "../lib/types";

const baseProgram: ProgramRecord = {
  code: 100000001,
  university: "Örnek Üniversitesi",
  universityType: "DEVLET",
  city: "Ankara",
  faculty: "Mühendislik Fakültesi",
  program: "Bilgisayar Mühendisliği",
  programGroup: "Bilgisayar Mühendisliği",
  degree: "LİSANS",
  duration: 4,
  scoreType: "SAY",
  language: "Türkçe",
  funding: "Ücretsiz",
  quota2026: 60,
  score2025: 410,
  rank2025: 50_000,
  score2024: 405,
  rank2024: 52_000,
  accreditation: null,
  rankRequirement: 300_000,
  conditionCodes: [],
};

const preferences: CandidatePreferences = {
  degree: "all",
  cities: [],
  universityTypes: [],
  funding: "all",
  programQuery: "",
};

describe("eşleşme bantları", () => {
  it("oranları beklenen bantlara ayırır", () => {
    expect(getMatchBand(0.7)).toBe("guclu");
    expect(getMatchBand(0.9)).toBe("dengeli");
    expect(getMatchBand(1.05)).toBe("sinir");
    expect(getMatchBand(1.25)).toBe("iddiali");
    expect(getMatchBand(1.5)).toBeNull();
  });

  it("filtreleri uygular ve yakın programı öne çıkarır", () => {
    const programs = [
      baseProgram,
      { ...baseProgram, code: 100000002, city: "İzmir", rank2025: 70_000 },
      {
        ...baseProgram,
        code: 100000003,
        program: "Psikoloji",
        scoreType: "EA" as const,
      },
    ];
    const result = rankPrograms(programs, 48_000, "SAY", {
      ...preferences,
      cities: ["Ankara"],
    });

    expect(result).toHaveLength(1);
    expect(result[0].code).toBe(100000001);
    expect(result[0].band).toBe("dengeli");
  });

  it("sonuçları bantlara ve limite göre gruplar", () => {
    const matches = rankPrograms(
      Array.from({ length: 20 }, (_, index) => ({
        ...baseProgram,
        code: 100000100 + index,
        rank2025: 50_000 + index,
      })),
      48_000,
      "SAY",
      preferences,
    );
    const grouped = groupMatches(matches, 5);
    expect(grouped.dengeli).toHaveLength(5);
  });
});
