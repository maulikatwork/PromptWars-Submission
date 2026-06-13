# Phase 1 — Foundation & Setup

> **Status:** Not Started
> **Exit Criteria:** `npm run dev` boots without errors, `GET /api/health` returns OK for all services, landing page renders in browser, UUID is generated and stored on first visit to `/journal`.

---

## Objective

Establish the single-project skeleton — one `package.json`, Vite frontend, Express backend, MongoDB, Redis, and DeepSeek integration. No features are built here; only foundations.

---

## Single-Project Architecture

One project, one deployment. Frontend (`src/`) and backend (`server/`) share one `package.json`.

- **Dev:** `npm run dev` → `concurrently` runs Vite (port 5173) + Express (port 3001). Vite proxies `/api` to Express.
- **Production:** `npm run build` → React compiles to `dist/`. `npm start` → Express serves both `/api` and `dist/`. One process, one port.

---

## Scope

### 1.1 Project Initialisation

```bash
npm create vite@latest . -- --template react-ts
npm install -D tailwindcss postcss autoprefixer && npx tailwindcss init -p
npm install express cors dotenv mongoose ioredis openai
npm install -D tsx concurrently @types/express @types/cors @types/node
npm install react-router-dom
```

Configure ESLint + Prettier before writing any production code:
```bash
npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-plugin-react prettier eslint-config-prettier
```

Add `.eslintrc.cjs` and `.prettierrc`.

### 1.2 Package Scripts — `package.json`

```json
{
  "scripts": {
    "dev":   "concurrently \"vite\" \"tsx watch server/index.ts\"",
    "build": "vite build && tsc -p tsconfig.server.json",
    "start": "node dist/server/index.js",
    "lint":  "eslint . --ext ts,tsx",
    "test":  "vitest run"
  }
}
```

### 1.3 TypeScript Config

`tsconfig.json` — base config for the frontend (Vite handles transpilation).

`tsconfig.server.json` — server-specific:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "CommonJS",
    "outDir": "dist/server",
    "rootDir": "server"
  },
  "include": ["server/**/*"]
}
```

### 1.4 Vite Config — `vite.config.ts`

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  test: {
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'server/**/*.test.ts'],
    environment: 'jsdom',
  }
})
```

### 1.5 Express Entry — `server/index.ts`

```ts
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { connectDatabase } from './db/mongoose'
import healthRouter from './routes/health'

const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json({ limit: '10kb' }))
app.use(cors({ origin: 'http://localhost:5173' }))  // tightened in Phase 7

app.use('/api', healthRouter)

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../dist')))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, '../../dist/index.html'))
  })
}

async function start() {
  await connectDatabase()
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
}

start()
```

### 1.6 Environment & Secrets

`.env` at project root (never committed):
```
DEEPSEEK_API_KEY=
MONGODB_URI=
REDIS_URL=
PORT=3001
NODE_ENV=development
```

Commit `.env.example` with all keys and placeholder values. Add `.env` to `.gitignore`.

### 1.7 MongoDB — `server/db/mongoose.ts`

Connect via Mongoose using `MONGODB_URI`. Export `connectDatabase()` — logs success or throws a typed error on failure (never silently swallows connection errors).

### 1.8 Redis — `server/cache/redis.ts`

Connect via `ioredis` using `REDIS_URL`. Export `redisClient` singleton. On connection failure: log the error and call `process.exit(1)` — a missing cache is not recoverable at startup.

### 1.9 DeepSeek Client — `server/llm/deepseekClient.ts`

Configure the `openai` SDK:
```ts
import OpenAI from 'openai'

export const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
})
```

### 1.10 Health Check — `server/routes/health.ts`

`GET /api/health`:
1. MongoDB ping.
2. Redis ping.
3. Minimal DeepSeek completion.
4. Returns `{ status: "ok", mongo: true, redis: true, deepseek: true }`.

In production: generic error only — no internal details in response body.

### 1.11 Tailwind — `tailwind.config.ts`

Light theme only. Custom design tokens:

