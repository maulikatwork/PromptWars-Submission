import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGet = vi.fn()
const mockSet = vi.fn()
const mockDel = vi.fn()
const mockFindOne = vi.fn()

vi.mock('./redis', () => ({
  REDIS_KEY_PATTERNS: {
    session: (userId: string) => `session:${userId}`,
    userProfile: (userId: string) => `user_profile:${userId}`,
    rateLimit: (userId: string) => `rate_limit:${userId}`,
  },
  redisClient: {
    get: (...args: unknown[]) => mockGet(...args),
    set: (...args: unknown[]) => mockSet(...args),
    del: (...args: unknown[]) => mockDel(...args),
  },
}))

vi.mock('../models/User', () => ({
  User: {
    findOne: (...args: unknown[]) => mockFindOne(...args),
  },
}))

import { getCachedProfile, invalidateProfileCache, PROFILE_CACHE_CONFIG } from './profileCache'

describe('profileCache', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns cached profile without querying MongoDB on cache hit', async () => {
    const cachedProfile = { name: 'Asha', exam: 'JEE', targetDate: '2026-12-01' }
    mockGet.mockResolvedValue(JSON.stringify(cachedProfile))

    const profile = await getCachedProfile('user-1')

    expect(profile).toEqual(cachedProfile)
    expect(mockFindOne).not.toHaveBeenCalled()
  })

  it('loads profile from MongoDB on cache miss and writes to Redis', async () => {
    mockGet.mockResolvedValue(null)
    mockFindOne.mockResolvedValue({
      name: 'Ravi',
      exam: 'NEET',
      targetDate: new Date('2026-11-15T00:00:00.000Z'),
    })

    const profile = await getCachedProfile('user-2')

    expect(profile).toEqual({
      name: 'Ravi',
      exam: 'NEET',
      targetDate: '2026-11-15',
    })
    expect(mockSet).toHaveBeenCalledWith(
      'user_profile:user-2',
      JSON.stringify({
        name: 'Ravi',
        exam: 'NEET',
        targetDate: '2026-11-15',
      }),
      'EX',
      PROFILE_CACHE_CONFIG.ttlSeconds,
    )
  })

  it('falls back to MongoDB when Redis read fails', async () => {
    mockGet.mockRejectedValue(new Error('Redis unavailable'))
    mockFindOne.mockResolvedValue({
      name: 'Meera',
      exam: 'UPSC',
      targetDate: null,
    })

    const profile = await getCachedProfile('user-3')

    expect(profile).toEqual({
      name: 'Meera',
      exam: 'UPSC',
      targetDate: null,
    })
    expect(mockFindOne).toHaveBeenCalledWith({ userId: 'user-3' })
  })

  it('returns null when user does not exist in MongoDB', async () => {
    mockGet.mockResolvedValue(null)
    mockFindOne.mockResolvedValue(null)

    const profile = await getCachedProfile('missing-user')

    expect(profile).toBeNull()
  })

  it('invalidates cached profile for a user', async () => {
    await invalidateProfileCache('user-4')

    expect(mockDel).toHaveBeenCalledWith('user_profile:user-4')
  })
})
