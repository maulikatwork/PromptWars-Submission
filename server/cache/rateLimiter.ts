import { REDIS_KEY_PATTERNS, redisClient } from './redis'

const RATE_LIMIT_WINDOW_SECONDS = 60
const DEFAULT_LIMIT_PER_MINUTE = 20

export async function checkRateLimit(
  userId: string,
  limitPerMinute = DEFAULT_LIMIT_PER_MINUTE,
): Promise<boolean> {
  const key = REDIS_KEY_PATTERNS.rateLimit(userId)
  const count = await redisClient.incr(key)

  if (count === 1) {
    await redisClient.expire(key, RATE_LIMIT_WINDOW_SECONDS)
  }

  return count <= limitPerMinute
}

export const RATE_LIMIT_CONFIG = {
  windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
  defaultLimitPerMinute: DEFAULT_LIMIT_PER_MINUTE,
} as const
