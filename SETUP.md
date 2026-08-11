# Setup Guide

Everything needed to get the Student Task / Assignment Manager running from a clean clone.

---

## 1. Prerequisites

| Requirement | Version | Check |
|---|---|---|
| **Node.js** | 18.18 or newer (developed on 22.x) | `node --version` |
| **npm** | 9 or newer | `npm --version` |
| Git | any | `git --version` |

Nothing else. No database server, no Docker, no cloud account — SQLite is a file, and Prisma creates
it for you.

---

## 2. Quick start

Three commands from the project root:

```bash
npm install
npm run setup
npm run dev
```

Then open **http://localhost:5173** and sign in with:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@college.local` | `Admin@123` |
| Student | `student1@college.local` | `Student@123` |

The login page also lists these as one-click buttons.

---

## 3. What each command does

### `npm install`

The project uses **npm workspaces**, so a single install at the root covers the root, `backend/` and
`frontend/`. Dependencies are hoisted into one `node_modules`, which keeps the install fast and
avoids duplicate copies of shared packages such as `zod` and `typescript`.

### `npm run setup`

Runs four steps inside `backend/`:

```text
1. node scripts/setup-env.mjs   Copies .env.example → .env  (skipped if .env exists)
2. prisma generate              Generates the type-safe Prisma client
3. prisma migrate deploy        Creates prisma/dev.db and applies the migration
4. npm run db:seed              Inserts the admin, 4 students and 19 assignments
```

Expected output ends with:

```text
  4 students and 19 tasks seeded.

  ---------------------------------------------------------
   DEMO CREDENTIALS  (development only - do not use in prod)
  ---------------------------------------------------------
   Admin    : admin@college.local     / Admin@123
   Student  : student1@college.local  / Student@123
   ...
```

### `npm run dev`

Starts both servers together with colour-coded, prefixed output:

```text
[API]   Student Task Manager API
[API]   Environment : development
[API]   Listening   : http://localhost:5000
[API]   Health      : http://localhost:5000/api/health
[WEB]   VITE v7.3.6  ready in 342 ms
[WEB]   ➜  Local:   http://localhost:5173/
```

| Service | URL |
|---|---|
| Web client | http://localhost:5173 |
| REST API | http://localhost:5000/api |
| Health check | http://localhost:5000/api/health |

Press `Ctrl+C` once to stop both.

---

## 4. Manual setup

If you would rather run each step yourself:

```bash
# --- Backend -------------------------------------------------------------
cd backend
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
npx prisma generate
npx prisma migrate dev        # creates prisma/dev.db + the migration
npm run db:seed
npm run dev                   # API on http://localhost:5000

# --- Frontend (second terminal) ------------------------------------------
cd frontend
npm run dev                   # client on http://localhost:5173
```

---

## 5. Environment variables

Only the backend needs configuration. `npm run setup` creates `backend/.env` from
`backend/.env.example` automatically.

```env
# Local SQLite file. Path is relative to backend/prisma/.
DATABASE_URL="file:./dev.db"

# Secret used to sign JWTs. Must be at least 16 characters.
JWT_SECRET="dev-only-secret-change-this-in-production-min-16-chars"

# Token lifetime (zeit/ms format: 15m, 2h, 7d ...)
JWT_EXPIRES_IN="7d"

# Port the Express API listens on.
PORT=5000

# Origin(s) allowed by CORS. Comma-separate for several.
CLIENT_URL="http://localhost:5173"

# development | production | test
NODE_ENV="development"

# bcrypt cost factor. 10-12 is the sane range.
BCRYPT_SALT_ROUNDS=10
```

The configuration is **validated at boot** by `src/config/env.ts`. A missing or too-short
`JWT_SECRET` stops the server with a clear message rather than failing mysteriously later:

```text
Invalid environment configuration:
  - JWT_SECRET: JWT_SECRET must be at least 16 characters long

Copy backend/.env.example to backend/.env and fill in the values.
```

> **`.env` is git-ignored.** Only `.env.example`, containing placeholders, is committed. Change
> `JWT_SECRET` to a long random string before deploying anywhere real.

### Frontend configuration (optional)

The client calls the relative path `/api`, and Vite proxies it to port 5000 — so no configuration is
needed in development. To point at a different API (for example a deployed build), create
`frontend/.env`:

```env
VITE_API_URL="https://api.example.com/api"
```

---

## 6. All available commands

Run from the project root.

| Command | Description |
|---|---|
| `npm install` | Install all workspaces |
| `npm run setup` | Create `.env`, generate client, migrate, seed |
| `npm run dev` | Start API + client together |
| `npm run dev:backend` | API only |
| `npm run dev:frontend` | Client only |
| `npm run build` | Type-check and build both workspaces |
| `npm start` | Serve the compiled API from `backend/dist` |
| `npm test` | Run the 73-test backend suite |
| `npm run typecheck` | Type-check both workspaces |
| `npm run db:seed` | Re-seed the demo data |
| `npm run db:reset` | Drop, re-migrate and re-seed |
| `npm run db:studio` | Open Prisma Studio at http://localhost:5555 |

Backend-only (from `backend/`):

| Command | Description |
|---|---|
| `npm run prisma:generate` | Regenerate the Prisma client |
| `npm run prisma:migrate` | Create and apply a new migration |
| `npm run prisma:deploy` | Apply committed migrations |
| `npm run test:watch` | Tests in watch mode |

