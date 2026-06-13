import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockIncr = vi.fn()
const mockExpire = vi.fn()

vi.mock('./redis', () => ({
  REDIS_KEY_PATTERNS: {
    session: (userId: string) => `session:${userId}`,
    userProfile: (userId: string) => `user_profile:${userId}`,
    rateLimit: (userId: string) => `rate_limit:${userId}`,
  },
  redisClient: {
    incr: (...args: unknown[]) => mockIncr(...args),
    expire: (...args: unknown[]) => mockExpire(...args),
  },
}))

import { checkRateLimit, RATE_LIMIT_CONFIG } from './rateLimiter'

describe('rateLimiter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('allows requests up to the configured limit', async () => {
    mockIncr.mockResolvedValueOnce(1).mockResolvedValueOnce(20)

    await expect(checkRateLimit('user-1')).resolves.toBe(true)
    await expect(checkRateLimit('user-1')).resolves.toBe(true)

    expect(mockExpire).toHaveBeenCalledWith(
      'rate_limit:user-1',
      RATE_LIMIT_CONFIG.windowSeconds,
    )
  })

  it('blocks requests above the configured limit', async () => {
    mockIncr.mockResolvedValue(21)

    await expect(checkRateLimit('user-1', 20)).resolves.toBe(false)
  })

  it('sets expiry only on the first request in a window', async () => {
    mockIncr.mockResolvedValueOnce(1).mockResolvedValueOnce(2)

    await checkRateLimit('user-2')
    await checkRateLimit('user-2')

    expect(mockExpire).toHaveBeenCalledOnce()
  })
})
