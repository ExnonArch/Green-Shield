import type { GeoLocation } from "./types";

export function locationLabel(loc: GeoLocation): string {
  return [loc.name, loc.admin, loc.country].filter(Boolean).join(", ");
}

export function coordLabel(lat: number, lon: number): string {
  const ns = lat >= 0 ? "N" : "S";
  const ew = lon >= 0 ? "E" : "W";
  return `${Math.abs(lat).toFixed(4)}° ${ns}, ${Math.abs(lon).toFixed(4)}° ${ew}`;
}

export function formatTimestamp(iso: string, timeZone?: string): string {
  const date = iso.length === 16 ? new Date(`${iso}:00Z`) : new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: iso.length === 16 ? "UTC" : timeZone,
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 16).replace("T", " ");
  }
}

export function shortDay(date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  return new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" }).format(d).toUpperCase();
}

export function toF(c: number): number {
  return c * 1.8 + 32;
}

export function tempDisplay(c: number, unit: "c" | "f", digits = 1): string {
  return unit === "f" ? `${(c * 1.8 + 32).toFixed(digits)}°F` : `${c.toFixed(digits)}°C`;
}

export const WEATHER_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Heavy freezing rain",
  71: "Slight snowfall",
  73: "Moderate snowfall",
  75: "Heavy snowfall",
  77: "Snow grains",
  80: "Rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Severe thunderstorm with hail",
};

export function weatherLabel(code: number): string {
  return WEATHER_CODES[code] ?? "Unclassified conditions";
}

/** European AQI descriptor bands (EEA). */
export function euAqiBand(aqi: number | null): string {
  if (aqi == null) return "Unavailable";
  if (aqi <= 20) return "Good";
  if (aqi <= 40) return "Fair";
  if (aqi <= 60) return "Moderate";
  if (aqi <= 80) return "Poor";
  if (aqi <= 100) return "Very poor";
  return "Extremely poor";
}

/** US EPA AQI descriptor bands. */
export function usAqiBand(aqi: number | null): string {
  if (aqi == null) return "Unavailable";
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for sensitive groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very unhealthy";
  return "Hazardous";
}
