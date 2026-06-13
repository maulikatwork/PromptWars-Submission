import { describe, expect, it } from 'vitest'
import { sentimentToMoodLabel } from './sentimentLabel'

describe('sentimentToMoodLabel', () => {
  it('returns Positive when score is >= 0.3', () => {
    expect(sentimentToMoodLabel(0.3)).toBe('Positive')
    expect(sentimentToMoodLabel(0.8)).toBe('Positive')
  })

  it('returns Stressed when score is <= -0.3', () => {
    expect(sentimentToMoodLabel(-0.3)).toBe('Stressed')
    expect(sentimentToMoodLabel(-0.9)).toBe('Stressed')
  })

  it('returns Neutral for scores between thresholds', () => {
    expect(sentimentToMoodLabel(0)).toBe('Neutral')
    expect(sentimentToMoodLabel(0.1)).toBe('Neutral')
    expect(sentimentToMoodLabel(-0.1)).toBe('Neutral')
  })
})
