import { usAqiBand } from "./format";
import type { EnvBundle, RiskResult, SeverityBand, SubScore } from "./types";

/** Piecewise-linear interpolation across published breakpoints. */
function piecewise(value: number, points: Array<[number, number]>): number {
  if (value <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    if (value <= x1) return y0 + ((value - x0) / (x1 - x0)) * (y1 - y0);
  }
  return points[points.length - 1][1];
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));

export const BREAKPOINTS = {
  heatApparentC: [
    [24, 0],
    [30, 25],
    [35, 50],
    [40, 75],
    [46, 100],
  ] as Array<[number, number]>,
  pm25: [
    [0, 0],
    [15, 25],
    [35, 50],
    [55, 75],
    [110, 100],
  ] as Array<[number, number]>,
  pm10: [
    [0, 0],
    [45, 25],
    [75, 50],
    [150, 75],
    [250, 100],
  ] as Array<[number, number]>,
  ozone: [
    [0, 0],
    [100, 35],
    [160, 65],
    [240, 100],
  ] as Array<[number, number]>,
  /** US EPA AQI category breakpoints mapped onto the GreenShield 0-100 band scale.
   *  0-50 Good -> low, 51-100 Moderate -> moderate, 101-150 USG -> elevated,
   *  151-200 Unhealthy -> high, 201-300+ Very unhealthy / hazardous -> severe. */
  usAqi: [
    [0, 0],
    [50, 19],
    [100, 39],
    [150, 59],
    [200, 79],
    [300, 92],
    [500, 100],
  ] as Array<[number, number]>,
  dailyRainMm: [
    [0, 0],
    [10, 20],
    [25, 45],
    [50, 70],
    [100, 100],
  ] as Array<[number, number]>,
  weekRainMm: [
    [0, 0],
    [25, 15],
    [75, 40],
    [150, 70],
    [300, 100],
  ] as Array<[number, number]>,
  uv: [
    [0, 0],
    [3, 20],
    [6, 45],
    [8, 65],
    [11, 100],
  ] as Array<[number, number]>,
};

export const WEIGHTS = { heat: 0.32, air: 0.3, rain: 0.18, humidity: 0.1, uv: 0.1 };

export function bandOf(score: number): SeverityBand {
  if (score < 20) return "low";
  if (score < 40) return "moderate";
  if (score < 60) return "elevated";
  if (score < 80) return "high";
  return "severe";
}

export const BAND_LABEL: Record<SeverityBand, string> = {
  low: "Low",
  moderate: "Moderate",
  elevated: "Elevated",
  high: "High",
  severe: "Severe",
};

export const BAND_TEXT: Record<SeverityBand, string> = {
  low: "text-sev-1",
  moderate: "text-sev-2",
  elevated: "text-sev-3",
  high: "text-sev-4",
  severe: "text-sev-5",
};

export const BAND_BG: Record<SeverityBand, string> = {
  low: "bg-sev-1",
  moderate: "bg-sev-2",
  elevated: "bg-sev-3",
  high: "bg-sev-4",
  severe: "bg-sev-5",
};

const r1 = (n: number) => Math.round(n * 10) / 10;