```ts
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f4f7f4', 100: '#e6ede6', 200: '#ccdccc', 300: '#a8c2a8',
          400: '#7ea07e', 500: '#5c825c', 600: '#496849', 700: '#3a533a',
          800: '#2f432f', 900: '#273827',
        },
        neutral: {
          50: '#fafaf9', 100: '#f5f5f4', 200: '#e7e5e4', 300: '#d6d3d1',
          400: '#a8a29e', 500: '#78716c', 600: '#57534e', 700: '#44403c',
          800: '#292524', 900: '#1c1917',
        },
        accent: { 100: '#fef3c7', 300: '#fcd34d', 500: '#f59e0b' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to:   { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        fadeInUp: 'fadeInUp 0.2s ease-out',
        shimmer:  'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
}
```

Add Inter via Google Fonts in `index.html` (`<link rel="preconnect">` + stylesheet).

### 1.12 Routing & Page Shells — `src/App.tsx`

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import JournalPage from './pages/JournalPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"        element={<LandingPage />} />
        <Route path="/journal" element={<JournalPage />} />
      </Routes>
    </BrowserRouter>
  )
}
```

`/dashboard` route added in Phase 6.

### 1.13 Anonymous Identity — `src/context/UserContext.tsx`

On first visit to `/journal`:
- `crypto.randomUUID()` generates a UUID v4 (no library needed — available in all modern browsers).
- Stored as `localStorage.setItem('user_id', uuid)`.
- `UserContext` provides `userId: string` to the entire app.
- All API calls include `X-User-ID: {userId}` header.
- Server validates UUID v4 format — returns `400` on invalid value.

### 1.14 Landing Page Shell — `src/pages/LandingPage.tsx`

Render:
- App name + tagline.
- What it is / what it is NOT (not a therapist).
- Privacy statement (anonymous, no account).
- Crisis helplines: Tele-MANAS 14416, KIRAN 1800-599-0019 — always visible.
- "Get Started" CTA → navigates to `/journal`.

### 1.15 Onboarding Modal Shell — `src/components/OnboardingModal.tsx`

Shown on first `/journal` visit when `localStorage` has no `user_profile`. Collects:
- `name` (required, max 60 chars)
- `exam` (required, select: JEE / NEET / CUET / CAT / GATE / UPSC / Other)
- `targetDate` (optional, must be a future date if provided)

On submit: `POST /api/users`, save to `localStorage` as `user_profile`.

---

## File Structure After Phase 1

```
/
├── src/
│   ├── context/UserContext.tsx
│   ├── pages/LandingPage.tsx
│   ├── pages/JournalPage.tsx         ← placeholder heading only
│   ├── components/OnboardingModal.tsx ← shell
│   ├── App.tsx
│   └── main.tsx
├── server/
│   ├── db/mongoose.ts
│   ├── cache/redis.ts
│   ├── llm/deepseekClient.ts
│   ├── routes/health.ts
│   └── index.ts
├── index.html
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── tsconfig.server.json
├── package.json
├── .env.example
└── .gitignore
```

---

## Acceptance Criteria

- [ ] `npm run dev` starts Vite (5173) and Express (3001) with no errors.
- [ ] `GET /api/health` returns `{ status: "ok", mongo: true, redis: true, deepseek: true }`.
- [ ] Landing page renders at `/` with tagline, privacy statement, crisis numbers, and CTA.
- [ ] First visit to `/journal` generates and stores a UUID in `localStorage`.
- [ ] Onboarding modal appears on first visit to `/journal`; skips on return.
- [ ] No secrets in any committed file — `.env.example` has all keys with placeholders.
- [ ] `npm run lint` passes with zero errors.

---

## CLAUDE.md Checklist

- Single `package.json` — no nested packages or workspaces.
- Vite proxy routes `/api` to Express — no CORS issues during development.
- `.env` in `.gitignore`; `.env.example` committed with all keys.
- ESLint + Prettier configured before any production code.
- Light theme only — no dark mode classes anywhere.
- `crypto.randomUUID()` — no external UUID library.
