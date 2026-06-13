export const DASHBOARD_PERIOD_DAYS = 30

export interface TimelineDay {
  date: string
  sentimentScore: number
  emotionalThemes: string[]
  triggers: string[]
}

export interface JournalEntryForTimeline {
  sentimentScore: number | null
  emotionalThemes: string[]
  triggers: string[]
  createdAt: Date
}

export function formatDateKey(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

export function aggregateDailyTimeline(entries: JournalEntryForTimeline[]): TimelineDay[] {
  const byDate = new Map<
    string,
    { scores: number[]; themes: Set<string>; triggers: Set<string> }
  >()

  for (const entry of entries) {
    if (entry.sentimentScore === null) {
      continue
    }

    const dateKey = formatDateKey(entry.createdAt)
    let day = byDate.get(dateKey)

    if (!day) {
      day = { scores: [], themes: new Set(), triggers: new Set() }
      byDate.set(dateKey, day)
    }

    day.scores.push(entry.sentimentScore)
    entry.emotionalThemes.forEach((theme) => day!.themes.add(theme))
    entry.triggers.forEach((trigger) => day!.triggers.add(trigger))
  }

  return Array.from(byDate.entries())
    .map(([date, data]) => ({
      date,
      sentimentScore: data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length,
      emotionalThemes: Array.from(data.themes),
      triggers: Array.from(data.triggers),
    }))
    .sort((left, right) => left.date.localeCompare(right.date))
}

export function computeAverageSentiment(scores: number[]): number | null {
  if (scores.length === 0) {
    return null
  }

  return scores.reduce((sum, score) => sum + score, 0) / scores.length
}

export function findMostCommonTrigger(triggers: string[]): string | null {
  if (triggers.length === 0) {
    return null
  }

  const counts = new Map<string, number>()

  for (const trigger of triggers) {
    const trimmed = trigger.trim()
    if (!trimmed) {
      continue
    }
    counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1)
  }

  if (counts.size === 0) {
    return null
  }

  let bestTrigger: string | null = null
  let bestCount = 0

  for (const [trigger, count] of counts) {
    if (count > bestCount) {
      bestTrigger = trigger
      bestCount = count
    }
  }

  return bestTrigger
}

export function computeStreakDays(entryDates: Date[], today: Date = new Date()): number {
  if (entryDates.length === 0) {
    return 0
  }

  const dateSet = new Set(entryDates.map((date) => formatDateKey(date)))
  const cursor = new Date(today)
  cursor.setHours(0, 0, 0, 0)

  let streak = 0

  while (dateSet.has(formatDateKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export function getPeriodCutoff(periodDays: number, today: Date = new Date()): Date {
  const cutoff = new Date(today)
  cutoff.setDate(cutoff.getDate() - periodDays)
  cutoff.setHours(0, 0, 0, 0)
  return cutoff
}
