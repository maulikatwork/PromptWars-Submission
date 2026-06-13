import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'
import { parsePagination, validateRequiredTrimmedString } from '../middleware/validate'
import { validateUserId } from '../middleware/validateUserId'
import { Journal } from '../models/Journal'
import { formatJournalEntry } from '../utils/serialize'

const router = Router()

router.post(
  '/journals',
  validateUserId,
  asyncHandler(async (req, res) => {
    const { rawText } = req.body as { rawText?: unknown }

    const rawTextResult = validateRequiredTrimmedString(rawText, 'Journal text', 4000)
    if (!rawTextResult.ok) {
      res.status(400).json(rawTextResult.response)
      return
    }

    const journal = await Journal.create({
      userId: req.userId,
      rawText: rawTextResult.value,
      sentimentScore: null,
      emotionalThemes: [],
      triggers: [],
      distressLevel: 0,
    })

    res.status(201).json({
      id: journal._id.toString(),
      rawText: journal.rawText,
      createdAt: journal.createdAt,
    })
  }),
)

router.get(
  '/journals',
  validateUserId,
  asyncHandler(async (req, res) => {
    const { limit, offset } = parsePagination(req.query.limit, req.query.offset)

    const filter = { userId: req.userId }

    const [entries, total] = await Promise.all([
      Journal.find(filter).sort({ createdAt: -1 }).skip(offset).limit(limit),
      Journal.countDocuments(filter),
    ])

    res.json({
      entries: entries.map(formatJournalEntry),
      total,
    })
  }),
)

export default router
