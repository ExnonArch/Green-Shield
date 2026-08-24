import { readFileSync } from "node:fs";

const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

/** Low-cost default — override with GEMINI_MODEL in .env. */
const DEFAULT_MODEL = "gemini-2.5-flash-lite";
export const AI_MODEL = DEFAULT_MODEL;

export interface AiMessage {
  role: "user" | "assistant";
  content: string;
}

interface GeminiPayload {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  error?: { message?: string; status?: string };
}

export class AiGatewayError extends Error {
  status: number;
  retryable: boolean;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.retryable = status === 429 || status >= 500;
  }
}

/** Read a value from the project-root .env file (dev fallback; process.env wins). */
function fromDotEnv(name: string): string | undefined {
  try {
    const raw = readFileSync(".env", "utf8");
    for (const line of raw.split("\n")) {
      const match = line.match(new RegExp(`^\\s*${name}\\s*=\\s*(.*?)\\s*$`));
      if (match && match[1]) return match[1].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* .env not readable in this runtime */
  }
  return undefined;
}

function readEnv(name: string): string | undefined {
  const direct = process.env[name];
  if (direct?.trim()) return direct.trim();
  return fromDotEnv(name);
}

function extractText(payload: GeminiPayload): string {
  const parts = payload.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((p) => p.text ?? "")
    .join("")
    .trim();
}

/** Single non-streaming call to the Gemini API (generateContent). */
export async function callAi(instructions: string, messages: AiMessage[]): Promise<string> {
  const key = readEnv("GEMINI_API_KEY");
  if (!key) {
    throw new AiGatewayError(
      401,
      "Gemini API key missing — add GEMINI_API_KEY to the .env file in the project root, then restart.",
    );
  }
  const model = readEnv("GEMINI_MODEL") ?? DEFAULT_MODEL;

  const res = await fetch(`${API_BASE}/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: instructions }] },
      contents: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
    }),
  });

  const raw = await res.text();
  let payload: GeminiPayload = {};
  try {
    payload = JSON.parse(raw) as GeminiPayload;
  } catch {
    /* non-JSON error body */
  }

  if (!res.ok) {
    const detail = payload.error?.message ?? raw.slice(0, 300);
    if (res.status === 400) throw new AiGatewayError(400, `Gemini rejected the request: ${detail}`);
    if (res.status === 403) throw new AiGatewayError(403, `Gemini API key was refused: ${detail}`);
    if (res.status === 429)
      throw new AiGatewayError(429, "Gemini free-tier rate limit reached. Wait a moment and try again.");
    throw new AiGatewayError(res.status, `Gemini request failed (${res.status}): ${detail}`);
  }

  const text = extractText(payload);
  if (!text) throw new AiGatewayError(502, "Gemini returned an empty response.");
  return text;
}
