export interface TimelineEntry {
  date: string
  sentimentScore: number
  emotionalThemes: string[]
  triggers: string[]
}

export interface TimelineResponse {
  entries: TimelineEntry[]
  periodDays: number
}

export interface DashboardInsight {
  id: string
  pattern: string
  triggerLabel: string
  outcomeLabel: string
  confidence: number
  supportingCount: number
  firstObserved: string
  lastObserved: string
}

export interface InsightsResponse {
  insights: DashboardInsight[]
}

export interface SummaryResponse {
  totalEntries: number
  averageSentiment: number
  mostCommonTrigger: string | null
  streakDays: number
  lastEntryDate: string | null
}

export class DashboardApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'DashboardApiError'
    this.status = status
  }
}

async function parseDashboardResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = 'Something went wrong. Please try again.'

    try {
      const body = (await response.json()) as { error?: string }
      if (body.error) {
        message = body.error
      }
    } catch {
      // Use default message when response body is not JSON.
    }

    throw new DashboardApiError(response.status, message)
  }

  return response.json() as Promise<T>
}

function dashboardHeaders(userId: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-User-ID': userId,
  }
}

export async function fetchTimeline(userId: string): Promise<TimelineResponse> {
  const response = await fetch('/api/dashboard/timeline', {
    headers: dashboardHeaders(userId),
  })

  return parseDashboardResponse<TimelineResponse>(response)
}

export async function fetchInsights(userId: string): Promise<InsightsResponse> {
  const response = await fetch('/api/dashboard/insights', {
    headers: dashboardHeaders(userId),
  })

  return parseDashboardResponse<InsightsResponse>(response)
}

export async function fetchSummary(userId: string): Promise<SummaryResponse> {
  const response = await fetch('/api/dashboard/summary', {
    headers: dashboardHeaders(userId),
  })

  return parseDashboardResponse<SummaryResponse>(response)
}

export { sentimentToMoodLabel } from '../utils/sentimentLabel'

export function formatLastEntryLabel(lastEntryDate: string | null): string {
  if (!lastEntryDate) {
    return 'No entries yet'
  }

  const todayKey = [
    new Date().getFullYear(),
    String(new Date().getMonth() + 1).padStart(2, '0'),
    String(new Date().getDate()).padStart(2, '0'),
  ].join('-')

  if (lastEntryDate === todayKey) {
    return 'Today'
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayKey = [
    yesterday.getFullYear(),
    String(yesterday.getMonth() + 1).padStart(2, '0'),
    String(yesterday.getDate()).padStart(2, '0'),
  ].join('-')

  if (lastEntryDate === yesterdayKey) {
    return 'Yesterday'
  }

  const [year, month, day] = lastEntryDate.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}
