# Project Plan: Antarman

> **Context:** Submission for the Prompt War Challenge (Google for Developers × H2S × Build with AI)
> **Core Objective:** Build a Generative AI-powered solution to monitor and improve the mental well-being of students preparing for high-stakes Indian competitive exams (JEE, NEET, CUET, CAT, GATE, UPSC).
> **One-line pitch:** *A private AI confidant that listens like a friend, remembers like a mentor, and spots the burnout you can't see coming.*

---

## 1. Problem Statement

Students preparing for milestone exams face severe stress, burnout, and self-doubt — yet the support available is broken in three specific ways:

1. **Tracking is too rigid.** Standard mood trackers reduce a turbulent inner life to a 1-to-5 slider. A student can rate their day "3/5" while quietly spiralling.
2. **Advice is generic.** "Drink water, take a break" is noise to someone who just failed a third Physics mock. It ignores *why* they are struggling and *what* exam they are fighting for.
3. **The decline is invisible until it's a crisis.** Burnout builds over weeks through subtle shifts in language. No tool watches the *trend*, so the first visible sign is often a breakdown.

### Solution

A conversational AI companion that replaces checkbox tracking with open-ended, empathetic journaling. The student simply *talks* — by text or voice — and the system:

- **Listens** without judgement.
- **Understands** unstructured input semantically, scoring sentiment and emotional state.
- **Remembers** the student's exam, syllabus, and past struggles to stay contextually relevant.
- **Detects** hidden stress patterns and early burnout markers across time.
- **Intervenes** with specific, academically-aware coping strategies — and escalates safely when distress is severe.

### Target User

A 16–24 year old aspirant in an intense, time-boxed preparation cycle. **Success** = the student returns and says *"I never noticed that about myself."*

---

## 2. Core Features

### Conversational Journaling
- Frictionless text and voice input (browser native Speech Recognition API).
- Empathetic, non-judgmental AI persona.
- Adaptive follow-up questions to surface the real source of stress.

### Hidden Pattern Recognition
- Semantic analysis of each entry (sentiment score, emotional themes, triggers).
- Temporal correlation: *"Anxiety spikes consistently 48 hours before every mock exam."*
- Early burnout detection as a trend, not a single data point.

### Contextual Academic Memory
- Remembers exam type, target date, and past struggles.
- Stays specific: *"You mentioned Organic Chemistry was rough last week — how did today go?"*

### Hyper-Personalised Interventions
- Actionable coping strategies matched to the detected trigger.
- Scales to the need: a bad mock gets a confidence-rebuild reframe; a healthy week gets light reinforcement.

### Self-Awareness Dashboard
- Emotional timeline: sentiment trend over the preparation journey.
- Trigger map: *"Trigger: Physics Mock → Outcome: Panic"* — invisible habits made visible.

### Safety & Crisis Guardrails
- Detects severe distress and self-harm language.
- Immediately surfaces verified crisis helplines: Tele-MANAS (14416) and KIRAN (1800-599-0019).
- Never poses as a licensed therapist. Explicit about limits.

---

## 3. Technical Stack

| Component | Technology | Purpose |
|---|---|---|
| **Frontend** | Vite + React + TypeScript + Tailwind CSS | Fast dev build, component-driven UI, utility-first styling |
| **Backend** | Node.js + Express + TypeScript | API layer, LLM orchestration, business logic |
| **AI / LLM** | DeepSeek (via OpenAI-compatible SDK) | Empathetic conversation + structured emotional extraction |
| **Cache** | Redis (ioredis) | Session context, profile cache, rate limiting |
| **Database** | MongoDB (Mongoose) | Journal entries, user profiles, insights |

### Single-Project Architecture

This is **one project** — one `package.json`, one repository, one deployment.

- **Development:** `npm run dev` starts Vite (port 5173) and Express (port 3001) via `concurrently`. Vite proxies `/api` requests to Express automatically.
- **Production:** `npm run build` compiles React into `dist/`. `npm start` runs Express, which serves both the API and the static `dist/` files. **One process, one port, one deployment.**

```
┌─────────────────────────────────────────┐
│            Single Deployment            │
│                                         │
│   Browser                               │
│     │                                   │
│     ▼                                   │
│   Express (port 3001 / prod port)       │
│     ├── GET /          → dist/index.html│
│     ├── GET /journal   → dist/index.html│
│     ├── GET /dashboard → dist/index.html│
│     └── /api/*         → route handlers │
│            │                            │
│            ├── Redis  (session/cache)   │
│            ├── MongoDB (persistence)    │
│            └── DeepSeek (LLM)          │
└─────────────────────────────────────────┘
```

### Project Directory Structure

