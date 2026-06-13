# Phase 7 — Safety, Hardening & Polish

> **Status:** Not Started
> **Depends On:** Phase 6 complete (all features end-to-end functional)
> **Exit Criteria:** Guardrails fire on test inputs, core utilities have passing tests, `npm run build` succeeds, the app is demo-ready across all breakpoints.

---

## Objective

Final phase: tighten safety guardrails, harden security, add meaningful test coverage, and polish the UI. Every competition criterion — security, accessibility, testing, code quality, alignment — gets a final verification pass here.

---

## Scope

### 7.1 Safety Guardrails — Tests

Create `server/llm/pipeline.test.ts`. Use `vi.mock` to inject pre-written DeepSeek responses — no real API calls in unit tests.

```ts
it("classifies self-harm ideation as distressLevel 3")
it("classifies hopeless language as distressLevel 3")
it("classifies mild stress as distressLevel 1 or lower")
it("appends crisis block to reply when distressLevel is 3")
it("does not append crisis block when distressLevel is 0")
it("crisis block contains Tele-MANAS number 14416")
it("crisis block contains KIRAN number 1800-599-0019")
it("malformed extractor JSON falls back to neutral defaults without throwing")
it("extractor failure still returns companion reply")
```

Also verify in the pipeline implementation:
- Malformed `distressLevel` (e.g., `"high"`) is clamped to `0` — no throw.
- Both calls fail → route returns `503` — no stack trace in body.

---

### 7.2 Security Hardening

#### 7.2.1 HTTP Security Headers

```bash
npm install helmet
```

Apply in `server/index.ts` before all routes:

```ts
import helmet from 'helmet'
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],  // Tailwind requires this
      imgSrc:     ["'self'", "data:"],
      connectSrc: ["'self'"],
    }
  }
}))
```

Helmet also sets `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` by default. Confirm with `curl -I http://localhost:3001/api/health`.

#### 7.2.2 CORS Lockdown

```ts
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGIN
    : 'http://localhost:5173',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-User-ID'],
}))
```

Add `ALLOWED_ORIGIN=` to `.env.example`.

#### 7.2.3 Secret Hygiene Audit

```bash
grep -rn 'DEEPSEEK_API_KEY\|MONGODB_URI\|REDIS_URL' \
  --include='*.ts' --include='*.tsx' --include='*.json' . \
  | grep -v '.env.example' | grep -v 'process.env'
```

Any hit not behind `process.env.*` is a leak — fix before demo.

#### 7.2.4 Dependency Audit

```bash
npm audit --audit-level=high
```

Fix all `high` and `critical` findings.

---

### 7.3 Test Suite

All tests run with `npm test` (Vitest, single command from project root).

| File | Tests |
|---|---|
| `server/llm/pipeline.test.ts` | Guardrails, JSON fallback, crisis block, distress clamping |
| `server/services/insightEngine.test.ts` | Confidence formula, trigger correlation, streak, prune |
| `server/cache/sessionContext.test.ts` | Append trims to 20, chronological order, TTL reset |
| `server/cache/rateLimiter.test.ts` | Allows up to limit, blocks at limit+1 |
| `server/middleware/validate.test.ts` | UUID check, rawText length, empty string rejection |
| `server/cache/profileCache.test.ts` | Cache hit skips MongoDB, miss warms cache |
| `src/hooks/useSpeechRecognition.test.ts` | `isSupported: false` when API absent |
| `src/components/OnboardingModal.test.ts` | Submit disabled with empty name |
| `src/utils/sentimentLabel.test.ts` | `>= 0.3` → "Positive", `<= -0.3` → "Stressed", else "Neutral" |

Use `vi.mock` for Redis and Mongoose in server tests — no real DB connections in unit tests.

All tests must pass with zero failures before marking Phase 7 done.

---

### 7.4 UI Polish Pass

One-time UI enhancement — no new features.

#### 7.4.1 Reduced Motion

Add to `src/index.css`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

This single rule covers all Tailwind animations and custom keyframes globally.

#### 7.4.2 Micro-interactions

- Message bubbles already use `animate-fadeInUp` from Phase 5.
- Send button: `active:scale-95 transition-transform duration-75`.
- Onboarding modal: backdrop fades in, panel slides up on open.

#### 7.4.3 Skeleton Loaders — shimmer

Already defined in `tailwind.config.ts`. Apply to `<SkeletonLoader />`:
```
bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200
bg-[length:200%_100%] animate-shimmer rounded-xl
```

#### 7.4.4 Typography

- All headings: `font-semibold` (600) — no `font-bold` (700+).
- Body: `leading-relaxed` everywhere.
- Stats (Summary Card, streak): `font-mono` for tabular digits.

#### 7.4.5 Error States

- Chat send fails: `"Couldn't send your message. Check your connection and try again."` — above input bar, `role="alert"`, auto-dismisses in 5 seconds.
- Dashboard load fails: inline error + Retry button, `role="alert"`.
- Error colour: `text-red-600` — the only use of red outside the crisis banner.

#### 7.4.6 Empty States

