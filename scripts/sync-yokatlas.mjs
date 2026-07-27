import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const API_URL = "https://yokatlas.yok.gov.tr/api/tercih-kilavuz/search";
const OUTPUT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../public/data/programs",
);
const SCORE_TYPES = ["TYT", "SAY", "EA", "SÖZ", "DİL"];

function cleanText(value) {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().replace(/\s+/g, " ");
  return cleaned || null;
}

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function fundingFor(item) {
  const funding = cleanText(item.bursOraniAdi);
  if (funding) return funding;
  if (item.universiteTuru === "DEVLET") return "Ücretsiz";
  return "Belirtilmemiş";
}

function normalize(item) {
  return {
    code: item.kilavuzKodu,
    university: cleanText(item.universiteAdi),
    universityType: cleanText(item.universiteTuru),
    city: cleanText(item.ilAdi),
    faculty: cleanText(item.fymkAdi),
    program: cleanText(item.birimAdi),
    programGroup: cleanText(item.birimGrupAdi),
    degree: cleanText(item.birimTuruAdi),
    duration: numberOrNull(item.ogrenimSuresi),
    scoreType: cleanText(item.puanTuru),
    language: cleanText(item.ogrenimDiliAdi),
    funding: fundingFor(item),
    quota2026: numberOrNull(item.kontenjan),
    score2025: numberOrNull(item.minPuan),
    rank2025: numberOrNull(item.basariSirasi),
    score2024: numberOrNull(item.minPuan1),
    rank2024: numberOrNull(item.basariSirasi1),
    accreditation: cleanText(item.akreditasyonAck ?? item.akreditasyon),
    rankRequirement: numberOrNull(item.minBasariSirasi),
    conditionCodes: cleanText(item.kosul)?.split(",").filter(Boolean) ?? [],
  };
}

async function fetchPrograms() {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "user-agent": "TercihceDataSync/1.0",
    },
    body: JSON.stringify({
      filters: {
        puanTuru: null,
        universiteId: null,
        birimGrupId: null,
        ilKodu: null,
        birimTuruId: null,
        universiteTuru: null,
        bursOraniId: null,
        ogrenimTuruId: null,
        kilavuzKodu: null,
        minBasariSirasi: null,
        maxBasariSirasi: null,
      },
      page: 0,
      size: 25_000,
      sortBy: "basariSirasi",
      direction: "ASC",
    }),
  });

  if (!response.ok) {
    throw new Error(`YÖK Atlas API ${response.status} döndürdü.`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload.content) || payload.content.length < 1_000) {
    throw new Error("YÖK Atlas yanıtı beklenen program listesini içermiyor.");
  }
  return payload;
}

const payload = await fetchPrograms();
await mkdir(OUTPUT_DIR, { recursive: true });

const normalized = payload.content.map(normalize);
const manifest = {
  catalogueYear: Number(payload.content[0]?.yil) || 2026,
  placementYear: (Number(payload.content[0]?.yil) || 2026) - 1,
  generatedAt: new Date().toISOString(),
  source: API_URL,
  total: normalized.length,
  files: {},
};

for (const scoreType of SCORE_TYPES) {
  const programs = normalized.filter((item) => item.scoreType === scoreType);
  const filename = `${scoreType.toLocaleLowerCase("tr-TR")}.json`;
  await writeFile(
    path.join(OUTPUT_DIR, filename),
    JSON.stringify(programs),
    "utf8",
  );
  manifest.files[scoreType] = {
    filename,
    count: programs.length,
    withPlacementRank: programs.filter((item) => item.rank2025).length,
  };
}

const unclassified = normalized.filter(
  (item) => !SCORE_TYPES.includes(item.scoreType),
);
if (unclassified.length) {
  const filename = "siniflandirilmamis.json";
  await writeFile(
    path.join(OUTPUT_DIR, filename),
    JSON.stringify(unclassified),
    "utf8",
  );
  manifest.files.SINIFLANDIRILMAMIS = {
    filename,
    count: unclassified.length,
    withPlacementRank: unclassified.filter((item) => item.rank2025).length,
  };
}

await writeFile(
  path.join(OUTPUT_DIR, "manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

console.log(
  `YÖK Atlas'tan ${normalized.length.toLocaleString("tr-TR")} program eşitlendi.`,
);
