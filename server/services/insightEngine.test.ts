import { describe, expect, it } from 'vitest'
import {
  analyzeTriggerCorrelations,
  buildInsightPattern,
  computeConfidence,
  findMostFrequentValue,
  MIN_CONFIDENCE,
} from './insightEngine'

describe('computeConfidence', () => {
  it('caps confidence at 1.0 for strong patterns', () => {
    expect(computeConfidence(10, -0.9)).toBe(1)
  })

  it('scales confidence with supporting count and sentiment magnitude', () => {
    expect(computeConfidence(5, -0.8)).toBeCloseTo(0.8)
    expect(computeConfidence(2, -0.5)).toBeCloseTo(0.2)
  })
})

describe('buildInsightPattern', () => {
  it('formats trigger-outcome insight text', () => {
    expect(buildInsightPattern('Physics Mock', 'anxiety')).toBe(
      'Anxiety spikes before Physics Mock',
    )
  })
})

describe('findMostFrequentValue', () => {
  it('returns the most common theme label', () => {
    expect(findMostFrequentValue(['anxiety', 'stress', 'anxiety', 'fatigue'])).toBe('anxiety')
  })
})

describe('analyzeTriggerCorrelations', () => {
  const baseDate = new Date('2025-06-01T10:00:00.000Z')

  it('returns no insights when mean sentiment is not negative enough', () => {
    const insights = analyzeTriggerCorrelations([
      {
        sentimentScore: -0.1,
        emotionalThemes: ['anxiety'],
        triggers: ['Physics Mock'],
        createdAt: baseDate,
      },
      {
        sentimentScore: -0.2,
        emotionalThemes: ['anxiety'],
        triggers: ['Physics Mock'],
        createdAt: baseDate,
      },
    ])

    expect(insights).toHaveLength(0)
  })

  it('returns insight when trigger repeats with negative sentiment and enough confidence', () => {
    const insights = analyzeTriggerCorrelations([
      {
        sentimentScore: -0.6,
        emotionalThemes: ['anxiety'],
        triggers: ['Physics Mock'],
        createdAt: baseDate,
      },
      {
        sentimentScore: -0.5,
        emotionalThemes: ['anxiety', 'stress'],
        triggers: ['Physics Mock'],
        createdAt: new Date('2025-06-02T10:00:00.000Z'),
      },
      {
        sentimentScore: -0.4,
        emotionalThemes: ['anxiety'],
        triggers: ['Physics Mock'],
        createdAt: new Date('2025-06-03T10:00:00.000Z'),
      },
      {
        sentimentScore: -0.7,
        emotionalThemes: ['anxiety'],
        triggers: ['Physics Mock'],
        createdAt: new Date('2025-06-04T10:00:00.000Z'),
      },
      {
        sentimentScore: -0.6,
        emotionalThemes: ['anxiety'],
        triggers: ['Physics Mock'],
        createdAt: new Date('2025-06-05T10:00:00.000Z'),
      },
    ])

    expect(insights).toHaveLength(1)
    expect(insights[0].triggerLabel).toBe('Physics Mock')
    expect(insights[0].outcomeLabel).toBe('anxiety')
    expect(insights[0].supportingCount).toBe(5)
    expect(insights[0].confidence).toBeGreaterThanOrEqual(MIN_CONFIDENCE)
  })

  it('skips triggers that appear in fewer than two entries', () => {
    const insights = analyzeTriggerCorrelations([
      {
        sentimentScore: -0.8,
        emotionalThemes: ['anxiety'],
        triggers: ['Physics Mock'],
        createdAt: baseDate,
      },
    ])

    expect(insights).toHaveLength(0)
  })
})
