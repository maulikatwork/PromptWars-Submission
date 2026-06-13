import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  fetchInsights,
  fetchSummary,
  fetchTimeline,
  formatLastEntryLabel,
  sentimentToMoodLabel,
} from './dashboardApi'

describe('dashboardApi helpers', () => {
  it('maps sentiment scores to mood labels', () => {
    expect(sentimentToMoodLabel(0.4)).toBe('Positive')
    expect(sentimentToMoodLabel(-0.4)).toBe('Stressed')
    expect(sentimentToMoodLabel(0)).toBe('Neutral')
  })

  it('formats last entry label as Today for current date', () => {
    const todayKey = [
      new Date().getFullYear(),
      String(new Date().getMonth() + 1).padStart(2, '0'),
      String(new Date().getDate()).padStart(2, '0'),
    ].join('-')

    expect(formatLastEntryLabel(todayKey)).toBe('Today')
  })
})

describe('dashboard fetch functions', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('fetchTimeline returns parsed timeline response on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          entries: [{ date: '2025-06-01', sentimentScore: -0.4, emotionalThemes: [], triggers: [] }],
          periodDays: 30,
        }),
      }),
    )

    const result = await fetchTimeline('user-123')

    expect(result.periodDays).toBe(30)
    expect(fetch).toHaveBeenCalledWith('/api/dashboard/timeline', {
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': 'user-123',
      },
    })
  })

  it('fetchInsights throws DashboardApiError on non-2xx', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Invalid or missing X-User-ID header' }),
      }),
    )

    await expect(fetchInsights('bad-id')).rejects.toEqual(
      expect.objectContaining({
        name: 'DashboardApiError',
        status: 400,
      }),
    )
  })

  it('fetchSummary returns parsed summary response on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          totalEntries: 5,
          averageSentiment: -0.2,
          mostCommonTrigger: 'Physics Mock',
          streakDays: 2,
          lastEntryDate: '2025-06-13',
        }),
      }),
    )

    const result = await fetchSummary('user-123')

    expect(result.totalEntries).toBe(5)
    expect(result.mostCommonTrigger).toBe('Physics Mock')
  })
})
