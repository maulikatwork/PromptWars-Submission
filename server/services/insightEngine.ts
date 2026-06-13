import { Insight } from '../models/Insight'
import { Journal } from '../models/Journal'

export const INSIGHT_WINDOW = 30
export const MIN_CONFIDENCE = 0.4
export const STALE_DAYS = 30
export const MEAN_SENTIMENT_THRESHOLD = -0.3

export interface JournalEntryForAnalysis {
  sentimentScore: number | null
  emotionalThemes: string[]
  triggers: string[]
  createdAt: Date
}

export interface TriggerInsightCandidate {
  triggerLabel: string
  outcomeLabel: string
  pattern: string
  confidence: number
  supportingCount: number
  lastObserved: Date
}

export function computeConfidence(supportingCount: number, meanSentiment: number): number {
  return Math.min(1.0, (supportingCount / 5) * Math.abs(meanSentiment))
}

export function capitalizeFirst(value: string): string {
  if (!value) {
    return value
  }

  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function buildInsightPattern(triggerLabel: string, outcomeLabel: string): string {
  return `${capitalizeFirst(outcomeLabel)} spikes before ${triggerLabel}`
}

export function findMostFrequentValue(values: string[]): string {
  if (values.length === 0) {
    return 'stress'
  }

  const counts = new Map<string, number>()

  for (const value of values) {
    const trimmed = value.trim()
    if (!trimmed) {
      continue
    }
    counts.set(trimmed, (counts.get(trimmed) ?? 0) + 1)
  }

  if (counts.size === 0) {
    return values[0].trim() || 'stress'
  }

  let bestValue = values[0]
  let bestCount = 0

  for (const [value, count] of counts) {
    if (count > bestCount) {
      bestValue = value
      bestCount = count
    }
  }

  return bestValue
}

export function analyzeTriggerCorrelations(
  entries: JournalEntryForAnalysis[],
): TriggerInsightCandidate[] {
  const triggerSet = new Set<string>()

  for (const entry of entries) {
    for (const trigger of entry.triggers) {
      const trimmed = trigger.trim()
      if (trimmed) {
        triggerSet.add(trimmed)
      }
    }
  }

  const results: TriggerInsightCandidate[] = []

  for (const triggerLabel of triggerSet) {
    const matching = entries.filter((entry) => entry.triggers.includes(triggerLabel))
    const scores = matching
      .map((entry) => entry.sentimentScore)
      .filter((score): score is number => score !== null)

    if (scores.length === 0) {
      continue
    }

    const meanSentiment = scores.reduce((sum, score) => sum + score, 0) / scores.length
    const supportingCount = matching.length

    if (meanSentiment >= MEAN_SENTIMENT_THRESHOLD || supportingCount < 2) {
      continue
    }

    const themes = matching.flatMap((entry) => entry.emotionalThemes)
    const outcomeLabel = findMostFrequentValue(themes)
    const confidence = computeConfidence(supportingCount, meanSentiment)

    if (confidence < MIN_CONFIDENCE) {
      continue
    }

    const lastObserved = matching.reduce(
      (latest, entry) => (entry.createdAt > latest ? entry.createdAt : latest),
      matching[0].createdAt,
    )

    results.push({
      triggerLabel,
      outcomeLabel,
      pattern: buildInsightPattern(triggerLabel, outcomeLabel),
      confidence,
      supportingCount,
      lastObserved,
    })
  }

  return results
}

export async function generateInsights(userId: string): Promise<void> {
  const entries = await Journal.find({ userId })
    .sort({ createdAt: -1 })
    .limit(INSIGHT_WINDOW)
    .lean()

  const analysisEntries: JournalEntryForAnalysis[] = entries.map((entry) => ({
    sentimentScore: entry.sentimentScore,
    emotionalThemes: entry.emotionalThemes,
    triggers: entry.triggers,
    createdAt: entry.createdAt,
  }))

  const candidates = analyzeTriggerCorrelations(analysisEntries)

  for (const candidate of candidates) {
    await Insight.findOneAndUpdate(
      { userId, triggerLabel: candidate.triggerLabel },
      {
        $set: {
          pattern: candidate.pattern,
          outcomeLabel: candidate.outcomeLabel,
          confidence: candidate.confidence,
          supportingCount: candidate.supportingCount,
          lastObserved: candidate.lastObserved,
        },
        $setOnInsert: {
          firstObserved: new Date(),
        },
      },
      { upsert: true, new: true },
    )
  }

  const staleCutoff = new Date()
  staleCutoff.setDate(staleCutoff.getDate() - STALE_DAYS)

  await Insight.deleteMany({
    userId,
    lastObserved: { $lt: staleCutoff },
  })
}
