import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPanel } from "@/components/gs/map-panel";
import { PageHeader } from "@/components/gs/page-header";
import { ProvenanceChip } from "@/components/gs/provenance";
import { RiskBreakdown, RiskGauge } from "@/components/gs/risk-panel";
import { DemoBanner, ErrorPanel, PanelSkeleton } from "@/components/gs/states";
import { useEnvironment } from "@/hooks/use-environment";
import { WEIGHTS } from "@/lib/gs/scoring";
import { coordLabel, formatTimestamp, locationLabel, weatherLabel } from "@/lib/gs/format";

export const Route = createFileRoute("/analysis")({
  head: () => ({
    meta: [
      { title: "Location Analysis — GreenShield" },
      {
        name: "description",
        content:
          "Component-by-component breakdown of the GreenShield Environmental Risk Score: the measured inputs, the weighting, and the resulting hazard bands.",
      },
      { property: "og:title", content: "Location Analysis — GreenShield" },
      {
        property: "og:description",
        content: "See exactly which measurements produced the risk score and how each hazard component is weighted.",
      },
    ],
  }),
  component: AnalysisPage,
});

function AnalysisPage() {
  const { bundle, risk, isLoading, error, refetch, location } = useEnvironment();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Location analysis"
        title="The maths behind this location's score"
        description="Each hazard component is normalised to 0–100 with a published piecewise-linear curve, then combined with fixed weights. The inputs listed under each component are the exact measurements used."
      />

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <PanelSkeleton lines={7} />
          <PanelSkeleton lines={7} />
        </div>
      ) : null}

      {error && !bundle ? <ErrorPanel message="Measurements for this location failed to load." onRetry={refetch} /> : null}

      {bundle && risk ? (
        <>
          {bundle.demo ? <DemoBanner onRetry={refetch} /> : null}

          <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
            <RiskGauge risk={risk} />

            <div className="space-y-4">
              <div className="panel space-y-4 p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="label-micro">Snapshot context</p>
                  <ProvenanceChip source={bundle.demo ? "demo" : "meteo"} />
                </div>
                <dl className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["Place", locationLabel(bundle.location)],
                    ["Coordinates", coordLabel(bundle.location.latitude, bundle.location.longitude)],
                    ["Timezone", bundle.weather.timezone],
                    ["Conditions", weatherLabel(bundle.weather.weatherCode)],
                    ["Weather observed", formatTimestamp(bundle.weather.observedAt, bundle.weather.timezone)],
                    ["Air observed", formatTimestamp(bundle.air.observedAt, bundle.weather.timezone)],
                    ["Score computed", formatTimestamp(risk.computedAt, bundle.weather.timezone)],
                    ["Model version", "GS-CALC-V1"],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="label-micro">{k}</dt>
                      <dd className="num mt-1 text-[11px] font-bold">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="panel space-y-3 p-5">
                <p className="label-micro">Composite formula</p>
                <p className="num bg-muted overflow-x-auto rounded-lg p-3 text-[11px] leading-relaxed">
                  score = round(
                  {Object.entries(WEIGHTS)
                    .map(([k, w]) => ` ${w} × ${k}`)
                    .join(" +")}{" "}
                  )
                </p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Weights are fixed, documented, and identical for every location — GreenShield never tunes them per
                  place. Missing measurements are excluded and the remaining weights are renormalised, so an unavailable
                  UV reading cannot silently lower the score.
                </p>
                <Link to="/methodology" className="num text-[10px] uppercase underline underline-offset-4">
                  Full methodology and breakpoints
                </Link>
              </div>

              <MapPanel location={location} band={risk.band} zoom={11} className="h-64" />
            </div>
          </div>

          <section className="space-y-4">
            <h2 className="text-lg font-extrabold">Component breakdown</h2>
            <RiskBreakdown risk={risk} />
          </section>
        </>
      ) : null}
    </div>
  );
}
