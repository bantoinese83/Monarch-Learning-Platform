'use client'

import { ResponsiveLine } from '@nivo/line'

interface Assessment {
  id: number
  subject: string
  topic: string
  score: number
  completed_at: string
}

interface PerformanceOverTimeProps {
  assessments: Assessment[]
}

export default function PerformanceOverTime({ assessments }: PerformanceOverTimeProps) {
  if (!assessments || assessments.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        No assessment data available
      </div>
    )
  }

  // Sort by date
  const sortedAssessments = [...assessments].sort(
    (a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
  )

  // Create data points with date labels
  const data = [
    {
      id: 'Overall Performance',
      color: '#3b82f6',
      data: sortedAssessments.map((assessment, index) => ({
        x: index + 1,
        y: assessment.score,
        date: new Date(assessment.completed_at).toLocaleDateString(),
        subject: assessment.subject,
        topic: assessment.topic,
      })),
    },
  ]

  // Calculate moving average (last 3 assessments)
  const movingAverage = sortedAssessments
    .map((_, index) => {
      if (index < 2) return null
      const recent = sortedAssessments.slice(Math.max(0, index - 2), index + 1)
      const avg = recent.reduce((sum, a) => sum + a.score, 0) / recent.length
      return {
        x: index + 1,
        y: avg,
      }
    })
    .filter((item): item is { x: number; y: number } => item !== null)

  const dataWithAverage = [
    ...data,
    {
      id: 'Moving Average (3)',
      color: '#10b981',
      data: movingAverage,
    },
  ]

  return (
    <div className="h-80 w-full">
      <ResponsiveLine
        data={dataWithAverage}
        margin={{ top: 20, right: 110, bottom: 50, left: 60 }}
        xScale={{ type: 'linear', min: 'auto', max: 'auto' }}
        yScale={{ type: 'linear', min: 0, max: 100 }}
        curve="monotoneX"
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Assessment Number',
          legendPosition: 'middle',
          legendOffset: 40,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Score (%)',
          legendPosition: 'middle',
          legendOffset: -50,
        }}
        pointSize={8}
        pointColor={{ theme: 'background' }}
        pointBorderWidth={2}
        pointBorderColor={{ from: 'serieColor' }}
        pointLabelYOffset={-12}
        enableArea={true}
        areaOpacity={0.1}
        useMesh={true}
        tooltip={({ point }: { point: any }) => (
          <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
            <div className="text-sm font-semibold text-gray-900">{point.serieId}</div>
            <div className="text-xs text-gray-600">
              Score: <span className="font-medium">{point.data.y}%</span>
            </div>
            {point.data.date && (
              <div className="text-xs text-gray-600">
                Date: <span className="font-medium">{point.data.date}</span>
              </div>
            )}
            {point.data.subject && (
              <div className="text-xs text-gray-600">
                Subject: <span className="font-medium">{point.data.subject}</span>
              </div>
            )}
            {point.data.topic && (
              <div className="text-xs text-gray-600">
                Topic: <span className="font-medium">{point.data.topic}</span>
              </div>
            )}
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
        legends={[
          {
            anchor: 'bottom-right',
            direction: 'column',
            justify: false,
            translateX: 100,
            translateY: 0,
            itemsSpacing: 0,
            itemDirection: 'left-to-right',
            itemWidth: 80,
            itemHeight: 20,
            itemOpacity: 0.75,
            symbolSize: 12,
            symbolShape: 'circle',
          },
        ]}
      />
    </div>
  )
}
