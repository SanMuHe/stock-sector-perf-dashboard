# Stock Sector Performance Dashboard

A responsive Vite + React dashboard for viewing weekly sector and ETF performance snapshots. The app reads dated CSV files from `public/data`, formats decimal returns as percentages, and provides sorting, symbol filtering, and Prev/Next snapshot navigation.

## Tech Stack

- React 19
- TypeScript
- Vite
- CSS modules via plain global CSS
- Static CSV data served from `public/data`

## Project Structure

```text
.
+-- public/
|   +-- data/
|       +-- sector_perf_index.json
|       +-- sector_perf_2026-05-29.csv
|       +-- sector_perf_2026-06-05.csv
|       +-- sector_perf_2026-06-12.csv
|       +-- sector_perf_2026-06-19.csv
+-- src/
|   +-- main.tsx
|   +-- styles.css
+-- index.html
+-- package.json
+-- tsconfig.json
+-- vite.config.ts
```

## Development

Install dependencies:

```bash
npm install
```

Start the local development server:

```bash
npm run dev
```

Open the local site:

```text
http://127.0.0.1:5173
```

To use a specific port:

```bash
npm run dev -- --port 3000
```

## Data Updates

The dashboard reads this index file first:

```text
public/data/sector_perf_index.json
```

The index lists the historical CSV files to load:

```json
[
  "sector_perf_2026-05-29.csv",
  "sector_perf_2026-06-05.csv"
]
```

Historical weekly snapshots are stored directly under `public/data` using this convention:

```text
public/data/sector_perf_YYYY-MM-DD.csv
```

Example:

```text
public/data/sector_perf_2026-06-12.csv
```

The expected CSV schema is:

```csv
symbol,1 wk,1 mo,3 mo,6 mo,1 yr
SPY,0.0147,0.0099,0.1542,0.1214,0.2674
```

Values should be decimal returns, not pre-formatted percentages. For example, `0.09` displays as `9.00%`.

To add a new weekly snapshot:

1. Add a new file such as `public/data/sector_perf_2026-06-26.csv`.
2. Add that filename to `public/data/sector_perf_index.json`.
3. Run `npm run build`.
4. Commit and deploy.

## Verification

Run the production build locally before deploying:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

Check production dependency vulnerabilities:

```bash
npm audit --omit=dev
```

## Deploying To Vercel

This project is compatible with the Vercel free tier as a static Vite site.

1. Push the repository to GitHub, GitLab, or Bitbucket.
2. In Vercel, select **Add New Project**.
3. Import the repository.
4. Use these settings:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

5. Deploy.

No server, database, or paid Vercel feature is required.

## Updating After Deployment

When a weekly CSV changes:

1. Add or replace the dated CSV under `public/data`.
2. Update `public/data/sector_perf_index.json` when adding a new date.
3. Commit the change.
4. Push to the deployed branch.
5. Vercel will automatically rebuild and publish the new dashboard.

## Notes

- `node_modules/`, `dist/`, and `.vercel/` are ignored by Git.
- The selected snapshot table sorts by `1 Week` descending by default.
- The latest date in `sector_perf_index.json` is selected by default after files are loaded.
