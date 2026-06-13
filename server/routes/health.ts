import { Router } from 'express'
import { pingDatabase } from '../db/mongoose'
import { redisClient } from '../cache/redis'
import { deepseek } from '../llm/deepseekClient'

const router = Router()

router.get('/health', async (_req, res) => {
  const isProduction = process.env.NODE_ENV === 'production'

  const mongo = await safeCheck(pingDatabase)
  const redis = await safeCheck(async () => {
    const result = await redisClient.ping()
    return result === 'PONG'
  })
  const deepseekOk = await safeCheck(checkDeepSeek)

  if (!mongo || !redis || !deepseekOk) {
    if (isProduction) {
      res.status(503).json({ status: 'error' })
      return
    }

    res.status(503).json({
      status: 'error',
      mongo,
      redis,
      deepseek: deepseekOk,
    })
    return
  }

  res.json({
    status: 'ok',
    mongo,
    redis,
    deepseek: deepseekOk,
  })
})

async function safeCheck(check: () => Promise<boolean>): Promise<boolean> {
  try {
    return await check()
  } catch {
    return false
  }
}

async function checkDeepSeek(): Promise<boolean> {
  if (!process.env.DEEPSEEK_API_KEY) {
    return false
  }

  const response = await deepseek.chat.completions.create({
    model: 'deepseek-chat',
    messages: [{ role: 'user', content: 'ping' }],
    max_tokens: 5,
  })

  return Boolean(response.choices[0]?.message?.content)
}

export default router
