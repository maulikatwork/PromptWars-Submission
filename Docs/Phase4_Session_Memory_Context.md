# Phase 4 — Session Memory & Context

> **Status:** Not Started
> **Depends On:** Phase 3 complete (`POST /api/chat` functional)
> **Exit Criteria:** The AI references prior messages and the student's exam context within a session without re-reading MongoDB each turn.

---

## Objective

Implement Redis-backed session context so every DeepSeek call receives the last N conversational turns and the student's profile — making responses feel like a continuous remembered conversation. Add per-user rate limiting to bound DeepSeek token spend.

---

## Scope

### 4.1 Session Context — `server/cache/sessionContext.ts`

```
Key:   session:{userId}
Type:  Redis List (newest at head via LPUSH)
TTL:   4 hours (14400 seconds)
Cap:   20 messages
Value: JSON-serialised ConversationMessage
```

```ts
export async function appendToSession(userId: string, message: ConversationMessage): Promise<void>
export async function getSessionContext(userId: string): Promise<ConversationMessage[]>
export async function clearSession(userId: string): Promise<void>
```

Implementation:
- `appendToSession`: `LPUSH` then `LTRIM 0 19` to enforce 20-message cap, then `EXPIRE` to reset TTL to 4 hours. Use a Redis pipeline (atomic batch — no race between LPUSH and LTRIM).
- `getSessionContext`: `LRANGE 0 -1` returns newest-first; reverse the array in memory to produce chronological order (oldest first) for the LLM prompt.
- Failed `JSON.parse` on any element: skip that element and log a warning — never crash.

### 4.2 Profile Cache — `server/cache/profileCache.ts`

Avoids a MongoDB read on every chat turn.

```
Key:  user_profile:{userId}
Type: String (JSON)
TTL:  24 hours
```

```ts
export async function getCachedProfile(userId: string): Promise<UserProfile | null>
export async function invalidateProfileCache(userId: string): Promise<void>
```

- Cache-aside: Redis `GET` first; on miss, query MongoDB, then `SET EX 86400`.
- If Redis is unavailable: fall through to MongoDB and log the Redis error — the request must not fail.
- `invalidateProfileCache`: `DEL`. Called by `POST /api/users` after a successful profile update.

### 4.3 Rate Limiter — `server/cache/rateLimiter.ts`

```
Key:  rate_limit:{userId}
Type: String (integer counter)
TTL:  60 seconds
```

```ts
export async function checkRateLimit(userId: string, limitPerMinute = 20): Promise<boolean>
```

- Atomic `INCR rate_limit:{userId}`.
- If counter is `1` (first request in window): `EXPIRE rate_limit:{userId} 60`.
- Return `false` (blocked) if counter > `limitPerMinute`.

Apply in `POST /api/chat` before any DB or LLM work:
```ts
if (!await checkRateLimit(userId)) {
  return res.status(429).set('Retry-After', '60').json({ error: "Too many requests. Please wait a moment." })
}
```

Limit: **20 requests per minute** per user — generous for prose journaling while bounding token cost.

### 4.4 Wiring into the Chat Route — `server/routes/chat.ts`

Update flow:

1. `checkRateLimit(userId)` → `429` if blocked.
2. `getCachedProfile(userId)` → profile (or MongoDB fallback, or `404` if never onboarded).
3. `getSessionContext(userId)` → `history`.
4. Create `Journal` document.
5. `processJournalEntry({ ..., conversationHistory: history })`.
6. Apply distress guardrail.
7. **After** LLM call returns:
   - `appendToSession(userId, { role: 'user', content: rawText })`.
   - `appendToSession(userId, { role: 'assistant', content: reply })`.
8. Return `200 { reply, entryId, distressLevel }`.

Current turn's messages are appended **after** the LLM call — they must never be included in the context passed to that same call.

### 4.5 Context Window Budget

| Factor | Value |
|---|---|
| Avg tokens per message pair | ~300 |
| Window (20 messages) | ~3,000 tokens |
| System prompt + profile overhead | ~500 tokens |
| **Total per call** | ~3,500 tokens |

Well within DeepSeek's context limit. After 4 hours the session TTL expires naturally, giving each day a fresh start.

---

## File Structure After Phase 4

```
server/
├── cache/
│   ├── redis.ts             ← Phase 1
│   ├── sessionContext.ts    ← NEW
│   ├── profileCache.ts      ← NEW
│   └── rateLimiter.ts       ← NEW
├── routes/
│   ├── chat.ts              ← UPDATED
│   └── users.ts             ← UPDATED: calls invalidateProfileCache on update
└── ...
```

---

## Acceptance Criteria

- [ ] Message 1: "Stressed about Physics mock." Message 2: "Don't know what to do." — second reply references Physics without re-mentioning it.
- [ ] After 20 messages, the 21st message's context still contains exactly 20 entries.
- [ ] `session:{userId}` TTL is ~4 hours after last message (`redis-cli TTL session:{userId}`).
- [ ] > 20 requests/minute from same `userId` returns `429` with `Retry-After: 60`.
- [ ] Updating profile via `POST /api/users` invalidates cache — next chat re-reads from MongoDB.
- [ ] Unit tests: append trims to 20, rate limit blocks at limit+1, profile cache hit skips MongoDB.

---

## CLAUDE.md Checklist

- `LPUSH` + `LTRIM` in a Redis pipeline — atomic, O(1) amortized.
- Cache-aside for profile — Redis first, MongoDB fallback, no dual-write.
- Atomic `INCR` for rate limit — no race condition.
- Messages appended **after** LLM call — current turn excluded from its own context.
- Redis failure in profile cache falls through to MongoDB gracefully.
- All cache logic in dedicated modules — never inlined in route handlers.
