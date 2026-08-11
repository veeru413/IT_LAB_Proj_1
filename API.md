# API Reference

REST API for the Student Task / Assignment Manager.

**Base URL:** `http://localhost:5000/api`

---

## Conventions

### Response envelope

Every endpoint returns the same shape.

**Success**

```json
{
  "success": true,
  "data": { },
  "meta": { }
}
```

`meta` is optional and carries supplementary information (counts, summaries, subject lists).

**Failure**

```json
{
  "success": false,
  "message": "Task not found",
  "errors": { "title": "Title must be at least 3 characters long" }
}
```

`errors` is present only for validation failures and maps field names to messages.

### Authentication

Protected endpoints require a JSON Web Token:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Obtain one from `POST /api/auth/login` or `POST /api/auth/register`. The default lifetime is 7 days
(`JWT_EXPIRES_IN`).

### Status codes

| Code | Meaning | When |
|---|---|---|
| `200 OK` | Success | Read, update, delete |
| `201 Created` | Resource created | Register, create task, create assignment |
| `400 Bad Request` | Validation failed / malformed input | Bad field, invalid date, unknown student id |
| `401 Unauthorized` | Missing, invalid or expired token; bad credentials | No token, tampered token, wrong password |
| `403 Forbidden` | Authenticated but not permitted | Student hitting an admin route, or another student's task |
| `404 Not Found` | Resource or route does not exist | Unknown task id, unknown path |
| `409 Conflict` | Uniqueness violation | Duplicate email or student ID |
| `429 Too Many Requests` | Rate limit exceeded | > 50 auth attempts in 15 minutes |
| `500 Internal Server Error` | Unexpected failure | Genuine bug (never leaks details) |

### Task object

Returned by every task endpoint.

```json
{
  "id": "clx8k2p9a0001abcdef",
  "title": "DBMS Normalization Worksheet",
  "description": "Normalise the supplied relation up to BCNF.",
  "subject": "DBMS",
  "priority": "HIGH",
  "status": "PENDING",
  "dueDate": "2026-08-15T23:59:00.000Z",
  "createdAt": "2026-08-01T10:12:33.000Z",
  "updatedAt": "2026-08-01T10:12:33.000Z",
  "studentId": "clx8k2p9a0000abcdef",
  "createdBy": "clx8k2adm0000abcdef",
  "isOverdue": false,
  "assignedByAdmin": true
}
```

| Field | Notes |
|---|---|
| `priority` | `LOW` \| `MEDIUM` \| `HIGH` |
| `status` | `PENDING` \| `COMPLETED` |
| `studentId` | The owner of the task |
| `createdBy` | Who authored it — an admin id means it was assigned |
| `isOverdue` | **Derived, not stored.** `true` when `status = PENDING` and `dueDate < now` |
| `assignedByAdmin` | **Derived.** `true` when `createdBy !== studentId` |
| `student` | Present on admin endpoints: `{ id, name, studentId, email }` |
| `creator` | Present on admin endpoints: `{ id, name, role }` |

### User object

```json
{
  "id": "clx8k2p9a0000abcdef",
  "name": "Aarav Sharma",
  "email": "student1@college.local",
  "studentId": "CS21B001",
  "role": "STUDENT",
  "createdAt": "2026-08-01T10:00:00.000Z",
  "updatedAt": "2026-08-01T10:00:00.000Z"
}
```

`passwordHash` is **never** included in any response.

---

# Endpoint index

