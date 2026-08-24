export interface GeoLocation {
  id: string;
  name: string;
  admin?: string;
  country?: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  population?: number;
}

export interface WeatherSnapshot {
  fetchedAt: string;
  observedAt: string;
  timezone: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  windDirection: number;
  uvIndex: number | null;
  weatherCode: number;
  isDay: boolean;
  daily: Array<{
    date: string;
    tempMax: number;
    tempMin: number;
    apparentMax: number;
    precipitation: number;
    precipitationProbability: number | null;
    uvIndexMax: number | null;
  }>;
  hourly: Array<{
    time: string;
    temperature: number;
    precipitation: number;
    humidity: number;
  }>;
}

export interface AirSnapshot {
  fetchedAt: string;
  observedAt: string;
  pm2_5: number | null;
  pm10: number | null;
  ozone: number | null;
  no2: number | null;
  so2: number | null;
  co: number | null;
  europeanAqi: number | null;
  usAqi: number | null;
  hourly: Array<{
    time: string;
    pm2_5: number | null;
    pm10: number | null;
    europeanAqi: number | null;
  }>;
}

export interface EnvBundle {
  location: GeoLocation;
  weather: WeatherSnapshot;
  air: AirSnapshot;
  /** true when live API calls failed and a bundled reference snapshot is shown. */
  demo: boolean;
}

export type SeverityBand = "low" | "moderate" | "elevated" | "high" | "severe";

export interface SubScore {
  key: "heat" | "air" | "rain" | "humidity" | "uv";
  label: string;
  score: number;
  weight: number;
  band: SeverityBand;
  /** Human-readable inputs used by the calculation, e.g. "Apparent max 38.2 °C". */
  inputs: string[];
  explanation: string;
}

export interface RiskResult {
  score: number;
  band: SeverityBand;
  subScores: SubScore[];
  drivers: SubScore[];
  computedAt: string;
}

export interface Recommendation {
  title: string;
  category: string;
  priority: "high" | "medium" | "low";
  detail: string;
  horizon: string;
}