- Dashboard — no entries yet: "Journal for a few days to unlock your patterns." (soft inline SVG placeholder).
- Dashboard — no insights yet: "Your patterns will surface here as you journal more."

---

### 7.5 Lazy Loading Dashboard

```tsx
// src/App.tsx
import React, { lazy, Suspense } from 'react'
import SkeletonLoader from './components/SkeletonLoader'

const DashboardPage = lazy(() => import('./pages/DashboardPage'))

// In Routes:
<Route path="/dashboard" element={
  <Suspense fallback={<SkeletonLoader />}>
    <DashboardPage />
  </Suspense>
} />
```

This keeps Recharts out of the initial JS bundle — loads only when the user navigates to `/dashboard`.

---

### 7.6 MongoDB Index Confirmation

Verify indices exist after `connectDatabase()` in `server/db/mongoose.ts`:

```ts
await Journal.collection.createIndex({ userId: 1, createdAt: -1 })
await Insight.collection.createIndex({ userId: 1, confidence: -1 })
// Users.userId unique index defined on the schema — created automatically by Mongoose
```

---

### 7.7 Performance Check

```bash
npm run build
```

Check Rollup output. Any chunk > 250KB gzipped: investigate and split. Recharts should be absent from the initial bundle (confirmed by the lazy load in 7.5).

---

### 7.8 Accessibility Final Audit

1. **Keyboard:** Tab through every interactive element in order. Nothing skipped; modal traps focus while open.
2. **Screen reader:** macOS VoiceOver (`Cmd+F5`) on Chrome — chat messages announced on arrival via `aria-live="polite"`.
3. **Contrast:** primary-500 (#5c825c) on white: 4.8:1 ✓ · neutral-700 (#44403c) on white: 7.4:1 ✓ · white on primary-500: 4.8:1 ✓.
4. **Touch targets:** All buttons ≥ 44×44px in mobile DevTools.
5. **iOS viewport:** `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">` in `index.html`.

---

### 7.9 Pre-Demo Checklist

- [ ] `.env` not committed. `.env.example` has all keys with placeholders.
- [ ] Cold clone: `npm install && npm run dev` starts without errors.
- [ ] `npm test` — zero failures.
- [ ] `npm run build` — zero TypeScript errors, zero ESLint errors.
- [ ] `curl -I http://localhost:3001/api/health` — Helmet security headers present.
- [ ] CORS rejects a request from an unlisted origin in production mode.
- [ ] Lighthouse on `/journal` (mobile): Accessibility ≥ 90, Best Practices ≥ 90.
- [ ] Message bubbles animate; animation suppressed under `prefers-reduced-motion`.
- [ ] iOS safe-area inset applied to input bar (test in Safari DevTools, iPhone 14 preset).
- [ ] `PRIVACY.md` exists at project root.
- [ ] `README.md` at project root: what it does, env vars, `npm install && npm run dev`, tech stack. Max 2 pages.

---

## Final Project Structure

```
/
├── src/
│   ├── api/                chatApi.ts, dashboardApi.ts
│   ├── components/         all UI components
│   ├── context/            UserContext.tsx
│   ├── hooks/              useSpeechRecognition.ts
│   ├── pages/              LandingPage, JournalPage, DashboardPage
│   ├── types/              messages.ts
│   ├── utils/              sentimentLabel.ts
│   ├── App.tsx
│   ├── index.css           ← prefers-reduced-motion rule here
│   └── main.tsx
├── server/
│   ├── cache/              redis, sessionContext, profileCache, rateLimiter
│   ├── db/                 mongoose.ts
│   ├── llm/                deepseekClient, prompts, pipeline
│   ├── middleware/         validateUserId, validate, errorHandler
│   ├── models/             User, Journal, Insight
│   ├── routes/             health, users, journals, chat, dashboard
│   ├── services/           insightEngine.ts
│   ├── types/              llm.ts
│   └── index.ts
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.server.json
├── package.json
├── .env.example
├── .gitignore
├── PRIVACY.md
└── README.md
```

---

## Acceptance Criteria

- [ ] All guardrail tests pass.
- [ ] `npm audit --audit-level=high` returns zero high/critical vulnerabilities.
- [ ] Helmet headers on all API responses.
- [ ] `npm test` passes with zero failures.
- [ ] `npm run build` — clean build, no TypeScript errors.
- [ ] `DashboardPage` lazy-loaded — Recharts absent from initial bundle.
- [ ] MongoDB compound indices confirmed.
- [ ] Lighthouse accessibility ≥ 90 on `/journal`.

---

## CLAUDE.md Checklist

- `helmet` for security headers — not hand-rolled.
- CORS origin from `process.env.ALLOWED_ORIGIN` in production.
- All tests in Vitest — single `npm test` from project root.
- `prefers-reduced-motion` in `src/index.css` — not per-component.
- `DashboardPage` lazy-loaded with `React.lazy`.
- MongoDB indices created programmatically on startup.
- `README.md` accurate from a cold clone.
- No `outline-none` without a visible alternative — confirmed in audit.