| Method | Endpoint | Auth | Role |
|---|---|:---:|---|
| GET | [`/api/health`](#get-apihealth) | – | – |
| POST | [`/api/auth/register`](#post-apiauthregister) | – | – |
| POST | [`/api/auth/login`](#post-apiauthlogin) | – | – |
| GET | [`/api/auth/me`](#get-apiauthme) | ✔ | any |
| POST | [`/api/auth/logout`](#post-apiauthlogout) | ✔ | any |
| GET | [`/api/tasks`](#get-apitasks) | ✔ | any |
| GET | [`/api/tasks/summary`](#get-apitaskssummary) | ✔ | any |
| GET | [`/api/tasks/:id`](#get-apitasksid) | ✔ | owner or admin |
| POST | [`/api/tasks`](#post-apitasks) | ✔ | any |
| PUT | [`/api/tasks/:id`](#put-apitasksid) | ✔ | owner or admin |
| PATCH | [`/api/tasks/:id/status`](#patch-apitasksidstatus) | ✔ | owner or admin |
| DELETE | [`/api/tasks/:id`](#delete-apitasksid) | ✔ | owner or admin |
| GET | [`/api/admin/statistics`](#get-apiadminstatistics) | ✔ | **ADMIN** |
| GET | [`/api/admin/students`](#get-apiadminstudents) | ✔ | **ADMIN** |
| GET | [`/api/admin/students/:id`](#get-apiadminstudentsid) | ✔ | **ADMIN** |
| GET | [`/api/admin/tasks`](#get-apiadmintasks) | ✔ | **ADMIN** |
| POST | [`/api/admin/tasks`](#post-apiadmintasks) | ✔ | **ADMIN** |

---

## Health

### `GET /api/health`

Liveness probe.

**Authentication:** not required
**Role:** none

**Response `200`**

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "student-task-manager-api",
    "timestamp": "2026-08-10T12:00:00.000Z"
  }
}
```

---

# Authentication

## `POST /api/auth/register`

Creates a new **student** account and returns a token. The role is always `STUDENT` — supplying
`"role": "ADMIN"` in the body has no effect.

**Authentication:** not required
**Role:** none
**Rate limited:** 50 requests / 15 minutes

**Request body**

| Field | Type | Rules |
|---|---|---|
| `name` | string | required, 2–80 characters |
| `studentId` | string | required, 2–30 characters, `[A-Za-z0-9._/-]`, unique |
| `email` | string | required, valid email, unique (lowercased) |
| `password` | string | required, 8–72 characters, ≥1 letter and ≥1 digit |
| `confirmPassword` | string | required, must equal `password` |

```json
{
  "name": "Veerendra Patil",
  "studentId": "CS21B045",
  "email": "veerendra@college.local",
  "password": "Secure123",
  "confirmPassword": "Secure123"
}
```

**Response `201`**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx8k2p9a0000abcdef",
      "name": "Veerendra Patil",
      "email": "veerendra@college.local",
      "studentId": "CS21B045",
      "role": "STUDENT",
      "createdAt": "2026-08-10T12:00:00.000Z",
      "updatedAt": "2026-08-10T12:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errors**

`400` — validation failed

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "email": "Enter a valid email address",
    "password": "Password must be at least 8 characters long",
    "confirmPassword": "Passwords do not match"
  }
}
```

`409` — email already registered

```json
{ "success": false, "message": "An account with this email already exists" }
```

`409` — student ID already registered

```json
{ "success": false, "message": "An account with this student ID already exists" }
```

---

## `POST /api/auth/login`

**Authentication:** not required
**Role:** none
**Rate limited:** 50 requests / 15 minutes

**Request body**

```json
{
  "email": "student1@college.local",
  "password": "Student@123"
}
```

**Response `200`**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx8k2p9a0000abcdef",
      "name": "Aarav Sharma",
      "email": "student1@college.local",
      "studentId": "CS21B001",
      "role": "STUDENT",
      "createdAt": "2026-08-01T10:00:00.000Z",
      "updatedAt": "2026-08-01T10:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Errors**

`401` — wrong password **or** unknown account (deliberately identical, to prevent account
enumeration)

```json
{ "success": false, "message": "Invalid email or password" }
```

`400` — malformed input

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": { "email": "Enter a valid email address" }
}
```

---

## `GET /api/auth/me`

Returns the currently authenticated user. Used on page load to validate a stored token.

**Authentication:** required
**Role:** `STUDENT` or `ADMIN`

**Response `200`**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "clx8k2p9a0000abcdef",
      "name": "Aarav Sharma",
      "email": "student1@college.local",
      "studentId": "CS21B001",
      "role": "STUDENT",
      "createdAt": "2026-08-01T10:00:00.000Z",
      "updatedAt": "2026-08-01T10:00:00.000Z"
    }
  }
}
```

**Errors**

`401` — no token

```json
{ "success": false, "message": "Authentication required. Please log in." }
```

`401` — expired token

```json
{ "success": false, "message": "Session expired. Please log in again." }
```

`401` — tampered token

```json
{ "success": false, "message": "Invalid authentication token" }
```

`401` — account deleted since the token was issued

```json
{ "success": false, "message": "Account no longer exists. Please log in again." }
```

---

## `POST /api/auth/logout`

Acknowledges the end of a session. JWTs are stateless, so the authoritative action is the client
discarding its token; this endpoint exists so the flow is explicit and a token blocklist could be
added later without changing the client.

**Authentication:** required
**Role:** `STUDENT` or `ADMIN`

**Response `200`**

```json
{
  "success": true,
  "data": { "message": "Logged out successfully" }
}
```

---

# Tasks

All task endpoints are scoped to the authenticated user. A student can only ever read or modify
their own tasks; an admin may act on any task.

## `GET /api/tasks`

Lists the caller's tasks with optional search, filtering and sorting.

**Authentication:** required
**Role:** `STUDENT` or `ADMIN`

**Query parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `status` | `PENDING` \| `COMPLETED` | – | Filter by status |
| `priority` | `LOW` \| `MEDIUM` \| `HIGH` | – | Filter by priority |
| `subject` | string | – | Exact subject match |
| `search` | string | – | Case-insensitive match on title, subject **or** description |
| `overdue` | `true` \| `false` | – | `true` returns only pending, past-due tasks |
| `sortBy` | `dueDate` \| `createdAt` \| `priority` \| `title` | `dueDate` | Sort field |
| `order` | `asc` \| `desc` | `asc` | Sort direction |

**Examples**

```http
GET /api/tasks?status=PENDING
GET /api/tasks?priority=HIGH
GET /api/tasks?subject=DBMS
GET /api/tasks?search=database
GET /api/tasks?sortBy=dueDate&order=asc
GET /api/tasks?status=PENDING&priority=HIGH&sortBy=priority&order=desc
```

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "id": "clx8k2p9a0001abcdef",
      "title": "DBMS Normalization Worksheet",
      "description": "Normalise the supplied relation up to BCNF.",
      "subject": "DBMS",
      "priority": "HIGH",
      "status": "PENDING",
      "dueDate": "2026-08-08T23:59:00.000Z",
      "createdAt": "2026-08-01T10:12:33.000Z",
      "updatedAt": "2026-08-01T10:12:33.000Z",
      "studentId": "clx8k2p9a0000abcdef",
      "createdBy": "clx8k2adm0000abcdef",
      "isOverdue": true,
      "assignedByAdmin": true
    }
  ],
  "meta": {
    "count": 1,
    "summary": { "total": 5, "pending": 4, "completed": 1, "overdue": 1 },
    "subjects": ["Computer Networks", "DBMS", "Data Structures", "Machine Learning"]
  }
}
```

> `meta.summary` always reflects **all** the caller's tasks, not just the filtered page, so the
> dashboard counters stay correct while a filter is applied. `meta.subjects` populates the subject
> dropdown.

**Errors**

`400` — invalid parameter

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": { "sortBy": "Invalid enum value. Expected 'dueDate' | 'createdAt' | 'priority' | 'title'" }
}
```

`401` — not authenticated

---

## `GET /api/tasks/summary`

Dashboard payload: counters plus the five most urgent pending tasks.

**Authentication:** required
**Role:** `STUDENT` or `ADMIN`

**Response `200`**

```json
{
  "success": true,
  "data": {
    "summary": { "total": 5, "pending": 4, "completed": 1, "overdue": 1 },
    "upcoming": [ { "id": "clx...", "title": "DBMS Normalization Worksheet", "...": "..." } ]
  }
}
```

---

## `GET /api/tasks/:id`

**Authentication:** required
**Role:** the task's owner, or any `ADMIN`

**Response `200`** — a single task object.

**Errors**

`404` — no such task

```json
{ "success": false, "message": "Task not found" }
```

`403` — the task belongs to a different student

```json
{ "success": false, "message": "You do not have permission to access this task" }
```

---

## `POST /api/tasks`

Creates a task **owned by the caller**.

**Authentication:** required
**Role:** `STUDENT` or `ADMIN`

**Request body**

| Field | Type | Rules |
|---|---|---|
| `title` | string | required, 3–120 characters |
| `description` | string | optional, max 2000 characters |
| `subject` | string | required, 2–60 characters |
| `dueDate` | string | required, a valid date (`2026-08-15` or ISO 8601) |
| `priority` | enum | optional, `LOW` \| `MEDIUM` \| `HIGH`, defaults to `MEDIUM` |

```json
{
  "title": "DBMS Assignment",
  "description": "Complete normalization questions",
  "subject": "DBMS",
  "dueDate": "2026-08-15",
  "priority": "HIGH"
}
```

> **`studentId` and `status` are not accepted.** The owner is always taken from the JWT and new
> tasks always start as `PENDING`. Sending either field is silently ignored — this is what stops a
> student pushing work onto somebody else's dashboard.

**Response `201`** — the created task object, with `"status": "PENDING"` and `studentId` set to the
caller.

**Errors**

`400` — validation failed

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {
    "title": "Title must be at least 3 characters long",
    "subject": "Subject must be at least 2 characters long",
    "dueDate": "Enter a valid due date",
    "priority": "Priority must be LOW, MEDIUM or HIGH"
  }
}
```

`401` — not authenticated

---

## `PUT /api/tasks/:id`

Updates one or more fields. All fields are optional, but at least one must be present.

**Authentication:** required
**Role:** the task's owner, or any `ADMIN`

**Request body** — any subset of:

| Field | Rules |
|---|---|
| `title` | 3–120 characters |
| `description` | max 2000 characters |
| `subject` | 2–60 characters |
| `dueDate` | valid date |
| `priority` | `LOW` \| `MEDIUM` \| `HIGH` |
| `status` | `PENDING` \| `COMPLETED` |

```json
{ "title": "DBMS Assignment (revised)", "priority": "MEDIUM", "status": "COMPLETED" }
```

**Response `200`** — the updated task object.

**Errors**

`400` — empty body

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": { "root": "Provide at least one field to update" }
}
```

`403` — another student's task · `404` — unknown id

---

## `PATCH /api/tasks/:id/status`

Dedicated toggle for completing or reopening a task.

**Authentication:** required
**Role:** the task's owner, or any `ADMIN`

**Request body**

```json
{ "status": "COMPLETED" }
```

Send `{ "status": "PENDING" }` to move a completed task back to pending.

**Response `200`** — the updated task object.

**Errors**

`400` — invalid value

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": { "status": "Status must be PENDING or COMPLETED" }
}
```

`403` — another student's task · `404` — unknown id

---

## `DELETE /api/tasks/:id`

**Authentication:** required
**Role:** the task's owner, or any `ADMIN`

**Response `200`**

```json
{
  "success": true,
  "data": { "message": "Task deleted successfully" }
}
```

**Errors**

`403` — another student's task · `404` — unknown id

---

# Admin

Every endpoint below is mounted behind `authenticate` **and** `requireAdmin`. A valid student token
receives `403 Forbidden`:

```json
{ "success": false, "message": "You do not have permission to access this resource" }
```

A request with no token at all receives `401 Unauthorized` instead.

---

## `GET /api/admin/statistics`

Everything the admin dashboard needs, in one request.

**Authentication:** required
**Role:** `ADMIN`

**Response `200`**

```json
{
  "success": true,
  "data": {
    "statistics": {
      "totalStudents": 4,
      "totalAssignments": 19,
      "pendingAssignments": 14,
      "completedAssignments": 5,
      "overdueAssignments": 4,
      "completionRate": 26
    },
    "recentTasks": [
      {
        "id": "clx...",
        "title": "Compiler Design Lab - Lexical Analyser",
        "subject": "Compiler Design",
        "priority": "HIGH",
        "status": "PENDING",
        "dueDate": "2026-08-17T23:59:00.000Z",
        "isOverdue": false,
        "assignedByAdmin": false,
        "student": {
          "id": "clx...",
          "name": "Rahul Verma",
          "studentId": "CS21B003",
          "email": "student3@college.local"
        },
        "creator": { "id": "clx...", "name": "Rahul Verma", "role": "STUDENT" }
      }
    ],
    "studentProgress": [
      {
        "id": "clx...",
        "name": "Aarav Sharma",
        "email": "student1@college.local",
        "studentId": "CS21B001",
        "role": "STUDENT",
        "createdAt": "2026-08-01T10:00:00.000Z",
        "updatedAt": "2026-08-01T10:00:00.000Z",
        "totalTasks": 5,
        "completedTasks": 1,
        "pendingTasks": 4,
        "overdueTasks": 1,
        "completionRate": 20
      }
    ]
  }
}
```

`recentTasks` returns the 8 most recently created assignments. `completionRate` is a whole
percentage.

---

## `GET /api/admin/students`

All student accounts with their task counters. Admin accounts are excluded.

**Authentication:** required
**Role:** `ADMIN`

**Query parameters**

| Parameter | Type | Description |
|---|---|---|
| `search` | string | Matches name, email or student ID |

```http
GET /api/admin/students
GET /api/admin/students?search=CS21B002
```

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "id": "clx8k2p9a0000abcdef",
      "name": "Aarav Sharma",
      "email": "student1@college.local",
      "studentId": "CS21B001",
      "role": "STUDENT",
      "createdAt": "2026-08-01T10:00:00.000Z",
      "updatedAt": "2026-08-01T10:00:00.000Z",
      "totalTasks": 5,
      "completedTasks": 1,
      "pendingTasks": 4,
      "overdueTasks": 1,
      "completionRate": 20
    }
  ],
  "meta": { "count": 4 }
}
```

---

## `GET /api/admin/students/:id`

One student's profile together with their complete task list.

**Authentication:** required
**Role:** `ADMIN`

**Response `200`**

```json
{
  "success": true,
  "data": {
    "student": {
      "id": "clx8k2p9a0000abcdef",
      "name": "Aarav Sharma",
      "email": "student1@college.local",
      "studentId": "CS21B001",
      "role": "STUDENT",
      "createdAt": "2026-08-01T10:00:00.000Z",
      "updatedAt": "2026-08-01T10:00:00.000Z",
      "totalTasks": 5,
      "completedTasks": 1,
      "pendingTasks": 4,
      "overdueTasks": 1,
      "completionRate": 20
    },
    "tasks": [ { "id": "clx...", "title": "...", "...": "..." } ]
  }
}
```

**Errors**

`404` — the id does not belong to a student

```json
{ "success": false, "message": "Student not found" }
```

---

## `GET /api/admin/tasks`

Every task in the system, across all students.

**Authentication:** required
**Role:** `ADMIN`

**Query parameters** — all of `GET /api/tasks`, plus:

| Parameter | Type | Description |
|---|---|---|
| `studentId` | string | Restrict to one student |

```http
GET /api/admin/tasks
GET /api/admin/tasks?studentId=clx8k2p9a0000abcdef
GET /api/admin/tasks?status=PENDING&priority=HIGH
GET /api/admin/tasks?search=assignment&sortBy=dueDate&order=asc
```

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "id": "clx...",
      "title": "DBMS Normalization Worksheet",
      "subject": "DBMS",
      "priority": "HIGH",
      "status": "PENDING",
      "dueDate": "2026-08-08T23:59:00.000Z",
      "studentId": "clx...",
      "createdBy": "clxadmin...",
      "isOverdue": true,
      "assignedByAdmin": true,
      "student": {
        "id": "clx...",
        "name": "Aarav Sharma",
        "studentId": "CS21B001",
        "email": "student1@college.local"
      },
      "creator": { "id": "clxadmin...", "name": "Dr. Meera Krishnan", "role": "ADMIN" }
    }
  ],
  "meta": {
    "count": 19,
    "subjects": ["Cloud Computing", "Compiler Design", "Computer Networks", "DBMS"]
  }
}
```

Admin listings include the nested `student` and `creator` objects so the UI can show who owns each
task and who assigned it.

---

## `POST /api/admin/tasks`

Creates an assignment and hands it to one student, several students, or the entire class.

**Authentication:** required
**Role:** `ADMIN`

**Request body**

| Field | Type | Rules |
|---|---|---|
| `title` | string | required, 3–120 characters |
| `description` | string | optional, max 2000 characters |
| `subject` | string | required, 2–60 characters |
| `dueDate` | string | required, valid date |
| `priority` | enum | optional, `LOW` \| `MEDIUM` \| `HIGH`, defaults to `MEDIUM` |
| `assignTo` | `"ALL"` \| `string[]` | required — the literal `"ALL"`, or a non-empty array of student ids |

**Assign to specific students**

```json
{
  "title": "Compiler Design Lab 4",
  "description": "Implement a recursive descent parser.",
  "subject": "Compiler Design",
  "dueDate": "2026-09-01",
  "priority": "HIGH",
  "assignTo": ["clx8k2p9a0000abcdef", "clx8k2p9a0001abcdef"]
}
```

**Assign to the whole class**

```json
{
  "title": "Mid-semester Review",
  "description": "Revise units 1 to 4 before the internal exam.",
  "subject": "Operating Systems",
  "dueDate": "2026-09-10",
  "priority": "MEDIUM",
  "assignTo": "ALL"
}
```

**Response `201`**

```json
{
  "success": true,
  "data": {
    "created": 4,
    "tasks": [
      { "id": "clx...", "studentId": "clxA...", "createdBy": "clxAdmin...", "status": "PENDING", "assignedByAdmin": true, "...": "..." },
      { "id": "clx...", "studentId": "clxB...", "createdBy": "clxAdmin...", "status": "PENDING", "assignedByAdmin": true, "...": "..." },
      { "id": "clx...", "studentId": "clxC...", "createdBy": "clxAdmin...", "status": "PENDING", "assignedByAdmin": true, "...": "..." },
      { "id": "clx...", "studentId": "clxD...", "createdBy": "clxAdmin...", "status": "PENDING", "assignedByAdmin": true, "...": "..." }
    ]
  },
  "meta": { "message": "Assignment created for 4 students" }
}
```

> **One row per student.** Selecting `"ALL"` creates a separate task owned by each student, inside a
> single database transaction — so the operation either fully succeeds or writes nothing. A task is
> never stored with a null `studentId`. Each student can then complete their own copy independently.

**Errors**

`400` — one or more ids are unknown, or belong to an admin rather than a student

```json
{ "success": false, "message": "One or more selected students could not be found" }
```

`400` — `"ALL"` was selected but no students are registered

```json
{ "success": false, "message": "There are no registered students to assign this task to" }
```

`400` — empty selection

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": { "assignTo": "Select at least one student" }
}
```

`403` — the caller is not an admin

---

# Error reference

## `400 Bad Request`

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": { "title": "Title must be at least 3 characters long" }
}
```

## `401 Unauthorized`

```json
{ "success": false, "message": "Authentication required. Please log in." }
```

## `403 Forbidden`

```json
{ "success": false, "message": "You do not have permission to access this resource" }
```

## `404 Not Found`

```json
{ "success": false, "message": "Route not found: GET /api/unknown" }
```

## `409 Conflict`

```json
{ "success": false, "message": "An account with this email already exists" }
```

## `429 Too Many Requests`

```json
{ "success": false, "message": "Too many attempts. Please try again later." }
```

## `500 Internal Server Error`

```json
{ "success": false, "message": "Internal server error" }
```

Stack traces and internal details are logged on the server and **never** included in the response.

---

# Trying the API from a terminal

```bash
# 1. Log in and capture the token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student1@college.local","password":"Student@123"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# 2. List your tasks
curl -s http://localhost:5000/api/tasks -H "Authorization: Bearer $TOKEN"

# 3. Create one
curl -s -X POST http://localhost:5000/api/tasks \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"New assignment","subject":"DBMS","dueDate":"2026-12-01","priority":"HIGH"}'

# 4. Confirm a student is blocked from the admin API  → 403
curl -s -o /dev/null -w "%{http_code}\n" \
  http://localhost:5000/api/admin/students -H "Authorization: Bearer $TOKEN"

# 5. Log in as the admin and assign to the whole class
ADMIN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@college.local","password":"Admin@123"}' \
  | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

curl -s -X POST http://localhost:5000/api/admin/tasks \
  -H "Authorization: Bearer $ADMIN" -H "Content-Type: application/json" \
  -d '{"title":"Class assignment","subject":"OS","dueDate":"2026-12-10","priority":"MEDIUM","assignTo":"ALL"}'
```

On Windows PowerShell:

```powershell
$login = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post `
  -Body (@{ email='student1@college.local'; password='Student@123' } | ConvertTo-Json) `
  -ContentType "application/json"

$headers = @{ Authorization = "Bearer $($login.data.token)" }
Invoke-RestMethod -Uri "http://localhost:5000/api/tasks" -Headers $headers
```
