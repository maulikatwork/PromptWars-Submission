import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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

import { checkRateLimit, isRateLimitEnabled, RATE_LIMIT_CONFIG } from './rateLimiter'

describe('rateLimiter', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    process.env = { ...originalEnv, NODE_ENV: 'production' }
    delete process.env.RATE_LIMIT_ENABLED
    delete process.env.RATE_LIMIT_PER_MINUTE
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('skips rate limiting in development', async () => {
    process.env.NODE_ENV = 'development'

    await expect(checkRateLimit('user-1')).resolves.toBe(true)
    expect(mockIncr).not.toHaveBeenCalled()
  })

  it('skips rate limiting when RATE_LIMIT_ENABLED is false', async () => {
    process.env.RATE_LIMIT_ENABLED = 'false'

    await expect(checkRateLimit('user-1')).resolves.toBe(true)
    expect(mockIncr).not.toHaveBeenCalled()
  })

  it('allows requests up to the configured limit in production', async () => {
    mockIncr.mockResolvedValueOnce(1).mockResolvedValueOnce(120)

    await expect(checkRateLimit('user-1')).resolves.toBe(true)
    await expect(checkRateLimit('user-1')).resolves.toBe(true)

    expect(mockExpire).toHaveBeenCalledWith(
      'rate_limit:user-1',
      RATE_LIMIT_CONFIG.windowSeconds,
    )
  })

  it('blocks requests above the configured limit', async () => {
    mockIncr.mockResolvedValue(121)

    await expect(checkRateLimit('user-1', 120)).resolves.toBe(false)
  })

  it('sets expiry only on the first request in a window', async () => {
    mockIncr.mockResolvedValueOnce(1).mockResolvedValueOnce(2)

    await checkRateLimit('user-2')
    await checkRateLimit('user-2')

    expect(mockExpire).toHaveBeenCalledOnce()
  })

  it('uses RATE_LIMIT_PER_MINUTE from the environment', async () => {
    process.env.RATE_LIMIT_PER_MINUTE = '50'
    mockIncr.mockResolvedValueOnce(50).mockResolvedValueOnce(51)

    await expect(checkRateLimit('user-3')).resolves.toBe(true)
    await expect(checkRateLimit('user-3')).resolves.toBe(false)
  })

  it('is disabled outside production by default', () => {
    process.env.NODE_ENV = 'development'
    expect(isRateLimitEnabled()).toBe(false)
  })
})
