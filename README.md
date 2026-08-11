# Student Task / Assignment Manager

A full-stack web application that lets students track their coursework and lets a professor
(administrator) hand out assignments and monitor the whole class.

Built with **React + Vite + TypeScript + Tailwind CSS** on the front end, **Node.js + Express +
TypeScript** on the back end, and **SQLite via Prisma ORM** for storage. The database is a local
file — there is no cloud service, no external account, and no network dependency beyond `npm
install`.

---

## Table of contents

1. [Overview](#overview)
2. [Features](#features)
3. [Technology stack](#technology-stack)
4. [Architecture](#architecture)
5. [Installation](#installation)
6. [Running the application](#running-the-application)
7. [Demo credentials](#demo-credentials)
8. [Demo walkthrough](#demo-walkthrough)
9. [Project structure](#project-structure)
10. [API overview](#api-overview)
11. [Database](#database)
12. [Security](#security)
13. [Testing](#testing)
14. [Assumptions](#assumptions)
15. [Limitations and future improvements](#limitations-and-future-improvements)

---

## Overview

Students juggle assignments across many subjects, each with its own deadline and weight. This
application gives them one place to record that work and see what is due next — and gives the
teaching staff a matching view of how the class is progressing.

Two roles share one system:

- **Students** manage their own assignments: create, edit, complete, reopen, delete, search,
  filter and sort. They can only ever see and touch their own records.
- **Administrators** (the professor) see every student and every assignment, and can push a new
  assignment to a single student or to the entire class in one action.

The critical design decision is that **authorisation lives on the server**. The React app hides
admin navigation from students purely for usability; the Express API independently rejects any
request a user is not entitled to make. Both behaviours are covered by automated tests.

---

## Features

### Authentication

- Student self-registration with full name, student ID, email and password
- Login issuing a signed JSON Web Token
- Logout
- `GET /api/auth/me` session restore — a stored token is re-validated against the server on every
  page load rather than trusted blindly
- Passwords hashed with bcrypt (per-password salt); plaintext is never stored, logged or returned
- Unique email and unique student ID, enforced by both the application and a database constraint
- Expired or tampered tokens end the session immediately across the whole app
- Self-registration always creates a `STUDENT`; the role cannot be escalated through the request body

### Student features

| # | Capability | Where |
|---|------------|-------|
| 1 | Dashboard with total / pending / completed / overdue counters | `/dashboard` |
| 2 | Upcoming assignments, nearest deadline first | `/dashboard` |
| 3 | Create an assignment | Any page — "Add new task" |
| 4 | Edit title, description, subject, due date, priority, status | Task card / detail page |
| 5 | Delete an assignment, behind a confirmation dialog | Task card / detail page |
| 6 | Mark as completed | Task card / detail page |
| 7 | Mark a completed task as pending again | Task card / detail page |
| 8 | View all / pending / completed tasks | `/tasks`, `/completed` |
| 9 | Search by title, subject or description | `/tasks` |
| 10 | Filter by status, priority and subject | `/tasks` |
| 11 | Sort by due date, created date, priority or alphabetically | `/tasks` |
| 12 | Full task detail view | `/tasks/:id` |
| 13 | Automatic overdue detection | Everywhere |
| 14 | Profile / account details | `/profile` |

### Admin features

| # | Capability | Where |
|---|------------|-------|
| 1 | Class statistics: students, assignments, pending, completed, overdue | `/admin` |
| 2 | Recent assignments table (assignment, subject, assigned to, due date, status) | `/admin` |
| 3 | Student progress table (student, total, completed, pending, overdue) | `/admin` |
| 4 | All students with per-student task counters | `/admin/students` |
| 5 | Individual student profile with their full task list | `/admin/students/:id` |
| 6 | Every task in the system, filterable by student | `/admin/tasks` |
| 7 | Create an assignment for **one or more specific students** | `/admin/tasks/create` |
| 8 | Create an assignment for **all students** at once | `/admin/tasks/create` |

When an assignment goes to "All students", the API creates **one task row per student** inside a
single transaction. Every task therefore has a real owner — the system never stores an assignment
with a null `studentId`.

---

## Technology stack

| Layer | Technology | Why |
|-------|------------|-----|
| UI | **React 18** | Component model suits a dashboard with many small, reusable pieces. |
| Build | **Vite 7** | Near-instant dev server and HMR; also proxies `/api` to Express so there is no CORS friction in development. |
| Language | **TypeScript** (both ends) | The API contract is expressed once as types and enforced at compile time on both sides. |
| Styling | **Tailwind CSS 3** | Utility classes keep spacing, colour and typography consistent without a parallel CSS file to drift out of sync. |
| Routing | **React Router 7** | Nested routes map cleanly onto the three access tiers (public / authenticated / admin). |
| HTTP | **Axios** | Interceptors attach the bearer token and normalise every error in one place. |
| Icons | **lucide-react** | Consistent, tree-shakeable icon set; icons pair with text so status is never colour-only. |
| Forms | **React Hook Form** | Uncontrolled inputs mean fewer re-renders and simpler validation wiring. |
| Validation | **Zod** (both ends) | One schema library on the client (instant feedback) and the server (the actual guarantee). |
| Server | **Express 4** | Small, explicit middleware pipeline — ideal for demonstrating where auth and validation sit. |
| Auth | **jsonwebtoken** | Stateless bearer tokens; no server-side session store required. |
| Hashing | **bcryptjs** | Deliberately slow, salted hashing — the correct primitive for passwords. |
| Security | **Helmet**, **CORS**, **express-rate-limit** | Standard headers, a locked-down origin allow-list, and brute-force throttling on the credential endpoints. |
| ORM | **Prisma 6** | Type-safe queries generated from the schema, plus a real migration history. |
| Database | **SQLite** | Zero-configuration local file. Clone, install, run — nothing else to provision. |
| Tests | **Vitest + Supertest** | 73 integration tests exercising the API through real HTTP requests. |

---

## Architecture

```text
                        ┌──────────────────────────┐
                        │      React Client        │
                        │   Vite + TypeScript      │
                        │  Tailwind · React Router │
                        └────────────┬─────────────┘
                                     │  REST / JSON
                                     │  Authorization: Bearer <JWT>
                                     ▼
                        ┌──────────────────────────┐
                        │    Express Backend       │
                        │       Node.js            │
                        └────────────┬─────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              ▼                      ▼                      ▼
      ┌───────────────┐    ┌──────────────────┐    ┌────────────────┐
      │  Auth / JWT   │    │    Services      │    │   Validation   │
      │ authenticate  │    │ business logic   │    │  Zod schemas   │
      │ requireAdmin  │    │  + ownership     │    │                │
      └───────┬───────┘    └────────┬─────────┘    └────────┬───────┘
              └─────────────────────┼───────────────────────┘
                                    ▼
                          ┌──────────────────┐
                          │   Repositories   │
                          └────────┬─────────┘
                                   ▼
                          ┌──────────────────┐
                          │    Prisma ORM    │
                          └────────┬─────────┘
                                   ▼
                          ┌──────────────────┐
                          │    SQLite DB     │
                          │ backend/prisma/  │
                          │     dev.db       │
                          └──────────────────┘
```

The backend is layered so each file has one job:

```text
Route  →  Middleware  →  Controller  →  Service  →  Repository  →  Prisma  →  SQLite
          (auth,          (HTTP in/     (rules,     (queries)
           validate)       out only)     ownership)
```

A full walkthrough — request lifecycle, auth flow, error handling and the student/admin
separation — is in **[ARCHITECTURE.md](ARCHITECTURE.md)**.

---

## Installation

**Prerequisites:** Node.js 18.18 or newer (developed on Node 22) and npm 9+.

From a clean clone, three commands:

```bash
npm install     # installs root + backend + frontend (npm workspaces)
npm run setup   # creates .env, generates Prisma client, migrates, seeds demo data
npm run dev     # starts the API on :5000 and the client on :5173
```

`npm run setup` performs, in order:

1. Copies `backend/.env.example` → `backend/.env` (skipped if it already exists)
2. `prisma generate` — builds the type-safe client
3. `prisma migrate deploy` — creates `backend/prisma/dev.db` and applies the migration
4. `npm run db:seed` — inserts the demo admin, 4 students and 19 assignments

Then open **http://localhost:5173**.

<details>
<summary>Prefer to run the steps individually?</summary>

```bash
cd backend
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npm run db:seed
npm run dev            # API on http://localhost:5000

# in a second terminal
cd frontend
npm run dev            # client on http://localhost:5173
```
</details>

More detail, plus troubleshooting, is in **[SETUP.md](SETUP.md)**.

---

## Running the application

| Command (from the project root) | What it does |
|---|---|
| `npm run dev` | Runs API and client together with colour-coded, prefixed logs |
| `npm run dev:backend` | API only — http://localhost:5000 |
| `npm run dev:frontend` | Client only — http://localhost:5173 |
| `npm run build` | Type-checks and builds both workspaces for production |
| `npm start` | Serves the compiled API from `backend/dist` |
| `npm test` | Runs the 73-test backend suite |
| `npm run typecheck` | Type-checks both workspaces |
| `npm run db:seed` | Re-seeds the demo data |
| `npm run db:reset` | Drops, re-migrates and re-seeds the database |
| `npm run db:studio` | Opens Prisma Studio to browse the SQLite file |

The Vite dev server proxies `/api` to `http://localhost:5000`, so the client needs no environment
variable and no CORS round-trip during development.

---

## Demo credentials

> ⚠️ **Development / demonstration credentials only.** These accounts are created by
> `backend/prisma/seed.ts` so the project is usable the moment it is installed. They are not
> production credentials and must never be used in a real deployment.

| Role | Email | Password |
|------|-------|----------|
| **Admin (professor)** | `admin@college.local` | `Admin@123` |
| Student 1 | `student1@college.local` | `Student@123` |
| Student 2 | `student2@college.local` | `Student@123` |
| Student 3 | `student3@college.local` | `Student@123` |
| Student 4 | `student4@college.local` | `Student@123` |

The login page lists the admin and student accounts as one-click buttons that fill the form.

Seeded data includes 19 assignments spread across subjects (Data Structures, DBMS, Operating
Systems, Machine Learning, Compiler Design, …) with a mix of priorities, statuses, and due dates —
including some **deliberately in the past**, so overdue detection is visible immediately.

---

## Demo walkthrough

### Demo 1 — Student

1. Log in as `student1@college.local` / `Student@123`
2. The dashboard shows counters and the nearest deadlines; note the red **OVERDUE** card
3. **Add new task** → fill the form → create
4. **Edit** the task, change its priority, save
5. **Mark as completed** — the title gains a strikethrough, a check icon and a Completed badge
6. Go to **Completed** to see it filtered
7. **Mark as pending** to move it back
8. **Delete** it and confirm in the dialog

### Demo 2 — Admin

1. Log out
2. Log in as `admin@college.local` / `Admin@123` — the navigation changes to the admin menu
3. The admin dashboard shows class statistics, recent assignments and per-student progress
4. **Students** → per-student counters; click a student for their full task list
5. **All Tasks** → every assignment, filterable by student
6. **Create Assignment** → choose *Specific students*, pick one, create
7. **Create Assignment** again → choose *All students* — the button reports how many tasks it will create
8. Log out, log back in as `student1@college.local`
9. The class-wide assignment is already on the student's dashboard; the individually-assigned one is not

### Demo 3 — Security (worth showing a professor)

- Logged in as a student, open the browser console and run:
  ```js
  fetch('/api/admin/students', {
    headers: { Authorization: `Bearer ${localStorage.getItem('stm.auth.token')}` }
  }).then(r => console.log(r.status));   // → 403
  ```
  The endpoint is refused even though the request carries a perfectly valid token, because the
  role check happens in Express middleware, not in React.
- Try fetching another student's task by id — the API returns **403 Forbidden**.
- Run `npm test` to see all of this asserted automatically.

---

## Project structure

```text
student-task-manager/
│
├── backend/
│   ├── prisma/
│   │   ├── migrations/          # committed SQL migration history
│   │   ├── schema.prisma        # User + Task models, relations, indexes
│   │   └── seed.ts              # demo admin, students and assignments
│   ├── scripts/
│   │   └── setup-env.mjs        # creates .env from .env.example
│   ├── src/
│   │   ├── config/              # env validation, Prisma client singleton
│   │   ├── controllers/         # HTTP request/response only
│   │   ├── middleware/          # authenticate, authorize, validate, errors
│   │   ├── repositories/        # all database access
│   │   ├── routes/              # endpoint definitions
│   │   ├── schemas/             # Zod request schemas
│   │   ├── services/            # business logic + ownership rules
│   │   ├── types/               # domain unions, Express augmentation
│   │   ├── utils/               # ApiError, JWT, bcrypt, DTO mappers
│   │   ├── app.ts               # Express app factory (used by tests too)
│   │   └── server.ts            # process entry point
│   ├── tests/                   # 73 Vitest + Supertest integration tests
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/          # Navbar
│   │   │   ├── routing/         # ProtectedRoute, AdminRoute, PublicOnlyRoute
│   │   │   ├── tasks/           # TaskCard, TaskFilters, TaskFormModal, badges
│   │   │   └── ui/              # Button, Card, Badge, Modal, Field, ...
│   │   ├── context/             # AuthContext, ToastContext
│   │   ├── hooks/               # useAuth, useTasks, useToast, useDebounce
│   │   ├── layouts/             # AppLayout, AuthLayout
│   │   ├── pages/               # one file per route (admin/ subfolder)
│   │   ├── services/            # axios client + one module per API area
│   │   ├── types/               # shared client types
│   │   ├── utils/               # date formatting, task helpers, cn()
│   │   ├── App.tsx              # route table
│   │   └── main.tsx
│   └── package.json
│
├── README.md            ← you are here
├── ARCHITECTURE.md      # layers, flows, request lifecycle, diagrams
├── API.md               # every endpoint, request, response and error
├── DATABASE.md          # schema, ER diagram, indexes, migrations, seed
├── SETUP.md             # step-by-step setup + troubleshooting
├── .gitignore
└── package.json         # npm workspaces + orchestration scripts
```

---

## API overview

All endpoints are prefixed with `/api`. Every response uses the same envelope:

```jsonc
// success
{ "success": true, "data": { }, "meta": { } }

// failure
{ "success": false, "message": "Task not found", "errors": { "title": "Title is required" } }
```

### Authentication

| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| POST | `/api/auth/register` | – | – | Create a student account |
| POST | `/api/auth/login` | – | – | Obtain a JWT |
| GET | `/api/auth/me` | ✔ | any | Current user profile |
| POST | `/api/auth/logout` | ✔ | any | Acknowledge logout |

### Tasks — always scoped to the logged-in user

| Method | Endpoint | Auth | Role | Purpose |
|---|---|---|---|---|
| GET | `/api/tasks` | ✔ | any | List own tasks (+ summary + subjects) |
| GET | `/api/tasks/summary` | ✔ | any | Dashboard counters + next deadlines |
| GET | `/api/tasks/:id` | ✔ | owner or admin | One task |
| POST | `/api/tasks` | ✔ | any | Create (owner = caller) |
| PUT | `/api/tasks/:id` | ✔ | owner or admin | Update fields |
| PATCH | `/api/tasks/:id/status` | ✔ | owner or admin | Complete / reopen |
| DELETE | `/api/tasks/:id` | ✔ | owner or admin | Delete |

Query parameters: `?status=PENDING&priority=HIGH&subject=DBMS&search=database&sortBy=dueDate&order=asc&overdue=true`

### Admin — `403 Forbidden` for any student

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/admin/statistics` | Class totals, recent assignments, student progress |
| GET | `/api/admin/students` | All students with task counters |
| GET | `/api/admin/students/:id` | One student + their full task list |
| GET | `/api/admin/tasks` | Every task, filterable (incl. `?studentId=`) |
| POST | `/api/admin/tasks` | Create an assignment for specific students or `"ALL"` |

Status codes in use: `200`, `201`, `400`, `401`, `403`, `404`, `409`, `429`, `500`.

Full request/response examples for every endpoint are in **[API.md](API.md)**.

---

## Database

**SQLite** accessed through **Prisma ORM**. The database is the single file
`backend/prisma/dev.db` — it is git-ignored and created locally by `npm run setup`.

Two models with a one-to-many relationship:

```text
┌──────────────────────────┐
│          USER            │
├──────────────────────────┤
│ id            PK  (cuid) │
│ name                     │
│ studentId     UNIQUE     │──┐  null for admin accounts
│ email         UNIQUE     │  │
│ passwordHash  (bcrypt)   │  │
│ role          STUDENT|ADMIN │
│ createdAt / updatedAt    │  │
└───────────┬──────────────┘  │
            │ 1               │
            │                 │
            │ N               │
┌───────────▼──────────────┐  │
│          TASK            │  │
├──────────────────────────┤  │
│ id            PK  (cuid) │  │
│ title                    │  │
│ description              │  │
│ subject                  │  │
│ priority   LOW|MEDIUM|HIGH  │
│ status     PENDING|COMPLETED│
│ dueDate                  │  │
│ createdAt / updatedAt    │  │
│ studentId     FK → USER  │──┘  the owner
│ createdBy     FK → USER  │     the author (student or admin)
└──────────────────────────┘
```

`studentId` is the owner; `createdBy` records who authored it. When they differ, the task was
assigned by a professor — which is how the UI shows its "Assigned" badge.

**Indexes:** `users.email`, `users.studentId`, `users.role`, `tasks.studentId`, `tasks.status`,
`tasks.dueDate`, `tasks.subject`, `tasks.createdBy`, and a composite `tasks(studentId, status)`
for the dashboard's most common query.

> **Note on enums:** Prisma does not support native `enum` blocks on the SQLite connector, so
> `role`, `priority` and `status` are stored as `TEXT`. The allowed values are enforced by Zod
> schemas at the API boundary and by TypeScript union types throughout the code. This is explained
> in detail in [DATABASE.md](DATABASE.md).

**Overdue is derived, never stored.** A task is overdue when `status = PENDING` **and**
`dueDate < now`. Computing it on read is always correct; a stored column would need a scheduled job
to stay accurate.

Full schema, ER diagram, migration and seed details: **[DATABASE.md](DATABASE.md)**.

---

## Security

| Concern | Measure |
|---|---|
| Password storage | bcrypt with a per-password salt; cost factor configurable via `BCRYPT_SALT_ROUNDS` |
| Password exposure | A `toUserDTO()` mapper strips `passwordHash` — no endpoint can return it |
| Authentication | Signed JWT with issuer + expiry, sent as `Authorization: Bearer <token>` |
| Token revocation | The user is re-read from the database on every request, so a deleted account fails immediately |
| Authorisation | `authenticate` then `requireRole('ADMIN')` mounted at router level on `/api/admin` |
| Object-level access | Every task operation loads the record and verifies ownership before acting |
| Privilege escalation | Registration hard-codes `role: 'STUDENT'`; `studentId` on create comes from the JWT, never the body |
| Input validation | Zod validates body, query and params on every route; parsed output replaces the raw input |
| User enumeration | Wrong password and unknown account both return the same "Invalid email or password" |
| Brute force | `express-rate-limit` throttles `/auth/register` and `/auth/login` |
| HTTP headers | Helmet (CSP, `X-Frame-Options`, `nosniff`, `X-Powered-By` removed) |
| CORS | Explicit origin allow-list from `CLIENT_URL` |
| Payload size | JSON body capped at 100 kb |
| SQL injection | Prisma parameterises every query; no string-concatenated SQL anywhere |
| Error leakage | A central handler maps errors to safe messages; stack traces are logged server-side only |
| Secrets | `.env` is git-ignored; only `.env.example` with placeholder values is committed |

**Known trade-off:** the JWT is kept in `localStorage`. This survives a page refresh and matches the
`Bearer` header architecture, but it is readable by any successful XSS. The hardened alternative is
an `httpOnly` + `SameSite=Strict` cookie with CSRF protection — noted as a future improvement and
discussed in [ARCHITECTURE.md](ARCHITECTURE.md#security-considerations).

---

## Testing

```bash
npm test
```

73 integration tests run against a **separate** SQLite database (`backend/prisma/test.db`), created
fresh from the committed migrations before the suite starts. The developer's `dev.db` is never
touched.

| File | Tests | Covers |
|---|---|---|
| `tests/auth.test.ts` | 16 | Registration, duplicate email/student ID, password hashing, login, invalid password, unknown account, `/me`, tampered tokens, deleted accounts, logout, role-escalation attempt |
| `tests/tasks.test.ts` | 23 | Create / read / update / delete, complete + reopen, defaults, validation, search, filters, sorting, overdue derivation, persistence |
| `tests/authorization.test.ts` | 13 | Students blocked from every admin route (403), 401 without a token, and students unable to read/edit/complete/delete another student's task |
| `tests/admin.test.ts` | 15 | Student listing with counters, student detail, all-tasks view, assignment to one student, assignment to all students, statistics |
| `tests/api.test.ts` | 6 | Response envelope, 404 handling, malformed JSON, no stack-trace leakage, Helmet headers |

Representative assertions:

```ts
it('stores the password as a bcrypt hash, never as plaintext', /* ... */);
it('ignores a studentId supplied in the body (no assigning work to others)', /* ... */);
it('GET /api/admin/students returns 403 for a student', /* ... */);
it('creates one task row per student, each owned by that student', /* ... */);
it('does not mark a COMPLETED task as overdue even when the date has passed', /* ... */);
```

---

## Assumptions

1. **Admin accounts are provisioned, not self-registered.** Public registration always creates a
   `STUDENT`. The demo admin comes from the seed script — appropriate for a college system where
   faculty accounts are issued centrally.
2. **`studentId` is nullable.** Administrators are not students and have no roll number. SQLite
   permits multiple `NULL`s in a `UNIQUE` column, so uniqueness still holds for every real student ID.
3. **Admins have read access to all tasks and may act on any task.** A professor overseeing the class
   needs this. Students remain strictly limited to their own records.
4. **An admin-created assignment becomes the student's own task.** The student can edit and complete
   their copy. `createdBy` preserves the provenance so the UI can show an "Assigned" badge. Editing
   one student's copy does not affect anyone else's.
5. **Overdue is derived, not stored** (see [Database](#database)).
6. **Due dates are stored as timestamps but entered as dates.** The date picker submits `yyyy-mm-dd`;
   the seed sets 23:59 local time so "due today" behaves the way a student expects.
7. **Priority sorting is applied in memory.** `HIGH`/`MEDIUM`/`LOW` sort alphabetically in SQL, which
   is wrong; the repository re-orders by rank. Task lists are scoped to one student or one class, so
   the cost is negligible.
8. **Search is case-insensitive for ASCII.** This is SQLite's native `LIKE` behaviour — verified
   working for mixed-case terms.
9. **No pagination.** A class-sized dataset fits comfortably in one response; see below.
10. **English (`en-GB`) date formatting**, e.g. `15 Aug 2026`.

---

## Limitations and future improvements

Known limitations, stated plainly:

- **No pagination or virtualisation.** `GET /api/tasks` returns every matching row. Fine for a class;
  it would need cursor pagination for thousands of records.
- **JWT in `localStorage`** — see the trade-off note under [Security](#security).
- **No token refresh or server-side revocation.** A token stays valid until it expires (7 days by
  default). Logout discards it client-side but cannot invalidate it server-side.
- **No password reset or email verification** — both need an email provider, which would break the
  "runs entirely offline" property.
- **No file attachments or submission upload.**
- **Admin cannot edit or bulk-delete assignments after creation** — only create and view. Editing a
  class-wide assignment would need to fan out across every copy.
- **Frontend has no automated tests.** Testing effort went into the API, where the security-critical
  logic lives. Component tests with Vitest + React Testing Library are the obvious next step.
- **SQLite serialises writes.** Correct for this scale, but Postgres would be the choice for real
  concurrent load. Prisma makes that largely a connector change.

Natural next features: notifications and deadline reminders, calendar view, file submission,
grades and feedback from the professor, CSV export, per-subject analytics, dark mode, and
per-student assignment editing for admins.

---

## Documentation index

| Document | Contents |
|---|---|
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | Layered design, authentication and authorisation flows, request lifecycle, error handling, validation strategy, admin/student separation, security analysis |
| **[API.md](API.md)** | Every endpoint: method, URL, auth and role requirements, request body, query parameters, example responses, error responses |
| **[DATABASE.md](DATABASE.md)** | SQLite + Prisma rationale, both models, relationships, enum handling, indexes, migrations, seed data, example queries |
| **[SETUP.md](SETUP.md)** | Prerequisites, install, environment variables, per-workspace commands, troubleshooting, resetting the database |

---

## License

MIT — an educational project.
