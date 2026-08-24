import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AnnualTrendChart } from "@/components/gs/charts";
import { PageHeader } from "@/components/gs/page-header";
import { ProvenanceChip } from "@/components/gs/provenance";
import { ErrorPanel, PanelSkeleton } from "@/components/gs/states";
import { Button } from "@/components/ui/button";
import { climateTrendQuery } from "@/lib/gs/queries";
import { useGreenShield } from "@/lib/gs/store";
import { locationLabel } from "@/lib/gs/format";
import { cn } from "@/lib/utils";
import type { AnnualClimatePoint } from "@/lib/gs/api";

export const Route = createFileRoute("/trends")({
  head: () => ({
    meta: [
      { title: "Climate Trends — GreenShield" },
      {
        name: "description",
        content:
          "Two decades of ERA5 reanalysis for any location: annual mean temperature, hot-day counts and rainfall totals with least-squares trend lines.",
      },
      { property: "og:title", content: "Climate Trends — GreenShield" },
      {
        property: "og:description",
        content: "Long-run temperature, hot-day and rainfall trends from the Open-Meteo historical archive.",
      },
    ],
  }),
  component: TrendsPage,
});

const METRICS = [
  { key: "meanTemp", label: "Mean temperature", unit: "°C", digits: 2 },
  { key: "hotDays", label: "Hot days ≥32 °C", unit: "days", digits: 0 },
  { key: "precipitation", label: "Annual rainfall", unit: "mm", digits: 0 },
] as const;

type MetricKey = (typeof METRICS)[number]["key"];

/** Ordinary least-squares slope per year over the supplied annual series. */
function linearTrend(points: Array<{ year: number; value: number | null }>) {
  const rows = points.filter((p): p is { year: number; value: number } => p.value != null);
  if (rows.length < 3) return null;
  const n = rows.length;
  const meanX = rows.reduce((a, r) => a + r.year, 0) / n;
  const meanY = rows.reduce((a, r) => a + r.value, 0) / n;
  let num = 0;
  let den = 0;
  for (const r of rows) {
    num += (r.year - meanX) * (r.value - meanY);
    den += (r.year - meanX) ** 2;
  }
  if (den === 0) return null;
  const slope = num / den;
  const first = rows.slice(0, Math.min(5, Math.floor(n / 2)));
  const last = rows.slice(-Math.min(5, Math.floor(n / 2)));
  const firstAvg = first.reduce((a, r) => a + r.value, 0) / first.length;
  const lastAvg = last.reduce((a, r) => a + r.value, 0) / last.length;
  return {
    slope,
    perDecade: slope * 10,
    firstAvg,
    lastAvg,
    delta: lastAvg - firstAvg,
    span: `${rows[0]!.year}–${rows[rows.length - 1]!.year}`,
    windowYears: first.length,
    n,
  };
}

function seriesFor(data: AnnualClimatePoint[], metric: MetricKey) {
  return data.map((d) => ({
    year: d.year,
    value:
      metric === "meanTemp" ? d.meanTemp : metric === "precipitation" ? d.precipitation : d.hotDays,
  }));
}

