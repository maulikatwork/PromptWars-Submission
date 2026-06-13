import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'
import { validateUserId } from '../middleware/validateUserId'
import { Insight } from '../models/Insight'
import { formatInsight } from '../utils/serialize'

const router = Router()

router.get(
  '/insights',
  validateUserId,
  asyncHandler(async (req, res) => {
    const insights = await Insight.find({
      userId: req.userId,
      confidence: { $gte: 0.5 },
      supportingCount: { $gte: 2 },
    }).sort({ confidence: -1 })

    res.json({ insights: insights.map(formatInsight) })
  }),
)

export default router
