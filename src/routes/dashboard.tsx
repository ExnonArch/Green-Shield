import { createFileRoute } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DailyTempChart, HourlyTempChart, ParticulateChart, RainfallChart } from "@/components/gs/charts";
import { MetricCard } from "@/components/gs/metric-card";
import { PageHeader } from "@/components/gs/page-header";
import { ProvenanceChip } from "@/components/gs/provenance";
import { RiskGauge } from "@/components/gs/risk-panel";
import { DemoBanner, ErrorPanel, PanelSkeleton } from "@/components/gs/states";
import { AiRecommendations } from "@/components/gs/recommendations";
import { useEnvironment } from "@/hooks/use-environment";
import { euAqiBand, formatTimestamp, tempDisplay, usAqiBand, weatherLabel } from "@/lib/gs/format";
import { BAND_LABEL, bandOf } from "@/lib/gs/scoring";
import { useGreenShield } from "@/lib/gs/store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Environmental Dashboard — GreenShield" },
      {
        name: "description",
        content:
          "Live environmental dashboard: risk score, heat risk, air quality, PM2.5/PM10, temperature, rainfall, humidity and 7-day forecasts for any location.",
      },
      { property: "og:title", content: "Environmental Dashboard — GreenShield" },
      {
        property: "og:description",
        content: "Risk score, heat, air quality, particulates, rainfall, humidity and forecasts from live Open-Meteo data.",
      },
    ],
  }),
  component: DashboardPage,
});

function ChartPanel({
  title,
  subtitle,
  source,
  children,
  height = "h-64",
}: {
  title: string;
  subtitle: string;
  source: "meteo" | "air";
  children: React.ReactNode;
  height?: string;
}) {
  return (
    <div className="panel p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold">{title}</h3>
          <p className="text-muted-foreground mt-1 text-[10px]">{subtitle}</p>
        </div>
        <ProvenanceChip source={source} />
      </div>
      <div className={height}>{children}</div>
    </div>
  );
}

