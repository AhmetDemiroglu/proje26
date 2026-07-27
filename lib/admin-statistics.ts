import type { ScoreType } from "./types";

const SCORE_TYPES: ScoreType[] = ["TYT", "SAY", "EA", "SÖZ", "DİL"];
const RANK_BANDS = [
  "1-10K",
  "10K-25K",
  "25K-50K",
  "50K-100K",
  "100K-250K",
  "250K-500K",
  "500K+",
] as const;

function rankBand(rank: number) {
  if (rank <= 10_000) return "1-10K";
  if (rank <= 25_000) return "10K-25K";
  if (rank <= 50_000) return "25K-50K";
  if (rank <= 100_000) return "50K-100K";
  if (rank <= 250_000) return "100K-250K";
  if (rank <= 500_000) return "250K-500K";
  return "500K+";
}

type MutableScoreStat = {
  count: number;
  rankTotal: number;
  scoreTotal: number;
  rankBands: Record<string, number>;
};

function increment(map: Record<string, number>, key: string) {
  map[key] = (map[key] ?? 0) + 1;
}

export function calculateSubmissionStatistics(
  submissions: Array<Record<string, unknown>>,
) {
  const mutableScores = Object.fromEntries(
    SCORE_TYPES.map((type) => [
      type,
      {
        count: 0,
        rankTotal: 0,
        scoreTotal: 0,
        rankBands: Object.fromEntries(
          RANK_BANDS.map((band) => [band, 0]),
        ),
      } satisfies MutableScoreStat,
    ]),
  ) as Record<ScoreType, MutableScoreStat>;
  const degree: Record<string, number> = {};
  const funding: Record<string, number> = {};
  const universityTypes: Record<string, number> = {};

  for (const submission of submissions) {
    const scores =
      submission.scores && typeof submission.scores === "object"
        ? (submission.scores as Record<string, unknown>)
        : {};
    for (const type of SCORE_TYPES) {
      const value = scores[type];
      if (!value || typeof value !== "object") continue;
      const score = value as Record<string, unknown>;
      const rank = Number(score.rank);
      const placementScore = Number(score.placementScore);
      if (
        !Number.isInteger(rank) ||
        rank < 1 ||
        rank > 5_000_000 ||
        !Number.isFinite(placementScore) ||
        placementScore < 100 ||
        placementScore > 600
      ) {
        continue;
      }
      const stat = mutableScores[type];
      stat.count += 1;
      stat.rankTotal += rank;
      stat.scoreTotal += placementScore;
      increment(stat.rankBands, rankBand(rank));
    }

    const interest =
      submission.interest && typeof submission.interest === "object"
        ? (submission.interest as Record<string, unknown>)
        : {};
    if (typeof interest.degree === "string") increment(degree, interest.degree);
    if (typeof interest.funding === "string") {
      increment(funding, interest.funding);
    }
    if (Array.isArray(interest.universityTypes)) {
      for (const type of interest.universityTypes) {
        if (typeof type === "string") increment(universityTypes, type);
      }
    }
  }

  return {
    sampleSize: submissions.length,
    scores: Object.fromEntries(
      SCORE_TYPES.map((type) => {
        const stat = mutableScores[type];
        return [
          type,
          {
            count: stat.count,
            averageRank: stat.count
              ? Math.round(stat.rankTotal / stat.count)
              : null,
            averagePlacementScore: stat.count
              ? Number((stat.scoreTotal / stat.count).toFixed(3))
              : null,
            rankBands: stat.rankBands,
          },
        ];
      }),
    ),
    interest: {
      degree,
      funding,
      universityTypes,
    },
  };
}

