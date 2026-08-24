# Restore GreenShield V3 into this project

The uploaded archive is a complete TanStack Start app (GreenShield climate-risk dashboard) that already uses the Google Gemini API directly, with the key read from a committed `.env` file. Nothing needs to be rewritten — the work is restoring it into this currently blank project and confirming it runs.

## What gets restored

- Pages: home, dashboard, map, air quality, trends, analysis, actions, chat, methodology, settings
- GreenShield components (app shell, charts, risk panel, map view, recommendations, AI widget) and the full shadcn UI set
- Data/scoring layer: Open-Meteo API client, scoring formula, brief builder, demo data, store
- Branding assets, styles/design tokens, config files (package.json, vite.config.ts, tsconfig, eslint, prettier, components.json)

## AI setup (as requested)

- Keep the existing Gemini integration: `src/lib/ai-gateway.server.ts` calls `generativelanguage.googleapis.com` with `x-goog-api-key`, default model `gemini-2.5-flash-lite`.
- Keep `.env` committed at the project root with `GEMINI_API_KEY=` left empty and an optional `GEMINI_MODEL` override; `.gitignore` will not include `.env`.
- All AI logic (chat answers + recommendations) stays behind the two server functions in `src/lib/gs/ai.functions.ts`, so the key never reaches the browser.
- Until a key is filled in, AI calls surface a clear "add GEMINI_API_KEY to .env, then restart" message; the rest of the app works on live Open-Meteo data.

## Technical notes

- Copy every file from the archive except any git metadata; overwrite the current placeholder `src/routes/index.tsx`, `__root.tsx`, `styles.css` and configs.
- Do not hand-edit `src/routeTree.gen.ts`; let the router plugin regenerate it from the restored route files.
- Run `bun install` against the restored `package.json` (adds recharts, leaflet/map deps, zod, etc.) and then verify the dev server boots and key routes render.