function TrendsPage() {
  const { location } = useGreenShield();
  const [metric, setMetric] = useState<MetricKey>("meanTemp");
  const query = useQuery(climateTrendQuery(location, 20));

  const data = query.data ?? [];
  const active = METRICS.find((m) => m.key === metric)!;
  const trend = useMemo(() => linearTrend(seriesFor(data, metric)), [data, metric]);

  const summaries = useMemo(
    () => METRICS.map((m) => ({ meta: m, trend: linearTrend(seriesFor(data, m.key)) })),
    [data],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Climate trends"
        title="Twenty years of reanalysis history"
        description="Annual values are aggregated by GreenShield from daily ERA5 reanalysis served by the Open-Meteo Historical Weather API. Trend lines are ordinary least-squares fits over the available years — they describe the past, they are not a forecast."
      />

      {query.isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <PanelSkeleton />
          <PanelSkeleton />
          <PanelSkeleton />
        </div>
      ) : null}

      {query.isError ? (
        <ErrorPanel
          title="Historical archive unavailable"
          message={
            "The Open-Meteo historical archive did not respond for this location. Reanalysis coverage lags roughly five days and can be briefly unavailable. " +
            (query.error as Error).message
          }
          onRetry={() => void query.refetch()}
        />
      ) : null}

      {!query.isLoading && !query.isError && data.length === 0 ? (
        <ErrorPanel
          title="No archive coverage"
          message="The archive returned no complete years for this coordinate. Try a nearby land location."
          onRetry={() => void query.refetch()}
        />
      ) : null}

      {data.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {summaries.map(({ meta, trend: t }) => (
              <div key={meta.key} className="panel animate-reveal space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <p className="label-micro">{meta.label}</p>
                  <ProvenanceChip source="calc" />
                </div>
                {t ? (
                  <>
                    <p
                      className={cn(
                        "num text-3xl font-extrabold",
                        t.perDecade > 0 ? "text-sev-4" : t.perDecade < 0 ? "text-forest" : "",
                      )}
                    >
                      {t.perDecade > 0 ? "+" : ""}
                      {t.perDecade.toFixed(meta.digits === 0 ? 1 : meta.digits)}
                    </p>
                    <p className="num text-muted-foreground text-[10px] uppercase">
                      {meta.unit} per decade · {t.span}
                    </p>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      First {t.windowYears} years averaged {t.firstAvg.toFixed(meta.digits)} {meta.unit}; the most
                      recent {t.windowYears} averaged {t.lastAvg.toFixed(meta.digits)} {meta.unit} — a change of{" "}
                      {t.delta > 0 ? "+" : ""}
                      {t.delta.toFixed(meta.digits)} {meta.unit}.
                    </p>
                  </>
                ) : (
                  <p className="text-muted-foreground text-xs">Not enough complete years to fit a trend.</p>
                )}
              </div>
            ))}
          </div>

          <div className="panel p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold">{active.label} by year — {locationLabel(location)}</h2>
                <p className="text-muted-foreground mt-1 text-[10px]">
                  Calendar-year aggregation of daily ERA5 values, {active.unit}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ProvenanceChip source="meteo" />
                <div className="flex flex-wrap gap-1" role="group" aria-label="Choose metric">
                  {METRICS.map((m) => (
                    <Button
                      key={m.key}
                      size="sm"
                      variant={m.key === metric ? "default" : "outline"}
                      onClick={() => setMetric(m.key)}
                      className="h-8 text-[11px]"
                    >
                      {m.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <div className="h-80">
              <AnnualTrendChart data={data} metric={metric} />
            </div>
          </div>

          <div className="panel space-y-3 p-5">
            <div className="flex items-center gap-2">
              <p className="label-micro">Reading the trend</p>
              <ProvenanceChip source="calc" />
            </div>
            <p className="text-muted-foreground max-w-prose text-xs leading-relaxed">
              {trend ? (
                <>
                  Over {trend.n} complete years ({trend.span}), {active.label.toLowerCase()} at{" "}
                  {locationLabel(location)} moved {trend.perDecade > 0 ? "up" : "down"} by{" "}
                  {Math.abs(trend.perDecade).toFixed(active.digits === 0 ? 1 : active.digits)} {active.unit} per
                  decade. Year-to-year variability is large at a single grid cell, so a single warm or wet year says
                  little; the slope across two decades is the signal worth acting on. GreenShield does not smooth,
                  infill or bias-correct these values beyond the calendar-year averaging described above.
                </>
              ) : (
                "Not enough complete years were returned to describe a direction of change."
              )}
            </p>
            <p className="num text-muted-foreground text-[9px] uppercase">
              Source: ERA5 reanalysis via Open-Meteo Historical Weather API · aggregation by GreenShield
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
