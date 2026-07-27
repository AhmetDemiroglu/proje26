import { describe, expect, it } from "vitest";
import { calculateSubmissionStatistics } from "../lib/admin-statistics";

describe("onaylı sonuç istatistikleri", () => {
  it("puan ortalamalarını ve sıralama dilimlerini hesaplar", () => {
    const result = calculateSubmissionStatistics([
      {
        scores: {
          SAY: { rank: 42_000, placementScore: 410 },
          TYT: { rank: 80_000, placementScore: 390 },
        },
        interest: {
          degree: "lisans",
          funding: "all",
          universityTypes: ["DEVLET"],
        },
      },
      {
        scores: {
          SAY: { rank: 58_000, placementScore: 390 },
        },
        interest: {
          degree: "lisans",
          funding: "scholarship",
          universityTypes: ["VAKIF"],
        },
      },
    ]);

    expect(result.sampleSize).toBe(2);
    expect(result.scores.SAY).toMatchObject({
      count: 2,
      averageRank: 50_000,
      averagePlacementScore: 400,
    });
    expect(result.scores.SAY.rankBands["25K-50K"]).toBe(1);
    expect(result.scores.SAY.rankBands["50K-100K"]).toBe(1);
    expect(result.interest.degree.lisans).toBe(2);
    expect(result.interest.universityTypes.DEVLET).toBe(1);
  });

  it("geçersiz veya eksik skorları ortalamaya katmaz", () => {
    const result = calculateSubmissionStatistics([
      {
        scores: {
          SAY: { rank: 0, placementScore: 700 },
          EA: { rank: 100_000, placementScore: 350 },
        },
        interest: {},
      },
    ]);
    expect(result.scores.SAY.count).toBe(0);
    expect(result.scores.EA.averageRank).toBe(100_000);
  });
});

