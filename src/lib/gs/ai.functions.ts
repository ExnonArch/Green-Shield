import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const ChatInput = z.object({
  question: z.string().min(1).max(2000),
  contextBrief: z.string().max(6000),
  history: z.array(MessageSchema).max(12).default([]),
});

const RecommendInput = z.object({
  contextBrief: z.string().max(6000),
});

const GUARDRAIL = [
  "You are GreenShield AI, the assistant inside a climate-risk web app built for the Hack the Habitat 2026 hackathon.",
  "You are given a DATA BRIEF containing measurements from the Open-Meteo APIs and risk scores computed by GreenShield's own transparent formula.",
  "Absolute rules:",
  "- Never invent, estimate or extrapolate a measurement. Only cite numbers that appear in the DATA BRIEF.",
  "- If a value is missing or unavailable, say so plainly instead of guessing.",
  "- Attribute correctly: measurements come from Open-Meteo; the 0-100 risk scores are GreenShield calculations; your prose is an interpretation.",
  "- Be concrete and practical for residents, planners and responders at this specific location.",
  "- Answer only what is necessary. Keep responses concise by default. Expand only when the user's question genuinely requires more explanation, detail, or context.",
  "- Keep answers concise, normally 50–4999 words. Fully answer the user's question without cutting off sentences.",
].join("\n");

export const askGreenShieldAI = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ChatInput.parse(input))
  .handler(async ({ data }) => {
    const { callAi } = await import("../ai-gateway.server");
    const instructions = `${GUARDRAIL}\n\nDATA BRIEF (authoritative, current):\n${data.contextBrief}`;
    const text = await callAi(instructions, [
      ...data.history.map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: data.question },
    ]);
    return { answer: text, generatedAt: new Date().toISOString() };
  });

export const generateRecommendations = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => RecommendInput.parse(input))
  .handler(async ({ data }) => {
    const { callAi } = await import("../ai-gateway.server");
    const instructions = [
      GUARDRAIL,
      "",
      "Task: produce 4 to 6 prioritised interventions for this location based strictly on the DATA BRIEF.",
      'Respond with JSON only, no prose, no code fences, shaped as {"items":[{"title","category","priority","horizon","detail"}]}.',
      "priority must be one of high | medium | low. horizon is a short phrase such as 'Next 24 hours' or 'This season'.",
      "category is a short domain label such as Public health, Cooling, Water, Air filtration, Urban greening, Preparedness.",
      "detail must be one or two sentences, must reference at least one number from the DATA BRIEF, and must be an action someone can take.",
      "",
      `DATA BRIEF (authoritative, current):\n${data.contextBrief}`,
    ].join("\n");

    const raw = await callAi(instructions, [
      { role: "user", content: "Generate the prioritised interventions as JSON." },
    ]);

    const cleaned = raw
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    const slice = start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned;

    const Shape = z.object({
      items: z
        .array(
          z.object({
            title: z.string(),
            category: z.string(),
            priority: z.enum(["high", "medium", "low"]).catch("medium"),
            horizon: z.string().default("Ongoing"),
            detail: z.string(),
          }),
        )
        .min(1),
    });

    const parsed = Shape.safeParse(JSON.parse(slice));
    if (!parsed.success) throw new Error("The AI response could not be read as recommendations.");

    return { items: parsed.data.items.slice(0, 6), generatedAt: new Date().toISOString() };
  });
