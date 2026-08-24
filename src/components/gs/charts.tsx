import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { shortDay } from "@/lib/gs/format";

const axis = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 10,
  fontFamily: "var(--font-mono)",
};

const tooltipStyle = {
  contentStyle: {
    background: "var(--color-popover)",
    border: "1px solid var(--color-border)",
    borderRadius: "8px",
    fontSize: "11px",
    fontFamily: "var(--font-mono)",
    color: "var(--color-popover-foreground)",
  },
  labelStyle: { color: "var(--color-muted-foreground)", fontSize: "10px" },
};

export function DailyTempChart({
  data,
}: {
  data: Array<{ date: string; tempMax: number; tempMin: number; apparentMax: number }>;
}) {
  const rows = data.map((d) => ({
    day: shortDay(d.date),
    date: d.date,
    max: Math.round(d.tempMax * 10) / 10,
    min: Math.round(d.tempMin * 10) / 10,
    apparent: Math.round(d.apparentMax * 10) / 10,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="day" {...axis} tickLine={false} axisLine={false} />
        <YAxis {...axis} tickLine={false} axisLine={false} unit="°" width={52} />
        <Tooltip {...tooltipStyle} formatter={(v: number, k) => [`${v} °C`, String(k)]} />
        <Line type="monotone" dataKey="apparent" name="Apparent max" stroke="var(--color-chart-1)" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="max" name="Air max" stroke="var(--color-chart-2)" strokeWidth={1.5} dot={false} />
        <Line type="monotone" dataKey="min" name="Air min" stroke="var(--color-chart-3)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function RainfallChart({ data }: { data: Array<{ date: string; precipitation: number }> }) {
  const rows = data.map((d) => ({ day: shortDay(d.date), mm: Math.round((d.precipitation ?? 0) * 10) / 10 }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="day" {...axis} tickLine={false} axisLine={false} />
        <YAxis {...axis} tickLine={false} axisLine={false} unit="mm" width={52} />
        <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v} mm`, "Precipitation"]} />
        <Bar dataKey="mm" fill="var(--color-chart-2)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ParticulateChart({
  data,
}: {
  data: Array<{ time: string; pm2_5: number | null; pm10: number | null }>;
}) {
  const rows = data.map((d) => ({
    hour: d.time.slice(11, 16),
    stamp: d.time.replace("T", " "),
    pm25: d.pm2_5,
    pm10: d.pm10,
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="hour" {...axis} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={28} />
        <YAxis {...axis} tickLine={false} axisLine={false} width={52} />
        <Tooltip {...tooltipStyle} formatter={(v: number, k) => [`${v} µg/m³`, String(k)]} />
        <Area type="monotone" dataKey="pm25" name="PM2.5" stroke="var(--color-chart-1)" fill="var(--color-chart-1)" fillOpacity={0.18} strokeWidth={2} />
        <Area type="monotone" dataKey="pm10" name="PM10" stroke="var(--color-chart-4)" fill="var(--color-chart-4)" fillOpacity={0.12} strokeWidth={1.5} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function HourlyTempChart({
  data,
}: {
  data: Array<{ time: string; temperature: number; humidity: number }>;
}) {
  const rows = data.map((d) => ({
    hour: d.time.slice(11, 16),
    temp: Math.round(d.temperature * 10) / 10,
    humidity: d.humidity,
  }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="hour" {...axis} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={28} />
        <YAxis {...axis} tickLine={false} axisLine={false} width={52} />
        <Tooltip {...tooltipStyle} />
        <Area type="monotone" dataKey="temp" name="Temperature °C" stroke="var(--color-chart-1)" fill="var(--color-chart-1)" fillOpacity={0.15} strokeWidth={2} />
        <Area type="monotone" dataKey="humidity" name="Humidity %" stroke="var(--color-chart-2)" fill="var(--color-chart-2)" fillOpacity={0.1} strokeWidth={1.5} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function AnnualTrendChart({
  data,
  metric,
}: {
  data: Array<{ year: number; meanTemp: number | null; precipitation: number | null; hotDays: number }>;
  metric: "meanTemp" | "precipitation" | "hotDays";
}) {
  const unit = metric === "meanTemp" ? "°C" : metric === "precipitation" ? "mm" : "days";
  const rows = data.map((d) => ({
    year: d.year,
    value:
      metric === "meanTemp"
        ? d.meanTemp == null
          ? null
          : Math.round(d.meanTemp * 100) / 100
        : metric === "precipitation"
          ? d.precipitation
          : d.hotDays,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey="year" {...axis} tickLine={false} axisLine={false} interval={1} />
        <YAxis {...axis} tickLine={false} axisLine={false} width={48} domain={metric === "meanTemp" ? ["auto", "auto"] : [0, "auto"]} />
        <Tooltip {...tooltipStyle} formatter={(v: number) => [`${v} ${unit}`, metric === "hotDays" ? "Days ≥ 32 °C" : metric === "meanTemp" ? "Annual mean" : "Annual total"]} />
        <Bar dataKey="value" fill={metric === "precipitation" ? "var(--color-chart-2)" : "var(--color-chart-1)"} radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
