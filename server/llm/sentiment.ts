import type { SentimentResult } from '../types/llm'

export const NEUTRAL_SENTIMENT: SentimentResult = {
  sentimentScore: 0,
  emotionalThemes: [],
  triggers: [],
  distressLevel: 0,
}

export function clampSentimentScore(value: number): number {
  if (Number.isNaN(value)) {
    return 0
  }

  return Math.min(1, Math.max(-1, value))
}

export function clampDistressLevel(value: number): SentimentResult['distressLevel'] {
  if (Number.isNaN(value)) {
    return 0
  }

  const rounded = Math.round(value)
  const clamped = Math.min(3, Math.max(0, rounded))
  return clamped as SentimentResult['distressLevel']
}

function extractJsonObject(rawContent: string): string {
  const start = rawContent.indexOf('{')
  const end = rawContent.lastIndexOf('}')

  if (start === -1 || end === -1 || end <= start) {
    throw new Error('No JSON object found in extractor response')
  }

  return rawContent.slice(start, end + 1)
}

export function parseSentimentResult(rawContent: string): SentimentResult {
  try {
    const trimmed = rawContent.trim()
    const jsonText = trimmed.startsWith('{') ? trimmed : extractJsonObject(trimmed)
    const parsed = JSON.parse(jsonText) as Partial<SentimentResult>

    return {
      sentimentScore: clampSentimentScore(Number(parsed.sentimentScore ?? 0)),
      emotionalThemes: Array.isArray(parsed.emotionalThemes)
        ? parsed.emotionalThemes
            .filter((theme): theme is string => typeof theme === 'string')
            .slice(0, 5)
        : [],
      triggers: Array.isArray(parsed.triggers)
        ? parsed.triggers.filter((trigger): trigger is string => typeof trigger === 'string').slice(0, 5)
        : [],
      distressLevel: clampDistressLevel(Number(parsed.distressLevel ?? 0)),
    }
  } catch (error) {
    console.error('Failed to parse extractor JSON:', error)
    return { ...NEUTRAL_SENTIMENT }
  }
}
