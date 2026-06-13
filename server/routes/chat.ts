import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'
import { validateRequiredTrimmedString } from '../middleware/validate'
import { validateUserId } from '../middleware/validateUserId'
import { applyDistressGuardrail } from '../llm/guardrail'
import { processJournalEntry } from '../llm/pipeline'
import { Journal } from '../models/Journal'
import { User } from '../models/User'
import { formatUserProfile } from '../utils/serialize'

const router = Router()

router.post(
  '/chat',
  validateUserId,
  asyncHandler(async (req, res) => {
    const { rawText } = req.body as { rawText?: unknown }

    const rawTextResult = validateRequiredTrimmedString(rawText, 'Journal text', 4000)
    if (!rawTextResult.ok) {
      res.status(400).json(rawTextResult.response)
      return
    }

    const userId = req.userId!
    const user = await User.findOne({ userId })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    const profile = formatUserProfile(user)

    const journal = await Journal.create({
      userId,
      rawText: rawTextResult.value,
      sentimentScore: null,
      emotionalThemes: [],
      triggers: [],
      distressLevel: 0,
    })

    const journalEntryId = journal._id.toString()

    try {
      const { companionReply, sentiment } = await processJournalEntry({
        journalEntryId,
        rawText: rawTextResult.value,
        studentName: profile.name,
        examType: profile.exam,
        targetDate: profile.targetDate,
        conversationHistory: [],
      })

      const reply = applyDistressGuardrail({
        reply: companionReply,
        distressLevel: sentiment.distressLevel,
        userId,
        journalEntryId,
      })

      res.json({
        reply,
        entryId: journalEntryId,
        distressLevel: sentiment.distressLevel,
      })
    } catch (error) {
      console.error('DeepSeek pipeline failed:', error)
      res.status(503).json({ error: 'AI service temporarily unavailable' })
    }
  }),
)

export default router
