# GreenShield — Project Setup + Full UI/UX Redesign

Set up the uploaded GreenShield climate-tech app (10 pages: Home, Explore Map, Dashboard, Location Analysis, Air Quality, Climate Trends, Action Center, AI Chat, Methodology, Settings) in this workspace, then redesign its entire interface with a modern, premium look.

## Design direction (locked from your answers)

- **Palette — Neon Mint:** deep navy `#0d1b2a` base, deep green `#1b4332`, mint `#2dd4a8` primary accent, bright mint `#73ffb8` highlights/glows. A clean light counterpart is derived for light mode (airy off-white, deep-green ink, same mint accents).
- **Typography:** Space Grotesk for display/headings, DM Sans for body, tabular numerals for every data readout. Loaded via `<link>` in the root route head.
- **Layout:** refined top-header + dense panel dashboard (no sidebar). Sticky translucent blurred header with logo, inline location search, theme toggle, and pill navigation.
- **Theme:** follows the visitor's OS setting on first visit; light/dark toggle remains in the header.
- **Feel:** precision climate instrument — hairline borders, small uppercase micro-labels, large tabular readouts, mint-glow risk gauge with sweep animation, provenance chips (Measured / Calculated / AI) kept front and center. Restrained motion: gauge sweep on load, subtle panel fade-rise, mint hover states.

## Phase 1 — Project setup

1. Copy the uploaded project into the workspace (verified: no `.git` inside the archive): `src/` (routes, gs components, hooks, lib), `public/`, and config files; merge `package.json` dependencies (adds leaflet, react-leaflet, recharts, react-markdown, embla-carousel, sonner, etc.) and install.
2. Verify the app builds and every route loads (`/`, `/map`, `/dashboard`, `/analysis`, `/air-quality`, `/trends`, `/actions`, `/chat`, `/methodology`, `/settings`); fix any import or config drift.
3. Verify the logo asset URL resolves from this project; if not, recreate it as a fresh CDN asset.
4. Confirm the AI backend (chat + recommendations) has its gateway key; if unavailable, the app's built-in error states already degrade gracefully — no secrets in client code.

## Phase 2 — Full UI/UX redesign

1. **Design tokens** (`src/styles.css`): rewrite the token system around the Neon Mint palette in `oklch` for both dark and light themes — surfaces, borders, primary/accent, risk-band colors (low/moderate/high/severe), chart palette, glow shadows, radius scale, font tokens.
2. **App shell:** new header (logo lockup, inline location search, theme toggle, pill nav with mint active state, mobile sheet nav), redesigned footer with attribution, skip-link kept for accessibility.
3. **Shared components:** restyle risk gauge (mint conic sweep + glow + band labels), metric cards, provenance chips, loading/error/demo states, page headers, AI chat widget, recommendations, map panel (dark-styled map tiles in dark mode).
4. **All 10 routes restyled** to the new system — home hero + pipeline + map, dashboard panel grid, analysis, air-quality, trends (charts rethemed to mint), action center, chat, methodology, settings. Copy and functionality stay intact; this is a visual/UX overhaul.
5. **Motion & polish:** gauge sweep animation, staggered panel fade-rise, hover border glows, smooth theme transition — all subtle and instrument-like.
6. **Metadata:** each route keeps/updates its own head title + description matching the new branding.

## Phase 3 — Verification

- Run the production build, check the preview on desktop and mobile widths, confirm no console errors, verify charts, map, location search, theme toggle, and AI chat states render correctly in both themes.

## Technical notes

- Stack stays as-is: TanStack Start + Tailwind v4 + shadcn/ui + Leaflet + Recharts + Gemini Powered AI (server-side key only).
- Fonts load via `<link>` tags (never CSS `@import` of URLs, which breaks the Tailwind v4 build).
- All colors go through semantic tokens in `src/styles.css` — no hardcoded color classes in components.
- No changes to data logic, scoring formulas, or API integrations — purely presentation and UX.
