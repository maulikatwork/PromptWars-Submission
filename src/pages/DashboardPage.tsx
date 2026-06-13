import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchInsights,
  fetchSummary,
  fetchTimeline,
  type DashboardInsight,
  type SummaryResponse,
  type TimelineEntry,
} from '../api/dashboardApi'
import InsightCard, { InsightEmptyState } from '../components/InsightCard'
import SkeletonLoader from '../components/SkeletonLoader'
import StickyHeader from '../components/StickyHeader'
import SummaryCard from '../components/SummaryCard'
import TimelineChart from '../components/TimelineChart'
import { useUser } from '../context/UserContext'
import { readStoredProfile } from '../types/user'

const MIN_ENTRIES_FOR_INSIGHTS = 5

interface DashboardData {
  timeline: TimelineEntry[]
  insights: DashboardInsight[]
  summary: SummaryResponse
}

export default function DashboardPage() {
  const { ensureUserId } = useUser()
  const profile = readStoredProfile()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadDashboard = useCallback(async () => {
    const userId = ensureUserId()
    setIsLoading(true)
    setLoadError(null)

    try {
      const [timelineResponse, insightsResponse, summaryResponse] = await Promise.all([
        fetchTimeline(userId),
        fetchInsights(userId),
        fetchSummary(userId),
      ])

      setData({
        timeline: timelineResponse.entries,
        insights: insightsResponse.insights,
        summary: summaryResponse,
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Something went wrong. Please try again.'
      setLoadError(message)
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [ensureUserId])

  useEffect(() => {
    void loadDashboard()
  }, [loadDashboard])

  if (!profile) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4">
        <p className="text-center text-base text-neutral-600">
          Complete onboarding in your journal before viewing the dashboard.
        </p>
        <Link
          to="/journal"
          className="rounded-xl bg-primary-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        >
          Go to Journal
        </Link>
      </main>
    )
  }

  const showEmptyState = data !== null && data.summary.totalEntries < MIN_ENTRIES_FOR_INSIGHTS

  return (
    <div className="flex min-h-dvh flex-col bg-neutral-50">
      <StickyHeader studentName={profile.name} />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
        {isLoading && <SkeletonLoader rows={5} />}

        {!isLoading && loadError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-center" role="alert">
            <p className="text-sm text-red-700">{loadError}</p>
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="mt-4 rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
            >
              Try again
            </button>
          </div>
        )}

        {!isLoading && !loadError && data && (
          <div className="flex flex-col gap-8">
            <SummaryCard summary={data.summary} />

            {showEmptyState && (
              <section className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-center">
                <p className="text-base font-medium text-neutral-800">Keep journaling</p>
                <p className="mt-2 text-sm text-neutral-600">
                  Your dashboard insights unlock after {MIN_ENTRIES_FOR_INSIGHTS} entries. You
                  have {data.summary.totalEntries} so far.
                </p>
                <Link
                  to="/journal"
                  className="mt-4 inline-block rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                >
                  Back to Journal
                </Link>
              </section>
            )}

            <section aria-labelledby="timeline-heading">
              <h2 id="timeline-heading" className="mb-3 text-lg font-semibold text-neutral-800">
                Emotional Timeline
              </h2>
              <TimelineChart entries={data.timeline} />
            </section>

            <section aria-labelledby="patterns-heading">
              <h2 id="patterns-heading" className="mb-3 text-lg font-semibold text-neutral-800">
                Your Patterns
              </h2>
              {data.insights.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {data.insights.map((insight) => (
                    <InsightCard key={insight.id} insight={insight} />
                  ))}
                </div>
              ) : (
                <InsightEmptyState />
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  )
}
