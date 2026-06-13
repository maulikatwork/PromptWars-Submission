import { format, parseISO } from 'date-fns'
import { type DashboardInsight } from '../api/dashboardApi'

export const SAMPLE_INSIGHTS: DashboardInsight[] = [
  {
    id: 'sample-1',
    pattern: 'Anxiety spikes before Physics Mock',
    triggerLabel: 'Physics Mock',
    outcomeLabel: 'anxiety',
    confidence: 0.72,
    supportingCount: 4,
    firstObserved: '2026-06-07',
    lastObserved: '2026-06-13',
  },
  {
    id: 'sample-2',
    pattern: 'Stress spikes before parent pressure',
    triggerLabel: 'parent pressure',
    outcomeLabel: 'stress',
    confidence: 0.58,
    supportingCount: 3,
    firstObserved: '2026-06-08',
    lastObserved: '2026-06-13',
  },
]

interface InsightCardProps {
  insight: DashboardInsight
  isSample?: boolean
}

function formatObservedDate(dateKey: string): string {
  return format(parseISO(dateKey), 'MMM d')
}

export default function InsightCard({ insight, isSample }: InsightCardProps) {
  const confidencePercent = Math.round(insight.confidence * 100)

  return (
    <article className="glass-card p-4 transition hover:shadow-glass-lg">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-neutral-500">Trigger: {insight.triggerLabel}</p>
        {isSample && (
          <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-400">
            Sample
          </span>
        )}
      </div>
      <h3 className="mt-1 text-base font-semibold text-neutral-800">{insight.pattern}</h3>

      <div className="mt-3 flex items-center gap-3">
        <div
          role="progressbar"
          aria-valuenow={confidencePercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${confidencePercent} percent confident`}
          className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200"
        >
          <div
            className="h-full rounded-full bg-primary-400 transition-all"
            style={{ width: `${confidencePercent}%` }}
          />
        </div>
        <span className="font-mono text-sm text-neutral-600">{confidencePercent}% confident</span>
      </div>

      <p className="mt-2 text-sm text-neutral-500">
        {insight.supportingCount} entries · Since {formatObservedDate(insight.firstObserved)}
      </p>
    </article>
  )
}

