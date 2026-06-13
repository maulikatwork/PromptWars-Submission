import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ConversationMessage } from '../types/llm'

const mockPipeline = vi.fn()
const mockLpush = vi.fn()
const mockLtrim = vi.fn()
const mockExpire = vi.fn()
const mockExec = vi.fn()
const mockLrange = vi.fn()
const mockDel = vi.fn()

function createPipelineChain() {
  const chain = {
    lpush: (...args: unknown[]) => {
      mockLpush(...args)
      return chain
    },
    ltrim: (...args: unknown[]) => {
      mockLtrim(...args)
      return chain
    },
    expire: (...args: unknown[]) => {
      mockExpire(...args)
      return chain
    },
    exec: (...args: unknown[]) => mockExec(...args),
  }

  return chain
}

vi.mock('./redis', () => ({
  REDIS_KEY_PATTERNS: {
    session: (userId: string) => `session:${userId}`,
    userProfile: (userId: string) => `user_profile:${userId}`,
    rateLimit: (userId: string) => `rate_limit:${userId}`,
  },
  redisClient: {
    pipeline: () => {
      mockPipeline()
      return createPipelineChain()
    },
    lrange: (...args: unknown[]) => mockLrange(...args),
    del: (...args: unknown[]) => mockDel(...args),
  },
}))

import {
  appendToSession,
  clearSession,
  getSessionContext,
  SESSION_CONFIG,
} from './sessionContext'

describe('sessionContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockExec.mockResolvedValue([])
  })

  it('appends messages with LPUSH, LTRIM cap, and EXPIRE in a pipeline', async () => {
    const message: ConversationMessage = { role: 'user', content: 'Stressed about Physics mock.' }

    await appendToSession('user-1', message)

    expect(mockPipeline).toHaveBeenCalledOnce()
    expect(mockLpush).toHaveBeenCalledWith('session:user-1', JSON.stringify(message))
    expect(mockLtrim).toHaveBeenCalledWith('session:user-1', 0, SESSION_CONFIG.messageCap - 1)
    expect(mockExpire).toHaveBeenCalledWith('session:user-1', SESSION_CONFIG.ttlSeconds)
  })

  it('returns session messages in chronological order', async () => {
    const newestFirst = [
      JSON.stringify({ role: 'assistant', content: 'What felt hardest?' }),
      JSON.stringify({ role: 'user', content: 'Physics mock.' }),
    ]
    mockLrange.mockResolvedValue(newestFirst)

    const history = await getSessionContext('user-1')

    expect(history).toEqual([
      { role: 'user', content: 'Physics mock.' },
      { role: 'assistant', content: 'What felt hardest?' },
    ])
  })

  it('skips malformed session entries without crashing', async () => {
    mockLrange.mockResolvedValue([
      'not-json',
      JSON.stringify({ role: 'user', content: 'Valid message' }),
      JSON.stringify({ role: 'invalid', content: 'Bad role' }),
    ])

    const history = await getSessionContext('user-1')

    expect(history).toEqual([{ role: 'user', content: 'Valid message' }])
  })

  it('clears the session key for a user', async () => {
    await clearSession('user-1')

    expect(mockDel).toHaveBeenCalledWith('session:user-1')
  })
})
