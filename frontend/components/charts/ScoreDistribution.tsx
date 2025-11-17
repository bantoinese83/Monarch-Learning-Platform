'use client'

import { ResponsiveBar } from '@nivo/bar'

interface Assessment {
  id: number
  score: number
  subject: string
  topic: string
  completed_at: string
}

interface ScoreDistributionProps {
  assessments: Assessment[]
}

export default function ScoreDistribution({ assessments }: ScoreDistributionProps) {
  if (!assessments || assessments.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        No assessment data available
      </div>
    )
  }

  // Create score ranges: 0-20, 21-40, 41-60, 61-80, 81-100
  const ranges = [
    { range: '0-20', min: 0, max: 20, count: 0 },
    { range: '21-40', min: 21, max: 40, count: 0 },
    { range: '41-60', min: 41, max: 60, count: 0 },
    { range: '61-80', min: 61, max: 80, count: 0 },
    { range: '81-100', min: 81, max: 100, count: 0 },
  ]

  assessments.forEach(assessment => {
    const score = assessment.score
    const range = ranges.find(r => score >= r.min && score <= r.max)
    if (range) {
      range.count++
    }
  })

  const data = ranges.map(range => ({
    range: range.range,
    count: range.count,
  }))

  const getColor = (range: string) => {
    if (range === '81-100') return '#10b981' // green
    if (range === '61-80') return '#3b82f6' // blue
    if (range === '41-60') return '#f59e0b' // yellow
    if (range === '21-40') return '#f97316' // orange
    return '#ef4444' // red
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveBar
        data={data}
        keys={['count']}
        indexBy="range"
        margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
        padding={0.3}
        valueScale={{ type: 'linear' }}
        indexScale={{ type: 'band', round: true }}
        colors={({ data }) => getColor(data.range)}
        borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Score Range',
          legendPosition: 'middle',
          legendOffset: 40,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Number of Assessments',
          legendPosition: 'middle',
          legendOffset: -50,
        }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
        animate={true}
        motionConfig="gentle"
        tooltip={({ value, indexValue }: { value: any; indexValue: any }) => (
          <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
            <div className="text-sm font-semibold text-gray-900">Score: {indexValue}</div>
            <div className="text-xs text-gray-600">
              Assessments: <span className="font-medium">{value}</span>
            </div>
            <div className="text-xs text-gray-600">
              Percentage:{' '}
              <span className="font-medium">
                {assessments.length > 0
                  ? ((Number(value) / assessments.length) * 100).toFixed(1)
                  : 0}
                %
              </span>
            </div>
          </div>
        )}
        theme={{
          axis: {
            domain: {
              line: {
                stroke: '#e0e0e0',
                strokeWidth: 1,
              },
            },
            ticks: {
              line: {
                stroke: '#e0e0e0',
                strokeWidth: 1,
              },
              text: {
                fill: '#666',
                fontSize: 12,
              },
            },
            legend: {
              text: {
                fill: '#666',
                fontSize: 12,
              },
            },
          },
          grid: {
            line: {
              stroke: '#f0f0f0',
              strokeWidth: 1,
            },
          },
        }}
      />
    </div>
  )
}
