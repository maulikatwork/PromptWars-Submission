import { Router } from 'express'
import { asyncHandler } from '../middleware/asyncHandler'
import { validateUserId } from '../middleware/validateUserId'
import { Insight } from '../models/Insight'
import { Journal } from '../models/Journal'
import {
  aggregateDailyTimeline,
  computeAverageSentiment,
  computeStreakDays,
  DASHBOARD_PERIOD_DAYS,
  findMostCommonTrigger,
  formatDateKey,
  getPeriodCutoff,
} from '../services/dashboardUtils'

const router = Router()

function formatInsightForDashboard(insight: {
  _id: { toString(): string }
  pattern: string
  triggerLabel: string
  outcomeLabel: string
  confidence: number
  supportingCount: number
  firstObserved: Date
  lastObserved: Date
}) {
  return {
    id: insight._id.toString(),
    pattern: insight.pattern,
    triggerLabel: insight.triggerLabel,
    outcomeLabel: insight.outcomeLabel,
    confidence: insight.confidence,
    supportingCount: insight.supportingCount,
    firstObserved: formatDateKey(insight.firstObserved),
    lastObserved: formatDateKey(insight.lastObserved),
  }
}

router.get(
  '/timeline',
  validateUserId,
  asyncHandler(async (req, res) => {
    const userId = req.userId!
    const cutoff = getPeriodCutoff(DASHBOARD_PERIOD_DAYS)

    const entries = await Journal.find({
      userId,
      createdAt: { $gte: cutoff },
      sentimentScore: { $ne: null },
    })
      .select('sentimentScore emotionalThemes triggers createdAt')
      .sort({ createdAt: 1 })
      .lean()

    const timelineEntries = aggregateDailyTimeline(
      entries.map((entry) => ({
        sentimentScore: entry.sentimentScore,
        emotionalThemes: entry.emotionalThemes,
        triggers: entry.triggers,
        createdAt: entry.createdAt,
      })),
    )

    res.json({
      entries: timelineEntries,
      periodDays: DASHBOARD_PERIOD_DAYS,
    })
  }),
)

router.get(
  '/insights',
  validateUserId,
  asyncHandler(async (req, res) => {
    const insights = await Insight.find({
      userId: req.userId,
      confidence: { $gte: 0.15 },
      supportingCount: { $gte: 2 },
    })
      .sort({ confidence: -1 })
      .limit(10)
      .lean()

    res.json({
      insights: insights.map(formatInsightForDashboard),
    })
  }),
)

router.get(
  '/summary',
  validateUserId,
  asyncHandler(async (req, res) => {
    const userId = req.userId!
    const cutoff = getPeriodCutoff(DASHBOARD_PERIOD_DAYS)

    const [totalEntries, periodEntries, allEntryDates, lastEntry] = await Promise.all([
      Journal.countDocuments({ userId }),
      Journal.find({
        userId,
        createdAt: { $gte: cutoff },
        sentimentScore: { $ne: null },
      })
        .select('sentimentScore triggers createdAt')
        .lean(),
      Journal.find({ userId }).select('createdAt').lean(),
      Journal.findOne({ userId }).sort({ createdAt: -1 }).select('createdAt').lean(),
    ])

    const sentimentScores = periodEntries
      .map((entry) => entry.sentimentScore)
      .filter((score): score is number => score !== null)

    const averageSentiment = computeAverageSentiment(sentimentScores) ?? 0
    const allTriggers = periodEntries.flatMap((entry) => entry.triggers)
    const mostCommonTrigger = findMostCommonTrigger(allTriggers)
    const streakDays = computeStreakDays(allEntryDates.map((entry) => entry.createdAt))

    res.json({
      totalEntries,
      averageSentiment,
      mostCommonTrigger,
      streakDays,
      lastEntryDate: lastEntry ? formatDateKey(lastEntry.createdAt) : null,
    })
  }),
)

export default router
