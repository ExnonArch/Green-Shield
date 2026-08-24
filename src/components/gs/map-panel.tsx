import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { coordLabel } from "@/lib/gs/format";
import type { GeoLocation, SeverityBand } from "@/lib/gs/types";
import { cn } from "@/lib/utils";
import { ProvenanceChip } from "./provenance";

const MapView = lazy(() => import("./map-view"));

function MapSkeleton() {
  return (
    <div className="bg-muted num text-muted-foreground grid size-full place-items-center text-[10px] tracking-widest uppercase">
      Loading OpenStreetMap tiles
    </div>
  );
}

export function MapPanel({
  location,
  band,
  zoom,
  onPick,
  markers,
  layerLabel = "OSM STANDARD",
  className,
}: {
  location: GeoLocation;
  band?: SeverityBand;
  zoom?: number;
  onPick?: (lat: number, lon: number) => void;
  markers?: Array<{ location: GeoLocation; band?: SeverityBand; score?: number }>;
  layerLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("panel relative overflow-hidden", className)}>
      <ClientOnly fallback={<MapSkeleton />}>
        <Suspense fallback={<MapSkeleton />}>
          <MapView location={location} band={band} zoom={zoom} onPick={onPick} markers={markers} />
        </Suspense>
      </ClientOnly>
      <div className="pointer-events-none absolute top-3 left-3 z-[400] flex flex-wrap gap-2">
        <ProvenanceChip source="osm" className="bg-foreground text-background">
          {layerLabel}
        </ProvenanceChip>
        {onPick ? (
          <ProvenanceChip source="osm" className="bg-card/90 text-foreground">
            Click map to analyse
          </ProvenanceChip>
        ) : null}
      </div>
      <div className="bg-card/90 num text-muted-foreground pointer-events-none absolute right-3 bottom-6 z-[400] rounded px-1.5 py-0.5 text-[9px]">
        {coordLabel(location.latitude, location.longitude)}
      </div>
    </div>
  );
}
