import { describe, expect, it } from 'vitest'
import { applyDistressGuardrail, CRISIS_HELPLINE_BLOCK, replyContainsCrisisNumbers } from './guardrail'
import {
  clampDistressLevel,
  clampSentimentScore,
  NEUTRAL_SENTIMENT,
  parseSentimentResult,
} from './sentiment'

describe('parseSentimentResult', () => {
  it('returns neutral defaults when extractor JSON is malformed', () => {
    const result = parseSentimentResult('not valid json at all')

    expect(result).toEqual(NEUTRAL_SENTIMENT)
  })

  it('parses valid extractor JSON', () => {
    const result = parseSentimentResult(
      '{"sentimentScore":-0.5,"emotionalThemes":["anxiety"],"triggers":["Physics Mock"],"distressLevel":2}',
    )

    expect(result).toEqual({
      sentimentScore: -0.5,
      emotionalThemes: ['anxiety'],
      triggers: ['Physics Mock'],
      distressLevel: 2,
    })
  })

  it('extracts JSON from prose-wrapped extractor output', () => {
    const result = parseSentimentResult(
      'Here is the analysis: {"sentimentScore":0.2,"emotionalThemes":[],"triggers":[],"distressLevel":1}',
    )

    expect(result.distressLevel).toBe(1)
    expect(result.sentimentScore).toBe(0.2)
  })
})

describe('sentiment clamping', () => {
  it('clamps sentimentScore to [-1, 1]', () => {
    expect(clampSentimentScore(-2)).toBe(-1)
    expect(clampSentimentScore(2)).toBe(1)
    expect(clampSentimentScore(Number.NaN)).toBe(0)
  })

  it('clamps distressLevel to [0, 3]', () => {
    expect(clampDistressLevel(-1)).toBe(0)
    expect(clampDistressLevel(5)).toBe(3)
    expect(clampDistressLevel(2.7)).toBe(3)
    expect(clampDistressLevel(Number.NaN)).toBe(0)
  })

  it('clamps out-of-range values from parsed extractor JSON', () => {
    const result = parseSentimentResult(
      '{"sentimentScore":-9,"emotionalThemes":[],"triggers":[],"distressLevel":99}',
    )

    expect(result.sentimentScore).toBe(-1)
    expect(result.distressLevel).toBe(3)
  })
})

describe('applyDistressGuardrail', () => {
  it('appends crisis helplines when distressLevel is 3 and reply lacks numbers', () => {
    const reply = applyDistressGuardrail({
      reply: 'I hear how heavy this feels right now.',
      distressLevel: 3,
      userId: '00000000-0000-4000-8000-000000000001',
      journalEntryId: '000000000000000000000001',
    })

    expect(reply).toContain('Tele-MANAS: 14416')
    expect(reply).toContain('1800-599-0019')
    expect(reply).toContain(CRISIS_HELPLINE_BLOCK)
  })

  it('does not duplicate crisis helplines when reply already includes them', () => {
    const originalReply =
      'Please reach Tele-MANAS (14416) or KIRAN (1800-599-0019) for support.'

    const reply = applyDistressGuardrail({
      reply: originalReply,
      distressLevel: 3,
      userId: '00000000-0000-4000-8000-000000000001',
      journalEntryId: '000000000000000000000001',
    })

    expect(reply).toBe(originalReply)
    expect(replyContainsCrisisNumbers(reply)).toBe(true)
  })

  it('returns the original reply unchanged for mild distress', () => {
    const originalReply = 'That sounds stressful. What part felt hardest?'

    const reply = applyDistressGuardrail({
      reply: originalReply,
      distressLevel: 1,
      userId: '00000000-0000-4000-8000-000000000001',
      journalEntryId: '000000000000000000000001',
    })

    expect(reply).toBe(originalReply)
  })
})
