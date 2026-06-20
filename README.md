# Stock Sector Performance Dashboard

A responsive Vite + React dashboard for viewing sector and ETF performance across multiple time horizons. The app reads a static CSV file from `public/data/sector_perf.csv`, formats decimal returns as percentages, and provides sorting plus symbol filtering.

## Tech Stack

- React 19
- TypeScript
- Vite
- CSS modules via plain global CSS
- Static CSV data served from `public/data`

## Project Structure

```text
.
├── public/
│   └── data/
│       └── sector_perf.csv
├── src/
│   ├── main.tsx
│   └── styles.css
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
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

The deployed site reads this file:

```text
public/data/sector_perf.csv
```

The expected CSV schema is:

```csv
symbol,1 wk,1 mo,3 mo,6 mo,1 yr
SPY,0.0147,0.0099,0.1542,0.1214,0.2674
```

Values should be decimal returns, not pre-formatted percentages. For example, `0.09` displays as `9.00%`.

To refresh the dashboard from your source data, copy:

```text
C:\Users\he_yi\OneDrive\Data\sector_perf\sector_perf.csv
```

to:

```text
public\data\sector_perf.csv
```

Then rebuild or redeploy.

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

When the CSV changes:

1. Replace `public/data/sector_perf.csv`.
2. Commit the change.
3. Push to the deployed branch.
4. Vercel will automatically rebuild and publish the new dashboard.

## Notes

- `node_modules/`, `dist/`, and `.vercel/` are ignored by Git.
- The app sorts by `1 Week` descending by default.
- The as-of date is currently set in `src/main.tsx`.
