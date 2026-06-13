# Phase 2 — Data Models & Persistence

> **Status:** Not Started
> **Depends On:** Phase 1 complete (Mongoose and Redis connected, `userId` context working)
> **Exit Criteria:** A journal entry can be written and retrieved with enforced schema validation and clean error responses.

---

## Objective

Define all Mongoose schemas, add server-side input validation, and implement the create/read API routes for `Users`, `Journals`, and `Insights`. No LLM calls in this phase — clean data in, clean data out.

---

## Scope

### 2.1 MongoDB Schemas — `server/models/`

One file per model.

---

#### `User` — `server/models/User.ts`

```ts
{
  userId:     string   // UUID v4, unique index
  name:       string   // max 60 chars, trimmed
  exam:       enum     // 'JEE'|'NEET'|'CUET'|'CAT'|'GATE'|'UPSC'|'Other'
  targetDate: Date?    // optional; must be >= today if provided
  createdAt:  Date     // auto (timestamps: true)
  updatedAt:  Date     // auto
}
```

- `userId` indexed `{ unique: true }`.
- `name` trimmed; reject if empty after trim or > 60 chars.
- `exam` validated against the enum — invalid → `400 { error: "Invalid exam type" }`.
- `targetDate`: if provided, must be a valid ISO date and >= today.

---

#### `Journal` — `server/models/Journal.ts`

```ts
{
  userId:          string    // UUID v4, indexed
  rawText:         string    // max 4000 chars, trimmed
  sentimentScore:  number?   // -1.0 to 1.0; null until LLM enriches (Phase 3)
  emotionalThemes: string[]  // default []
  triggers:        string[]  // default []
  distressLevel:   number    // 0–3, default 0
  createdAt:       Date      // auto
}
```

- `userId` indexed for per-user timeline queries.
- `rawText` trimmed; reject if empty or > 4000 chars.
- `sentimentScore` Mongoose constraints: `min: -1, max: 1`.
- `distressLevel` constraints: `min: 0, max: 3, default: 0`.
- `updatedAt: false` — entries are immutable after creation.

---

#### `Insight` — `server/models/Insight.ts`

```ts
{
  userId:          string  // UUID v4, indexed
  pattern:         string  // e.g. "Anxiety spikes before Physics Mocks"
  triggerLabel:    string  // e.g. "Physics Mock"
  outcomeLabel:    string  // e.g. "anxiety"
  confidence:      number  // 0.0–1.0
  supportingCount: number  // min 2
  firstObserved:   Date
  lastObserved:    Date
  createdAt:       Date
  updatedAt:       Date
}
```

- `confidence` constraints: `min: 0, max: 1`.
- `supportingCount` constraint: `min: 2`.

---

### 2.2 Validation Middleware — `server/middleware/validate.ts`

All validation errors return the same shape — never expose Mongoose internals:
```ts
{ error: string, field?: string }
```

Rules applied at every route boundary:
- Strip and reject empty strings after trim.
- Reject strings exceeding documented max lengths.
- `X-User-ID` header validated as UUID v4 — invalid → `400`.
- Mongoose `ValidationError` mapped to `{ error, field }` before leaving the server.
- Mongoose `CastError` → `400 { error: "Invalid identifier" }`.

---

### 2.3 API Routes — `server/routes/`

Mount all routes in `server/index.ts` under `/api`.

---

#### `POST /api/users`
- Body: `{ name, exam, targetDate? }`.
- `findOneAndUpdate({ userId }, update, { upsert: true, new: true })` — idempotent.
- Returns `201` on create, `200` on update. Omit `__v` and `_id` from response.

#### `GET /api/users/me`
- Returns user document or `404` if not found (client re-triggers onboarding).

#### `POST /api/journals`
- Validates and sanitises `rawText`.
- Creates `Journal` with `sentimentScore: null`, `emotionalThemes: []`, `triggers: []`, `distressLevel: 0`.
- Returns `201 { id, rawText, createdAt }`.
- LLM enrichment added in Phase 3 — this route stores only raw data.

#### `GET /api/journals`
- Query params: `limit` (default 20, max 100), `offset` (default 0).
- Returns `{ entries: [...], total: number }` sorted `createdAt` descending.
- Response fields: `id`, `rawText`, `sentimentScore`, `emotionalThemes`, `triggers`, `distressLevel`, `createdAt`.
- Never return `__v`, `_id`, or internal Mongoose fields.

#### `GET /api/insights`
- Returns insights with `confidence >= 0.5` and `supportingCount >= 2`.
- Sorted by `confidence` descending.

---

### 2.4 Global Error Handler — `server/middleware/errorHandler.ts`

Express error-handling middleware (4-argument signature). Register as the last middleware in `server/index.ts`.

- **Development:** logs full error, returns `{ error: error.message }`.
- **Production:** logs to console only, returns `{ error: "Something went wrong" }` — no stack traces in body.
- Mongoose `ValidationError` → `400` with human-readable message.
- Mongoose `CastError` → `400 { error: "Invalid identifier" }`.

---

### 2.5 Privacy Architecture

- `userId` is opaque — no PII embedded.
- `User` schema holds `name` (the only PII field in the system).
- `Journal` stores content linked to `User` only via the opaque `userId` — never by name or email.
- No email, phone, or device fingerprint collected.
- Create `PRIVACY.md` at the project root: one page, plain English — what is stored, where, and how.

---

## File Structure After Phase 2

```
server/
├── models/
│   ├── User.ts
│   ├── Journal.ts
│   └── Insight.ts
├── routes/
│   ├── health.ts         ← Phase 1
│   ├── users.ts          ← NEW
│   └── journals.ts       ← NEW
├── middleware/
│   ├── validateUserId.ts ← Phase 1
│   ├── validate.ts       ← NEW
│   └── errorHandler.ts   ← NEW
├── db/mongoose.ts
├── cache/redis.ts
├── llm/deepseekClient.ts
└── index.ts
```

---

## Acceptance Criteria

- [ ] `POST /api/users` creates a User document; calling again with the same `userId` updates, not duplicates.
- [ ] `POST /api/journals` with valid `rawText` returns `201`; `sentimentScore` is `null`.
- [ ] `POST /api/journals` with empty or >4000 char `rawText` returns `400` with a readable error.
- [ ] `GET /api/journals` returns entries newest-first; pagination works.
- [ ] A malformed `X-User-ID` returns `400`.
- [ ] No `__v` or `_id` in any response.
- [ ] Production error responses contain no stack traces.
- [ ] Unit tests cover all validation rules; `npm test` passes.

---

## CLAUDE.md Checklist

- Input validated at route boundary — not inside model methods.
- Error responses use `{ error, field? }` — no raw Mongoose errors exposed.
- Each model in its own file; each route group in its own file.
- No LLM calls in this phase.
- Tests runnable with `npm test` from project root.
