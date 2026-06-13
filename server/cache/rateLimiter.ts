import { REDIS_KEY_PATTERNS, redisClient } from './redis'

const RATE_LIMIT_WINDOW_SECONDS = 60
// MVP default: generous enough for demos; tighten via RATE_LIMIT_PER_MINUTE in production.
const DEFAULT_LIMIT_PER_MINUTE = 120

export function isRateLimitEnabled(): boolean {
  if (process.env.RATE_LIMIT_ENABLED === 'false') {
    return false
  }

  // Local dev and manual QA should never hit chat throttling.
  if (process.env.NODE_ENV !== 'production') {
    return false
  }

  return true
}

function resolveLimitPerMinute(limitOverride?: number): number {
  if (limitOverride !== undefined) {
    return limitOverride
  }

  const configured = Number(process.env.RATE_LIMIT_PER_MINUTE)

  if (Number.isFinite(configured) && configured > 0) {
    return Math.floor(configured)
  }

  return DEFAULT_LIMIT_PER_MINUTE
}

export async function checkRateLimit(
  userId: string,
  limitPerMinute?: number,
): Promise<boolean> {
  if (!isRateLimitEnabled()) {
    return true
  }

  const limit = resolveLimitPerMinute(limitPerMinute)
  const key = REDIS_KEY_PATTERNS.rateLimit(userId)
  const count = await redisClient.incr(key)

  if (count === 1) {
    await redisClient.expire(key, RATE_LIMIT_WINDOW_SECONDS)
  }

  return count <= limit
}

export const RATE_LIMIT_CONFIG = {
  windowSeconds: RATE_LIMIT_WINDOW_SECONDS,
  defaultLimitPerMinute: DEFAULT_LIMIT_PER_MINUTE,
} as const
