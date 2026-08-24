import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/gs/page-header";
import { ProvenanceChip } from "@/components/gs/provenance";
import { BREAKPOINTS, WEIGHTS } from "@/lib/gs/scoring";

export const Route = createFileRoute("/methodology")({
  head: () => ({
    meta: [
      { title: "Methodology & Data Sources — GreenShield" },
      {
        name: "description",
        content:
          "Every formula, weight, breakpoint and data source behind the GreenShield Environmental Risk Score, plus the model's stated limitations.",
      },
      { property: "og:title", content: "Methodology & Data Sources — GreenShield" },
      {
        property: "og:description",
        content: "Transparent scoring: Open-Meteo measurements in, a documented weighted 0–100 index out.",
      },
    ],
  }),
  component: MethodologyPage,
});

const SOURCES = [
  {
    name: "Open-Meteo Forecast API",
    url: "https://open-meteo.com/en/docs",
    provides: "Current temperature, apparent temperature, humidity, precipitation, wind, UV index, weather code, 7-day daily and 48-hour hourly forecasts",
    cadence: "Hourly model output, refreshed by GreenShield every 5 minutes on demand",
    key: "No API key",
  },
  {
    name: "Open-Meteo Air Quality API",
    url: "https://open-meteo.com/en/docs/air-quality-api",
    provides: "PM2.5, PM10, ozone, NO2, SO2, CO, European AQI, US AQI, 48-hour hourly particulate trace",
    cadence: "Hourly CAMS model output at ~11 km resolution",
    key: "No API key",
  },
  {
    name: "Open-Meteo Historical Weather API (ERA5)",
    url: "https://open-meteo.com/en/docs/historical-weather-api",
    provides: "Daily mean/max temperature and precipitation for the last 20 complete years",
    cadence: "Reanalysis, lags roughly 5 days; cached 24 hours",
    key: "No API key",
  },
  {
    name: "Open-Meteo Geocoding API",
    url: "https://open-meteo.com/en/docs/geocoding-api",
    provides: "Place-name search and coordinates, with admin area, country and population",
    cadence: "On each search keystroke, debounced",
    key: "No API key",
  },
  {
    name: "OpenStreetMap Nominatim",
    url: "https://nominatim.openstreetmap.org/",
    provides: "Reverse geocoding for points picked directly on the map",
    cadence: "On map click",
    key: "No API key",
  },
  {
    name: "OpenStreetMap tiles via Leaflet",
    url: "https://www.openstreetmap.org/copyright",
    provides: "Base map imagery",
    cadence: "On demand",
    key: "No API key",
  },
  {
    name: "Google Gemini API",
    url: "https://ai.google.dev/",
    provides: "Chat answers and AI-authored intervention lists, generated only from the GreenShield data brief",
    cadence: "On explicit user action",
    key: "Server-side API key, never exposed to the browser",
  },
];

const SUBSCORES = [
  {
    label: "Heat risk",
    weight: WEIGHTS.heat,
    formula:
      "piecewise(max(current apparent temperature, apparent max of next 3 forecast days), heat breakpoints)",
    points: BREAKPOINTS.heatApparentC,
    unit: "°C apparent",
    note: "Apparent temperature already folds in humidity and wind, so it tracks physiological load better than dry-bulb air temperature.",
  },
  {
    label: "Air quality risk",
    weight: WEIGHTS.air,
    formula: "max(piecewise(PM2.5), piecewise(PM10), piecewise(ozone)) — worst pollutant governs",
    points: BREAKPOINTS.pm25,
    unit: "µg/m³ PM2.5 (PM10 and ozone use their own curves)",
    note: "Breakpoints are anchored to WHO 2021 guideline values: 15 µg/m³ PM2.5 and 45 µg/m³ PM10 map to 25/100.",
  },
  {
    label: "Rainfall / flood risk",
    weight: WEIGHTS.rain,
    formula: "max(piecewise(heaviest single forecast day), piecewise(7-day forecast total))",
    points: BREAKPOINTS.dailyRainMm,
    unit: "mm in one day (weekly totals use a separate curve)",
    note: "This is a rainfall-intensity proxy, not a hydrological flood model — it knows nothing about terrain, drainage or river state.",
  },
  {
    label: "Humidity stress",
    weight: WEIGHTS.humidity,
    formula:
      "piecewise(deviation outside the 30–60 % comfort band) × heat factor (1.0 at ≥28 °C, 0.6 at ≥20 °C, else 0.35)",
    points: [
      [0, 0],
      [10, 25],
      [25, 60],
      [40, 100],
    ] as Array<[number, number]>,
    unit: "percentage points outside the comfort band",
    note: "Humid heat suppresses sweat evaporation, so the same humidity scores far higher on a hot day than a cold one.",
  },
  {
    label: "UV exposure",
    weight: WEIGHTS.uv,
    formula: "piecewise(max(current UV index, UV max of next 3 forecast days))",
    points: BREAKPOINTS.uv,
    unit: "WHO UV index",
    note: "The WHO UV scale is already a risk scale; the curve simply rescales it to 0–100.",
  },
];

const BANDS = [
  { range: "0–19", label: "Low" },
  { range: "20–39", label: "Moderate" },
  { range: "40–59", label: "Elevated" },
  { range: "60–79", label: "High" },
  { range: "80–100", label: "Severe" },
];

