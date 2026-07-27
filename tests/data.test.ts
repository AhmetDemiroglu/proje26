import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("YÖK Atlas veri paketi", () => {
  it("manifest ve puan türü dosyaları birbiriyle tutarlı", async () => {
    const root = path.resolve("public/data/programs");
    const manifest = JSON.parse(
      await readFile(path.join(root, "manifest.json"), "utf8"),
    ) as {
      catalogueYear: number;
      placementYear: number;
      total: number;
      files: Record<string, { filename: string; count: number }>;
    };

    expect(manifest.catalogueYear).toBe(2026);
    expect(manifest.placementYear).toBe(2025);
    expect(manifest.total).toBeGreaterThan(20_000);

    let total = 0;
    for (const entry of Object.values(manifest.files)) {
      const programs = JSON.parse(
        await readFile(path.join(root, entry.filename), "utf8"),
      ) as Array<{ code: number; rank2025: number | null }>;
      expect(programs).toHaveLength(entry.count);
      expect(new Set(programs.map((program) => program.code)).size).toBe(
        programs.length,
      );
      total += programs.length;
    }
    expect(total).toBe(manifest.total);
  });
});
