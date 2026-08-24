import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Crosshair, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LocationSearch } from "@/components/gs/location-search";
import { MapPanel } from "@/components/gs/map-panel";
import { PageHeader } from "@/components/gs/page-header";
import { ProvenanceChip } from "@/components/gs/provenance";
import { DemoBanner, ErrorPanel, LoadingRow } from "@/components/gs/states";
import { useEnvironment } from "@/hooks/use-environment";
import { reverseGeocode } from "@/lib/gs/api";
import { coordLabel, euAqiBand, locationLabel, tempDisplay } from "@/lib/gs/format";
import { BAND_BG, BAND_LABEL, BAND_TEXT } from "@/lib/gs/scoring";
import { useGreenShield } from "@/lib/gs/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/map")({
  head: () => ({
    meta: [
      { title: "Explore Map — GreenShield" },
      {
        name: "description",
        content:
          "Pick any point on an OpenStreetMap basemap and GreenShield scores that coordinate from live Open-Meteo weather and air-quality measurements.",
      },
      { property: "og:title", content: "Explore Map — GreenShield" },
      {
        property: "og:description",
        content: "Click anywhere on the map to score a coordinate with live weather and air-quality data.",
      },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const { location, setLocation, saved, toggleSaved, isSaved } = useGreenShield();
  const { bundle, risk, isLoading, error, refetch } = useEnvironment();
  const [picking, setPicking] = useState(false);
  const [pickError, setPickError] = useState<string | null>(null);

  const handlePick = async (lat: number, lon: number) => {
    setPicking(true);
    setPickError(null);
    try {
      const loc = await reverseGeocode(lat, lon);
      setLocation(loc);
    } catch {
      setPickError("Could not name that point, so it is labelled by coordinates only.");
      setLocation({
        id: `${lat.toFixed(4)},${lon.toFixed(4)}`,
        name: `${lat.toFixed(3)}, ${lon.toFixed(3)}`,
        latitude: lat,
        longitude: lon,
      });
    } finally {
      setPicking(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Explore map"
        title="Score any coordinate on the planet"
        description="Click the map, search a place, or reuse a saved location. GreenShield reverse-geocodes the point through Open-Meteo and refetches every measurement for it."
      >
        <LocationSearch className="w-full sm:w-72" />
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <MapPanel
          location={location}
          band={risk?.band}
          zoom={10}
          onPick={handlePick}
          markers={saved.map((loc) => ({ location: loc }))}
          className="h-[420px] lg:h-[640px]"
        />

        <div className="space-y-4">
          <div className="panel space-y-3 p-5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="label-micro">Selected point</p>
                <h2 className="mt-1 text-sm font-bold">{locationLabel(location)}</h2>
                <p className="num text-muted-foreground mt-1 text-[10px]">
                  {coordLabel(location.latitude, location.longitude)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={isSaved(location) ? "Remove from saved locations" : "Save this location"}
                onClick={() => toggleSaved(location)}
                className="size-8"
              >
                <Star className={cn("size-4", isSaved(location) && "fill-caution text-caution")} aria-hidden />
              </Button>
            </div>
            {picking ? <LoadingRow label="Reverse geocoding point" /> : null}
            {pickError ? <p className="text-muted-foreground text-[10px]">{pickError}</p> : null}
          </div>

          {bundle?.demo ? <DemoBanner onRetry={refetch} /> : null}

          {isLoading ? (
            <div className="panel p-5">
              <LoadingRow label="Fetching measurements for point" />
            </div>
          ) : null}

          {error && !bundle ? <ErrorPanel message="Measurements for this point failed to load." onRetry={refetch} /> : null}

          {risk && bundle ? (
            <div className="panel space-y-4 p-5">
              <div className="flex items-center justify-between">
                <p className="label-micro">Risk at point</p>
                <ProvenanceChip source="calc">GS-CALC-V1</ProvenanceChip>
              </div>
              <p className={cn("num text-5xl font-extrabold", BAND_TEXT[risk.band])}>{risk.score}</p>
              <p className={cn("num text-[10px] font-bold uppercase", BAND_TEXT[risk.band])}>
                {BAND_LABEL[risk.band]} severity
              </p>
              <dl className="space-y-2 border-t pt-3">
                <div className="flex justify-between text-[11px]">
                  <dt className="text-muted-foreground">Temperature</dt>
                  <dd className="num font-bold">{tempDisplay(bundle.weather.temperature, "c")}</dd>
                </div>
                <div className="flex justify-between text-[11px]">
                  <dt className="text-muted-foreground">European AQI</dt>
                  <dd className="num font-bold">
                    {bundle.air.europeanAqi == null ? "—" : Math.round(bundle.air.europeanAqi)} ·{" "}
                    {euAqiBand(bundle.air.europeanAqi)}
                  </dd>
                </div>
                <div className="flex justify-between text-[11px]">
                  <dt className="text-muted-foreground">PM2.5</dt>
                  <dd className="num font-bold">
                    {bundle.air.pm2_5 == null ? "—" : `${bundle.air.pm2_5.toFixed(1)} µg/m³`}
                  </dd>
                </div>
              </dl>
            </div>
          ) : null}

          <div className="panel space-y-3 p-5">
            <p className="label-micro">Marker legend</p>
            {(["low", "moderate", "elevated", "high", "severe"] as const).map((band) => (
              <div key={band} className="flex items-center gap-2">
                <span className={cn("size-2.5 rounded-full", BAND_BG[band])} aria-hidden />
                <span className="num text-[10px] uppercase">{BAND_LABEL[band]}</span>
              </div>
            ))}
            <p className="text-muted-foreground flex items-start gap-2 pt-2 text-[10px] leading-relaxed">
              <Crosshair className="mt-0.5 size-3 shrink-0" aria-hidden />
              Saved locations appear as secondary markers. Click one to make it active.
            </p>
          </div>

          {picking ? (
            <p className="text-muted-foreground flex items-center gap-2 text-[10px]">
              <Loader2 className="size-3 animate-spin" aria-hidden /> Updating context…
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
