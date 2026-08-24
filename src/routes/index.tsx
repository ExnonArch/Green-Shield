import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Cpu, Database, Gauge, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocationSearch } from "@/components/gs/location-search";
import { MapPanel } from "@/components/gs/map-panel";
import { ProvenanceChip } from "@/components/gs/provenance";
import { RiskGauge } from "@/components/gs/risk-panel";
import { DemoBanner, ErrorPanel, PanelSkeleton } from "@/components/gs/states";
import { NAV } from "@/components/gs/nav";
import { useEnvironment } from "@/hooks/use-environment";
import { formatTimestamp, locationLabel, tempDisplay } from "@/lib/gs/format";
import { useGreenShield } from "@/lib/gs/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GreenShield — Environmental Risk Score from live climate data" },
      {
        name: "description",
        content:
          "Search any location for a transparent 0–100 Environmental Risk Score built from live Open-Meteo weather and air-quality data, with AI-explained interventions.",
      },
      { property: "og:title", content: "GreenShield — Environmental Risk Score from live climate data" },
      {
        property: "og:description",
        content:
          "Transparent 0–100 environmental risk scoring from live Open-Meteo measurements, with maps, charts and AI-explained climate actions.",
      },
    ],
  }),
  component: HomePage,
});

const PIPELINE = [
  { icon: Database, title: "Measured inputs", body: "Open-Meteo forecast, air-quality and archive APIs. No keys, no scraping, no synthetic values." },
  { icon: Gauge, title: "GreenShield calculation", body: "Five hazard components — heat, air, rainfall, humidity, UV — normalised to 0–100 and weighted into one composite." },
  { icon: Cpu, title: "Explanation layer", body: "Deterministic text for every sub-score, so the number is readable without any AI in the loop." },
  { icon: Sparkles, title: "AI interpretation", body: "Grounded prose and prioritised actions from a server-side model that may only cite the measured brief." },
];

function HomePage() {
  const { bundle, risk, isLoading, error, refetch, location } = useEnvironment();
  const { settings } = useGreenShield();

  return (
    <div className="space-y-16">
      <section className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div
          aria-hidden
          className="bg-primary/15 pointer-events-none absolute -top-24 -left-24 size-96 rounded-full blur-[110px]"
        />
        <div className="relative">
          <div className="flex flex-wrap items-center gap-2">
            <ProvenanceChip source="meteo" />
            <ProvenanceChip source="osm" />
            <ProvenanceChip source="calc">GS-CALC-V1</ProvenanceChip>
          </div>
          <h1 className="mt-5 text-4xl leading-[1.02] font-bold tracking-tight sm:text-6xl">
            Real environmental data,{" "}
            <span className="text-primary text-glow-mint">scored</span> where you actually live.
          </h1>
          <p className="text-muted-foreground mt-5 max-w-xl text-sm leading-relaxed">
            GreenShield reads live weather and air-quality measurements for a coordinate, converts them into a single
            Environmental Risk Score between 0 and 100, names the hazards driving that number, and turns them into
            actions. Every figure on screen is labelled as a measurement, a GreenShield calculation, or an AI
            explanation.
          </p>

          <div className="mt-7 max-w-md">
            <LocationSearch />
            <p className="text-muted-foreground num mt-2 text-[10px] uppercase">
              Try a city name, or paste coordinates like 31.55, 74.34
            </p>
          </div>

          <div className="mt-7 flex flex-wrap gap-2">
            <Button asChild size="sm" className="glow-mint h-9 text-xs font-semibold">
              <Link to="/dashboard">
                Open dashboard <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="sm" variant="outline" className="h-9 text-xs">
              <Link to="/methodology">Read the methodology</Link>
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? <PanelSkeleton lines={5} /> : null}
          {error && !bundle ? (
            <ErrorPanel
              message="Live Open-Meteo requests failed and no snapshot could be loaded. Check your connection and retry."
              onRetry={refetch}
            />
          ) : null}
          {risk && bundle ? (
            <>
              {bundle.demo ? <DemoBanner onRetry={refetch} /> : null}
              <RiskGauge risk={risk} compact />
              <div className="panel flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="label-micro">Now at {locationLabel(bundle.location)}</p>
                  <p className="num mt-1 text-sm font-bold">
                    {tempDisplay(bundle.weather.temperature, settings.unit)} air ·{" "}
                    {tempDisplay(bundle.weather.apparentTemperature, settings.unit)} apparent
                  </p>
                </div>
                <p className="num text-muted-foreground text-[9px] uppercase">
                  Observed {formatTimestamp(bundle.weather.observedAt, bundle.weather.timezone)}
                </p>
              </div>
            </>
          ) : null}
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <p className="label-micro">The pipeline</p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Search → measure → score → act</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {PIPELINE.map((step, i) => (
            <div key={step.title} className="panel panel-hover space-y-3 p-5">
              <div className="flex items-center justify-between">
                <step.icon className="text-forest size-4" aria-hidden />
                <span className="num text-muted-foreground text-[10px]">0{i + 1}</span>
              </div>
              <h3 className="text-sm font-bold">{step.title}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="label-micro">Explore</p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">Ten instruments, one location context</h2>
          <p className="text-muted-foreground mt-3 max-w-prose text-sm leading-relaxed">
            Choose a location once — every page below re-reads the same live snapshot, so the map, the charts, the
            action list and the chatbot all describe the same coordinate and the same timestamp.
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {NAV.filter((n) => n.to !== "/").map((item) => (
              <Link key={item.to} to={item.to} className="panel panel-hover group p-4">
                <span className="flex items-center justify-between gap-2 text-xs font-bold">
                  {item.label}
                  <ArrowRight
                    className="text-primary size-3 opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden
                  />
                </span>
                <span className="text-muted-foreground mt-1 block text-[10px] leading-snug">{item.blurb}</span>
              </Link>
            ))}
          </div>
        </div>
        <MapPanel location={location} band={risk?.band} zoom={9} className="h-[420px] lg:h-full" />
      </section>
    </div>
  );
}
