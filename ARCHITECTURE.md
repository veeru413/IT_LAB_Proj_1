# Architecture

Technical design of the Student Task / Assignment Manager.

**Contents**

1. [Overall architecture](#1-overall-architecture)
2. [Frontend architecture](#2-frontend-architecture)
3. [Backend architecture](#3-backend-architecture)
4. [Authentication flow](#4-authentication-flow)
5. [Authorization flow](#5-authorization-flow)
6. [Database architecture](#6-database-architecture)
7. [Request lifecycle](#7-request-lifecycle)
8. [Error handling](#8-error-handling)
9. [Validation](#9-validation)
10. [Admin / student separation](#10-admin--student-separation)
11. [Security considerations](#11-security-considerations)

---

## 1. Overall architecture

A classic three-tier application: a single-page React client, a stateless REST API, and a local
relational database.

```text
┌───────────────────────────────────────────────────────────────────┐
│                        PRESENTATION TIER                          │
│                                                                   │
│   React 18 · Vite · TypeScript · Tailwind CSS · React Router      │
│                                                                   │
│   Pages ──▶ Components ──▶ Hooks ──▶ Services (axios)             │
│                              │                                    │
│                        AuthContext (session)                      │
└─────────────────────────────┬─────────────────────────────────────┘
                              │  HTTP / JSON
                              │  Authorization: Bearer <JWT>
                              ▼
┌───────────────────────────────────────────────────────────────────┐
│                         APPLICATION TIER                          │
│                                                                   │
│   Express 4 · TypeScript                                          │
│                                                                   │
│   Routes ─▶ Middleware ─▶ Controllers ─▶ Services ─▶ Repositories │
│              (helmet,      (HTTP only)   (rules,     (queries)    │
│               cors,                       ownership)              │
│               authenticate,                                       │
│               requireAdmin,                                       │
│               validate,                                           │
│               errorHandler)                                       │
└─────────────────────────────┬─────────────────────────────────────┘
                              │  Prisma Client (type-safe SQL)
                              ▼
┌───────────────────────────────────────────────────────────────────┐
│                            DATA TIER                              │
│                                                                   │
│   SQLite  ·  backend/prisma/dev.db                                │
│   Tables: users, tasks   (+ _prisma_migrations)                   │
└───────────────────────────────────────────────────────────────────┘
```

### Why this shape

- **Stateless API.** No server-side session store, so the API could be scaled horizontally or
  restarted without logging anyone out.
- **Layered backend.** Each layer has exactly one reason to change: routes describe the surface,
  controllers translate HTTP, services hold rules, repositories hold queries.
- **Shared vocabulary.** TypeScript types on both sides describe the same contract, so a change to
  a response shape produces a compile error in the client rather than a runtime surprise.
- **Local-first storage.** SQLite through Prisma means the project runs immediately after cloning,
  with no database server to install and no credentials to obtain.

---

## 2. Frontend architecture

```text
frontend/src/
├── components/
│   ├── layout/       Navbar (role-aware, responsive)
│   ├── routing/      ProtectedRoute · AdminRoute · PublicOnlyRoute
│   ├── tasks/        TaskCard · TaskFilters · TaskFormModal · TaskBadges
│   └── ui/           Button · Card · Badge · Modal · Field · StatCard · Feedback
├── context/          AuthContext (session) · ToastContext (notifications)
├── hooks/            useAuth · useTasks · useToast · useDebounce
├── layouts/          AppLayout (nav + content) · AuthLayout (split screen)
├── pages/            One component per route; admin/ subfolder for admin screens
├── services/         api.ts (axios instance) + auth/task/admin service modules
├── types/            Client-side mirror of the API contract
├── utils/            date formatting · task helpers · cn()
├── App.tsx           Route table
└── main.tsx          Entry point
```

### Component layers

```text
        Page  ("what this screen is")
          │  owns data fetching + page state
          ▼
    Feature component  (TaskCard, TaskFilters, TaskFormModal)
          │  understands the task domain
          ▼
      UI primitive  (Button, Card, Badge, Modal, Field)
             knows nothing about tasks - purely presentational
```

Keeping primitives domain-agnostic is what makes spacing, colour and focus styling identical
everywhere: there is one `Button`, one `Badge`, one form-field wrapper.

### State management

No Redux, no external state library — three mechanisms cover everything:

| State | Mechanism | Reason |
|---|---|---|
| Session (user + token) | `AuthContext` | Needed globally by navigation and every route guard |
| Notifications | `ToastContext` | Any page may raise a toast |
| Server data (tasks, students) | `useTasks` and page-level `useState` | Naturally scoped to one screen |
| Form state | React Hook Form | Uncontrolled inputs, fewer re-renders |
| Filters | `useState` in the page, debounced for search | Drives the API query |

`useTasks` is the notable abstraction: it owns the task list, filters, and every mutation
(create / update / toggle / delete), so `TasksPage` stays declarative. Filtering, searching and
sorting are **server-side** — the hook converts UI state into query parameters and refetches.

### Routing

```text
/                        → redirect to /dashboard
│
├─ PublicOnlyRoute       (redirects away if already signed in)
│  └─ AuthLayout
│     ├─ /login
│     └─ /register
│
└─ ProtectedRoute        (requires a valid session)
   └─ AppLayout          (navbar + content + footer)
      ├─ /dashboard
      ├─ /tasks
      ├─ /tasks/:id
      ├─ /completed
      ├─ /profile
      │
      └─ AdminRoute      (additionally requires role = ADMIN)
         ├─ /admin
         ├─ /admin/students
         ├─ /admin/students/:id
         ├─ /admin/tasks
         └─ /admin/tasks/create
```

`ProtectedRoute` records the attempted path in router state, so logging in returns the user to the
page they originally asked for.

### Design system

- **Colour:** slate for text and structure; a single indigo accent (`brand`) for primary actions and
  active navigation; semantic tones for state — amber (pending), emerald (completed), rose (overdue
  / high priority), sky (low priority).
- **Never colour alone.** Every status badge carries an icon *and* a text label. A completed task is
  marked four ways: strikethrough title, reduced opacity, check icon, and a "Completed" badge.
- **Motion is minimal.** Two 150 ms animations exist, used only for modal and toast entry, and both
  are disabled under `prefers-reduced-motion`.
- **Responsive.** Mobile-first utilities; the navbar collapses to a disclosure menu below `md`, stat
  grids reflow 1 → 2 → 4 columns, and every table scrolls horizontally inside its own container so
  the page body never does.

---

## 3. Backend architecture

```text
backend/src/
├── config/        env.ts (validated at boot) · prisma.ts (client singleton)
├── controllers/   HTTP request → service call → HTTP response
├── middleware/    authenticate · authorize · validate · errorHandler
├── repositories/  Every Prisma query lives here
├── routes/        Endpoint definitions and middleware composition
├── schemas/       Zod schemas for body / query / params
├── services/      Business logic, ownership rules, aggregation
├── types/         Domain unions + Express Request augmentation
├── utils/         ApiError · response envelope · JWT · bcrypt · DTO mappers
├── app.ts         createApp() — exported so tests mount it without a port
└── server.ts      Boot, health check, graceful shutdown
```

### Layer responsibilities

| Layer | Does | Never does |
|---|---|---|
| **Route** | Declares path + method, composes middleware | Contain logic |
| **Middleware** | Auth, role checks, validation, error formatting | Know about tasks |
| **Controller** | Read validated request, call service, send response | Query the database |
| **Service** | Enforce rules, check ownership, aggregate, orchestrate | Touch `req`/`res` |
| **Repository** | Build and run Prisma queries | Decide who may do what |

The rule that keeps this honest: **controllers never import Prisma, and services never import
Express types.** A service is a plain function taking a user and an input and returning data — which
is exactly why the ownership check can be trusted, and why it is easy to test.

### `app.ts` as a factory

`createApp()` returns a configured Express app rather than starting a server. `server.ts` calls it
for the real process; the test suite calls it and hands the result to Supertest. The tests therefore
exercise the same middleware pipeline the browser hits — including Helmet, CORS, validation and the
error handler.

---

## 4. Authentication flow

### Registration

```text
Browser                    Express                      bcrypt        SQLite
   │                          │                            │             │
   │ POST /api/auth/register  │                            │             │
   ├─────────────────────────▶│                            │             │
   │                          │ validate(registerSchema)   │             │
   │                          │   name, studentId, email,  │             │
   │                          │   password, confirmPassword│             │
   │                          │                            │             │
   │                          │ email / studentId unique?  │             │
   │                          ├────────────────────────────┼────────────▶│
   │                          │◀───────────────────────────┼─────────────┤
   │                          │   (409 Conflict if taken)  │             │
   │                          │                            │             │
   │                          │ hash(password, salt)       │             │
   │                          ├───────────────────────────▶│             │
   │                          │◀───────────────────────────┤             │
   │                          │   $2a$10$...               │             │
   │                          │                            │             │
   │                          │ INSERT user role='STUDENT' │             │
   │                          ├────────────────────────────┼────────────▶│
   │                          │                            │             │
   │                          │ sign JWT {sub, email, role}│             │
   │ 201 { user, token }      │                            │             │
   │◀─────────────────────────┤                            │             │
```

The role is **hard-coded** in `auth.service.ts`, not read from the body, so a crafted
`{"role":"ADMIN"}` cannot escalate privileges. A test asserts this.

### Login

```text
POST /api/auth/login
   │
   ├─▶ validate(loginSchema)
   ├─▶ findUserByEmail(email)
   │     └─ not found ──▶ 401 "Invalid email or password"
   ├─▶ bcrypt.compare(password, user.passwordHash)
   │     └─ mismatch ──▶ 401 "Invalid email or password"   ← identical message
   └─▶ sign JWT ──▶ 200 { user, token }
```

Both failure paths return the same message so the endpoint cannot be used to discover which emails
are registered.

### Authenticated requests

```text
React                                Express
  │                                     │
  │ axios request interceptor           │
  │   Authorization: Bearer <token>     │
  ├────────────────────────────────────▶│
  │                                     │ authenticate middleware
  │                                     │   1. extract bearer token
  │                                     │   2. jwt.verify (signature, expiry, issuer)
  │                                     │   3. SELECT user WHERE id = payload.sub
  │                                     │   4. req.user = { id, email, name, role, studentId }
  │                                     │
  │                                     ├─▶ requireRole / controller / service
  │◀────────────────────────────────────┤
  │                                     │
  │ 401? → dispatch 'stm:unauthorized'  │
  │        AuthContext clears session   │
```

**Step 3 is deliberate.** The user is re-read from the database on every request rather than trusted
straight from the token payload, so a deleted account or a changed role takes effect immediately
instead of whenever the token happens to expire. The cost is one indexed primary-key lookup.

### Session restore and expiry

On page load, `AuthProvider` finds a token in `localStorage` and calls `GET /api/auth/me` to
validate it before rendering anything protected. Any 401 from any request — expired token, deleted
account, tampered signature — dispatches a `stm:unauthorized` window event that `AuthContext`
listens for and uses to clear the session, so the app can never sit in a half-authenticated state.

---

## 5. Authorization flow

Authorization is answered at two levels.

### Level 1 — role (route access)

```text
router.use(authenticate, requireAdmin);   // src/routes/admin.routes.ts
```

Mounted on the whole `/api/admin` router, so every admin endpoint is covered by construction — a new
route added to that file cannot accidentally be left unguarded.

```text
Request → authenticate ─── no/bad token ──▶ 401 Unauthorized
              │
              ▼
         requireRole('ADMIN') ─── role = STUDENT ──▶ 403 Forbidden
              │
              ▼
           controller
```

The distinction matters: **401** means "you are not authenticated"; **403** means "you are
authenticated, but not permitted".

### Level 2 — ownership (object access)

Role alone is not enough: two students both have the `STUDENT` role, but must not see each other's
work. Every task operation funnels through one guard in `task.service.ts`:

```ts
const getOwnedTask = async (taskId: string, user: AuthenticatedUser) => {
  const task = await taskRepository.findTaskById(taskId);

  if (!task) {
    throw ApiError.notFound('Task not found');
  }

  // Admins may inspect any task; students are restricted to their own.
  if (task.studentId !== user.id && user.role !== 'ADMIN') {
    throw ApiError.forbidden('You do not have permission to access this task');
  }

  return task;
};
```

`getTaskById`, `updateTask`, `updateTaskStatus` and `deleteTask` all call it first. There is exactly
one place this rule lives, so it cannot drift between endpoints.

List endpoints are protected differently — by construction rather than by check:

```ts
// The filter is forced, so a student's list can only ever contain their own rows.
const tasks = await taskRepository.findTasks({ ...query, studentId: user.id });
```

And creation forces ownership the same way:

```ts
studentId: user.id,   // from the JWT — never from the request body
createdBy: user.id,
```

### Why the frontend guards do not count

`AdminRoute` hides admin pages from students. That is a **usability** feature: it stops a student
navigating to a screen that would only show errors. It is not a security control, because anyone can
call the API directly with a valid student token. The Express middleware is the control, and
`tests/authorization.test.ts` asserts the 403s independently of the UI.

---

## 6. Database architecture

```text
┌────────────────────────────┐
│           User             │
├────────────────────────────┤
│ id            String  PK   │
│ name          String       │
│ studentId     String? UQ   │
│ email         String  UQ   │
│ passwordHash  String       │
│ role          String       │  "STUDENT" | "ADMIN"
│ createdAt     DateTime     │
│ updatedAt     DateTime     │
└──────┬──────────────┬──────┘
       │              │
       │ 1            │ 1
       │              │
       │ N            │ N
       │              │
┌──────▼──────────────▼──────┐
│           Task             │
├────────────────────────────┤
│ id            String  PK   │
│ title         String       │
│ description   String       │
│ subject       String       │
│ priority      String       │  "LOW" | "MEDIUM" | "HIGH"
│ status        String       │  "PENDING" | "COMPLETED"
│ dueDate       DateTime     │
│ createdAt     DateTime     │
│ updatedAt     DateTime     │
│ studentId     String  FK ──┼──▶ User.id   (owner)     [TaskOwner]
│ createdBy     String  FK ──┼──▶ User.id   (author)    [TaskCreator]
└────────────────────────────┘
```

Two distinct relations connect the same pair of tables:

- **`TaskOwner`** (`studentId`) — whose dashboard the task appears on.
- **`TaskCreator`** (`createdBy`) — who wrote it.

When they are equal, a student created their own to-do. When they differ, a professor assigned it.
That single comparison drives the "Assigned" badge, with no extra column needed.

Both foreign keys cascade on delete, so removing a user cannot orphan rows.

Full schema, indexes, migrations and seed detail: **[DATABASE.md](DATABASE.md)**.

---

## 7. Request lifecycle

Following `PATCH /api/tasks/:id/status` — a student marking an assignment complete:

```text
 1. Browser
    fetch('/api/tasks/abc123/status', { method: 'PATCH', body: '{"status":"COMPLETED"}' })
        │
 2. Axios request interceptor
    adds  Authorization: Bearer eyJhbGci...
        │
 3. Vite dev proxy   /api → http://localhost:5000
        │
 4. helmet()          security headers
 5. cors()            origin allow-list check
 6. express.json()    parse body (100 kb cap)
 7. morgan()          log the request
        │
 8. Router  /api → /tasks → PATCH /:id/status
        │
 9. authenticate      verify JWT, load user, set req.user
10. requireRole('STUDENT','ADMIN')
11. validate(idParamSchema, 'params')
12. validate(updateTaskStatusSchema)   body must be { status: 'PENDING' | 'COMPLETED' }
        │
13. task.controller.updateTaskStatus
        │  reads req.user and the validated body
        ▼
14. task.service.updateTaskStatus
        │  getOwnedTask(id, user)  ← 404 if missing, 403 if not the owner
        ▼
15. task.repository.updateTask
        │  prisma.task.update({ where: { id }, data: { status } })
        ▼
16. SQLite   UPDATE tasks SET status = ?, updatedAt = ? WHERE id = ?
        │
17. toTaskDTO(task)   adds derived isOverdue + assignedByAdmin
        │
18. sendSuccess(res, dto)   → { success: true, data: { ... } }
        │
19. Axios response → useTasks refetches → toast → UI updates
```

Any throw between steps 9 and 17 skips straight to the error handler (step 8 in the next section);
`asyncHandler` ensures rejected promises get there too.

---

## 8. Error handling

### Consistent envelope

```jsonc
// success
{ "success": true, "data": { }, "meta": { } }

// failure
{ "success": false, "message": "Task not found", "errors": { "title": "Title is required" } }
```

`sendSuccess` and `sendError` in `utils/response.ts` are the only functions that write a response
body, so the contract cannot drift.

### `ApiError`

Any layer can throw an error carrying its own status code:

```ts
throw ApiError.notFound('Task not found');
throw ApiError.forbidden('You do not have permission to access this task');
throw ApiError.conflict('An account with this email already exists');
```

No controller needs a `try/catch`. `asyncHandler` forwards rejections to Express, and the central
handler formats them.

### Central handler

`middleware/errorHandler.ts` normalises everything it can receive:

| Thrown value | Status | Client sees |
|---|---|---|
| `ApiError` | its own code | its own message (+ field errors) |
| `ZodError` | 400 | `Validation failed` + `{ field: message }` |
| Prisma `P2002` (unique violation) | 409 | `A record with this email already exists` |
| Prisma `P2025` (record not found) | 404 | `Resource not found` |
| Prisma `P2003` (FK violation) | 400 | `Related record does not exist` |
| `SyntaxError` from body parsing | 400 | `Malformed JSON in request body` |
| Anything else | 500 | `Internal server error` — nothing more |

```text
        throw
          │
          ▼
   asyncHandler catches ──▶ next(error)
          │
          ▼
   errorHandler
     ├─ headersSent?      → delegate to Express
     ├─ normalise         → { statusCode, message, errors }
     ├─ statusCode ≥ 500? → console.error(full error + stack)   ← server only
     └─ sendError(res, statusCode, message, errors)
```

**Stack traces never reach the browser.** Unrecognised errors collapse to a generic 500 message, and
the real detail is logged server-side. A test asserts that no response body matches a stack-trace
pattern.

### Client-side handling

The axios response interceptor converts every failure into an `ApiRequestError` with `message`,
`status` and optional `fieldErrors`, so components handle one error shape:

- **Network failure / timeout** → "Cannot reach the server. Is the backend running on port 5000?"
- **401** → dispatches `stm:unauthorized`; the session is cleared everywhere
- **400 with field errors** → mapped back onto the offending form inputs
- **409** → attached to the specific field (email or student ID) on the registration form

---

## 9. Validation

Validation happens **twice**, and the two are not equivalent.

```text
┌──────────────────────────────────────────────────────────────────┐
│  Client — React Hook Form + Zod                                  │
│  Purpose: fast feedback. Catches typos before a round trip.      │
│  Guarantee: NONE. Trivially bypassed with curl or devtools.      │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  Server — Zod via validate() middleware                          │
│  Purpose: the actual contract.                                   │
│  Guarantee: no handler ever runs on unvalidated input.           │
└──────────────────────────────────────────────────────────────────┘
```

### The `validate` middleware

```ts
validate(createTaskSchema)              // body
validate(taskQuerySchema, 'query')      // query string
validate(idParamSchema, 'params')       // route params
```

It **replaces** the request part with the parsed result, so controllers receive data that is already
trimmed, coerced and correctly typed — `dueDate` arrives as a real `Date`, `priority` as a narrowed
union. Unknown properties are stripped, which is why sending `{"studentId": "someone-else"}` to
`POST /api/tasks` is silently ignored rather than honoured.

### Rules enforced

| Field | Rule |
|---|---|
| `name` | 2–80 characters, trimmed |
| `studentId` | 2–30 characters, `[A-Za-z0-9._/-]` only, unique |
| `email` | valid address, lowercased, unique |
| `password` | 8–72 characters, at least one letter and one digit |
| `confirmPassword` | must equal `password` |
| `title` | 3–120 characters |
| `subject` | 2–60 characters |
| `description` | max 2000 characters, optional |
| `dueDate` | parseable date, transformed to `Date` |
| `priority` | `LOW` \| `MEDIUM` \| `HIGH` |
| `status` | `PENDING` \| `COMPLETED` |
| `sortBy` | `dueDate` \| `createdAt` \| `priority` \| `title` |
| `assignTo` | `"ALL"` or a non-empty array of student ids |

Constraining `sortBy` to a fixed set matters: the value reaches a Prisma `orderBy`, and an
allow-list is what keeps that safe.

Errors come back as `{ field: message }`, which the React forms apply directly to the right input.

---

## 10. Admin / student separation

The two roles are separated at **five** independent points. Removing any one of them still leaves
the data protected.

```text
1. DATABASE       users.role stores 'STUDENT' or 'ADMIN'
                  tasks.studentId records the true owner of every row

2. TOKEN          the JWT payload carries { sub, email, role }
                  signed, so the role cannot be edited client-side

3. MIDDLEWARE     authenticate  → 401 without a valid token
                  requireAdmin  → 403 without the ADMIN role
                  mounted on the entire /api/admin router

4. SERVICE        getOwnedTask() rejects cross-student access
                  list queries force studentId = req.user.id
                  create forces studentId from the JWT

5. UI             AdminRoute + role-aware navigation
                  ← convenience only, not a control
```

### Capability matrix

| Capability | Student | Admin |
|---|:---:|:---:|
| Register through the public form | ✔ | ✖ (seeded / provisioned) |
| View own tasks | ✔ | ✔ |
| View another student's task | ✖ **403** | ✔ |
| Create a task for self | ✔ | ✔ |
| Create a task for another student | ✖ | ✔ |
| Assign to the whole class | ✖ **403** | ✔ |
| Edit / delete own task | ✔ | ✔ |
| Edit / delete another student's task | ✖ **403** | ✔ |
| List all students | ✖ **403** | ✔ |
| View class statistics | ✖ **403** | ✔ |

### Assigning to a whole class

```text
POST /api/admin/tasks   { ..., assignTo: "ALL" }
        │
        ├─ authenticate + requireAdmin
        ├─ validate(adminCreateTaskSchema)
        │
        ├─ assignTo === 'ALL'
        │     └─ findAllStudentIds()          → [s1, s2, s3, s4]
        │        (400 if the class is empty)
        │
        └─ createTasksForStudents(ids, data)
              │
              └─ prisma.$transaction([
                   create({ ...data, studentId: s1, createdBy: admin.id }),
                   create({ ...data, studentId: s2, createdBy: admin.id }),
                   create({ ...data, studentId: s3, createdBy: admin.id }),
                   create({ ...data, studentId: s4, createdBy: admin.id }),
                 ])
```

Two properties matter here:

1. **One row per student.** A task is never stored with a null owner. Each student owns their copy
   and can complete it independently without affecting anyone else.
2. **All-or-nothing.** The `$transaction` means a partial fan-out cannot happen — either every
   student receives the assignment or none do.

When `assignTo` is an array instead, every id is verified to belong to an existing **student**
account first; unknown ids, or an admin's id, produce a 400 before anything is written.

---

## 11. Security considerations

### Implemented

| Area | Measure |
|---|---|
| Password storage | bcrypt, per-password salt, configurable cost (`BCRYPT_SALT_ROUNDS`, default 10) |
| Password exposure | `toUserDTO()` strips `passwordHash`; every user-returning endpoint goes through it |
| Token integrity | HMAC-signed JWT with `issuer` and expiry, both verified |
| Token freshness | User re-read from the database on every request |
| Role escalation | Registration hard-codes `STUDENT`; `role` in the body is ignored |
| Ownership forgery | `studentId` on create comes from the JWT, never the body |
| Object-level access | `getOwnedTask()` guards every single-task operation |
| Route-level access | `requireAdmin` mounted on the whole admin router |
| Input validation | Zod on body, query and params; parsed output replaces raw input |
| Injection | Prisma parameterises all SQL; no string concatenation anywhere |
| User enumeration | Identical 401 message for unknown account and wrong password |
| Brute force | `express-rate-limit`: 50 attempts / 15 min on the auth endpoints |
| Security headers | Helmet — CSP, `X-Frame-Options`, `nosniff`; `X-Powered-By` removed |
| CORS | Explicit origin allow-list from `CLIENT_URL` |
| Payload size | JSON capped at 100 kb |
| Information leakage | Central handler; stack traces logged server-side only |
| Secret management | `.env` git-ignored; `.env.example` holds placeholders; `JWT_SECRET` length-checked at boot |

### Known trade-off: token storage

The JWT is stored in `localStorage`.

| | `localStorage` (chosen) | `httpOnly` cookie |
|---|---|---|
| Survives refresh | ✔ | ✔ |
| Readable by XSS | ✖ **yes — the risk** | ✔ no |
| CSRF exposure | ✔ none | ✖ needs CSRF tokens |
| Works with `Bearer` header | ✔ natural | needs extra handling |

It was chosen because it matches the stateless `Authorization: Bearer` architecture and keeps the
demo simple to reason about. In a production deployment the right choice is an
`httpOnly; Secure; SameSite=Strict` cookie plus CSRF protection, combined with a short-lived access
token and a refresh token.

### Not implemented (and why)

- **Token revocation / refresh rotation** — would need a server-side blocklist or a token version
  column, reintroducing state the design deliberately avoids at this scale. `POST /api/auth/logout`
  exists as the hook where a blocklist would attach.
- **HTTPS** — a deployment concern, not an application one.
- **Password reset / email verification** — both require an email provider, which would break the
  project's "runs entirely offline" property.
- **Account lockout** — rate limiting covers the demo threat model; lockout adds a denial-of-service
  vector against legitimate users.
- **Audit log** — `createdBy`, `createdAt` and `updatedAt` provide basic provenance; a full audit
  trail is future work.
