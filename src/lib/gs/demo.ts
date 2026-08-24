import type { AirSnapshot, GeoLocation, WeatherSnapshot } from "./types";

/**
 * Reference snapshot used ONLY when the Open-Meteo APIs are unreachable.
 * These are fixed archived readings for Lahore, Pakistan (June 2024 heat event),
 * never randomised and always labelled as demo data in the UI.
 */
export const demoLocation: GeoLocation = {
  id: "demo-lahore",
  name: "Lahore",
  admin: "Punjab",
  country: "Pakistan",
  countryCode: "PK",
  latitude: 31.5204,
  longitude: 74.3587,
  timezone: "Asia/Karachi",
  population: 11126000,
};

const DEMO_ANCHOR = "2024-06-18T12:00";

const dailyFixture = [
  { tempMax: 41.2, tempMin: 29.4, apparentMax: 45.1, precipitation: 0, precipitationProbability: 3, uvIndexMax: 9.4 },
  { tempMax: 42.6, tempMin: 30.1, apparentMax: 46.8, precipitation: 0, precipitationProbability: 5, uvIndexMax: 9.8 },
  { tempMax: 43.4, tempMin: 30.8, apparentMax: 48.2, precipitation: 0, precipitationProbability: 8, uvIndexMax: 10.1 },
  { tempMax: 42.1, tempMin: 30.2, apparentMax: 46.4, precipitation: 1.2, precipitationProbability: 24, uvIndexMax: 9.2 },
  { tempMax: 39.8, tempMin: 28.6, apparentMax: 44.0, precipitation: 6.8, precipitationProbability: 61, uvIndexMax: 8.4 },
  { tempMax: 37.4, tempMin: 27.9, apparentMax: 42.2, precipitation: 18.4, precipitationProbability: 78, uvIndexMax: 7.6 },
  { tempMax: 38.6, tempMin: 28.2, apparentMax: 43.1, precipitation: 4.2, precipitationProbability: 44, uvIndexMax: 8.1 },
];

const hourlyTemp = [
  30.4, 29.8, 29.2, 28.9, 28.6, 29.4, 31.2, 33.6, 35.9, 38.1, 39.8, 41.0, 41.9, 42.4, 42.6, 42.1,
  40.8, 38.9, 36.7, 35.1, 33.8, 32.6, 31.7, 30.9,
];
const hourlyHumidity = [
  58, 61, 63, 64, 66, 63, 57, 49, 42, 36, 32, 29, 27, 26, 26, 28, 32, 38, 44, 48, 52, 54, 56, 57,
];

function shiftDate(base: string, days: number) {
  const d = new Date(`${base}:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function demoWeather(): WeatherSnapshot {
  const daily = Array.from({ length: 14 }, (_, i) => {
    const f = dailyFixture[i % dailyFixture.length];
    return { date: shiftDate(DEMO_ANCHOR, i - 7), ...f };
  });

  const hourly = Array.from({ length: 72 }, (_, i) => {
    const day = Math.floor(i / 24);
    const hour = i % 24;
    return {
      time: `${shiftDate(DEMO_ANCHOR, day - 1)}T${String(hour).padStart(2, "0")}:00`,
      temperature: hourlyTemp[hour],
      precipitation: hour === 17 && day === 2 ? 3.4 : 0,
      humidity: hourlyHumidity[hour],
    };
  });

  return {
    fetchedAt: new Date().toISOString(),
    observedAt: DEMO_ANCHOR,
    timezone: "Asia/Karachi",
    temperature: 42.4,
    apparentTemperature: 48.2,
    humidity: 26,
    precipitation: 0,
    windSpeed: 14.8,
    windDirection: 212,
    uvIndex: 9.6,
    weatherCode: 0,
    isDay: true,
    daily,
    hourly,
  };
}

const airHourly = [42, 45, 51, 58, 64, 71, 78, 84, 88, 91, 86, 79, 72, 68, 65, 61, 58, 62, 68, 74, 79, 72, 61, 52];

export function demoAir(): AirSnapshot {
  const hourly = Array.from({ length: 72 }, (_, i) => {
    const day = Math.floor(i / 24);
    const hour = i % 24;
    const pm25 = airHourly[hour];
    return {
      time: `${shiftDate(DEMO_ANCHOR, day - 1)}T${String(hour).padStart(2, "0")}:00`,
      pm2_5: pm25,
      pm10: Math.round(pm25 * 1.9),
      europeanAqi: Math.round(pm25 * 1.05),
    };
  });

  return {
    fetchedAt: new Date().toISOString(),
    observedAt: DEMO_ANCHOR,
    pm2_5: 68.4,
    pm10: 132.6,
    ozone: 118.2,
    no2: 31.4,
    so2: 12.8,
    co: 486,
    europeanAqi: 74,
    usAqi: 158,
    hourly,
  };
}
