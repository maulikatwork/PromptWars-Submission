# Phase 6 — Insight Engine & Dashboard

> **Status:** Not Started
> **Depends On:** Phase 5 complete (chat UI working; journal entries accumulating with sentiment/trigger data)
> **Exit Criteria:** Dashboard surfaces at least one real cross-time pattern from accumulated entries, with a working emotional timeline and trigger map.

---

## Objective

Aggregate structured sentiment and trigger data into longitudinal insights. Build the Self-Awareness Dashboard — an emotional timeline and trigger map — so students can see patterns they cannot see from inside the experience.

---

## Scope

### 6.1 Insight Engine — `server/services/insightEngine.ts`

```ts
export async function generateInsights(userId: string): Promise<void>
```

Called from `POST /api/chat` as **fire-and-forget** after entry is enriched:
```ts
generateInsights(userId).catch(err => console.error('Insight generation failed:', err))
```
Never awaited — never blocks the chat response.

#### Algorithm

Analyses the last `INSIGHT_WINDOW = 30` journal entries for the user.

**Step 1 — Trigger-Outcome Correlation**

For each unique `trigger` in the window:
1. Collect all entries containing that trigger.
2. Compute mean `sentimentScore` for those entries.
3. If mean sentiment `< -0.3` AND the trigger appears in `>= 2` entries:
   - Find the most frequent `emotionalTheme` across those entries.
   - Build insight: `{ triggerLabel, outcomeLabel, pattern, confidence, supportingCount }`.

**Confidence formula:**
```
confidence = min(1.0, (supportingCount / 5) * Math.abs(meanSentiment))
```
Only persist insights with `confidence >= 0.4`.

**Step 2 — Upsert Insights**

```ts
Insight.findOneAndUpdate(
  { userId, triggerLabel },
  {
    $set: { pattern, outcomeLabel, confidence, supportingCount, lastObserved },
    $setOnInsert: { firstObserved: new Date() }
  },
  { upsert: true, new: true }
)
```

Idempotent: updates existing insight, sets `firstObserved` only on first insert.

**Step 3 — Prune Stale Insights**

Delete insights where `lastObserved` < 30 days ago for this user.

---

### 6.2 Dashboard API — `server/routes/dashboard.ts`

Mount in `server/index.ts` under `/api/dashboard`.

---

#### `GET /api/dashboard/timeline`

Returns last 30 days of journal entries grouped and averaged by calendar date.

```json
{
  "entries": [
    {
      "date": "2025-06-01",
      "sentimentScore": -0.4,
      "emotionalThemes": ["anxiety"],
      "triggers": ["Physics Mock"]
    }
  ],
  "periodDays": 30
}
```

- Sorted ascending by date (oldest first — reads left to right).
- Multiple entries on the same date: average `sentimentScore`, union `emotionalThemes` and `triggers`.
- Only entries with non-null `sentimentScore`.
- **Never return `rawText`** — dashboard never exposes journal content.

#### `GET /api/dashboard/insights`

```json
{
  "insights": [
    {
      "id": "...",
      "pattern": "Anxiety spikes before Physics Mocks",
      "triggerLabel": "Physics Mock",
      "outcomeLabel": "anxiety",
      "confidence": 0.72,
      "supportingCount": 5,
      "firstObserved": "2025-05-20",
      "lastObserved": "2025-06-10"
    }
  ]
}
```

- Filter: `confidence >= 0.4` and `supportingCount >= 2`. Max 10 results.
- Sorted by `confidence` descending.

#### `GET /api/dashboard/summary`

```json
{
  "totalEntries": 42,
  "averageSentiment": -0.12,
  "mostCommonTrigger": "Physics Mock",
  "streakDays": 5,
  "lastEntryDate": "2025-06-13"
}
```

- `streakDays`: consecutive calendar days with at least one entry, counting back from today.
- `averageSentiment`: mean of last 30 days' non-null `sentimentScore`.

---

### 6.3 Dashboard UI — `src/pages/DashboardPage.tsx`

Add `/dashboard` route in `src/App.tsx` (lazy-loaded — see Phase 7). Update `<StickyHeader />` with a nav icon link to `/dashboard`.

#### Data Loading

Three parallel fetches on mount — never sequential:

