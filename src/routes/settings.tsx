import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/gs/page-header";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { coordLabel, locationLabel, tempDisplay } from "@/lib/gs/format";
import { useGreenShield, type TempUnit, type ThemeMode } from "@/lib/gs/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — GreenShield" },
      {
        name: "description",
        content:
          "Choose theme, temperature units and AI behaviour, and manage the locations you have saved in GreenShield.",
      },
      { property: "og:title", content: "Settings — GreenShield" },
      { property: "og:description", content: "Theme, units, AI preferences and saved locations." },
    ],
  }),
  component: SettingsPage,
});

const THEMES: Array<{ key: ThemeMode; label: string; note: string }> = [
  { key: "light", label: "Light", note: "Always light" },
  { key: "dark", label: "Dark", note: "Always dark" },
  { key: "system", label: "System", note: "Follow the OS" },
];

const UNITS: Array<{ key: TempUnit; label: string; note: string }> = [
  { key: "c", label: "Celsius", note: "°C — Open-Meteo native" },
  { key: "f", label: "Fahrenheit", note: "°F — converted by GreenShield" },
];

function SettingsPage() {
  const { settings, updateSettings, saved, toggleSaved, location, setLocation, resetAll, hydrated } =
    useGreenShield();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Settings"
        title="Preferences and saved places"
        description="Everything here is stored locally in your browser. GreenShield keeps no account and sends no personal data to any server — API requests carry only the coordinates you choose."
        showLocation={false}
      />

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="panel space-y-4 p-6">
          <div>
            <h2 className="text-sm font-bold">Appearance</h2>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              Charts, maps and severity colours all adapt to the chosen theme.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-3" role="group" aria-label="Theme">
            {THEMES.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => updateSettings({ theme: t.key })}
                aria-pressed={settings.theme === t.key}
                className={cn(
                  "rounded-lg border px-3 py-3 text-left transition-colors",
                  settings.theme === t.key ? "border-foreground bg-muted" : "hover:bg-muted/60",
                )}
              >
                <span className="block text-xs font-bold">{t.label}</span>
                <span className="num text-muted-foreground block text-[10px] uppercase">{t.note}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="panel space-y-4 p-6">
          <div>
            <h2 className="text-sm font-bold">Temperature units</h2>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              Measurements arrive in Celsius. Fahrenheit is a display conversion applied by GreenShield; the scoring
              model always runs on the original Celsius values.
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Temperature unit">
            {UNITS.map((u) => (
              <button
                key={u.key}
                type="button"
                onClick={() => updateSettings({ unit: u.key })}
                aria-pressed={settings.unit === u.key}
                className={cn(
                  "rounded-lg border px-3 py-3 text-left transition-colors",
                  settings.unit === u.key ? "border-foreground bg-muted" : "hover:bg-muted/60",
                )}
              >
                <span className="block text-xs font-bold">{u.label}</span>
                <span className="num text-muted-foreground block text-[10px] uppercase">{u.note}</span>
              </button>
            ))}
          </div>
          <p className="num text-muted-foreground text-[10px] uppercase">
            Preview · 36.4 °C renders as {tempDisplay(36.4, settings.unit)}
          </p>
        </div>
      </section>

      <section className="panel space-y-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold">AI explanations</h2>
            <p className="text-muted-foreground mt-1 max-w-prose text-xs leading-relaxed">
              When off, GreenShield hides the chat and AI-authored interventions. Measurements, risk scores and
              rule-based actions keep working exactly as before — the AI layer is always optional and never feeds back
              into the score.
            </p>
          </div>
          <Switch
            id="ai-explanations"
            checked={settings.aiExplanations}
            onCheckedChange={(v) => updateSettings({ aiExplanations: v })}
            aria-label="Enable AI explanations"
          />
        </div>
        <Label htmlFor="ai-explanations" className="num text-muted-foreground text-[10px] uppercase">
          AI explanations are {settings.aiExplanations ? "on" : "off"}
        </Label>
      </section>

      <section className="panel space-y-4 p-6">
        <div>
          <h2 className="text-sm font-bold">Saved locations</h2>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            Up to 12 places, kept in this browser only. Save a place from the header search or the map.
          </p>
        </div>

        {!hydrated ? (
          <p className="text-muted-foreground text-xs">Loading…</p>
        ) : saved.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            Nothing saved yet. The active location is {locationLabel(location)}.
          </p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {saved.map((loc) => (
              <li key={loc.id} className="flex items-center gap-3 rounded-lg border px-3 py-2.5">
                <MapPin className="text-muted-foreground size-3.5 shrink-0" aria-hidden />
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold">{locationLabel(loc)}</p>
                  <p className="num text-muted-foreground text-[10px]">
                    {coordLabel(loc.latitude, loc.longitude)}
                  </p>
                </div>
                <div className="ml-auto flex shrink-0 items-center gap-1">
                  <Button
                    size="sm"
                    variant={loc.id === location.id ? "default" : "outline"}
                    onClick={() => setLocation(loc)}
                    className="h-7 text-[10px]"
                  >
                    {loc.id === location.id ? "Active" : "Use"}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => toggleSaved(loc)}
                    aria-label={`Remove ${locationLabel(loc)}`}
                    className="size-7"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel border-destructive/30 space-y-3 p-6">
        <h2 className="text-sm font-bold">Reset GreenShield</h2>
        <p className="text-muted-foreground max-w-prose text-xs leading-relaxed">
          Clears the active location, saved places and preferences from this browser, returning to the Lahore default.
          Nothing is deleted anywhere else, because nothing is stored anywhere else.
        </p>
        <Button variant="outline" size="sm" onClick={resetAll} className="h-8 text-xs">
          <Trash2 className="size-3.5" aria-hidden />
          Reset everything
        </Button>
      </section>
    </div>
  );
}