function MethodologyPage() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Methodology"
        title="How the score is built, and what it cannot tell you"
        description="GreenShield keeps three things separate: measurements returned by an API, numbers GreenShield computes from them, and prose an AI model writes about both. Everything on this page is the middle category, spelled out in full."
        showLocation={false}
      />

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-extrabold">1. The pipeline</h2>
          <ProvenanceChip source="calc" />
        </div>
        <ol className="grid gap-3 md:grid-cols-5">
          {[
            "Location search or map click resolves to coordinates via Open-Meteo Geocoding or OSM Nominatim.",
            "Forecast and air-quality endpoints are called in parallel for those coordinates.",
            "Each hazard component is converted to 0–100 through a published piecewise-linear curve.",
            "Components are combined with fixed weights into the composite Environmental Risk Score.",
            "Rule-based actions are derived from the sub-scores; AI text is optional and additive.",
          ].map((step, i) => (
            <li key={i} className="panel space-y-2 p-4">
              <p className="num text-muted-foreground text-[10px] font-bold">STEP {i + 1}</p>
              <p className="text-xs leading-relaxed">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-extrabold">2. Sub-scores, weights and breakpoints</h2>
        <p className="text-muted-foreground max-w-prose text-xs leading-relaxed">
          Composite score = Σ (sub-score × weight), clamped to 0–100 and rounded. Weights sum to 1.00. Every curve is
          piecewise-linear between the anchor points listed — values below the first anchor score 0, values above the
          last score 100.
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          {SUBSCORES.map((s) => (
            <article key={s.label} className="panel space-y-3 p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold">{s.label}</h3>
                <span className="num bg-muted rounded px-1.5 py-0.5 text-[10px] font-bold">
                  weight {Math.round(s.weight * 100)}%
                </span>
              </div>
              <p className="num bg-muted/60 rounded p-3 text-[10px] leading-relaxed break-words">{s.formula}</p>
              <div>
                <p className="label-micro mb-1">Anchor points · {s.unit}</p>
                <div className="flex flex-wrap gap-1">
                  {s.points.map(([x, y]) => (
                    <span key={`${x}-${y}`} className="num rounded border px-1.5 py-0.5 text-[10px]">
                      {x} → {y}
                    </span>
                  ))}
                </div>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">{s.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-extrabold">3. Severity bands</h2>
        <div className="grid gap-3 sm:grid-cols-5">
          {BANDS.map((b) => (
            <div key={b.range} className="panel space-y-1 p-4">
              <p className="num text-sm font-extrabold">{b.range}</p>
              <p className="num text-muted-foreground text-[10px] uppercase">{b.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-extrabold">4. Data sources</h2>
        <div className="panel overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="bg-muted/60">
              <tr className="num text-[10px] uppercase">
                <th className="px-4 py-3 font-bold">Source</th>
                <th className="px-4 py-3 font-bold">Provides</th>
                <th className="px-4 py-3 font-bold">Cadence</th>
                <th className="px-4 py-3 font-bold">Credentials</th>
              </tr>
            </thead>
            <tbody>
              {SOURCES.map((s) => (
                <tr key={s.name} className="border-t align-top">
                  <td className="px-4 py-3 font-bold">
                    <a href={s.url} target="_blank" rel="noreferrer noopener" className="hover:underline">
                      {s.name}
                    </a>
                  </td>
                  <td className="text-muted-foreground px-4 py-3 leading-relaxed">{s.provides}</td>
                  <td className="text-muted-foreground px-4 py-3 leading-relaxed">{s.cadence}</td>
                  <td className="num px-4 py-3 text-[10px]">{s.key}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-extrabold">5. Limitations</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {[
            "Air-quality values are modelled on an ~11 km grid, not measured at street level. A nearby highway, kiln or construction site can push local exposure far above what is shown.",
            "The rainfall component measures precipitation intensity only. It is not a flood model: it has no terrain, drainage capacity, soil saturation or river-stage input.",
            "Weights were chosen for a general urban-resident risk profile. A farmer, an asthma patient and a logistics planner would each weight these hazards differently.",
            "Forecast skill degrades with lead time; days 4–7 of the outlook are indicative rather than reliable.",
            "The historical trend uses a single ERA5 grid cell, which smooths local microclimate and urban heat-island effects.",
            "When every live request fails, GreenShield switches to a clearly labelled archived demo snapshot rather than showing blank panels or invented values.",
            "AI text is an interpretation layer. It is instructed to cite only numbers present in the data brief and to state when a value is missing, but it is not a substitute for professional advice.",
          ].map((l) => (
            <li key={l} className="panel text-muted-foreground p-4 text-xs leading-relaxed">
              {l}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-extrabold">6. Attribution</h2>
        <p className="text-muted-foreground max-w-prose text-xs leading-relaxed">
          Weather, air-quality, historical and geocoding data by{" "}
          <a href="https://open-meteo.com/" target="_blank" rel="noreferrer noopener" className="underline">
            Open-Meteo
          </a>{" "}
          (CC BY 4.0). Map data and tiles ©{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer noopener"
            className="underline"
          >
            OpenStreetMap
          </a>{" "}
          contributors (ODbL). Reverse geocoding by OpenStreetMap Nominatim. GreenShield scoring model v1 — built for
          Hack the Habitat 2026.
        </p>
      </section>
    </div>
  );
}
