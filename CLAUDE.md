# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server
npm run build     # Production build
npm run preview   # Preview production build
npm run check     # Type-check with svelte-check + tsc
```

There are no tests. There is no lint script beyond `check`.

## Architecture

This is a **pure Vite + Svelte 5 SPA** (not SvelteKit) — a PWA for tracking overtime hours locally in the browser via IndexedDB, with Excel export. No backend.

### Data layer (`src/lib/db.ts`)

Single Dexie `OvertimeDatabase` with one `entries` table. Schema: `id`, `date` (ISO string `YYYY-MM-DD`), `hours` (number), `note` (optional string). All database operations live here — `getEntry`, `setEntry`, `incrementEntry`, `bulkSetEntries`, `getEntriesInRange`, etc. Components use `liveQuery()` from Dexie for reactive updates.

### App structure

`src/App.svelte` is the root component with three tabs (Track / Bulk / Export), each backed by a dedicated component in `src/lib/components/`:

- **QuickEntry** — +/- buttons to adjust today's or yesterday's hours by 0.5h increments
- **BulkAdd** — form to apply the same hours across a date range, with optional weekend-skip toggle
- **RecentEntries** — live-query list of the last 30 days
- **ExportPanel** — exports to `.xlsx` via ExcelJS; offers "last full month" shortcut or custom range

### UI components (`src/lib/components/ui/`)

Shadcn-style component wrappers built on **Bits UI** (headless). Editing these follows the Bits UI API, not shadcn/ui's React patterns.

### Styling

TailwindCSS v4 (plugin-based, configured in `vite.config.ts` — no `tailwind.config.*` file). Theme color: `#0f172a` (slate-900).

### Path alias

`$lib` → `src/lib` (configured in both `tsconfig.app.json` and `vite.config.ts`).
