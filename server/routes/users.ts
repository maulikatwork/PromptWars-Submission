import { Router } from 'express'
import { validateUserId } from '../middleware/validateUserId'

const EXAM_OPTIONS = ['JEE', 'NEET', 'CUET', 'CAT', 'GATE', 'UPSC', 'Other'] as const

type ExamOption = (typeof EXAM_OPTIONS)[number]

interface UserProfilePayload {
  name: string
  exam: ExamOption
  targetDate?: string
}

const router = Router()

router.post('/users', validateUserId, (req, res) => {
  const { name, exam, targetDate } = req.body as Partial<UserProfilePayload>

  if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 60) {
    res.status(400).json({ error: 'Name is required and must be 60 characters or fewer' })
    return
  }

  if (!exam || !EXAM_OPTIONS.includes(exam)) {
    res.status(400).json({ error: 'A valid exam selection is required' })
    return
  }

  if (targetDate) {
    const parsedDate = new Date(targetDate)

    if (Number.isNaN(parsedDate.getTime()) || parsedDate <= new Date()) {
      res.status(400).json({ error: 'Target date must be a valid future date' })
      return
    }
  }

  const profile = {
    name: name.trim(),
    exam,
    targetDate: targetDate ?? null,
  }

  res.status(201).json({ profile })
})

export default router
