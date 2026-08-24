import type { AirSnapshot, EnvBundle, GeoLocation, WeatherSnapshot } from "./types";
import { demoAir, demoLocation, demoWeather } from "./demo";

const GEOCODE = "https://geocoding-api.open-meteo.com/v1/search";
const REVERSE = "https://nominatim.openstreetmap.org/reverse";
const FORECAST = "https://api.open-meteo.com/v1/forecast";
const AIR = "https://air-quality-api.open-meteo.com/v1/air-quality";
const ARCHIVE = "https://archive-api.open-meteo.com/v1/archive";

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Request failed (${res.status}) for ${new URL(url).host}`);
  return (await res.json()) as T;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export async function searchLocations(query: string, signal?: AbortSignal): Promise<GeoLocation[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const coord = q.match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (coord) {
    const latitude = Number(coord[1]);
    const longitude = Number(coord[2]);
    if (Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) {
      return [
        {
          id: `coord-${latitude}-${longitude}`,
          name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          country: "Coordinate input",
          latitude,
          longitude,
        },
      ];
    }
  }

  const url = `${GEOCODE}?name=${encodeURIComponent(q)}&count=8&language=en&format=json`;
  const data = await getJson<{
    results?: Array<{
      id: number;
      name: string;
      admin1?: string;
      country?: string;
      country_code?: string;
      latitude: number;
      longitude: number;
      timezone?: string;
      population?: number;
    }>;
  }>(url, signal);

  return (data.results ?? []).map((r) => ({
    id: String(r.id),
    name: r.name,
    admin: r.admin1,
    country: r.country,
    countryCode: r.country_code,
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone,
    population: r.population,
  }));
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<GeoLocation> {
  const fallback: GeoLocation = {
    id: `coord-${latitude.toFixed(4)}-${longitude.toFixed(4)}`,
    name: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    country: "Map selection",
    latitude,
    longitude,
  };
  try {
    const url = `${REVERSE}?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`;
    const data = await getJson<{
      name?: string;
      display_name?: string;
      address?: Record<string, string>;
    }>(url, signal);
    const a = data.address ?? {};
    const name =
      a.city ?? a.town ?? a.village ?? a.county ?? data.name ?? fallback.name;
    return {
      ...fallback,
      name,
      admin: a.state,
      country: a.country,
      countryCode: a.country_code?.toUpperCase(),
    };
  } catch {
    return fallback;
  }
}

export async function fetchWeather(
  loc: GeoLocation,
  signal?: AbortSignal,
): Promise<WeatherSnapshot> {
  const url =
    `${FORECAST}?latitude=${loc.latitude}&longitude=${loc.longitude}` +
    "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,uv_index,is_day" +
    "&hourly=temperature_2m,precipitation,relative_humidity_2m" +
    "&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_sum,precipitation_probability_max,uv_index_max" +
    "&forecast_days=7&past_days=7&timezone=auto";

  const data = await getJson<{
    timezone: string;
    current: Record<string, number | string>;
    hourly: { time: string[]; temperature_2m: number[]; precipitation: number[]; relative_humidity_2m: number[] };
    daily: {
      time: string[];
      temperature_2m_max: number[];
      temperature_2m_min: number[];
      apparent_temperature_max: number[];
      precipitation_sum: number[];
      precipitation_probability_max: (number | null)[];
      uv_index_max: (number | null)[];
    };
  }>(url, signal);

  const c = data.current;
  return {
    fetchedAt: new Date().toISOString(),
    observedAt: String(c.time),
    timezone: data.timezone,
    temperature: Number(c.temperature_2m),
    apparentTemperature: Number(c.apparent_temperature),
    humidity: Number(c.relative_humidity_2m),
    precipitation: Number(c.precipitation),
    windSpeed: Number(c.wind_speed_10m),
    windDirection: Number(c.wind_direction_10m),
    uvIndex: num(c.uv_index),
    weatherCode: Number(c.weather_code),
    isDay: Number(c.is_day) === 1,
    daily: data.daily.time.map((date, i) => ({
      date,
      tempMax: data.daily.temperature_2m_max[i],
      tempMin: data.daily.temperature_2m_min[i],
      apparentMax: data.daily.apparent_temperature_max[i],
      precipitation: data.daily.precipitation_sum[i],
      precipitationProbability: num(data.daily.precipitation_probability_max[i]),
      uvIndexMax: num(data.daily.uv_index_max[i]),
    })),
    hourly: data.hourly.time.map((time, i) => ({
      time,
      temperature: data.hourly.temperature_2m[i],
      precipitation: data.hourly.precipitation[i],
      humidity: data.hourly.relative_humidity_2m[i],
    })),
  };
}

export async function fetchAirQuality(loc: GeoLocation, signal?: AbortSignal): Promise<AirSnapshot> {
  const url =
    `${AIR}?latitude=${loc.latitude}&longitude=${loc.longitude}` +
    "&current=pm10,pm2_5,ozone,nitrogen_dioxide,sulphur_dioxide,carbon_monoxide,european_aqi,us_aqi" +
    "&hourly=pm2_5,pm10,european_aqi&past_days=3&forecast_days=3&timezone=auto";

  const data = await getJson<{
    current: Record<string, number | string>;
    hourly: { time: string[]; pm2_5: (number | null)[]; pm10: (number | null)[]; european_aqi: (number | null)[] };
  }>(url, signal);

  const c = data.current;
  return {
    fetchedAt: new Date().toISOString(),
    observedAt: String(c.time),
    pm2_5: num(c.pm2_5),
    pm10: num(c.pm10),
    ozone: num(c.ozone),
    no2: num(c.nitrogen_dioxide),
    so2: num(c.sulphur_dioxide),
    co: num(c.carbon_monoxide),
    europeanAqi: num(c.european_aqi),
    usAqi: num(c.us_aqi),
    hourly: data.hourly.time.map((time, i) => ({
      time,
      pm2_5: num(data.hourly.pm2_5[i]),
      pm10: num(data.hourly.pm10[i]),
      europeanAqi: num(data.hourly.european_aqi[i]),
    })),
  };
}

/** Live bundle with an explicit demo fallback so the app never shows blank panels. */
export async function fetchEnvBundle(loc: GeoLocation, signal?: AbortSignal): Promise<EnvBundle> {
  try {
    const [weather, air] = await Promise.all([
      fetchWeather(loc, signal),
      fetchAirQuality(loc, signal),
    ]);
    return { location: loc, weather, air, demo: false };
  } catch (error) {
    if (signal?.aborted) throw error;
    return { location: demoLocation, weather: demoWeather(), air: demoAir(), demo: true };
  }
}

export interface AnnualClimatePoint {
  year: number;
  meanTemp: number | null;
  maxTemp: number | null;
  precipitation: number | null;
  hotDays: number;
}

export async function fetchClimateTrend(
  loc: GeoLocation,
  years = 20,
  signal?: AbortSignal,
): Promise<AnnualClimatePoint[]> {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 6); // archive lags a few days
  const endYear = end.getUTCFullYear() - 1;
  const startYear = endYear - (years - 1);
  const url =
    `${ARCHIVE}?latitude=${loc.latitude}&longitude=${loc.longitude}` +
    `&start_date=${startYear}-01-01&end_date=${endYear}-12-31` +
    "&daily=temperature_2m_mean,temperature_2m_max,precipitation_sum&timezone=auto";

  const data = await getJson<{
    daily: {
      time: string[];
      temperature_2m_mean: (number | null)[];
      temperature_2m_max: (number | null)[];
      precipitation_sum: (number | null)[];
    };
  }>(url, signal);

  const acc = new Map<number, { t: number[]; tx: number[]; p: number; hot: number }>();
  data.daily.time.forEach((date, i) => {
    const year = Number(date.slice(0, 4));
    const bucket = acc.get(year) ?? { t: [], tx: [], p: 0, hot: 0 };
    const mean = data.daily.temperature_2m_mean[i];
    const max = data.daily.temperature_2m_max[i];
    const precip = data.daily.precipitation_sum[i];
    if (mean != null) bucket.t.push(mean);
    if (max != null) {
      bucket.tx.push(max);
      if (max >= 32) bucket.hot += 1;
    }
    if (precip != null) bucket.p += precip;
    acc.set(year, bucket);
  });

  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

  return [...acc.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([year, b]) => ({
      year,
      meanTemp: avg(b.t),
      maxTemp: avg(b.tx),
      precipitation: Math.round(b.p),
      hotDays: b.hot,
    }));
}
