import { User } from '../models/User'
import { formatUserProfile, type UserProfileResponse } from '../utils/serialize'
import { REDIS_KEY_PATTERNS, redisClient } from './redis'

const PROFILE_CACHE_TTL_SECONDS = 86_400

export async function getCachedProfile(userId: string): Promise<UserProfileResponse | null> {
  const key = REDIS_KEY_PATTERNS.userProfile(userId)

  try {
    const cached = await redisClient.get(key)

    if (cached) {
      try {
        const parsed: unknown = JSON.parse(cached)

        if (isUserProfileResponse(parsed)) {
          return parsed
        }

        console.warn(`Invalid profile cache payload for user ${userId}`)
      } catch {
        console.warn(`Malformed profile cache payload for user ${userId}`)
      }
    }
  } catch (error) {
    console.error('Profile cache read failed, falling back to MongoDB:', error)
  }

  const user = await User.findOne({ userId })

  if (!user) {
    return null
  }

  const profile = formatUserProfile(user)

  try {
    await redisClient.set(key, JSON.stringify(profile), 'EX', PROFILE_CACHE_TTL_SECONDS)
  } catch (error) {
    console.error('Profile cache write failed:', error)
  }

  return profile
}

export async function invalidateProfileCache(userId: string): Promise<void> {
  try {
    await redisClient.del(REDIS_KEY_PATTERNS.userProfile(userId))
  } catch (error) {
    console.error('Profile cache invalidation failed:', error)
  }
}

function isUserProfileResponse(value: unknown): value is UserProfileResponse {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const profile = value as Record<string, unknown>
  return (
    typeof profile.name === 'string' &&
    typeof profile.exam === 'string' &&
    (typeof profile.targetDate === 'string' || profile.targetDate === null)
  )
}

export const PROFILE_CACHE_CONFIG = {
  ttlSeconds: PROFILE_CACHE_TTL_SECONDS,
} as const