```
/
├── src/                        ← React frontend (Vite)
│   ├── api/                    chatApi.ts, dashboardApi.ts
│   ├── components/             UI components
│   ├── context/                UserContext.tsx
│   ├── hooks/                  useSpeechRecognition.ts
│   ├── pages/                  LandingPage, JournalPage, DashboardPage
│   ├── types/                  messages.ts
│   ├── utils/                  sentimentLabel.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── server/                     ← Express backend
│   ├── cache/                  redis, sessionContext, profileCache, rateLimiter
│   ├── db/                     mongoose.ts
│   ├── llm/                    deepseekClient, prompts, pipeline
│   ├── middleware/             validateUserId, validate, errorHandler
│   ├── models/                 User, Journal, Insight
│   ├── routes/                 health, users, journals, chat, dashboard
│   ├── services/               insightEngine.ts
│   ├── types/                  llm.ts
│   └── index.ts
├── index.html                  ← Vite entry point
├── vite.config.ts              ← proxy config + Vitest config
├── tailwind.config.ts          ← design tokens
├── tsconfig.json
├── tsconfig.server.json
├── package.json                ← single package.json
├── .env.example
├── .gitignore
├── PRIVACY.md
└── README.md
```

---

## 4. Data Strategy

### MongoDB Collections

| Collection | Purpose |
|---|---|
| `Users` | `userId` (UUID), name, exam type, target date |
| `Journals` | Raw text, sentiment score, emotional themes, triggers, distress level |
| `Insights` | Detected patterns, trigger→outcome pairs, confidence, supporting entry count |

### Redis Keys

| Key Pattern | Type | TTL | Purpose |
|---|---|---|---|
| `session:{userId}` | List | 4 hours | Last 20 conversation messages |
| `user_profile:{userId}` | String (JSON) | 24 hours | Cached user profile |
| `rate_limit:{userId}` | String (integer) | 60 seconds | Request rate counter |

### Auth & Identity

- **No accounts, no passwords, no email.** MVP uses an auto-generated UUID v4 stored in `localStorage`.
- `userId` is opaque — no PII embedded. It is the only link between the `User` and `Journal` collections.
- All API calls carry `X-User-ID` header validated server-side.

### Privacy

- Journal content is the most sensitive data in the system. It is stored linked only to an opaque UUID, never to a real-world identity.
- No data is ever sold, shared, or used for any purpose beyond the student's own insights.
- Full details in `PRIVACY.md`.

---

## 5. UI Design System

### Theme: Calm & Minimal, Light Only

- **No dark mode.** Light theme only — consistent, readable, lower complexity.
- **Primary colour:** Muted sage green (`#5c825c`) — calm, growth-oriented, non-clinical.
- **Neutral:** Warm grey (not cold blue-grey) — avoids the sterile feel of typical apps.
- **Font:** Inter — highly legible, neutral, low cognitive load at body sizes.
- **Body text minimum:** 16px (`text-base`) — prevents iOS Safari zoom on inputs.
- **Max content width:** `max-w-2xl` (672px) — keeps line length comfortable on desktop.
- **Mobile-first:** Base styles for 375px; enhanced at `sm:` (640px), `md:` (768px), `lg:` (1024px).

### Pages

| Route | Page | Purpose |
|---|---|---|
| `/` | Landing Page | Introduces the app, privacy notice, crisis helplines, CTA |
| `/journal` | Journal / Chat | The core journaling conversation interface |
| `/dashboard` | Dashboard | Emotional timeline and trigger map |

---

## 6. Implementation Phases

| Phase | Name | Key Deliverable |
|---|---|---|
| 1 | Foundation & Setup | Project boots, DB/cache/LLM connect, landing page shell |
| 2 | Data Models & Persistence | Schemas defined, CRUD API routes working |
| 3 | Conversational Core | DeepSeek pipeline: empathetic reply + sentiment extraction |
| 4 | Session Memory & Context | Redis session context + rate limiting wired into chat |
| 5 | Conversational Interface | Full chat UI with text + voice input, mobile-first |
| 6 | Insight Engine & Dashboard | Pattern detection, emotional timeline, trigger map |
| 7 | Safety, Hardening & Polish | Guardrail tests, security headers, UI animations, demo-ready |

Each phase ends in a **working, demoable state** — the repository is never left broken between phases.

---

## 7. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| LLM gives unsafe or off-tone advice | Strict system prompt + crisis guardrails + explicit non-therapist boundary |
| Sensitive data exposure | Secrets in env only; privacy-conscious schema; sanitise all input |
| Runaway DeepSeek token cost | Redis-bounded 20-message context window + per-user rate limiting (20 req/min) |
| Pattern engine produces noise | Confidence scoring + minimum 2 supporting entries before surfacing an insight |
| Low retention | Frictionless voice/text input and compounding personalised memory reward return visits |

---

## 8. Competition Scoring Strategy

| Criterion | Weight | Our Approach |
|---|---|---|
| **Code Quality** | High | TypeScript strict mode, single-responsibility modules, no dead code, ESLint + Prettier |
| **Problem Alignment** | High | Every feature traces to a stated requirement; no gold-plating |
| **Security** | Medium | Helmet headers, CORS lockdown, UUID validation, secrets in env, no stack traces in responses |
| **Efficiency** | Medium | `Promise.all` for parallel LLM calls, Redis hot path, compound MongoDB indices, lazy-loaded dashboard |
| **Testing** | Low | Vitest unit tests for all core logic; single `npm test` command |
| **Accessibility** | Low | Semantic HTML, ARIA where needed, keyboard navigation, 44px touch targets, 4.5:1 contrast |
