import { cn } from "@/lib/utils";
import { ProvenanceChip, type Provenance } from "./provenance";

export function MetricCard({
  label,
  value,
  unit,
  note,
  noteTone = "muted",
  source,
  delay = 0,
  className,
}: {
  label: string;
  value: string;
  unit?: string;
  note?: string;
  noteTone?: "muted" | "ember" | "forest";
  source: Provenance;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("panel panel-hover animate-reveal space-y-3 p-4", className)}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-muted-foreground text-[9px] font-bold tracking-widest uppercase">{label}</span>
        <ProvenanceChip source={source} />
      </div>
      <div className="num text-[1.7rem] leading-none font-bold tracking-tight">
        {value}
        {unit ? <span className="text-muted-foreground ml-1 font-sans text-xs font-medium">{unit}</span> : null}
      </div>
      {note ? (
        <div
          className={cn(
            "text-[10px] leading-tight",
            noteTone === "ember" && "text-ember",
            noteTone === "forest" && "text-forest",
            noteTone === "muted" && "text-muted-foreground",
          )}
        >
          {note}
        </div>
      ) : null}
    </div>
  );
}
