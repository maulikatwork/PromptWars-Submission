import { Router } from 'express'
import { invalidateProfileCache } from '../cache/profileCache'
import { isValidExam } from '../constants/exams'
import { asyncHandler } from '../middleware/asyncHandler'
import { validateOptionalFutureDate, validateRequiredTrimmedString } from '../middleware/validate'
import { validateUserId } from '../middleware/validateUserId'
import { User } from '../models/User'
import { formatUserProfile } from '../utils/serialize'

const router = Router()

router.post(
  '/users',
  validateUserId,
  asyncHandler(async (req, res) => {
    const userId = req.userId!
    const { name, exam, targetDate } = req.body as {
      name?: unknown
      exam?: unknown
      targetDate?: unknown
    }

    const nameResult = validateRequiredTrimmedString(name, 'Name', 60)
    if (!nameResult.ok) {
      res.status(400).json(nameResult.response)
      return
    }

    if (!isValidExam(exam)) {
      res.status(400).json({ error: 'Invalid exam type', field: 'exam' })
      return
    }

    const targetDateResult = validateOptionalFutureDate(targetDate)
    if (!targetDateResult.ok) {
      res.status(400).json(targetDateResult.response)
      return
    }

    const existingUser = await User.findOne({ userId })

    const user = await User.findOneAndUpdate(
      { userId },
      {
        userId,
        name: nameResult.value,
        exam,
        targetDate: targetDateResult.value,
      },
      { upsert: true, new: true, runValidators: true },
    )

    await invalidateProfileCache(userId)

    res.status(existingUser ? 200 : 201).json({ profile: formatUserProfile(user) })
  }),
)

router.get(
  '/users/me',
  validateUserId,
  asyncHandler(async (req, res) => {
    const user = await User.findOne({ userId: req.userId })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.json({ profile: formatUserProfile(user) })
  }),
)

export default router
