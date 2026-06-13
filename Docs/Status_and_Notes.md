# Status & Notes

## Phase 1 — Foundation & Setup (Done)

- Single-package Vite + React + Express + TypeScript scaffold created
- Dev scripts wired: `npm run dev`, `build`, `start`, `lint`, `test`
- ESLint + Prettier configured; lint passes with zero errors
- `.env.example` added with `REDIS_KEY_PREFIX` for shared Redis namespacing
- MongoDB connection module with typed error handling
- Redis singleton via `ioredis` using Docker instance (`redis://localhost:6379`)
- All Redis keys prefixed (`promptwars:foundation:`) — session/profile/rate-limit patterns defined
- DeepSeek client configured via OpenAI-compatible SDK
- `GET /api/health` checks Mongo, Redis, DeepSeek independently
- `POST /api/users` with UUID v4 `X-User-ID` validation
- Landing page: tagline, privacy, crisis helplines, Get Started CTA
- Journal page: UUID generated on first visit, stored in `localStorage`
- Onboarding modal: name/exam/targetDate; skips on return visit
- Unit tests for UUID validation (3 passing)
- Build succeeds (`vite build` + server `tsc`)

## Phase 2 — Data Models & Persistence (Done)

- Mongoose models: `User`, `Journal`, `Insight` with schema constraints and indexes
- Shared validation helpers in `server/middleware/validate.ts` — trimmed strings, exam enum, future dates, pagination
- Global error handler maps Mongoose `ValidationError`/`CastError` to `{ error, field? }`; production hides internals
- `POST /api/users` upserts by `X-User-ID` (201 create / 200 update); `GET /api/users/me` returns profile or 404
- `POST /api/journals` stores raw text with `sentimentScore: null`; `GET /api/journals` paginates newest-first
- `GET /api/insights` filters by `confidence >= 0.5` and `supportingCount >= 2`
- API responses omit `_id` and `__v`; journal/insight entries expose `id` string
- `PRIVACY.md` added at project root
- Unit tests: 20 passing (validation rules, error handler, UUID checks)

## Validation Notes

- `npm run dev` starts Vite (5173) + Express (3001) without errors
- Health returns `mongo: true`, `redis: true` against local Docker Redis + Mongo
- DeepSeek health requires a valid `DEEPSEEK_API_KEY` in `.env` (placeholder fails as expected)
- Temp MongoDB container (`wellness-mongo-test`) started on port 27017 for local dev
- `npm run lint` passes with zero errors
- `npm test` passes (20 tests)
- `npm run build` succeeds

## Next

- Phase 3: Conversational Core (DeepSeek pipeline: empathetic reply + sentiment extraction)
