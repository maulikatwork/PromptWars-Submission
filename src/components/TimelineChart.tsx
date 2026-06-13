import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { sentimentToMoodLabel, type TimelineEntry } from '../api/dashboardApi'

const SAMPLE_ENTRIES: TimelineEntry[] = [
  { date: '2026-06-07', sentimentScore: -0.2, emotionalThemes: ['anxiety'], triggers: ['Physics Mock'] },
  { date: '2026-06-08', sentimentScore: -0.55, emotionalThemes: ['stress', 'self-doubt'], triggers: ['parent pressure'] },
  { date: '2026-06-09', sentimentScore: -0.3, emotionalThemes: ['frustration'], triggers: ['Physics Mock'] },
  { date: '2026-06-10', sentimentScore: 0.15, emotionalThemes: ['contentment'], triggers: [] },
  { date: '2026-06-11', sentimentScore: -0.65, emotionalThemes: ['anxiety', 'hopelessness'], triggers: ['mock test'] },
  { date: '2026-06-12', sentimentScore: -0.4, emotionalThemes: ['stress'], triggers: ['parent pressure'] },
  { date: '2026-06-13', sentimentScore: -0.25, emotionalThemes: ['self-reflection'], triggers: [] },
]

interface TimelineChartProps {
  entries: TimelineEntry[]
}

interface ChartPoint {
  date: string
  sentimentScore: number
  label: string
}

function buildChartData(entries: TimelineEntry[]): ChartPoint[] {
  return entries.map((entry) => ({
    date: entry.date,
    sentimentScore: entry.sentimentScore,
    label: format(parseISO(entry.date), 'MMM d'),
  }))
}

function ChartTooltip({
  active,
  payload,
  isSample,
}: {
  active?: boolean
  payload?: Array<{ payload: ChartPoint }>
  isSample?: boolean
}) {
  if (!active || !payload?.length) {
    return null
  }

  const point = payload[0].payload

  return (
    <div className="rounded-lg border border-white/60 bg-white/80 px-3 py-2 shadow-glass backdrop-blur-md">
      <p className="text-sm font-medium text-neutral-800">{point.label}</p>
      <p className="text-sm text-neutral-600">
        Mood: {sentimentToMoodLabel(point.sentimentScore)}
      </p>
      {isSample && (
        <p className="mt-1 text-xs text-neutral-400">Sample data</p>
      )}
    </div>
  )
}

export default function TimelineChart({ entries }: TimelineChartProps) {
  const [chartHeight, setChartHeight] = useState(192)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)')

    const updateHeight = () => {
      setChartHeight(mediaQuery.matches ? 256 : 192)
    }

    updateHeight()
    mediaQuery.addEventListener('change', updateHeight)

    return () => mediaQuery.removeEventListener('change', updateHeight)
  }, [])

  const isSample = entries.length === 0
  const chartData = buildChartData(isSample ? SAMPLE_ENTRIES : entries)

  return (
    <figure role="img" aria-label="Emotional timeline chart, last 30 days">
      {isSample && (
        <p className="mb-2 text-center text-xs text-neutral-400">
          Sample data — your timeline will appear as you journal
        </p>
      )}
      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: '#78716c' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[-1, 1]}
            hide={chartHeight === 192}
            tick={{ fontSize: 12, fill: '#78716c' }}
            axisLine={false}
            tickLine={false}
            width={32}
          />
          <Tooltip content={<ChartTooltip isSample={isSample} />} />
          <Line
            type="monotone"
            dataKey="sentimentScore"
            stroke="#db6f30"
            strokeWidth={2}
            dot={{ r: 4, fill: '#db6f30' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <table className="sr-only">
        <caption>Sentiment by date</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Sentiment score</th>
            <th scope="col">Mood</th>
          </tr>
        </thead>
        <tbody>
          {chartData.map((point) => (
            <tr key={point.date}>
              <td>{point.label}</td>
              <td>{point.sentimentScore.toFixed(2)}</td>
              <td>{sentimentToMoodLabel(point.sentimentScore)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
