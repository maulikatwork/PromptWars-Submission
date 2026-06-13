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

## Phase 3 — Conversational Core (Done)

- System prompts in `server/llm/prompts.ts`: `PERSONA_SYSTEM_PROMPT`, `EXTRACTOR_SYSTEM_PROMPT` with student context injection
- Shared LLM types in `server/types/llm.ts`: `SentimentResult`, `ConversationMessage`
- LLM pipeline in `server/llm/pipeline.ts`: parallel DeepSeek calls via `Promise.all`, JSON parse fallback, sentiment clamping, Journal update
- Crisis guardrail in `server/llm/guardrail.ts`: appends Tele-MANAS/KIRAN block at `distressLevel: 3`; logs moderate distress at level 2
- `POST /api/chat` in `server/routes/chat.ts`: validates `rawText`, loads user profile, creates Journal, runs pipeline, returns `{ reply, entryId, distressLevel }`
- DeepSeek failures mapped to `503 { error: "AI service temporarily unavailable" }` — no internal details exposed
- Unit tests: 9 new tests (JSON parse fallback, sentiment/distress clamping, crisis block injection)

## Phase 4 — Session Memory & Context (Done)

- Session context in `server/cache/sessionContext.ts`: Redis list (`LPUSH` + `LTRIM` pipeline), 20-message cap, 4-hour TTL, chronological history for LLM
- Profile cache in `server/cache/profileCache.ts`: cache-aside with 24-hour TTL; Redis read/write failures fall through to MongoDB
- Rate limiter in `server/cache/rateLimiter.ts`: atomic `INCR` + 60s window; 20 requests/minute per user
- `POST /api/chat` updated: rate limit → cached profile → session history → pipeline → guardrail → append user/assistant messages after reply
- `POST /api/users` calls `invalidateProfileCache` after successful upsert so next chat re-reads MongoDB
- `429` with `Retry-After: 60` when rate limit exceeded
- Unit tests: 12 new tests (session trim/order, malformed entry skip, profile cache hit/miss/fallback, rate limit blocking)

## Phase 5 — Conversational Interface (Done)

- Landing page completed: mobile-first layout, privacy/crisis cards, accessible CTA to `/journal`
- Onboarding modal completed: field-level validation, focus on mount, submit disabled until name + exam filled, privacy note, `POST /api/users` + `localStorage` persistence
- Journal chat UI in `src/pages/JournalPage.tsx`: full-viewport layout (`100dvh`), sticky header, scrollable message list, opening greeting from profile
- Components: `MessageBubble`, `ThinkingIndicator`, `InputBar`, `CrisisBanner`, `StickyHeader`
- Voice input via `useSpeechRecognition` hook: browser-native Web Speech API (`en-IN`), mic hidden when unsupported, inline error on microphone failure
- `src/api/chatApi.ts`: typed `sendMessage` wrapper with `ChatApiError` on non-2xx
- Chat flow: append user message → `POST /api/chat` → append assistant reply; loading state disables send; inline error on failure
- Crisis banner shown at `distressLevel >= 2`; dismissible at level 2, persistent at level 3
- Shared types: `src/types/messages.ts`, `src/types/user.ts`
- Unit tests: 3 new tests (`chatApi` success, server error, non-JSON fallback)

## Validation Notes

- `npm run dev` starts Vite (5173) + Express (3001) without errors
- Health returns `mongo: true`, `redis: true` against local Docker Redis + Mongo
- DeepSeek health requires a valid `DEEPSEEK_API_KEY` in `.env` (placeholder fails as expected)
- Temp MongoDB container (`wellness-mongo-test`) started on port 27017 for local dev
- `npm run lint` passes with zero errors
- `npm test` passes (44 tests)
- `npm run build` succeeds
- Live `POST /api/chat` testing requires valid `DEEPSEEK_API_KEY` and an onboarded user (`POST /api/users` first)
- Multi-turn context: second chat message should reference prior turn without re-stating it (verify with Redis running)
- Rate limit: >20 requests/minute from same `X-User-ID` returns `429` with `Retry-After: 60`
- Journal UI: opening greeting appears after onboarding; send shows thinking indicator then AI reply
- Voice input: mic button hidden in browsers without `SpeechRecognition`; supported browsers append transcript to textarea
- Crisis banner: verify with distress-level responses (level 2 dismissible, level 3 persistent)
- Responsive layout: verify landing and journal at 375px, 768px, and 1280px

## Next

- Phase 6: Insight Engine & Dashboard (`/dashboard` route, sentiment trends, theme cards)
