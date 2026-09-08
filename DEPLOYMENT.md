# Forms Portal — Deployment & Operations Runbook

How the whole thing is built, served, deployed, and kept running. Read this
before touching the VM.

---

## 1. What this project is

An internal staff forms portal for Carolina Furniture Concepts (three sites:
Arden, Waynesville, Warehouse). Three code folders, **served as one server**:

| Folder | What it is | Built to |
| --- | --- | --- |
| `server/` | Express API **+** serves both web apps | — (runs Node) |
| `frontend/` | Forms app (staff fill out 15 forms) | `frontend/dist` |
| `formreport/` | Read-only report dashboard + Users tab | `formreport/dist` |

Everything runs behind **one Node process on port `1214`**.

- `http://<host>:1214/`            → forms app
- `http://<host>:1214/formreport`  → report dashboard (`/report` also redirects here)
- `http://<host>:1214/api/*`       → REST API

Backing services: **MySQL** (submissions) and **Google Drive** (PDF reports +
image attachments). Auth is **Google Sign-In**, restricted to `@123cfc.com`.

---

## 2. Authentication (Google Sign-In)

- Browser signs in with Google Identity Services (the "Sign in with Google"
  button). It receives a Google **ID token** (JWT).
- The app sends that token as `Authorization: Bearer <token>` on every API call.
- The server (`server/src/auth.js`) verifies it with `google-auth-library`,
  requires a verified email, and enforces the `@123cfc.com` domain.