```ts
const [timeline, insights, summary] = await Promise.all([
  fetchTimeline(),
  fetchInsights(),
  fetchSummary(),
])
```

All fetch functions in `src/api/dashboardApi.ts`. Show `<SkeletonLoader />` while loading. Single retry-able error state if any call fails.

#### Layout (mobile-first, single column)

```
sticky header
│
├── Summary Card
├── "Emotional Timeline" heading
│   └── TimelineChart
├── "Your Patterns" heading
│   ├── InsightCard
│   └── InsightCard
└── Empty state (< 5 entries)
```

On `md:` the chart gets more height (`h-64`); on mobile `h-48`.

---

#### Summary Card — `src/components/SummaryCard.tsx`

```
bg-primary-50 border border-primary-200 rounded-2xl p-5
grid grid-cols-2 gap-4

42 entries    5-day streak
Avg mood: Neutral
Last entry: Today
```

- Avg mood label: `>= 0.3` → "Positive", `<= -0.3` → "Stressed", else "Neutral".
- Stats in `font-mono` (tabular digits don't shift width).

---

#### Timeline Chart — `src/components/TimelineChart.tsx`

Install Recharts: `npm install recharts date-fns`.

```ts
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
```

- `ResponsiveContainer width="100%"` + `height={192}` (mobile), `height={256}` at `md:`.
- X-axis: dates via `date-fns/format(date, 'MMM d')`.
- Y-axis domain `[-1, 1]`; hide labels on mobile.
- Line: `stroke="#5c825c"` (primary-500), `strokeWidth={2}`, `dot={{ r: 4 }}`.
- No grid lines — calm and minimal.
- Tooltip: date + sentiment label (same mapping as Summary Card).
- < 3 data points: show placeholder text, not an empty chart.

Accessibility:
```html
<figure role="img" aria-label="Emotional timeline chart, last 30 days">
  <!-- Recharts -->
  <table class="sr-only">
    <caption>Sentiment by date</caption>
    ...rows...
  </table>
</figure>
```

---

#### Insight Card — `src/components/InsightCard.tsx`

```
bg-white border border-neutral-200 rounded-xl p-4 shadow-sm

Trigger: Physics Mock
Anxiety spikes before Physics Mocks

████████░░  72% confident
5 entries · Since May 20
```

- Confidence bar: `<div role="progressbar" aria-valuenow={72} aria-valuemin={0} aria-valuemax={100}>` with inner `bg-primary-400` fill.
- Empty state: "Your patterns will appear here as you journal more."

---

## File Structure After Phase 6

```
server/
├── services/insightEngine.ts  ← NEW
└── routes/dashboard.ts        ← NEW

src/
├── api/dashboardApi.ts        ← NEW
├── components/
│   ├── InsightCard.tsx        ← NEW
│   ├── SkeletonLoader.tsx     ← NEW
│   ├── SummaryCard.tsx        ← NEW
│   └── TimelineChart.tsx      ← NEW
└── pages/DashboardPage.tsx    ← NEW
```

---

## Acceptance Criteria

- [ ] After 5+ entries with a recurring trigger, `GET /api/dashboard/insights` returns ≥ 1 insight with `confidence >= 0.4`.
- [ ] `GET /api/dashboard/timeline` returns entries grouped by date, sorted ascending, with averaged daily sentiment.
- [ ] Timeline chart renders; `sr-only` data table present in DOM.
- [ ] Insight card `aria-valuenow` matches the confidence percentage.
- [ ] All three dashboard API calls fire simultaneously (verify in browser Network tab).
- [ ] `generateInsights` does not block `POST /api/chat` response (fire-and-forget).
- [ ] Unit tests: confidence formula, streak calculation, daily sentiment averaging, trigger correlation.

---

## CLAUDE.md Checklist

- Three dashboard API calls in `Promise.all` — not sequential.
- `generateInsights` fire-and-forget — never awaited in the chat route.
- Insight upsert uses `$setOnInsert` for `firstObserved` — not overwritten on update.
- Recharts imported destructured — only used components.
- `date-fns/format` for date formatting — no manual string manipulation.
- No `rawText` in any dashboard response.
- Chart wrapped in `<figure role="img">` + `sr-only` table.
- Empty states shown — never a blank screen.
