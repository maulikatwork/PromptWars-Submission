import Redis from 'ioredis'

const redisUrl = process.env.REDIS_URL
const keyPrefix = process.env.REDIS_KEY_PREFIX ?? 'promptwars:foundation:'

if (!redisUrl) {
  console.error('REDIS_URL is not configured')
  process.exit(1)
}

export const redisClient = new Redis(redisUrl, {
  keyPrefix,
  maxRetriesPerRequest: 3,
})

redisClient.on('error', (error) => {
  console.error('Redis connection error:', error.message)
  process.exit(1)
})

export const REDIS_KEY_PATTERNS = {
  session: (userId: string) => `session:${userId}`,
  userProfile: (userId: string) => `user_profile:${userId}`,
  rateLimit: (userId: string) => `rate_limit:${userId}`,
} as const
