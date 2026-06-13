# GenAI Academic Wellness Companion

A private AI confidant for students preparing for high-stakes Indian competitive exams.

## Stack

- **Frontend:** Vite + React + TypeScript + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** MongoDB (Mongoose)
- **Cache:** Redis (ioredis, Docker)
- **LLM:** DeepSeek (OpenAI-compatible SDK)

## Development

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Ensure MongoDB and the local Redis Docker container are running.

3. Install dependencies and start dev servers:

```bash
npm install
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001/api

## Redis Key Prefixing

This project uses a shared Redis instance. All keys are namespaced via `REDIS_KEY_PREFIX` (default: `promptwars:foundation:`).

Logical key patterns:

- `session:{userId}`
- `user_profile:{userId}`
- `rate_limit:{userId}`

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite + Express concurrently |
| `npm run build` | Build frontend and compile server |
| `npm start` | Run production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run Vitest unit tests |
