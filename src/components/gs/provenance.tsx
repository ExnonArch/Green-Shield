import { cn } from "@/lib/utils";

export type Provenance = "meteo" | "air" | "osm" | "calc" | "ai" | "demo";

const LABELS: Record<Provenance, string> = {
  meteo: "OPEN-METEO",
  air: "OM AIR-QUALITY",
  osm: "OPENSTREETMAP",
  calc: "GS CALC",
  ai: "AI EXPLANATION",
  demo: "DEMO DATA",
};

const TITLES: Record<Provenance, string> = {
  meteo: "Measured value from the Open-Meteo Forecast API",
  air: "Measured value from the Open-Meteo Air Quality API",
  osm: "Map tiles and place data from OpenStreetMap",
  calc: "Computed by the GreenShield scoring model from API measurements",
  ai: "Generated language from GreenShield AI — interpretation, not a measurement",
  demo: "Archived reference snapshot shown because live APIs were unreachable",
};

const TONE: Record<Provenance, string> = {
  meteo: "bg-chip text-chip-foreground ring-1 ring-foreground/10",
  air: "bg-chip text-chip-foreground ring-1 ring-foreground/10",
  osm: "bg-chip text-chip-foreground ring-1 ring-foreground/10",
  calc: "bg-accent text-accent-foreground ring-1 ring-primary/30",
  ai: "bg-forest/12 text-forest ring-1 ring-forest/30",
  demo: "bg-ember/12 text-ember ring-1 ring-ember/30",
};

export function ProvenanceChip({
  source,
  className,
  children,
}: {
  source: Provenance;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <span
      title={TITLES[source]}
      className={cn(
        "num inline-flex shrink-0 items-center rounded px-1.5 py-0.5 text-[9px] leading-tight font-medium tracking-tight uppercase",
        TONE[source],
        className,
      )}
    >
      {children ?? LABELS[source]}
    </span>
  );
}
