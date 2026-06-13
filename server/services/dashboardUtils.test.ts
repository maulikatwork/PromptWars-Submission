import { describe, expect, it } from 'vitest'
import {
  aggregateDailyTimeline,
  computeAverageSentiment,
  computeStreakDays,
  findMostCommonTrigger,
  formatDateKey,
} from './dashboardUtils'

describe('aggregateDailyTimeline', () => {
  it('averages daily sentiment and unions themes and triggers', () => {
    const result = aggregateDailyTimeline([
      {
        sentimentScore: -0.4,
        emotionalThemes: ['anxiety'],
        triggers: ['Physics Mock'],
        createdAt: new Date('2025-06-01T09:00:00.000Z'),
      },
      {
        sentimentScore: -0.2,
        emotionalThemes: ['stress'],
        triggers: ['Physics Mock', 'Revision'],
        createdAt: new Date('2025-06-01T18:00:00.000Z'),
      },
      {
        sentimentScore: 0.1,
        emotionalThemes: ['hope'],
        triggers: ['Break'],
        createdAt: new Date('2025-06-02T09:00:00.000Z'),
      },
    ])

    expect(result).toHaveLength(2)
    expect(result[0].date).toBe('2025-06-01')
    expect(result[0].sentimentScore).toBeCloseTo(-0.3)
    expect(result[0].emotionalThemes).toEqual(expect.arrayContaining(['anxiety', 'stress']))
    expect(result[0].triggers).toEqual(expect.arrayContaining(['Physics Mock', 'Revision']))
    expect(result[1].date).toBe('2025-06-02')
    expect(result[1].sentimentScore).toBe(0.1)
  })

  it('sorts timeline entries ascending by date', () => {
    const result = aggregateDailyTimeline([
      {
        sentimentScore: 0.2,
        emotionalThemes: [],
        triggers: [],
        createdAt: new Date('2025-06-03T09:00:00.000Z'),
      },
      {
        sentimentScore: -0.1,
        emotionalThemes: [],
        triggers: [],
        createdAt: new Date('2025-06-01T09:00:00.000Z'),
      },
    ])

    expect(result.map((entry) => entry.date)).toEqual(['2025-06-01', '2025-06-03'])
  })

  it('ignores entries with null sentiment scores', () => {
    const result = aggregateDailyTimeline([
      {
        sentimentScore: null,
        emotionalThemes: ['anxiety'],
        triggers: ['Physics Mock'],
        createdAt: new Date('2025-06-01T09:00:00.000Z'),
      },
    ])

    expect(result).toHaveLength(0)
  })
})

describe('computeAverageSentiment', () => {
  it('returns null for empty score lists', () => {
    expect(computeAverageSentiment([])).toBeNull()
  })

  it('returns the arithmetic mean for score lists', () => {
    expect(computeAverageSentiment([-0.4, 0.2])).toBeCloseTo(-0.1)
  })
})

describe('findMostCommonTrigger', () => {
  it('returns the trigger with the highest frequency', () => {
    expect(findMostCommonTrigger(['Physics Mock', 'Revision', 'Physics Mock'])).toBe(
      'Physics Mock',
    )
  })

  it('returns null when no triggers are present', () => {
    expect(findMostCommonTrigger([])).toBeNull()
  })
})

describe('computeStreakDays', () => {
  it('counts consecutive days with entries back from today', () => {
    const today = new Date('2025-06-13T15:00:00.000Z')
    const streak = computeStreakDays(
      [
        new Date('2025-06-13T08:00:00.000Z'),
        new Date('2025-06-12T08:00:00.000Z'),
        new Date('2025-06-11T08:00:00.000Z'),
        new Date('2025-06-09T08:00:00.000Z'),
      ],
      today,
    )

    expect(streak).toBe(3)
  })

  it('returns zero when today has no entry', () => {
    const today = new Date('2025-06-13T15:00:00.000Z')
    const streak = computeStreakDays([new Date('2025-06-12T08:00:00.000Z')], today)

    expect(streak).toBe(0)
  })
})

describe('formatDateKey', () => {
  it('formats dates as YYYY-MM-DD', () => {
    expect(formatDateKey(new Date('2025-06-01T22:00:00.000Z'))).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})
