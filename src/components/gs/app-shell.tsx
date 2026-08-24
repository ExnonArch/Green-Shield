import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, MoonStar, Search, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useGreenShield } from "@/lib/gs/store";
import { locationLabel } from "@/lib/gs/format";
import logoUrl from "@/assets/greenshield-mark.png";
import { cn } from "@/lib/utils";
import { LocationSearch } from "./location-search";
import { NAV } from "./nav";
import { AiWidget } from "./ai-widget";

function ThemeToggle() {
  const { settings, updateSettings } = useGreenShield();
  const isDark = settings.theme === "dark";
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => updateSettings({ theme: isDark ? "light" : "dark" })}
      className="size-9"
    >
      {isDark ? <MoonStar className="size-4" aria-hidden /> : <Sun className="size-4" aria-hidden />}
    </Button>
  );
}

function NavLinks({ onNavigate, className }: { onNavigate?: () => void; className?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className={className} aria-label="Primary">
      {NAV.map((item) => {
        const active = pathname === item.to;
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            title={item.blurb}
            className={cn(
              "group num relative flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold tracking-wide uppercase transition-all duration-200",
              active
                ? "bg-primary text-primary-foreground shadow-[0_0_20px_-4px_var(--color-primary)]"
                : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
            )}
          >
            <Icon
              className={cn(
                "size-3.5 transition-transform duration-200 group-hover:scale-110",
                active ? "" : "opacity-70",
              )}
              aria-hidden
            />
            <span className="xl:hidden">{item.short}</span>
            <span className="hidden xl:inline">{item.label}</span>
            {active ? (
              <span className="bg-primary-foreground/80 absolute -bottom-[7px] left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full" aria-hidden />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

function LiveIndicator({ label }: { label: string }) {
  return (
    <span className="num text-muted-foreground hidden shrink-0 items-center gap-2 text-[10px] uppercase 2xl:flex">
      <span className="relative flex size-1.5">
        <span className="bg-primary absolute inline-flex size-full animate-ping rounded-full opacity-60" />
        <span className="bg-primary relative inline-flex size-1.5 rounded-full" />
      </span>
      Live: <span className="text-foreground font-bold">{label}</span>
    </span>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { location, hydrated } = useGreenShield();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="focus:bg-primary focus:text-primary-foreground sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[900] focus:rounded focus:px-3 focus:py-2 focus:text-xs"
      >
        Skip to content
      </a>

      <header className="bg-background/80 sticky top-0 z-[700] border-b backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-3 py-3 sm:gap-3 sm:px-4 lg:px-8">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Open navigation"
                className="size-9 shrink-0 md:hidden"
              >
                <Menu className="size-4" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] overflow-y-auto p-0">
              <div className="border-b p-5">
                <div className="flex items-center gap-2.5">
                  <img
                    src={logoUrl}
                    alt="GreenShield logo"
                    width={36}
                    height={36}
                    className="size-9 drop-shadow-[0_0_10px_rgba(52,211,153,0.45)]"
                  />
                  <span>
                    <SheetTitle className="font-display block text-sm leading-none font-bold tracking-tight">
                      GreenShield
                    </SheetTitle>
                    <span className="label-micro">Environmental risk intelligence</span>
                  </span>
                </div>
                <LocationSearch className="mt-4 w-full" onSelected={() => setOpen(false)} />
              </div>
              <nav className="space-y-1 p-4" aria-label="Mobile">
                {NAV.map((item) => {
                  const active = pathname === item.to;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors",
                        active ? "bg-primary/10 text-primary ring-1 ring-primary/30" : "hover:bg-muted",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg",
                          active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                        )}
                      >
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <span>
                        <span className="block text-xs font-bold">{item.label}</span>
                        <span className="text-muted-foreground block text-[10px] leading-snug">{item.blurb}</span>
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>

          <Link to="/" className="group flex shrink-0 items-center gap-2.5">
            <img
              src={logoUrl}
              alt="GreenShield logo"
              width={36}
              height={36}
              className="size-9 shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 drop-shadow-[0_0_10px_rgba(52,211,153,0.45)]"
            />
            <span className="hidden sm:block">
              <span className="font-display block text-sm leading-none font-bold tracking-tight">
                GreenShield
              </span>
              <span className="label-micro">Environmental risk intelligence</span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label={searchOpen ? "Close location search" : "Search for a location"}
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((v) => !v)}
              className={cn("size-9 shrink-0 sm:hidden", searchOpen && "border-primary/50 text-primary")}
            >
              {searchOpen ? <X className="size-4" aria-hidden /> : <Search className="size-4" aria-hidden />}
            </Button>
            <LocationSearch className="hidden w-64 sm:block md:w-80 lg:w-96" />
            <ThemeToggle />
          </div>
        </div>

        {searchOpen ? (
          <div className="border-t px-3 py-2.5 sm:hidden">
            <LocationSearch
              className="w-full"
              autoFocus
              onSelected={() => setSearchOpen(false)}
            />
          </div>
        ) : null}

        <div className="hidden border-t md:block">
          <div className="mx-auto flex max-w-[1400px] items-center gap-2 px-4 py-1.5 lg:px-8">
            <NavLinks className="scrollbar-none flex flex-1 items-center gap-1 overflow-x-auto xl:flex-wrap xl:overflow-visible" />
            <LiveIndicator label={hydrated ? locationLabel(location) : "…"} />
          </div>
        </div>
      </header>

      {pathname !== "/chat" ? <AiWidget /> : null}

      <main id="main" className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:py-8 lg:px-8">
        {children}
      </main>

      <footer className="mt-8 border-t">
        <div className="text-muted-foreground mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-6 text-[10px] leading-relaxed lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <p className="num uppercase">
            GreenShield · Hack the Habitat 2026 · scores are model estimates, not official advisories
          </p>
          <p className="max-w-prose">
            Weather, air quality, geocoding and historical reanalysis from{" "}
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noreferrer noopener"
              className="text-foreground underline underline-offset-2"
            >
              Open-Meteo
            </a>{" "}
            (CC BY 4.0). Map tiles and place names &copy;{" "}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noreferrer noopener"
              className="text-foreground underline underline-offset-2"
            >
              OpenStreetMap
            </a>{" "}
            contributors. AI explanations generated by Gemini Powered AI.
          </p>
        </div>
      </footer>
    </div>
  );
}
