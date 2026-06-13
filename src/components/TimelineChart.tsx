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
}: {
  active?: boolean
  payload?: Array<{ payload: ChartPoint }>
}) {
  if (!active || !payload?.length) {
    return null
  }

  const point = payload[0].payload

  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-sm">
      <p className="text-sm font-medium text-neutral-800">{point.label}</p>
      <p className="text-sm text-neutral-600">
        Mood: {sentimentToMoodLabel(point.sentimentScore)}
      </p>
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

  if (entries.length < 3) {
    return (
      <p className="flex h-48 items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white px-4 text-center text-sm text-neutral-600 md:h-64">
        Keep journaling — your emotional timeline will appear after a few more entries.
      </p>
    )
  }

  const chartData = buildChartData(entries)

  return (
    <figure role="img" aria-label="Emotional timeline chart, last 30 days">
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
          <Tooltip content={<ChartTooltip />} />
          <Line
            type="monotone"
            dataKey="sentimentScore"
            stroke="#5c825c"
            strokeWidth={2}
            dot={{ r: 4, fill: '#5c825c' }}
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