- **Client ID:** `1052053074639-l2vk9ra0a511ku4b32pdeol8s0qt2kvm.apps.googleusercontent.com`
  (same web client is reused for Drive uploads — that's fine).

### Google Cloud Console — REQUIRED for sign-in to work
The client's **Authorized JavaScript origins** must include the URL the app is
served from, or the button renders but sign-in fails:

- `http://localhost:1214`  (always accepted by Google)
- `http://<vm-host>:1214`  (your production origin)

Google requires **HTTPS for non-localhost origins and rejects raw IP addresses**.
A plain-HTTP LAN/IP origin may be refused — use a hostname (or `*.nip.io`) and
ideally HTTPS in front. This is configured in the Console, **not** in any file
in this repo.

### Known limitation
Google ID tokens last ~1 hour and can't be silently refreshed. When one expires,
the user is returned to the login screen and must sign in again; the offline
outbox pauses until they do. There are **no roles** — any `@123cfc.com` account
can use both the forms and the report dashboard.

---

## 3. How the builds are created

The two web apps are Vite/React. The server has a one-shot script that builds
both:

```bash
cd server
npm run build:web
```

That runs (see `server/package.json`):
```
npm --prefix ../frontend  install && npm --prefix ../frontend  run build
npm --prefix ../formreport install && npm --prefix ../formreport run build
```

Output:
- `frontend/dist`   — built with base `/`          (asset URLs `/assets/...`)
- `formreport/dist` — built with base `/formreport/` (asset URLs `/formreport/assets/...`)

**Why the API calls are relative:** each app's `.env.production` sets
`VITE_API_URL=` (empty), so the built apps call `/api/...` on **the same origin
that served them**. This makes the whole thing IP- and port-independent — no URL
needs editing when the server's address changes.

To build one app on its own: `cd frontend && npm run build` (or `formreport`).

---

## 4. How Node serves both builds

`server/src/index.js`, in order:

1. `GET /api/health`, `GET /api/config`
2. `/api/submissions`, `/api/reports`, `/api/users` routers
3. `app.use('/api', → 404 JSON)` — unknown API paths return JSON, never HTML
4. `express.static(formreport/dist)` at `/formreport` + SPA fallback
   (`/report` → 301 → `/formreport`)
5. `express.static(frontend/dist)` at `/` + SPA fallback (`app.get('*')`)
6. error handler

The SPA fallbacks send `index.html` for client-side routes (e.g.
`/forms/to-do-list`, `/formreport/users`) so a page refresh or deep link works.

Port comes from `PORT` in `server/.env` (set to `1214`). On startup it warns if
either `dist` folder is missing.

---

## 5. Environment files

### `server/.env` (production values on the VM)
```
PORT=1214
CORS_ORIGIN=http://localhost:7801,http://localhost:7802   # only matters for separate Vite dev
DB_HOST=...            # prod MySQL host
DB_PORT=3306
DB_USER=...
DB_PASSWORD=...
DB_NAME=db_cfc
GOOGLE_CLIENT_ID=1052053074639-l2vk9ra0a511ku4b32pdeol8s0qt2kvm.apps.googleusercontent.com
ALLOWED_EMAIL_DOMAIN=123cfc.com
MAX_FILE_MB=10
DRIVE_100=<Arden cash-PDF folder id>
DRIVE_200=<Waynesville cash-PDF folder id>
IMAGES=<image-attachments folder id>
```

### `frontend/.env` and `formreport/.env`
```
VITE_GOOGLE_CLIENT_ID=1052053074639-...apps.googleusercontent.com
VITE_API_URL=http://localhost:1214     # ONLY used for separate-Vite dev; ignored by prod build
```
### `frontend/.env.production` and `formreport/.env.production`
```
VITE_API_URL=          # empty → built app calls /api relative (same origin)
```

`.env` files are gitignored — they must be set on the VM directly (they are not
deployed by `git pull`).

---

## 6. Deploying an update (git pull → pm2)

On the VM, after pushing code:

```bash
cd ~/forms
git pull
cd server
npm install          # in case server deps changed
npm run build:web    # rebuild both web apps
pm2 restart forms-server
```

That's the whole loop. The built `dist/` folders are produced on the VM by
`build:web`, so they don't need to be committed.

### First-time PM2 setup (already done on this VM)
```bash
cd ~/forms/server
pm2 start ecosystem.config.cjs   # app name: forms-server
pm2 save                         # persist across reboots
```
`pm2 save` + `systemctl enable docker` (for the DB stack) mean everything comes
back automatically after a VM reboot. If a stale `forms-server` already exists,
`pm2 delete forms-server` first, then start from the ecosystem file.

`server/ecosystem.config.cjs` defines the process (name `forms-server`,
`NODE_ENV=production`).

Verify a deploy:
```bash
pm2 status
pm2 logs forms-server --lines 20     # expect "listening on 0.0.0.0:1214" + "verifying Google ID tokens"
curl http://localhost:1214/api/health
```

---

## 7. Google Drive (PDF reports + image attachments)

The server uploads to Drive using an OAuth client + a saved refresh token.
Two files make Drive work, and **both are gitignored** (secrets never go in git):

- `server/client_secret_2_1052053074639-….json`  — OAuth app config
- `server/.drive-token.json`                       — the saved authorization (refresh token)

Because they're gitignored, `git pull` never brings them. They must be placed on
the VM **once** (they then persist through every future deploy).

### Provisioning them on a new VM
Do **not** run `npm run drive:setup` on a headless VM — it needs a browser
callback on localhost that a remote server can't receive. Instead copy the two
working files from a machine that already has them:

```bash
# from a machine with working Drive creds (e.g. the dev laptop, Git Bash):
cd server
scp .drive-token.json client_secret_2_1052053074639-*.json  aayush@<vm-host>:~/forms/server/
```
No scp? base64 each file, paste on the VM:
```bash
# local:  base64 -w0 .drive-token.json ; echo
# vm:     echo 'PASTE' | base64 -d > .drive-token.json
```

### Verify + notes
```bash
cd ~/forms/server
npm run drive:diagnose    # expect: "Both folders are writable"
```
- The `localhost` URLs inside `client_secret*.json` are **irrelevant** to Drive —
  uploads use the refresh token, which involves no redirect URI or origin. Works
  on any IP/port. Do **not** edit those URLs.
- PDFs are generated **only** for `cash-received-arden` (→ folder 100) and
  `cash-received-wvl` (→ folder 200). Other forms' images go to the `images`
  folder. Drive uploads are fire-and-forget: if Drive is down the submission
  still saves to MySQL; only the upload is skipped (logged).

---

## 8. Users tab (report dashboard)

`/formreport/users` — add / edit / delete a directory of `{ email, name, role }`,
saved on the server as JSON.

- API: `GET /api/users`, `PUT /api/users` (auth-protected), in
  `server/src/routes/users.js`.
- Storage: `server/data/users.json` (gitignored, so deploys don't clobber it;
  self-creates on first save).
- Roles dropdown is the `ROLES` array at the top of `formreport/src/pages/Users.jsx`.
- **This is a stored list only — it does NOT gate access yet.** Any `@123cfc.com`
  user can reach everything, including this tab. Wiring it to actual access
  control (server checks the list per request) is a future step.

---

## 9. Database & schema drift

MySQL database `db_cfc`. Each of the 15 forms maps to its own table; a form field
lives in three places that must stay in sync (nothing enforces it):

1. `server/src/forms.js` — API registry (what's accepted/inserted)
2. `server/src/schema.sql` — the MySQL columns
3. `formreport/src/data/formsMeta.js` — what the dashboard displays

**Gotcha:** `schema.sql` uses `CREATE TABLE IF NOT EXISTS`, so `npm run db:init`
does nothing on tables that already exist — it can't add new columns. When
`forms.js` gains a field, add the column with the drift tool:

```bash
cd server
node schema-drift.mjs          # report missing columns vs the live DB in .env
node schema-drift.mjs --fix    # apply additive ALTER TABLE ... ADD COLUMN (no drops)
```

Prod and dev are **separate databases** — run it against each (it uses whichever
DB the local `.env` points at). Back up before `--fix` on production:
`mysqldump -h <host> -u <user> -p db_cfc > backup_$(date +%F).sql`.

---

## 10. Local development (optional, separate ports)

The single-server model above is production. To iterate locally with hot-reload
you can instead run three processes:

```bash
cd server     && npm run dev     # API on :1214
cd frontend   && npm run dev     # Vite on :7801  → set VITE_API_URL=http://localhost:1214
cd formreport && npm run dev     # Vite on :7802  → set VITE_API_URL=http://localhost:1214
```
In this mode the apps are cross-origin to the API, so `VITE_API_URL` in each
`.env` must point at the API, and `CORS_ORIGIN` in `server/.env` must list the
Vite origins. (The production build ignores `VITE_API_URL` via `.env.production`.)

---

## 11. History / dead weight

- **Auth used to be Keycloak; it was reverted to Google Sign-In.** The Keycloak
  SSO Docker stack (`~/sso`, containers `cfc-sso` + `cfc-sso-db`) is **left
  running but unused** — the apps no longer talk to it. It can be stopped
  (`docker compose stop` in `~/sso`) if you want the resources back. Do **not**
  `docker compose down -v` it casually — that wipes a MySQL volume holding a
  Keycloak client/roles not captured in the realm export (only matters if you
  ever go back to Keycloak).
- `keycloak-js` may still be listed in the frontend `package.json` but is no
  longer imported.
- `jose` may still be in `server/package.json` but auth now uses
  `google-auth-library`.

---

## 12. Quick reference

| Task | Command (on the VM, in `~/forms`) |
| --- | --- |
| Deploy an update | `git pull && cd server && npm install && npm run build:web && pm2 restart forms-server` |
| Rebuild web only | `cd server && npm run build:web` |
| Restart server | `pm2 restart forms-server` |
| Logs | `pm2 logs forms-server --lines 40` |
| Health check | `curl http://localhost:1214/api/health` |
| Check Drive | `cd server && npm run drive:diagnose` |
| Fix DB columns | `cd server && node schema-drift.mjs --fix` |
| First-time PM2 | `cd server && pm2 start ecosystem.config.cjs && pm2 save` |
