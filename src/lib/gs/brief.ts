import { coordLabel, euAqiBand, locationLabel, usAqiBand, weatherLabel } from "./format";
import { BAND_LABEL } from "./scoring";
import type { EnvBundle, RiskResult } from "./types";

const n = (v: number | null | undefined, unit = "", digits = 1) =>
  v == null ? "unavailable" : `${Number(v).toFixed(digits)}${unit}`;

/** Compact, factual brief handed to the AI so it can never invent measurements. */
export function buildContextBrief(bundle: EnvBundle, risk: RiskResult): string {
  const { location, weather, air } = bundle;
  const days = weather.daily.slice(-7);

  return [
    `LOCATION: ${locationLabel(location)} (${coordLabel(location.latitude, location.longitude)}), timezone ${weather.timezone}`,
    bundle.demo
      ? "DATA MODE: reference demo snapshot (live APIs unreachable). Warn the user that readings are archived, not live."
      : "DATA MODE: live Open-Meteo readings",
    `OBSERVED AT: ${weather.observedAt} (local)`,
    "",
    "SOURCE: Open-Meteo Forecast API (measurements)",
    `- Air temperature: ${n(weather.temperature, " °C")}`,
    `- Apparent temperature: ${n(weather.apparentTemperature, " °C")}`,
    `- Relative humidity: ${n(weather.humidity, " %", 0)}`,
    `- Precipitation (current hour): ${n(weather.precipitation, " mm")}`,
    `- Wind speed: ${n(weather.windSpeed, " km/h")}`,
    `- UV index: ${n(weather.uvIndex, "")}`,
    `- Conditions: ${weatherLabel(weather.weatherCode)}`,
    "",
    "SOURCE: Open-Meteo Air Quality API (measurements)",
    `- PM2.5: ${n(air.pm2_5, " µg/m³")}`,
    `- PM10: ${n(air.pm10, " µg/m³")}`,
    `- Ozone: ${n(air.ozone, " µg/m³")}`,
    `- NO2: ${n(air.no2, " µg/m³")}`,
    `- SO2: ${n(air.so2, " µg/m³")}`,
    `- European AQI: ${n(air.europeanAqi, "", 0)} (${euAqiBand(air.europeanAqi)})`,
    `- US AQI: ${n(air.usAqi, "", 0)} (${usAqiBand(air.usAqi)})`,
    "",
    "SOURCE: Open-Meteo 7-day forecast (measurements)",
    ...days.map(
      (d) =>
        `- ${d.date}: max ${n(d.tempMax, " °C")}, min ${n(d.tempMin, " °C")}, apparent max ${n(d.apparentMax, " °C")}, rain ${n(d.precipitation, " mm")}, UV max ${n(d.uvIndexMax, "")}`,
    ),
    "",
    "SOURCE: GreenShield calculation (transparent weighted model, 0-100)",
    `- Environmental Risk Score: ${risk.score} (${BAND_LABEL[risk.band]})`,
    ...risk.subScores.map(
      (s) => `- ${s.label}: ${s.score} (${BAND_LABEL[s.band]}), weight ${Math.round(s.weight * 100)}% — inputs: ${s.inputs.join("; ")}`,
    ),
    `- Leading drivers: ${risk.drivers.map((d) => d.label).join(", ") || "none above zero"}`,
  ].join("\n");
}
