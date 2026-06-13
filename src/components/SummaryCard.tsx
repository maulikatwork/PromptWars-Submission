import {
  formatLastEntryLabel,
  sentimentToMoodLabel,
  type SummaryResponse,
} from '../api/dashboardApi'

interface SummaryCardProps {
  summary: SummaryResponse
}

export default function SummaryCard({ summary }: SummaryCardProps) {
  const moodLabel = sentimentToMoodLabel(summary.averageSentiment)
  const lastEntryLabel = formatLastEntryLabel(summary.lastEntryDate)

  return (
    <section
      aria-label="Journal summary"
      className="rounded-2xl border border-primary-200 bg-primary-50 p-5"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-neutral-600">Entries</p>
          <p className="font-mono text-2xl font-semibold text-neutral-800">
            {summary.totalEntries}
          </p>
        </div>
        <div>
          <p className="text-sm text-neutral-600">Streak</p>
          <p className="font-mono text-2xl font-semibold text-neutral-800">
            {summary.streakDays}-day
          </p>
        </div>
        <div>
          <p className="text-sm text-neutral-600">Avg mood</p>
          <p className="font-mono text-lg font-semibold text-neutral-800">{moodLabel}</p>
        </div>
        <div>
          <p className="text-sm text-neutral-600">Last entry</p>
          <p className="font-mono text-lg font-semibold text-neutral-800">{lastEntryLabel}</p>
        </div>
      </div>
      {summary.mostCommonTrigger && (
        <p className="mt-4 text-sm text-neutral-600">
          Most common trigger:{' '}
          <span className="font-medium text-neutral-800">{summary.mostCommonTrigger}</span>
        </p>
      )}
    </section>
  )
}
