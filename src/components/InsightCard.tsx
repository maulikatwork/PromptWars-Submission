import { format, parseISO } from 'date-fns'
import { type DashboardInsight } from '../api/dashboardApi'

interface InsightCardProps {
  insight: DashboardInsight
}

function formatObservedDate(dateKey: string): string {
  return format(parseISO(dateKey), 'MMM d')
}

export default function InsightCard({ insight }: InsightCardProps) {
  const confidencePercent = Math.round(insight.confidence * 100)

  return (
    <article className="glass-card p-4 transition hover:shadow-glass-lg">
      <p className="text-sm font-medium text-neutral-500">Trigger: {insight.triggerLabel}</p>
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

export function InsightEmptyState() {
  return (
    <p className="glass-card border-dashed border-white/60 p-6 text-center text-sm text-neutral-600">
      Your patterns will surface here as you journal more.
    </p>
  )
}