function DashboardPage() {
  const { bundle, risk, brief, isLoading, isFetching, error, refetch } = useEnvironment();
  const { settings } = useGreenShield();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Environmental dashboard"
        title="Every live reading in one instrument panel"
        description="Measurements come straight from the Open-Meteo forecast and air-quality APIs. Bands and the 0–100 composite are GreenShield calculations over those measurements."
      >
        <Button size="sm" variant="outline" onClick={refetch} disabled={isFetching} className="h-9 text-xs">
          <RefreshCw className={isFetching ? "size-3.5 animate-spin" : "size-3.5"} aria-hidden />
          Refresh
        </Button>
      </PageHeader>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <PanelSkeleton lines={6} className="lg:col-span-1" />
          <PanelSkeleton lines={6} />
          <PanelSkeleton lines={6} />
        </div>
      ) : null}

      {error && !bundle ? (
        <ErrorPanel
          message="Open-Meteo could not be reached and no snapshot is cached for this location. Retry, or pick another location."
          onRetry={refetch}
        />
      ) : null}

      {bundle && risk ? (
        <>
          {bundle.demo ? <DemoBanner onRetry={refetch} /> : null}

          <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
            <RiskGauge risk={risk} />

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <MetricCard
                label="Heat risk"
                value={String(risk.subScores.find((s) => s.key === "heat")?.score ?? 0)}
                unit="/100"
                note={BAND_LABEL[risk.subScores.find((s) => s.key === "heat")?.band ?? "low"]}
                noteTone="ember"
                source="calc"
              />
              <MetricCard
                label="European AQI"
                value={bundle.air.europeanAqi == null ? "—" : String(Math.round(bundle.air.europeanAqi))}
                note={euAqiBand(bundle.air.europeanAqi)}
                source="air"
                delay={40}
              />
              <MetricCard
                label="US AQI"
                value={bundle.air.usAqi == null ? "—" : String(Math.round(bundle.air.usAqi))}
                note={usAqiBand(bundle.air.usAqi)}
                source="air"
                delay={80}
              />
              <MetricCard
                label="PM2.5"
                value={bundle.air.pm2_5 == null ? "—" : bundle.air.pm2_5.toFixed(1)}
                unit="µg/m³"
                note="WHO 24 h guideline 15 µg/m³"
                source="air"
                delay={120}
              />
              <MetricCard
                label="PM10"
                value={bundle.air.pm10 == null ? "—" : bundle.air.pm10.toFixed(1)}
                unit="µg/m³"
                note="WHO 24 h guideline 45 µg/m³"
                source="air"
                delay={160}
              />
              <MetricCard
                label="Temperature"
                value={tempDisplay(bundle.weather.temperature, settings.unit)}
                note={`Apparent ${tempDisplay(bundle.weather.apparentTemperature, settings.unit)}`}
                source="meteo"
                delay={200}
              />
              <MetricCard
                label="Rainfall (now)"
                value={bundle.weather.precipitation.toFixed(1)}
                unit="mm/h"
                note={`Next 7 days ${bundle.weather.daily.reduce((a, d) => a + (d.precipitation ?? 0), 0).toFixed(1)} mm`}
                source="meteo"
                delay={240}
              />
              <MetricCard
                label="Humidity"
                value={String(Math.round(bundle.weather.humidity))}
                unit="%"
                note={weatherLabel(bundle.weather.weatherCode)}
                source="meteo"
                delay={280}
              />
              <MetricCard
                label="UV index"
                value={bundle.weather.uvIndex == null ? "—" : bundle.weather.uvIndex.toFixed(1)}
                note={
                  bundle.weather.uvIndex == null
                    ? "Not reported for this hour"
                    : BAND_LABEL[bandOf(risk.subScores.find((s) => s.key === "uv")?.score ?? 0)]
                }
                source="meteo"
                delay={320}
              />
              <MetricCard
                label="Wind"
                value={bundle.weather.windSpeed.toFixed(1)}
                unit="km/h"
                note={`Bearing ${Math.round(bundle.weather.windDirection)}°`}
                source="meteo"
                delay={360}
              />
              <MetricCard
                label="Ozone"
                value={bundle.air.ozone == null ? "—" : bundle.air.ozone.toFixed(0)}
                unit="µg/m³"
                note={`NO₂ ${bundle.air.no2 == null ? "—" : bundle.air.no2.toFixed(0)} µg/m³`}
                source="air"
                delay={400}
              />
              <MetricCard
                label="Data age"
                value={formatTimestamp(bundle.weather.observedAt, bundle.weather.timezone).split(", ")[1] ?? "—"}
                note={`Fetched ${formatTimestamp(bundle.weather.fetchedAt, bundle.weather.timezone)}`}
                source={bundle.demo ? "demo" : "meteo"}
                delay={440}
              />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <ChartPanel
              title="7-day temperature outlook"
              subtitle="Daily air maxima and minima with apparent-temperature maxima"
              source="meteo"
            >
              <DailyTempChart data={bundle.weather.daily} />
            </ChartPanel>
            <ChartPanel title="7-day rainfall" subtitle="Daily precipitation totals in millimetres" source="meteo">
              <RainfallChart data={bundle.weather.daily} />
            </ChartPanel>
            <ChartPanel
              title="Particulate matter, next 48 hours"
              subtitle="Hourly PM2.5 and PM10 concentrations"
              source="air"
            >
              <ParticulateChart data={bundle.air.hourly} />
            </ChartPanel>
            <ChartPanel
              title="Hourly temperature and humidity"
              subtitle="Next 48 hours from the forecast model"
              source="meteo"
            >
              <HourlyTempChart data={bundle.weather.hourly} />
            </ChartPanel>
          </div>

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-extrabold">Why the score reads {risk.score}</h2>
              <p className="text-muted-foreground mt-1 text-xs">
                Deterministic explanations — no AI involved in these sentences.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {risk.subScores.map((s) => (
                <div key={s.key} className="panel space-y-2 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold">{s.label}</h3>
                    <span className="num text-[10px] font-bold">
                      {s.score}/100 · w{Math.round(s.weight * 100)}%
                    </span>
                  </div>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">{s.explanation}</p>
                </div>
              ))}
            </div>
          </section>

          <AiRecommendations brief={brief} risk={risk} aiEnabled={settings.aiExplanations} />
        </>
      ) : null}
    </div>
  );
}
