# Forms Portal — Backend

Express + MySQL API that stores form submissions from the React frontend. Verifies Google ID tokens on every request so only signed-in users can submit.

## Setup (one-time)

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env` and fill in:

- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — your MySQL creds. The database must already exist.
- `GOOGLE_CLIENT_ID` — same value as the frontend's `VITE_GOOGLE_CLIENT_ID`.
- `ALLOWED_EMAIL_DOMAIN` — optional. Set to `123cfc.com` to only accept those accounts.
- `CORS_ORIGIN` — comma-separated origins the frontend runs on (defaults cover Vite dev ports).

## Create the tables

```bash
npm run db:init
```

This runs [`src/schema.sql`](src/schema.sql) against your DB and creates all 15 tables. Safe to re-run — uses `CREATE TABLE IF NOT EXISTS`.

## Run the server

```bash
npm start       # production
npm run dev     # auto-reloads on file changes (Node 22+)
```

By default listens on `http://localhost:4000`. Health check: `GET /api/health`.

## How submissions work

- Frontend sends `POST /api/submissions/:formKey` as `multipart/form-data` with an `Authorization: Bearer <google-id-token>` header.
- Server verifies the token via `google-auth-library`, extracts email/name.
- Scalar fields are inserted into typed columns. Grids/arrays go to JSON columns. Files land in `server/uploads/<formKey>/` and their metadata is stored as JSON.
- Common columns on every table: `id`, `email`, `submitted_by_name`, `created_at`.

## Form keys → tables

| Form key                                  | Table                                     |
| ----------------------------------------- | ----------------------------------------- |
| cash-received-arden                       | cash_received_arden                       |
| cash-received-wvl                         | cash_received_wvl                         |
| managers-opening-checklist-arden          | managers_opening_checklist_arden          |
| managers-opening-checklist-waynesville    | managers_opening_checklist_waynesville    |
| managers-closing-checklist-arden          | managers_closing_checklist_arden          |
| managers-closing-checklist-waynesville    | managers_closing_checklist_waynesville    |
| warehouse-notification                    | warehouse_notification                    |
| warehouse-opening-checklist               | warehouse_opening_checklist               |
| warehouse-closing-checklist               | warehouse_closing_checklist               |
| part-received                             | part_received                             |
| delivery-checklist                        | delivery_checklist                        |
| pre-delivery-checklist                    | pre_delivery_checklist                    |
| to-do-list                                | to_do_list                                |
| hot-button-status-call-alert              | hot_button_status_call_alert              |
| customer-service-request                  | customer_service_request                  |

## Google Drive: automatic PDF reports for Cash Batch forms

When a submission comes in for `cash-received-arden` or `cash-received-wvl`, the server generates a PDF and uploads it to the configured Drive folder:

| Form key              | Env var    | Destination               |
| --------------------- | ---------- | ------------------------- |
| cash-received-arden   | DRIVE_100  | Arden folder              |
| cash-received-wvl     | DRIVE_200  | Waynesville folder        |

### One-time setup

1. **Drop the OAuth client JSON in `server/`.** Expected filename pattern: `client_secret*.json` (whatever Google Cloud Console downloaded). The file is gitignored.
2. **Make sure the Drive folder IDs are in `.env`:**
   ```
   DRIVE_100=1Hf89GhvxqBk51Df0shInDDZAZwFA4BBu
   DRIVE_200=13P6NL99rx_nOSjELX0gkKn-ZrvHXjcXJ
   ```
3. **Authorize the uploader account** — run:
   ```bash
   npm run drive:setup
   ```
   It prints a URL. Open it in the browser of the Google account that has **edit access** to both Drive folders. Sign in, grant the Drive permission, copy the authorization code Google shows you, paste it back into the terminal. Token gets saved to `server/.drive-token.json` (also gitignored) and the server refreshes it automatically from then on.

### What gets uploaded

- Filename: `cash-arden_YYYY-MM-DD_id<insert_id>.pdf` (or `cash-wvl_…`)
- Content: submitter, date, opening cash, totals, closing balance, EXT NO, remarks — styled PDF
- Upload is async and non-blocking — if Drive is down, the submission still succeeds and gets stored in MySQL; only the PDF upload is skipped (logged to console).

### If Drive isn't configured

The server logs a warning (`[drive] Drive not configured …`) and skips the upload. MySQL insert still happens normally. Runtime cost: zero.

## Uploaded files

Files are served at `GET /uploads/<formKey>/<filename>`. This is open (no auth) — anyone with the URL can download. For production, put this behind auth or move to S3.

## Token expiry

Google ID tokens last ~1 hour. When a token expires the API returns `401`; the frontend should redirect to `/login`. (Not yet wired — user has to manually re-sign-in.)

## Layout

```
server/
├── src/
│   ├── index.js            Express app entry
│   ├── db.js               MySQL connection pool
│   ├── dbInit.js           Runs schema.sql
│   ├── schema.sql          All 15 CREATE TABLE statements
│   ├── auth.js             Google token verification middleware
│   ├── forms.js            Form → table/column registry
│   └── routes/
│       └── submissions.js  POST /api/submissions/:formKey
├── uploads/                File storage (created at runtime)
├── .env                    Your local credentials (not committed)
└── package.json
```
