/**
 * Server-only AI layer. Talks to the Lovable AI Gateway.
 * If no credentials are available, falls back to a clearly labelled Demo Mode
 * with realistic sample output while keeping the production shape identical.
 */

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.7-flash";

export type AiResult = { text: string; demo: boolean };

export class AiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function runAi(
  system: string,
  user: string,
  demoFallback: string,
): Promise<AiResult> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) {
    return { text: demoFallback, demo: true };
  }

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    let message = body;
    try {
      const parsed = JSON.parse(body) as { error?: { message?: string } };
      message = parsed.error?.message ?? body;
    } catch {
      /* keep raw body */
    }
    if (res.status === 429) {
      throw new AiError(
        "The AI service is busy right now. Please wait a moment and try again.",
        429,
      );
    }
    if (res.status === 402) {
      throw new AiError(
        message || "AI credits are exhausted. Add credits to continue using AI features.",
        402,
      );
    }
    throw new AiError(message || "AI generation failed.", res.status);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new AiError("The AI returned an empty response. Please try again.", 502);
  }
  return { text, demo: false };
}

export async function runChat(
  system: string,
  history: { role: "user" | "assistant"; content: string }[],
  demoFallback: string,
): Promise<AiResult> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) return { text: demoFallback, demo: true };

  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "system", content: system }, ...history],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new AiError(
      body || "The assistant could not respond. Please try again.",
      res.status,
    );
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new AiError("The assistant returned an empty response.", 502);
  return { text, demo: false };
}
