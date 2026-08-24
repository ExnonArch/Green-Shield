import { queryOptions } from "@tanstack/react-query";
import { fetchClimateTrend, fetchEnvBundle } from "./api";
import type { GeoLocation } from "./types";

const key = (loc: GeoLocation) => [loc.latitude.toFixed(3), loc.longitude.toFixed(3)];

export const envBundleQuery = (loc: GeoLocation) =>
  queryOptions({
    queryKey: ["env", ...key(loc)],
    queryFn: ({ signal }) => fetchEnvBundle(loc, signal),
    // Open-Meteo publishes new observations every 15 minutes; keep the app live.
    staleTime: 2 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 1,
  });

export const climateTrendQuery = (loc: GeoLocation, years = 20) =>
  queryOptions({
    queryKey: ["climate", years, ...key(loc)],
    queryFn: ({ signal }) => fetchClimateTrend(loc, years, signal),
    staleTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
