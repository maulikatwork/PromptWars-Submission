import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
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

  const handleBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate('/journal')
  }, [navigate])

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
        <button
          type="button"
          onClick={handleBack}
          className="mb-4 inline-flex min-h-[44px] items-center gap-2 rounded-lg px-2 py-1 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back
        </button>

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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="mx-auto h-12 w-12 text-neutral-300"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.5V6.75A2.25 2.25 0 0 1 5.25 4.5h13.5A2.25 2.25 0 0 1 21 6.75v6.75M3 13.5l3.6 2.7a1.5 1.5 0 0 0 1.8 0L12 13.5l3.6 2.7a1.5 1.5 0 0 0 1.8 0L21 13.5M3 13.5V18a1.5 1.5 0 0 0 1.5 1.5h15A1.5 1.5 0 0 0 21 18v-4.5"
                  />
                </svg>
                <p className="mt-4 text-base font-medium text-neutral-800">
                  Journal for a few days to unlock your patterns.
                </p>
                <p className="mt-2 text-sm text-neutral-600">
                  You have {data.summary.totalEntries} of {MIN_ENTRIES_FOR_INSIGHTS} entries so far.
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
