import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "edge";

const programSchema = z.object({
  code: z.number().int().min(100_000_000).max(999_999_999),
  university: z.string().min(2).max(160),
  program: z.string().min(2).max(180),
  city: z.string().min(2).max(40),
  funding: z.string().min(2).max(60),
  scoreType: z.enum(["TYT", "SAY", "EA", "SÖZ", "DİL"]),
  rank2025: z.number().int().positive(),
  band: z.enum(["guclu", "dengeli", "sinir", "iddiali"]),
});

const requestSchema = z.object({
  scoreType: z.enum(["TYT", "SAY", "EA", "SÖZ", "DİL"]),
  candidateRank: z.number().int().min(1).max(5_000_000),
  programs: z.array(programSchema).min(1).max(8),
});

const adviceSchema = z.object({
  summary: z.string().min(20).max(500),
  observations: z.array(z.string().min(10).max(300)).min(2).max(4),
  nextSteps: z.array(z.string().min(10).max(300)).min(2).max(4),
  caution: z.string().min(20).max(400),
});

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return true;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Geçersiz istek kaynağı." }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 24_000) {
    return NextResponse.json({ error: "İstek çok büyük." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Analiz verisi doğrulanamadı." },
      { status: 400 },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Yapay zeka bağlantısı henüz etkin değil. Sıralama eşleştirmeleri kullanılabilir.",
        code: "AI_NOT_CONFIGURED",
      },
      { status: 503 },
    );
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
  const prompt = [
    "Sen Tercihçe adlı ücretsiz YKS tercih rehberinin temkinli danışmanısın.",
    "Sadece verilen aday sırası ve 2025 taban sıralamalarını kullan.",
    "Yerleşme olasılığı yüzdesi üretme, garanti verme, ücret veya koşul uydurma.",
    "2026 kontenjanlarının ve taban sıralarının değişebileceğini açıkça belirt.",
    "Adaya programın öğretim koşullarını ve özel koşul kodlarını resmi 2026 ÖSYM kılavuzundan kontrol etmesini söyle.",
    "Yanıt Türkçe, sakin, kısa ve somut olsun.",
    `Veri: ${JSON.stringify(parsed.data)}`,
  ].join("\n");

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.25,
            maxOutputTokens: 900,
            responseMimeType: "application/json",
            responseJsonSchema: {
              type: "object",
              required: ["summary", "observations", "nextSteps", "caution"],
              properties: {
                summary: { type: "string" },
                observations: {
                  type: "array",
                  minItems: 2,
                  maxItems: 4,
                  items: { type: "string" },
                },
                nextSteps: {
                  type: "array",
                  minItems: 2,
                  maxItems: 4,
                  items: { type: "string" },
                },
                caution: { type: "string" },
              },
            },
          },
        }),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Yapay zeka servisi şu anda yanıt veremiyor." },
        { status: 502 },
      );
    }

    const payload = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini boş yanıt döndürdü.");

    const advice = adviceSchema.parse(JSON.parse(text));
    return NextResponse.json(advice);
  } catch {
    return NextResponse.json(
      { error: "Yapay zeka yorumu oluşturulamadı." },
      { status: 502 },
    );
  }
}
