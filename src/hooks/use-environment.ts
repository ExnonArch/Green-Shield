import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { envBundleQuery } from "@/lib/gs/queries";
import { buildContextBrief } from "@/lib/gs/brief";
import { calculateRisk } from "@/lib/gs/scoring";
import { useGreenShield } from "@/lib/gs/store";
import type { EnvBundle, GeoLocation, RiskResult } from "@/lib/gs/types";

export interface EnvironmentState {
  location: GeoLocation;
  bundle: EnvBundle | undefined;
  risk: RiskResult | undefined;
  brief: string;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  refetch: () => void;
}

/** Single source of truth for every page: live bundle + GreenShield risk + AI brief. */
export function useEnvironment(): EnvironmentState {
  const { location } = useGreenShield();
  const query = useQuery(envBundleQuery(location));

  const risk = useMemo(() => (query.data ? calculateRisk(query.data) : undefined), [query.data]);
  const brief = useMemo(
    () => (query.data && risk ? buildContextBrief(query.data, risk) : ""),
    [query.data, risk],
  );

  return {
    location,
    bundle: query.data,
    risk,
    brief,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: (query.error as Error | null) ?? null,
    refetch: () => void query.refetch(),
  };
}
