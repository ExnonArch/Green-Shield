import { AlertTriangle, DatabaseZap, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function PanelSkeleton({ className, lines = 3 }: { className?: string; lines?: number }) {
  return (
    <div className={cn("panel p-6", className)}>
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-6 h-10 w-32" />
      <div className="mt-6 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-full" />
        ))}
      </div>
    </div>
  );
}

export function LoadingRow({ label = "Loading readings" }: { label?: string }) {
  return (
    <div className="text-muted-foreground flex items-center gap-2 text-xs">
      <Loader2 className="size-3.5 animate-spin" aria-hidden />
      <span className="num tracking-tight uppercase">{label}</span>
    </div>
  );
}

export function ErrorPanel({
  title = "Data unavailable",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="panel border-destructive/30 p-6" role="alert">
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-destructive mt-0.5 size-4 shrink-0" aria-hidden />
        <div className="space-y-2">
          <h3 className="text-sm font-bold">{title}</h3>
          <p className="text-muted-foreground max-w-prose text-xs leading-relaxed">{message}</p>
          {onRetry ? (
            <Button size="sm" variant="outline" onClick={onRetry} className="mt-1 h-8 text-xs">
              <RefreshCw className="size-3.5" aria-hidden />
              Try again
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function DemoBanner({ onRetry }: { onRetry?: () => void }) {
  return (
    <div
      className="border-ember/30 bg-ember/8 flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3"
      role="status"
    >
      <DatabaseZap className="text-ember size-4 shrink-0" aria-hidden />
      <p className="text-xs leading-relaxed">
        <span className="text-ember font-bold uppercase">Demo mode</span> — live Open-Meteo requests failed, so
        GreenShield is showing an archived reference snapshot for Lahore, Pakistan (18 Jun 2024). Nothing here is a
        live reading.
      </p>
      {onRetry ? (
        <Button size="sm" variant="outline" onClick={onRetry} className="ml-auto h-7 text-xs">
          Retry live data
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="panel text-muted-foreground p-6 text-xs leading-relaxed">
      {message}
    </div>
  );
}
