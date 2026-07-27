import { describe, expect, it } from "vitest";
import {
  addSubmissionToResearchAggregate,
  aggregateShardForSubmissionId,
  mergeResearchAggregateShards,
  RESEARCH_AGGREGATE_SHARD_COUNT,
} from "../lib/research-aggregate";

describe("araştırma toplulaştırması", () => {
  it("puanları, dilimleri ve tercihleri shard içinde toplar", () => {
    const shard = addSubmissionToResearchAggregate(undefined, {
      scores: {
        SAY: { rank: 42_000, placementScore: 410 },
      },
      interest: {
        degree: "lisans",
        funding: "all",
        universityTypes: ["DEVLET"],
      },
    });
    expect(shard.submissionCount).toBe(1);
    expect(shard.scores.SAY.rankBands["25K-50K"]).toBe(1);
    expect(shard.interest.universityTypes.DEVLET).toBe(1);
  });

  it("birden çok shard için kesin ortalama üretir", () => {
    const first = addSubmissionToResearchAggregate(undefined, {
      scores: { SAY: { rank: 40_000, placementScore: 420 } },
      interest: {},
    });
    const second = addSubmissionToResearchAggregate(undefined, {
      scores: { SAY: { rank: 60_000, placementScore: 380 } },
      interest: {},
    });
    const merged = mergeResearchAggregateShards([first, second]);
    expect(merged.sampleSize).toBe(2);
    expect(merged.scores.SAY.averageRank).toBe(50_000);
    expect(merged.scores.SAY.averagePlacementScore).toBe(400);
  });

  it("belge kimliğini kararlı ve geçerli bir shard numarasına dönüştürür", () => {
    const first = aggregateShardForSubmissionId("same-document-id");
    expect(first).toBe(aggregateShardForSubmissionId("same-document-id"));
    expect(first).toBeGreaterThanOrEqual(0);
    expect(first).toBeLessThan(RESEARCH_AGGREGATE_SHARD_COUNT);
  });
});

