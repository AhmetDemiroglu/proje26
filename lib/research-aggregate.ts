import type { ScoreType } from "./types";

export const RESEARCH_AGGREGATE_SHARD_COUNT = 16;
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

type ScoreAggregate = {
  count: number;
  rankTotal: number;
  scoreTotal: number;
  rankBands: Record<string, number>;
};

export type ResearchAggregateShard = {
  schemaVersion: 1;
  examYear: 2026;
  submissionCount: number;
  scores: Record<ScoreType, ScoreAggregate>;
  interest: {
    degree: Record<string, number>;
    funding: Record<string, number>;
    universityTypes: Record<string, number>;
  };
};

function emptyScore(): ScoreAggregate {
  return {
    count: 0,
    rankTotal: 0,
    scoreTotal: 0,
    rankBands: Object.fromEntries(RANK_BANDS.map((band) => [band, 0])),
  };
}

export function emptyResearchAggregate(): ResearchAggregateShard {
  return {
    schemaVersion: 1,
    examYear: 2026,
    submissionCount: 0,
    scores: Object.fromEntries(
      SCORE_TYPES.map((type) => [type, emptyScore()]),
    ) as Record<ScoreType, ScoreAggregate>,
    interest: {
      degree: {},
      funding: {},
      universityTypes: {},
    },
  };
}

function increment(map: Record<string, number>, key: string, amount = 1) {
  map[key] = Number(map[key] ?? 0) + amount;
}

function bandForRank(rank: number) {
  if (rank <= 10_000) return "1-10K";
  if (rank <= 25_000) return "10K-25K";
  if (rank <= 50_000) return "25K-50K";
  if (rank <= 100_000) return "50K-100K";
  if (rank <= 250_000) return "100K-250K";
  if (rank <= 500_000) return "250K-500K";
  return "500K+";
}

function cloneShard(value: Record<string, unknown> | undefined) {
  const result = emptyResearchAggregate();
  if (!value) return result;
  result.submissionCount = Number(value.submissionCount ?? 0);
  const scores = (value.scores as Record<string, unknown> | undefined) ?? {};
  for (const type of SCORE_TYPES) {
    const source = (scores[type] as Record<string, unknown> | undefined) ?? {};
    const bands =
      (source.rankBands as Record<string, number> | undefined) ?? {};
    result.scores[type] = {
      count: Number(source.count ?? 0),
      rankTotal: Number(source.rankTotal ?? 0),
      scoreTotal: Number(source.scoreTotal ?? 0),
      rankBands: Object.fromEntries(
        RANK_BANDS.map((band) => [band, Number(bands[band] ?? 0)]),
      ),
    };
  }
  const interest =
    (value.interest as Record<string, unknown> | undefined) ?? {};
  for (const field of ["degree", "funding", "universityTypes"] as const) {
    const source =
      (interest[field] as Record<string, number> | undefined) ?? {};
    result.interest[field] = Object.fromEntries(
      Object.entries(source).map(([key, count]) => [key, Number(count)]),
    );
  }
  return result;
}

export function addSubmissionToResearchAggregate(
  existing: Record<string, unknown> | undefined,
  submission: Record<string, unknown>,
) {
  const result = cloneShard(existing);
  result.submissionCount += 1;

  const scores =
    submission.scores && typeof submission.scores === "object"
      ? (submission.scores as Record<string, unknown>)
      : {};
  for (const type of SCORE_TYPES) {
    const source = scores[type];
    if (!source || typeof source !== "object") continue;
    const score = source as Record<string, unknown>;
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
    const target = result.scores[type];
    target.count += 1;
    target.rankTotal += rank;
    target.scoreTotal += placementScore;
    increment(target.rankBands, bandForRank(rank));
  }

  const interest =
    submission.interest && typeof submission.interest === "object"
      ? (submission.interest as Record<string, unknown>)
      : {};
  if (typeof interest.degree === "string") {
    increment(result.interest.degree, interest.degree);
  }
  if (typeof interest.funding === "string") {
    increment(result.interest.funding, interest.funding);
  }
  if (Array.isArray(interest.universityTypes)) {
    for (const type of interest.universityTypes) {
      if (typeof type === "string") {
        increment(result.interest.universityTypes, type);
      }
    }
  }
  return result;
}

export function mergeResearchAggregateShards(
  values: Array<Record<string, unknown>>,
) {
  const merged = emptyResearchAggregate();
  for (const value of values) {
    const shard = cloneShard(value);
    merged.submissionCount += shard.submissionCount;
    for (const type of SCORE_TYPES) {
      const source = shard.scores[type];
      const target = merged.scores[type];
      target.count += source.count;
      target.rankTotal += source.rankTotal;
      target.scoreTotal += source.scoreTotal;
      for (const band of RANK_BANDS) {
        increment(target.rankBands, band, source.rankBands[band]);
      }
    }
    for (const field of ["degree", "funding", "universityTypes"] as const) {
      for (const [key, count] of Object.entries(shard.interest[field])) {
        increment(merged.interest[field], key, count);
      }
    }
  }

  return {
    sampleSize: merged.submissionCount,
    scores: Object.fromEntries(
      SCORE_TYPES.map((type) => {
        const score = merged.scores[type];
        return [
          type,
          {
            count: score.count,
            averageRank: score.count
              ? Math.round(score.rankTotal / score.count)
              : null,
            averagePlacementScore: score.count
              ? Number((score.scoreTotal / score.count).toFixed(3))
              : null,
            rankBands: score.rankBands,
          },
        ];
      }),
    ),
    interest: merged.interest,
  };
}

export function aggregateShardForSubmissionId(submissionId: string) {
  let hash = 0;
  for (const character of submissionId) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return hash % RESEARCH_AGGREGATE_SHARD_COUNT;
}

