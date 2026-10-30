# AGENTS.md — Overtime Tracker

Instructions and guidelines for AI coding agents (Antigravity, Claude Code, Cursor, Codex, etc.) working in this repository.

---

## 1. Commands

```bash
npm run dev        # Start Vite dev server
npm run build      # Production build (outputs to dist/)
npm run preview    # Preview production build
npm run check      # Type-check with svelte-check + tsc
npm test           # Run Vitest unit tests
npm run test:watch # Vitest in interactive watch mode
```

> [!NOTE]
> When installing dependencies, use `npm install --legacy-peer-deps` or `npm ci --legacy-peer-deps` to satisfy Vite/peer constraints.

---

## 2. Architecture & Tech Stack

This is a **pure Vite + Svelte 5 SPA / PWA** (client-only, no backend). All data is stored locally in the browser via **IndexedDB** using **Dexie.js**, with Excel export and JSON backup/restore capabilities.

* **Framework**: Svelte 5 (using runes: `$state()`, `$derived()`, `$effect()`, `$props()`, `$bindable()`)
* **Bundler & Tooling**: Vite 8 + Vitest + TypeScript
* **Database / Storage**: Dexie.js (IndexedDB) + Storage Manager API for persistence
* **Styling**: Tailwind CSS v4 (configured via `@tailwindcss/vite` plugin in `vite.config.ts`; no `tailwind.config.*`)
* **UI Components**: Hand-rolled shadcn-style primitives built on **Bits UI** (headless) in `src/lib/components/ui/`
* **PWA**: `vite-plugin-pwa` with `generateSW` / `autoUpdate`
* **Export / Import**: ExcelJS for `.xlsx` generation; native JSON backup and restore

---

## 3. Key Modules & Directory Structure

### Data Layer (`src/lib/db.ts`)
* Single Dexie `OvertimeDatabase` with an `entries` table.
* **Schema**: `id` (auto-increment), `date` (ISO `YYYY-MM-DD`), `hours` (number), `note` (optional string).
* **Core Helpers**:
  * Date utilities: `today()`, `yesterday()`, `shiftDate()`, `getRelativeDateLabel()`, `getPastWeekDays()`, `formatDate()`, `lastFullMonthRange()`
  * Entry operations: `getEntry()`, `setEntry()`, `incrementEntry()`, `bulkSetEntries()`, `getEntriesInRange()`
  * Portability: `exportAllEntries()`, `importAllEntries()`
* Components use `liveQuery()` from Dexie for reactive subscription to database changes.

### Storage Persistence (`src/lib/storage.ts`)
* Manages browser persistence via `navigator.storage.persist()` and `persisted()` to avoid silent browser evictions.

### App Structure (`src/App.svelte`)
Four tabs configured via `<Tabs>`:
1. **Track**:
   * `DateNavigator.svelte`: Day navigation stepper (Previous / Next / Today) and 7-day past week pill strip with glanceable hours.
   * `QuickEntry.svelte`: Single-day card with debounced (500ms) note auto-save and hour adjustments (`±0.5h`, `+1h`, `+2h`, `-1h`).
   * `RecentEntries.svelte`: Live reactive list of the last 30 days of entries.
2. **Bulk**:
   * `BulkAdd.svelte`: Form to bulk-apply hours across a date range with optional weekend skipping.
3. **Export**:
   * `ExportPanel.svelte`: Generates styled Excel `.xlsx` reports (last full month or custom range) and full JSON backup exports.
4. **Settings**:
   * `Settings.svelte`: Storage persistence status/toggle and JSON backup restoration with schema validation and confirmation dialog.

### UI Primitives (`src/lib/components/ui/`)
* Built on **Bits UI** and `tailwind-variants` (`tv`). When modifying or adding components, follow Bits UI conventions rather than React shadcn patterns.

### Path Alias
* `$lib` points to `src/lib/` (configured in `tsconfig.app.json` and `vite.config.ts`).

---

## 4. Deployment

* **Production URL**: `https://overtime.jarv.dev`
* **Hosting**: Static assets hosted on `pi5` (`/home/mj/Storage/www/overtime`), reverse-proxied with SSL termination by `pi3` (`/etc/nginx/sites-available/overtime.jarv.dev`).
* **Deploy Command**:
  ```bash
  npm run build && rsync -avz --delete dist/ pi5:/home/mj/Storage/www/overtime/
  ```
