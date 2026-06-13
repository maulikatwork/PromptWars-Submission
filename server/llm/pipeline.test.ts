import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockCreate = vi.fn()

vi.mock('./deepseekClient', () => ({
  deepseek: {
    chat: {
      completions: {
        create: (...args: unknown[]) => mockCreate(...args),
      },
    },
  },
}))

vi.mock('../models/Journal', () => ({
  Journal: {
    findByIdAndUpdate: vi.fn().mockResolvedValue({}),
  },
}))

import { Journal } from '../models/Journal'
import { applyDistressGuardrail, CRISIS_HELPLINE_BLOCK, replyContainsCrisisNumbers } from './guardrail'
import { processJournalEntry } from './pipeline'
import {
  clampDistressLevel,
  clampSentimentScore,
  NEUTRAL_SENTIMENT,
  parseSentimentResult,
} from './sentiment'

const baseParams = {
  journalEntryId: '000000000000000000000001',
  rawText: 'I feel overwhelmed.',
  studentName: 'Asha',
  examType: 'JEE',
  targetDate: null,
  conversationHistory: [],
}

function mockDeepSeekResponses(personaReply: string, extractorJson: string) {
  mockCreate
    .mockResolvedValueOnce({
      choices: [{ message: { content: personaReply } }],
    })
    .mockResolvedValueOnce({
      choices: [{ message: { content: extractorJson } }],
    })
}

describe('processJournalEntry', () => {
  beforeEach(() => {
    mockCreate.mockReset()
    vi.mocked(Journal.findByIdAndUpdate).mockClear()
  })

  it('classifies self-harm ideation as distressLevel 3', async () => {
    mockDeepSeekResponses(
      'I hear how much pain you are in.',
      '{"sentimentScore":-0.9,"emotionalThemes":["despair"],"triggers":[],"distressLevel":3}',
    )

    const result = await processJournalEntry({
      ...baseParams,
      rawText: 'I want to hurt myself and end it all.',
    })

    expect(result.sentiment.distressLevel).toBe(3)
  })

  it('classifies hopeless language as distressLevel 3', async () => {
    mockDeepSeekResponses(
      'Thank you for sharing this with me.',
      '{"sentimentScore":-0.85,"emotionalThemes":["hopelessness"],"triggers":[],"distressLevel":3}',
    )

    const result = await processJournalEntry({
      ...baseParams,
      rawText: 'There is no point anymore. I feel completely hopeless.',
    })

    expect(result.sentiment.distressLevel).toBe(3)
  })

  it('classifies mild stress as distressLevel 1 or lower', async () => {
    mockDeepSeekResponses(
      'That sounds stressful. What part felt hardest?',
      '{"sentimentScore":-0.2,"emotionalThemes":["stress"],"triggers":["Physics Mock"],"distressLevel":1}',
    )

    const result = await processJournalEntry({
      ...baseParams,
      rawText: 'Today was a bit stressful after my mock test.',
    })

    expect(result.sentiment.distressLevel).toBeLessThanOrEqual(1)
  })

  it('appends crisis block to reply when distressLevel is 3', () => {
    const reply = applyDistressGuardrail({
      reply: 'I hear how heavy this feels right now.',
      distressLevel: 3,
      userId: '00000000-0000-4000-8000-000000000001',
      journalEntryId: '000000000000000000000001',
    })

    expect(reply).toContain(CRISIS_HELPLINE_BLOCK)
  })

  it('does not append crisis block when distressLevel is 0', () => {
    const originalReply = 'Glad you had a calmer day today.'

    const reply = applyDistressGuardrail({
      reply: originalReply,
      distressLevel: 0,
      userId: '00000000-0000-4000-8000-000000000001',
      journalEntryId: '000000000000000000000001',
    })

    expect(reply).toBe(originalReply)
    expect(replyContainsCrisisNumbers(reply)).toBe(false)
  })

  it('crisis block contains Tele-MANAS number 14416', () => {
    const reply = applyDistressGuardrail({
      reply: 'You matter.',
      distressLevel: 3,
      userId: '00000000-0000-4000-8000-000000000001',
      journalEntryId: '000000000000000000000001',
    })

    expect(reply).toContain('14416')
  })

  it('crisis block contains KIRAN number 1800-599-0019', () => {
    const reply = applyDistressGuardrail({
      reply: 'You matter.',
      distressLevel: 3,
      userId: '00000000-0000-4000-8000-000000000001',
      journalEntryId: '000000000000000000000001',
    })

    expect(reply).toContain('1800-599-0019')
  })

  it('returns companion reply when extractor JSON is malformed', async () => {
    mockDeepSeekResponses('I am here with you.', 'not valid json at all')

    const result = await processJournalEntry(baseParams)

    expect(result.companionReply).toBe('I am here with you.')
    expect(result.sentiment).toEqual(NEUTRAL_SENTIMENT)
  })

  it('still returns companion reply when extractor returns neutral fallback', async () => {
    mockDeepSeekResponses(
      'That mock sounds draining.',
      '{"sentimentScore":-0.4,"emotionalThemes":["anxiety"],"triggers":["Mock Exam"],"distressLevel":2}',
    )

    const result = await processJournalEntry(baseParams)

    expect(result.companionReply).toBe('That mock sounds draining.')
    expect(result.sentiment.distressLevel).toBe(2)
  })

  it('propagates errors when both DeepSeek calls fail', async () => {
    mockCreate.mockRejectedValue(new Error('DeepSeek unavailable'))

    await expect(processJournalEntry(baseParams)).rejects.toThrow('DeepSeek unavailable')
  })

  it('persists parsed sentiment on the journal entry', async () => {
    mockDeepSeekResponses(
      'That sounds tough.',
      '{"sentimentScore":-0.5,"emotionalThemes":["anxiety"],"triggers":["Physics Mock"],"distressLevel":2}',
    )

    await processJournalEntry(baseParams)

    expect(Journal.findByIdAndUpdate).toHaveBeenCalledWith(baseParams.journalEntryId, {
      sentimentScore: -0.5,
      emotionalThemes: ['anxiety'],
      triggers: ['Physics Mock'],
      distressLevel: 2,
    })
  })
})

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

  it('falls back to neutral distress when distressLevel is a non-numeric string', () => {
    const result = parseSentimentResult(
      '{"sentimentScore":0,"emotionalThemes":[],"triggers":[],"distressLevel":"high"}',
    )

    expect(result.distressLevel).toBe(0)
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
