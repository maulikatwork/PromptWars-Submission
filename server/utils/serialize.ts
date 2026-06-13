import type { IJournalDocument } from '../models/Journal'
import type { IInsightDocument } from '../models/Insight'
import type { IUserDocument } from '../models/User'

export interface UserProfileResponse {
  name: string
  exam: string
  targetDate: string | null
}

function formatDateOnly(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

export function formatUserProfile(user: IUserDocument): UserProfileResponse {
  return {
    name: user.name,
    exam: user.exam,
    targetDate: user.targetDate ? formatDateOnly(user.targetDate) : null,
  }
}

export function formatJournalEntry(journal: IJournalDocument) {
  return {
    id: journal._id.toString(),
    rawText: journal.rawText,
    sentimentScore: journal.sentimentScore,
    emotionalThemes: journal.emotionalThemes,
    triggers: journal.triggers,
    distressLevel: journal.distressLevel,
    createdAt: journal.createdAt,
  }
}

export function formatInsight(insight: IInsightDocument) {
  return {
    id: insight._id.toString(),
    pattern: insight.pattern,
    triggerLabel: insight.triggerLabel,
    outcomeLabel: insight.outcomeLabel,
    confidence: insight.confidence,
    supportingCount: insight.supportingCount,
    firstObserved: insight.firstObserved,
    lastObserved: insight.lastObserved,
    createdAt: insight.createdAt,
  }
}
