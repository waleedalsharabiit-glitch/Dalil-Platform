import { z } from "zod";

const intentSchema = z.object({
  terms: z.array(z.string().trim().min(1).max(60)).max(6),
  category: z.string().nullable(),
  service: z.string().nullable(),
  city: z.string().nullable(),
});

export type SearchIntent = z.infer<typeof intentSchema>;

function fallbackIntent(query: string): SearchIntent {
  const stopWords = new Set(["عن", "في", "من", "على", "الى", "إلى", "مع", "ابحث", "أبحث", "اريد", "أريد", "خدمة", "خدمات", "قريب", "قريبة", "قريباً", "بالقرب"]);
  const terms = query
    .split(/[\s،,؛;]+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 1 && !stopWords.has(term))
    .slice(0, 6);
  return { terms: terms.length ? terms : [query], category: null, service: null, city: null };
}

export async function extractSearchIntent(query: string): Promise<{ intent: SearchIntent; aiPowered: boolean }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { intent: fallbackIntent(query), aiPowered: false };

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-6-astra",
        input: [
          {
            role: "system",
            content: "حوّل طلب البحث العربي إلى مرشحات دليل أعمال. استخرج كلمات دلالية قصيرة فقط، واسم التصنيف أو الخدمة أو المدينة إن ذُكر. لا تخترع مدينة أو تصنيفًا. أعد JSON مطابقًا للمخطط.",
          },
          { role: "user", content: query },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "directory_search_intent",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                terms: { type: "array", items: { type: "string" } },
                category: { anyOf: [{ type: "string" }, { type: "null" }] },
                service: { anyOf: [{ type: "string" }, { type: "null" }] },
                city: { anyOf: [{ type: "string" }, { type: "null" }] },
              },
              required: ["terms", "category", "service", "city"],
            },
          },
        },
        max_output_tokens: 250,
      }),
    });

    if (!response.ok) {
      console.error("OpenAI search request failed:", response.status);
      return { intent: fallbackIntent(query), aiPowered: false };
    }

    const payload: unknown = await response.json();
    const outputText = typeof payload === "object" && payload !== null && "output" in payload && Array.isArray(payload.output)
      ? payload.output.flatMap((item) => typeof item === "object" && item !== null && "content" in item && Array.isArray(item.content) ? item.content : []).find((part) => typeof part === "object" && part !== null && "type" in part && part.type === "output_text" && "text" in part)?.text
      : null;
    if (typeof outputText !== "string") return { intent: fallbackIntent(query), aiPowered: false };

    const parsed = intentSchema.safeParse(JSON.parse(outputText));
    if (!parsed.success) return { intent: fallbackIntent(query), aiPowered: false };
    return {
      intent: {
        ...parsed.data,
        terms: parsed.data.terms.map((term) => term.trim()).filter(Boolean).slice(0, 6),
        category: parsed.data.category?.trim() || null,
        service: parsed.data.service?.trim() || null,
        city: parsed.data.city?.trim() || null,
      },
      aiPowered: true,
    };
  } catch (error) {
    console.error("OpenAI search intent extraction failed:", error);
    return { intent: fallbackIntent(query), aiPowered: false };
  }
}
