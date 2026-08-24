import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchLocations } from "@/lib/gs/api";
import { locationLabel } from "@/lib/gs/format";
import { useGreenShield } from "@/lib/gs/store";
import type { GeoLocation } from "@/lib/gs/types";
import { cn } from "@/lib/utils";

export function LocationSearch({
  className,
  autoFocus = false,
  onSelected,
}: {
  className?: string;
  autoFocus?: boolean;
  onSelected?: (loc: GeoLocation) => void;
}) {
  const { setLocation, saved, toggleSaved, isSaved } = useGreenShield();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeoLocation[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setError(null);
      setBusy(false);
      return;
    }
    const controller = new AbortController();
    setBusy(true);
    const timer = setTimeout(async () => {
      try {
        const found = await searchLocations(q, controller.signal);
        setResults(found);
        setError(found.length ? null : "No matching place. Try a city name or `lat, lon`.");
      } catch (err) {
        if (!controller.signal.aborted) {
          setError("Geocoding service unreachable. Check your connection and retry.");
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) setBusy(false);
      }
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const pick = (loc: GeoLocation) => {
    setLocation(loc);
    setQuery("");
    setResults([]);
    setOpen(false);
    onSelected?.(loc);
  };

  const showPanel = open && (query.trim().length >= 2 || saved.length > 0);

  return (
    <div ref={wrapRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2" aria-hidden />
        <Input
          value={query}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && results.length) pick(results[0]);
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Search a city or paste lat, lon"
          aria-label="Search for a location"
          className="num h-9 pl-9 text-xs"
        />
        {query ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Clear search"
            onClick={() => setQuery("")}
            className="absolute top-1/2 right-1 size-7 -translate-y-1/2"
          >
            <X className="size-3.5" aria-hidden />
          </Button>
        ) : null}
      </div>

      {showPanel ? (
        <div className="panel absolute top-11 right-0 left-0 z-[600] max-h-80 overflow-y-auto p-2 shadow-lg">
          {busy ? (
            <div className="text-muted-foreground flex items-center gap-2 px-2 py-3 text-xs">
              <Loader2 className="size-3.5 animate-spin" aria-hidden /> Searching Maps…
            </div>
          ) : null}

          {!busy && error ? <p className="text-muted-foreground px-2 py-3 text-xs">{error}</p> : null}

          {results.map((loc) => (
            <div key={loc.id} className="hover:bg-muted flex items-center gap-1 rounded-md">
              <button
                type="button"
                onClick={() => pick(loc)}
                className="flex flex-1 items-center gap-2 px-2 py-2 text-left"
              >
                <MapPin className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
                <span className="min-w-0">
                  <span className="block truncate text-xs font-medium">{locationLabel(loc)}</span>
                  <span className="num text-muted-foreground block text-[10px]">
                    {loc.latitude.toFixed(3)}, {loc.longitude.toFixed(3)}
                    {loc.population ? ` · pop ${Intl.NumberFormat("en").format(loc.population)}` : ""}
                  </span>
                </span>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={isSaved(loc) ? `Remove ${loc.name} from saved` : `Save ${loc.name}`}
                onClick={() => toggleSaved(loc)}
                className="mr-1 size-7"
              >
                <Star className={cn("size-3.5", isSaved(loc) && "fill-caution text-caution")} aria-hidden />
              </Button>
            </div>
          ))}

          {!busy && query.trim().length < 2 && saved.length ? (
            <div className="space-y-1">
              <p className="label-micro px-2 py-1">Saved locations</p>
              {saved.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => pick(loc)}
                  className="hover:bg-muted flex w-full items-center gap-2 rounded-md px-2 py-2 text-left"
                >
                  <Star className="fill-caution text-caution size-3.5 shrink-0" aria-hidden />
                  <span className="truncate text-xs font-medium">{locationLabel(loc)}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