export function calculateRisk(bundle: EnvBundle): RiskResult {
  const { weather, air } = bundle;
  const next3 = weather.daily.filter((d) => new Date(`${d.date}T12:00:00Z`) >= new Date(Date.now() - 864e5));
  const horizon = (next3.length ? next3 : weather.daily).slice(0, 3);
  const apparentPeak = Math.max(weather.apparentTemperature, ...horizon.map((d) => d.apparentMax));

  const heatScore = clamp(piecewise(apparentPeak, BREAKPOINTS.heatApparentC));

  const pm25Score = air.pm2_5 == null ? 0 : piecewise(air.pm2_5, BREAKPOINTS.pm25);
  const pm10Score = air.pm10 == null ? 0 : piecewise(air.pm10, BREAKPOINTS.pm10);
  const o3Score = air.ozone == null ? 0 : piecewise(air.ozone, BREAKPOINTS.ozone);
  // US AQI is the authoritative published index; it already folds every pollutant
  // into one calibrated scale, so prefer it over our worst-of pollutant sub-indices.
  const aqiScore = air.usAqi == null ? null : piecewise(air.usAqi, BREAKPOINTS.usAqi);
  const airScore = clamp(aqiScore ?? Math.max(pm25Score, pm10Score, o3Score));

  const week = (next3.length ? next3 : weather.daily).slice(0, 7);
  const weekSum = week.reduce((a, d) => a + (d.precipitation ?? 0), 0);
  const dayPeak = week.length ? Math.max(...week.map((d) => d.precipitation ?? 0)) : 0;
  const rainScore = clamp(
    Math.max(piecewise(dayPeak, BREAKPOINTS.dailyRainMm), piecewise(weekSum, BREAKPOINTS.weekRainMm)),
  );

  // Humidity stress: distance outside the 30–60 % comfort band, amplified by heat.
  const rh = weather.humidity;
  const deviation = rh > 60 ? rh - 60 : rh < 30 ? 30 - rh : 0;
  const heatFactor = weather.temperature >= 28 ? 1 : weather.temperature >= 20 ? 0.6 : 0.35;
  const humidityScore = clamp(piecewise(deviation, [[0, 0], [10, 25], [25, 60], [40, 100]]) * heatFactor);

  const uvPeak = Math.max(
    weather.uvIndex ?? 0,
    ...horizon.map((d) => d.uvIndexMax ?? 0),
  );
  const uvScore = clamp(piecewise(uvPeak, BREAKPOINTS.uv));

  const subScores: SubScore[] = [
    {
      key: "heat",
      label: "Heat risk",
      score: Math.round(heatScore),
      weight: WEIGHTS.heat,
      band: bandOf(heatScore),
      inputs: [
        `Current apparent temperature ${r1(weather.apparentTemperature)} °C`,
        `3-day apparent peak ${r1(apparentPeak)} °C`,
      ],
      explanation:
        "Scored from apparent temperature (heat + humidity + wind), using the peak of the current reading and the next three forecast days.",
    },
    {
      key: "air",
      label: "Air quality risk",
      score: Math.round(airScore),
      weight: WEIGHTS.air,
      band: bandOf(airScore),
      inputs: [
        air.usAqi == null
          ? "US AQI unavailable — falling back to pollutant sub-indices"
          : `US AQI ${Math.round(air.usAqi)} (${usAqiBand(air.usAqi)}) → ${Math.round(airScore)}`,
        air.pm2_5 == null ? "PM2.5 unavailable" : `PM2.5 ${r1(air.pm2_5)} µg/m³`,
        air.pm10 == null ? "PM10 unavailable" : `PM10 ${r1(air.pm10)} µg/m³`,
        air.ozone == null ? "Ozone unavailable" : `Ozone ${r1(air.ozone)} µg/m³`,
      ],
      explanation:
        air.usAqi == null
          ? "US AQI was unavailable, so this falls back to the worst of the PM2.5, PM10 and ozone sub-indices (WHO 2021 guidelines)."
          : "Live US EPA AQI from the Open-Meteo Air Quality API, mapped onto the GreenShield 0-100 band scale (AQI ≤50 Good, 51-100 Moderate, 101-150 Unhealthy for sensitive groups, 151-200 Unhealthy, 200+ Very unhealthy).",
    },
    {
      key: "rain",
      label: "Rainfall / flood risk",
      score: Math.round(rainScore),
      weight: WEIGHTS.rain,
      band: bandOf(rainScore),
      inputs: [`Heaviest forecast day ${r1(dayPeak)} mm`, `7-day forecast total ${r1(weekSum)} mm`],
      explanation:
        "Worst-of single-day intensity and 7-day accumulation from the Open-Meteo precipitation forecast.",
    },
    {
      key: "humidity",
      label: "Humidity stress",
      score: Math.round(humidityScore),
      weight: WEIGHTS.humidity,
      band: bandOf(humidityScore),
      inputs: [`Relative humidity ${Math.round(rh)} %`, `Air temperature ${r1(weather.temperature)} °C`],
      explanation:
        "Deviation outside the 30–60 % comfort band, scaled by air temperature so humid heat scores higher than humid cold.",
    },
    {
      key: "uv",
      label: "UV exposure",
      score: Math.round(uvScore),
      weight: WEIGHTS.uv,
      band: bandOf(uvScore),
      inputs: [`Peak UV index ${r1(uvPeak)}`],
      explanation: "Peak UV index across the current reading and the next three forecast days, on the WHO UV scale.",
    },
  ];

  const composite = subScores.reduce((a, s) => a + s.score * s.weight, 0);
  const score = Math.round(clamp(composite));

  return {
    score,
    band: bandOf(score),
    subScores,
    drivers: [...subScores]
      .sort((a, b) => b.score * b.weight - a.score * a.weight)
      .slice(0, 2)
      .filter((s) => s.score > 0),
    computedAt: new Date().toISOString(),
  };
}
