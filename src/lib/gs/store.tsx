import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { GeoLocation } from "./types";

export const DEFAULT_LOCATION: GeoLocation = {
  id: "1172451",
  name: "Lahore",
  admin: "Punjab",
  country: "Pakistan",
  countryCode: "PK",
  latitude: 31.55,
  longitude: 74.34361,
  timezone: "Asia/Karachi",
  population: 11126000,
};

export type ThemeMode = "light" | "dark" | "system";
export type TempUnit = "c" | "f";

export interface Settings {
  theme: ThemeMode;
  unit: TempUnit;
  aiExplanations: boolean;
}

const DEFAULT_SETTINGS: Settings = { theme: "system", unit: "c", aiExplanations: true };

const LOCATION_KEY = "greenshield.location";
const SAVED_KEY = "greenshield.saved";
const SETTINGS_KEY = "greenshield.settings";

interface StoreValue {
  location: GeoLocation;
  setLocation: (loc: GeoLocation) => void;
  saved: GeoLocation[];
  toggleSaved: (loc: GeoLocation) => void;
  isSaved: (loc: GeoLocation) => boolean;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
  resetAll: () => void;
  hydrated: boolean;
}

const StoreContext = createContext<StoreValue | null>(null);

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? ({ ...fallback, ...(JSON.parse(raw) as object) } as T) : fallback;
  } catch {
    return fallback;
  }
}

export function GreenShieldProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState<GeoLocation>(DEFAULT_LOCATION);
  const [saved, setSaved] = useState<GeoLocation[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLocationState(read<GeoLocation>(LOCATION_KEY, DEFAULT_LOCATION));
    setSettings(read<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS));
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      if (raw) setSaved(JSON.parse(raw) as GeoLocation[]);
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  // Theme application + OS preference tracking.
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = settings.theme === "dark" || (settings.theme === "system" && media.matches);
      root.classList.toggle("dark", dark);
      root.style.colorScheme = dark ? "dark" : "light";
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [settings.theme]);

  const setLocation = useCallback((loc: GeoLocation) => {
    setLocationState(loc);
    try {
      localStorage.setItem(LOCATION_KEY, JSON.stringify(loc));
    } catch {
      /* storage unavailable */
    }
  }, []);

  const toggleSaved = useCallback((loc: GeoLocation) => {
    setSaved((prev) => {
      const exists = prev.some((l) => l.id === loc.id);
      const next = exists ? prev.filter((l) => l.id !== loc.id) : [...prev, loc].slice(-12);
      try {
        localStorage.setItem(SAVED_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    [LOCATION_KEY, SAVED_KEY, SETTINGS_KEY].forEach((k) => {
      try {
        localStorage.removeItem(k);
      } catch {
        /* storage unavailable */
      }
    });
    setLocationState(DEFAULT_LOCATION);
    setSaved([]);
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      location,
      setLocation,
      saved,
      toggleSaved,
      isSaved: (loc: GeoLocation) => saved.some((l) => l.id === loc.id),
      settings,
      updateSettings,
      resetAll,
      hydrated,
    }),
    [location, setLocation, saved, toggleSaved, settings, updateSettings, resetAll, hydrated],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useGreenShield(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useGreenShield must be used inside GreenShieldProvider");
  return ctx;
}
