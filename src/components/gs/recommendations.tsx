import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateRecommendations } from "@/lib/gs/ai.functions";
import { formatTimestamp } from "@/lib/gs/format";
import type { Recommendation, RiskResult } from "@/lib/gs/types";
import { cn } from "@/lib/utils";
import { ProvenanceChip } from "./provenance";
import { ErrorPanel, LoadingRow } from "./states";

const PRIORITY_TONE: Record<Recommendation["priority"], string> = {
  high: "bg-sev-5/12 text-sev-5",
  medium: "bg-caution/15 text-caution-foreground",
  low: "bg-forest/12 text-forest",
};

/** Deterministic, non-AI fallback actions derived only from the computed sub-scores. */
export function baselineActions(risk: RiskResult): Recommendation[] {
  const items: Recommendation[] = [];
  for (const s of risk.subScores) {
    if (s.score < 40) continue;
    const map: Record<string, Recommendation> = {
      heat: {
        title: "Open cooling capacity during peak heat hours",
        category: "Cooling",
        priority: s.score >= 70 ? "high" : "medium",
        horizon: "Next 24 hours",
        detail: `Heat sub-score is ${s.score}/100 (${s.inputs.join("; ")}). Extend shaded/air-conditioned public space and shift outdoor labour away from the afternoon peak.`,
      },
      air: {
        title: "Reduce exposure to particulate pollution",
        category: "Air filtration",
        priority: s.score >= 70 ? "high" : "medium",
        horizon: "Next 24 hours",
        detail: `Air sub-score is ${s.score}/100 (${s.inputs.join("; ")}). Keep windows shut during peaks, run filtration indoors and mask outdoors for sensitive groups.`,
      },
      rain: {
        title: "Clear drainage ahead of forecast rainfall",
        category: "Water",
        priority: "medium",
        horizon: "This week",
        detail: `Rainfall sub-score is ${s.score}/100 (${s.inputs.join("; ")}). Clear inlets and stage pumps in known low-lying pockets.`,
      },
      humidity: {
        title: "Watch humid-heat stress indicators",
        category: "Public health",
        priority: "medium",
        horizon: "Next 48 hours",
        detail: `Humidity sub-score is ${s.score}/100 (${s.inputs.join("; ")}). Humid air suppresses sweat evaporation, so treat apparent temperature as the operative number.`,
      },
      uv: {
        title: "Push UV protection messaging",
        category: "Public health",
        priority: "low",
        horizon: "Daylight hours",
        detail: `UV sub-score is ${s.score}/100 (${s.inputs.join("; ")}). Advise shade, sunscreen and covered clothing during the solar maximum.`,
      },
    };
    const rec = map[s.key];
    if (rec) items.push(rec);
  }
  if (!items.length) {
    items.push({
      title: "Maintain monitoring — no hazard component is elevated",
      category: "Preparedness",
      priority: "low",
      horizon: "Ongoing",
      detail: `Composite risk is ${risk.score}/100 and every sub-score sits below 40. Keep tracking the dashboard so a change in conditions is caught early.`,
    });
  }
  return items;
}

export function RecommendationCard({ item }: { item: Recommendation; }) {
  return (
    <article className="panel animate-reveal space-y-3 p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("num rounded px-1.5 py-0.5 text-[9px] font-bold uppercase", PRIORITY_TONE[item.priority])}>
          {item.priority} priority
        </span>
        <span className="num text-muted-foreground text-[9px] uppercase">{item.category}</span>
        <span className="num text-muted-foreground ml-auto text-[9px] uppercase">{item.horizon}</span>
      </div>
      <h3 className="text-sm leading-snug font-bold">{item.title}</h3>
      <p className="text-muted-foreground text-xs leading-relaxed">{item.detail}</p>
    </article>
  );
}

export function AiRecommendations({
  brief,
  risk,
  aiEnabled,
}: {
  brief: string;
  risk: RiskResult;
  aiEnabled: boolean;
}) {
  const callAi = useServerFn(generateRecommendations);
  const mutation = useMutation({
    mutationFn: () => callAi({ data: { contextBrief: brief } }),
  });

  const baseline = baselineActions(risk);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold">Recommended interventions</h2>
          <p className="text-muted-foreground mt-1 max-w-prose text-xs leading-relaxed">
            Rule-based actions are derived directly from the GreenShield sub-scores. AI actions are an interpretation
            of the same measurements — they never introduce new numbers.
          </p>
        </div>
        {aiEnabled ? (
          <Button
            size="sm"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !brief}
            className="h-9 text-xs"
          >
            <Sparkles className="size-3.5" aria-hidden />
            {mutation.data ? "Regenerate AI actions" : "Generate AI actions"}
          </Button>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ProvenanceChip source="calc">RULE-BASED · GS-CALC-V1</ProvenanceChip>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {baseline.map((item) => (
            <RecommendationCard key={item.title} item={item} />
          ))}
        </div>
      </div>

      {aiEnabled ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <ProvenanceChip source="ai">AI INTERPRETATION</ProvenanceChip>
            {mutation.data ? (
              <span className="num text-muted-foreground text-[9px] uppercase">
                Generated {formatTimestamp(mutation.data.generatedAt)}
              </span>
            ) : null}
          </div>

          {mutation.isPending ? <LoadingRow label="Asking GreenShield AI" /> : null}

          {mutation.isError ? (
            <ErrorPanel
              title="AI recommendations unavailable"
              message={(mutation.error as Error).message}
              onRetry={() => mutation.mutate()}
            />
          ) : null}

          {!mutation.data && !mutation.isPending && !mutation.isError ? (
            <p className="text-muted-foreground flex items-center gap-2 text-xs">
              <TriangleAlert className="size-3.5" aria-hidden />
              No AI actions generated yet for this snapshot.
            </p>
          ) : null}

          {mutation.data ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {mutation.data.items.map((item) => (
                <RecommendationCard key={item.title} item={item as Recommendation} />
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">
          AI explanations are switched off in Settings. Rule-based actions above still reflect live measurements.
        </p>
      )}
    </section>
  );
}
