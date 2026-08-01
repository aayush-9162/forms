# Forms Report

Read-only dashboard that reads submissions from the shared MySQL backend and presents them for review.

## Setup

```bash
cd formreport
npm install
cp .env.example .env   # fill in VITE_GOOGLE_CLIENT_ID + VITE_API_URL
```

## Run

Make sure the backend (`server/`) is running on port 4000, then:

```bash
npm run dev
```

Opens on http://localhost:5174. Sign in with any Google account that the backend allows (same OAuth client ID as the main Forms app).

## What it shows

- **Left sidebar** — forms grouped by category (Arden / Waynesville / Warehouse / General) with live row counts
- **Main table** — one row per submission, key columns only (sale #, date, totals, etc.). Searchable.
- **Detail drawer** — click any row to slide in a detail panel showing every field, grid answers color-coded, checkboxes as badges, and file attachments as clickable links to the Google Drive originals.

## Backend dependency

Requires these endpoints on the API server (already wired in `server/src/routes/reports.js`):

- `GET /api/reports/summary` — row counts for every form
- `GET /api/reports/:formKey` — paginated list
- `GET /api/reports/:formKey/:id` — single submission

All endpoints require the same Google ID token used by the main Forms app.
