import { createFileRoute } from "@tanstack/react-router";
import { ParticulateChart } from "@/components/gs/charts";
import { MetricCard } from "@/components/gs/metric-card";
import { PageHeader } from "@/components/gs/page-header";
import { ProvenanceChip } from "@/components/gs/provenance";
import { DemoBanner, ErrorPanel, PanelSkeleton } from "@/components/gs/states";
import { useEnvironment } from "@/hooks/use-environment";
import { euAqiBand, formatTimestamp, usAqiBand } from "@/lib/gs/format";
import { BAND_LABEL, BAND_TEXT } from "@/lib/gs/scoring";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/air-quality")({
  head: () => ({
    meta: [
      { title: "Air Quality — GreenShield" },
      {
        name: "description",
        content:
          "Live PM2.5, PM10, ozone, NO2, SO2 and CO concentrations with European and US AQI bands, compared against WHO guideline values.",
      },
      { property: "og:title", content: "Air Quality — GreenShield" },
      {
        property: "og:description",
        content: "Particulates and gases from the Open-Meteo Air Quality API, banded against WHO and EEA references.",
      },
    ],
  }),
  component: AirQualityPage,
});

const GUIDELINES = [
  { key: "pm2_5", label: "PM2.5", unit: "µg/m³", who: 15, note: "WHO 2021 24-hour guideline" },
  { key: "pm10", label: "PM10", unit: "µg/m³", who: 45, note: "WHO 2021 24-hour guideline" },
  { key: "ozone", label: "Ozone", unit: "µg/m³", who: 100, note: "WHO 8-hour peak-season guideline" },
  { key: "no2", label: "Nitrogen dioxide", unit: "µg/m³", who: 25, note: "WHO 24-hour guideline" },
  { key: "so2", label: "Sulphur dioxide", unit: "µg/m³", who: 40, note: "WHO 24-hour guideline" },
  { key: "co", label: "Carbon monoxide", unit: "µg/m³", who: 4000, note: "WHO 24-hour guideline" },
] as const;

function AirQualityPage() {
  const { bundle, risk, isLoading, error, refetch } = useEnvironment();
  const airScore = risk?.subScores.find((s) => s.key === "air");

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Air quality"
        title="Particulates, gases and index bands"
        description="Concentrations are measured values from the Open-Meteo Air Quality API (CAMS model output). Guideline comparisons use published WHO 2021 thresholds; the 0–100 air sub-score is a GreenShield calculation."
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          <PanelSkeleton />
          <PanelSkeleton />
          <PanelSkeleton />
        </div>
      ) : null}

      {error && !bundle ? <ErrorPanel message="The air-quality request failed for this location." onRetry={refetch} /> : null}

      {bundle && airScore ? (
        <>
          {bundle.demo ? <DemoBanner onRetry={refetch} /> : null}

          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <div className="panel space-y-4 p-6">
              <div className="flex items-center justify-between">
                <p className="label-micro">Air sub-score</p>
                <ProvenanceChip source="calc" />
              </div>
              <p className={cn("num text-6xl font-extrabold", BAND_TEXT[airScore.band])}>{airScore.score}</p>
              <p className={cn("num text-[10px] font-bold uppercase", BAND_TEXT[airScore.band])}>
                {BAND_LABEL[airScore.band]} · weight {Math.round(airScore.weight * 100)}%
              </p>
              <p className="text-muted-foreground text-xs leading-relaxed">{airScore.explanation}</p>
              <ul className="space-y-1 border-t pt-3">
                {airScore.inputs.map((i) => (
                  <li key={i} className="num text-[10px]">
                    {i}
                  </li>
                ))}
              </ul>
              <p className="num text-muted-foreground text-[9px] uppercase">
                Observed {formatTimestamp(bundle.air.observedAt, bundle.weather.timezone)}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <MetricCard
                label="European AQI"
                value={bundle.air.europeanAqi == null ? "—" : String(Math.round(bundle.air.europeanAqi))}
                note={`${euAqiBand(bundle.air.europeanAqi)} · EEA scale 0–100+`}
                source="air"
              />
              <MetricCard
                label="US AQI"
                value={bundle.air.usAqi == null ? "—" : String(Math.round(bundle.air.usAqi))}
                note={`${usAqiBand(bundle.air.usAqi)} · EPA scale 0–500`}
                source="air"
                delay={60}
              />
              {GUIDELINES.map((g, i) => {
                const value = bundle.air[g.key];
                const ratio = value == null ? null : value / g.who;
                return (
                  <MetricCard
                    key={g.key}
                    label={g.label}
                    value={value == null ? "—" : value.toFixed(g.key === "co" ? 0 : 1)}
                    unit={g.unit}
                    note={
                      ratio == null
                        ? "Not reported for this hour"
                        : `${ratio.toFixed(2)}× ${g.note} (${g.who} ${g.unit})`
                    }
                    noteTone={ratio != null && ratio > 1 ? "ember" : "forest"}
                    source="air"
                    delay={120 + i * 40}
                  />
                );
              })}
            </div>
          </div>

          <div className="panel p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold">Hourly particulate trace</h2>
                <p className="text-muted-foreground mt-1 text-[10px]">
                  PM2.5 and PM10 for the next 48 hours, µg/m³
                </p>
              </div>
              <ProvenanceChip source="air" />
            </div>
            <div className="h-72">
              <ParticulateChart data={bundle.air.hourly} />
            </div>
          </div>

          <div className="panel space-y-2 p-5">
            <p className="label-micro">How to read these numbers</p>
            <p className="text-muted-foreground max-w-prose text-xs leading-relaxed">
              These are modelled concentrations at a 11 km grid resolution, not readings from a street-level monitor.
              They are reliable for regional exposure trends and for comparing hours or locations, but a nearby
              construction site, highway or brick kiln can push local values well above what you see here. GreenShield
              never blends in synthetic sensor data to fill that gap.
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
