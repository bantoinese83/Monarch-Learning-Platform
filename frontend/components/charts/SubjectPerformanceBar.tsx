'use client'

import { ResponsiveBar } from '@nivo/bar'

interface SubjectPerformanceBarProps {
  data: Array<{ subject: string; avg_score: number; count: number }>
}

export default function SubjectPerformanceBar({ data }: SubjectPerformanceBarProps) {
  const chartData = data.map(item => ({
    subject: item.subject,
    score: item.avg_score,
    count: item.count,
  }))

  return (
    <div className="h-64 w-full">
      <ResponsiveBar
        data={chartData}
        keys={['score']}
        indexBy="subject"
        margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
        padding={0.3}
        valueScale={{ type: 'linear', min: 0, max: 100 }}
        indexScale={{ type: 'band', round: true }}
        colors={{ scheme: 'nivo' }}
        borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -45,
          legend: 'Subject',
          legendPosition: 'middle',
          legendOffset: 50,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Average Score (%)',
          legendPosition: 'middle',
          legendOffset: -50,
        }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
        animate={true}
        motionConfig="gentle"
        tooltip={({ value, indexValue, data }: { value: any; indexValue: any; data: any }) => (
          <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
            <div className="text-sm font-semibold text-gray-900">{indexValue}</div>
            <div className="text-xs text-gray-600">
              Score: <span className="font-medium">{value}%</span>
            </div>
            <div className="text-xs text-gray-600">
              Assessments: <span className="font-medium">{data.count}</span>
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
