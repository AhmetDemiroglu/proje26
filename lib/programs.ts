import type { ProgramRecord, ScoreType } from "./types";

const cache = new Map<ScoreType, Promise<ProgramRecord[]>>();

export function loadPrograms(scoreType: ScoreType) {
  const existing = cache.get(scoreType);
  if (existing) return existing;

  const request = fetch(`/data/programs/${scoreType.toLocaleLowerCase("tr-TR")}.json`)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`${scoreType} program verisi yüklenemedi.`);
      }
      return (await response.json()) as ProgramRecord[];
    })
    .catch((error) => {
      cache.delete(scoreType);
      throw error;
    });

  cache.set(scoreType, request);
  return request;
}