---

## 7. Verifying the installation

### API is alive

```bash
curl http://localhost:5000/api/health
```

```json
{"success":true,"data":{"status":"ok","service":"student-task-manager-api","timestamp":"..."}}
```

PowerShell:

```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/health"
```

### Login works

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@college.local","password":"Admin@123"}'
```

Should return `"role":"ADMIN"` and a `token`.

### Test suite passes

```bash
npm test
```

```text
 ✓ tests/tasks.test.ts         (23 tests)
 ✓ tests/admin.test.ts         (15 tests)
 ✓ tests/auth.test.ts          (16 tests)
 ✓ tests/authorization.test.ts (13 tests)
 ✓ tests/api.test.ts           (6 tests)

 Test Files  5 passed (5)
      Tests  73 passed (73)
```

Tests run against a **separate** database (`backend/prisma/test.db`), created fresh from the
migrations each run. Your `dev.db` is never touched.

### Database contains the seed data

```bash
npm run db:studio
```

`users` should hold 5 rows (1 admin + 4 students) and `tasks` should hold 19.

---

## 8. Troubleshooting

### `Port 5000 is already in use`

```text
Port 5000 is already in use.
Another instance of the API is probably still running.
Stop it, or set a different PORT in backend/.env.
```

Find and stop the process:

```bash
# macOS / Linux
lsof -ti:5000 | xargs kill -9
```

```powershell
# Windows PowerShell
Get-NetTCPConnection -LocalPort 5000 -State Listen |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

Or change `PORT` in `backend/.env` — remember to update the proxy target in
`frontend/vite.config.ts` to match.

### `Port 5173 is already in use`

Vite will offer the next free port automatically. If you accept it, the API's `CLIENT_URL` must be
updated to match, or CORS will reject the browser's requests.

### `Cannot connect to the SQLite database`

```text
Could not connect to the SQLite database.
Run `npm run setup` from the project root to create and seed it.
```

The database file has not been created yet. Run `npm run setup`.

### `@prisma/client did not initialize yet`

The generated client is missing — usually because `npm install` ran without `prisma generate`:

```bash
npm run setup --workspace backend
# or just:
cd backend && npx prisma generate
```

### `Environment variable not found: DATABASE_URL`

`backend/.env` is missing:

```bash
node backend/scripts/setup-env.mjs
```

### `Invalid environment configuration: JWT_SECRET ...`

`JWT_SECRET` is absent or shorter than 16 characters. Set a longer value in `backend/.env`.

### Login always fails with "Invalid email or password"

The database has no seed data, or was reset without re-seeding:

```bash
npm run db:seed
```

### The UI loads but every request fails

Check the API is running — the client shows *"Cannot reach the server. Is the backend running on
port 5000?"* when it is not. Start it with `npm run dev:backend`, and confirm
http://localhost:5000/api/health responds.

### CORS errors in the browser console

`CLIENT_URL` in `backend/.env` must exactly match the origin the browser is using, including the
port. If Vite moved to 5174, set `CLIENT_URL="http://localhost:5174"` and restart the API.

### TypeScript errors after changing `schema.prisma`

Regenerate the client so the types match the schema:

```bash
cd backend && npx prisma generate
```

### Starting completely over

```bash
npm run db:reset          # drops, re-migrates and re-seeds the database
```

Full clean rebuild:

```bash
# from the project root
rm -rf node_modules backend/node_modules frontend/node_modules
rm -f backend/prisma/dev.db backend/.env
npm install
npm run setup
```

PowerShell:

```powershell
Remove-Item -Recurse -Force node_modules, backend\node_modules, frontend\node_modules -ErrorAction SilentlyContinue
Remove-Item -Force backend\prisma\dev.db, backend\.env -ErrorAction SilentlyContinue
npm install
npm run setup
```

---

## 9. Production build

```bash
npm run build
```

- `backend/dist/` — compiled JavaScript
- `frontend/dist/` — static assets to serve from any web server or CDN

Running the compiled API:

```bash
npm start
```

Before deploying anywhere real:

1. Set `NODE_ENV=production`
2. Replace `JWT_SECRET` with a long random value (`openssl rand -base64 48`)
3. Set `CLIENT_URL` to the deployed frontend origin
4. Serve over HTTPS
5. Consider raising `BCRYPT_SALT_ROUNDS` to 12
6. Review the token-storage trade-off in [ARCHITECTURE.md](ARCHITECTURE.md#11-security-considerations)

---

## 10. Project layout after setup

```text
IT_LAB_Proejct_1/
├── node_modules/              created by npm install (hoisted workspace deps)
├── backend/
│   ├── .env                   created by npm run setup  (git-ignored)
│   ├── .env.example           committed template
│   └── prisma/
│       ├── dev.db             created by npm run setup  (git-ignored)
│       ├── migrations/        committed migration history
│       └── schema.prisma
├── frontend/
├── README.md
├── ARCHITECTURE.md
├── API.md
├── DATABASE.md
├── SETUP.md
└── package.json
```

Files created locally and never committed: `node_modules/`, `backend/.env`,
`backend/prisma/dev.db`, `backend/prisma/test.db`, and both `dist/` folders.
