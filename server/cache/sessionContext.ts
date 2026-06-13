import type { ConversationMessage } from '../types/llm'
import { REDIS_KEY_PATTERNS, redisClient } from './redis'

const SESSION_TTL_SECONDS = 14_400
const SESSION_MESSAGE_CAP = 20

function isConversationMessage(value: unknown): value is ConversationMessage {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const message = value as Record<string, unknown>
  return (
    (message.role === 'user' || message.role === 'assistant') &&
    typeof message.content === 'string'
  )
}

export async function appendToSession(
  userId: string,
  message: ConversationMessage,
): Promise<void> {
  const key = REDIS_KEY_PATTERNS.session(userId)
  const serialized = JSON.stringify(message)

  await redisClient
    .pipeline()
    .lpush(key, serialized)
    .ltrim(key, 0, SESSION_MESSAGE_CAP - 1)
    .expire(key, SESSION_TTL_SECONDS)
    .exec()
}

export async function getSessionContext(userId: string): Promise<ConversationMessage[]> {
  const key = REDIS_KEY_PATTERNS.session(userId)
  const rawMessages = await redisClient.lrange(key, 0, -1)

  const messages: ConversationMessage[] = []

  for (const raw of rawMessages) {
    try {
      const parsed: unknown = JSON.parse(raw)

      if (isConversationMessage(parsed)) {
        messages.push(parsed)
      } else {
        console.warn(`Skipping invalid session message for user ${userId}`)
      }
    } catch {
      console.warn(`Skipping malformed session message for user ${userId}`)
    }
  }

  return messages.reverse()
}

export async function clearSession(userId: string): Promise<void> {
  await redisClient.del(REDIS_KEY_PATTERNS.session(userId))
}

export const SESSION_CONFIG = {
  ttlSeconds: SESSION_TTL_SECONDS,
  messageCap: SESSION_MESSAGE_CAP,
} as const
