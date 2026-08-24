import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/gs/page-header";
import { ProvenanceChip } from "@/components/gs/provenance";
import { AiRecommendations, baselineActions } from "@/components/gs/recommendations";
import { DemoBanner, ErrorPanel, PanelSkeleton } from "@/components/gs/states";
import { Button } from "@/components/ui/button";
import { useEnvironment } from "@/hooks/use-environment";
import { formatTimestamp } from "@/lib/gs/format";
import { BAND_LABEL, BAND_TEXT } from "@/lib/gs/scoring";
import { useGreenShield } from "@/lib/gs/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/actions")({
  head: () => ({
    meta: [
      { title: "Action Center — GreenShield" },
      {
        name: "description",
        content:
          "Prioritised climate interventions for the active location, derived from GreenShield risk sub-scores and optional AI interpretation of the same measurements.",
      },
      { property: "og:title", content: "Action Center — GreenShield" },
      {
        property: "og:description",
        content: "Rule-based and AI-assisted interventions tied to live Open-Meteo measurements.",
      },
    ],
  }),
  component: ActionsPage,
});

function ActionsPage() {
  const { bundle, risk, brief, isLoading, error, refetch } = useEnvironment();
  const { settings } = useGreenShield();
  const [priorityFilter, setPriorityFilter] = useState<"all" | "high" | "medium" | "low">("all");

  const baseline = useMemo(() => (risk ? baselineActions(risk) : []), [risk]);
  const filtered = useMemo(
    () => (priorityFilter === "all" ? baseline : baseline.filter((b) => b.priority === priorityFilter)),
    [baseline, priorityFilter],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Action center"
        title="What to do about this location"
        description="Every action below is anchored to a measured value or a GreenShield sub-score. Rule-based actions are deterministic; AI actions reinterpret the same brief and never introduce new numbers."
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <PanelSkeleton />
          <PanelSkeleton />
          <PanelSkeleton />
        </div>
      ) : null}

      {error && !bundle ? (
        <ErrorPanel message="Live conditions could not be loaded, so no actions can be derived yet." onRetry={refetch} />
      ) : null}

      {bundle && risk ? (
        <>
          {bundle.demo ? <DemoBanner onRetry={refetch} /> : null}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="panel space-y-2 p-5">
              <p className="label-micro">Composite risk</p>
              <p className={cn("num text-4xl font-extrabold", BAND_TEXT[risk.band])}>{risk.score}</p>
              <p className={cn("num text-[10px] font-bold uppercase", BAND_TEXT[risk.band])}>
                {BAND_LABEL[risk.band]}
              </p>
            </div>
            {risk.drivers.map((d) => (
              <div key={d.key} className="panel space-y-2 p-5">
                <p className="label-micro">Leading driver</p>
                <p className={cn("num text-2xl font-extrabold", BAND_TEXT[d.band])}>{d.score}</p>
                <p className="text-xs font-bold">{d.label}</p>
                <p className="text-muted-foreground text-[10px] leading-relaxed">{d.inputs.join(" · ")}</p>
              </div>
            ))}
            <div className="panel space-y-2 p-5">
              <p className="label-micro">Actions queued</p>
              <p className="num text-4xl font-extrabold">{baseline.length}</p>
              <p className="num text-muted-foreground text-[10px] uppercase">
                Observed {formatTimestamp(bundle.weather.observedAt, bundle.weather.timezone)}
              </p>
            </div>
          </div>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <ProvenanceChip source="calc">RULE-BASED · GS-CALC-V1</ProvenanceChip>
              <div className="ml-auto flex flex-wrap gap-1" role="group" aria-label="Filter by priority">
                {(["all", "high", "medium", "low"] as const).map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={p === priorityFilter ? "default" : "outline"}
                    onClick={() => setPriorityFilter(p)}
                    className="num h-8 text-[10px] uppercase"
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>

            {filtered.length ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((item) => (
                  <article key={item.title} className="panel animate-reveal space-y-3 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "num rounded px-1.5 py-0.5 text-[9px] font-bold uppercase",
                          item.priority === "high"
                            ? "bg-sev-5/12 text-sev-5"
                            : item.priority === "medium"
                              ? "bg-caution/15 text-caution-foreground"
                              : "bg-forest/12 text-forest",
                        )}
                      >
                        {item.priority} priority
                      </span>
                      <span className="num text-muted-foreground text-[9px] uppercase">{item.category}</span>
                      <span className="num text-muted-foreground ml-auto text-[9px] uppercase">{item.horizon}</span>
                    </div>
                    <h3 className="text-sm leading-snug font-bold">{item.title}</h3>
                    <p className="text-muted-foreground text-xs leading-relaxed">{item.detail}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-xs">
                No rule-based action carries {priorityFilter} priority for the current readings.
              </p>
            )}
          </section>

          <AiRecommendations brief={brief} risk={risk} aiEnabled={settings.aiExplanations} />

          <p className="num text-muted-foreground text-[9px] uppercase">
            Measurements: Open-Meteo Forecast + Air Quality APIs · Scores: GreenShield calculation · AI actions:
            interpretation only
          </p>
        </>
      ) : null}
    </div>
  );
}
