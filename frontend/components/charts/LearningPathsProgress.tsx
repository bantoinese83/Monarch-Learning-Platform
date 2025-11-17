'use client'

import { ResponsiveBar } from '@nivo/bar'

interface LearningPathsProgressProps {
  total: number
  completed: number
}

export default function LearningPathsProgress({ total, completed }: LearningPathsProgressProps) {
  const inProgress = total - completed

  const data = [
    {
      status: 'Completed',
      value: completed,
      color: '#10b981',
    },
    {
      status: 'In Progress',
      value: inProgress,
      color: '#3b82f6',
    },
  ].filter(item => item.value > 0)

  if (total === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        No learning paths yet
      </div>
    )
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveBar
        data={data}
        keys={['value']}
        indexBy="status"
        margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
        padding={0.4}
        valueScale={{ type: 'linear' }}
        indexScale={{ type: 'band', round: true }}
        colors={({ data }: { data: any }) => data.color}
        borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Status',
          legendPosition: 'middle',
          legendOffset: 40,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Count',
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
            <div className="text-sm font-semibold text-gray-900">{indexValue}</div>
            <div className="text-xs text-gray-600">
              Count: <span className="font-medium">{value}</span>
            </div>
            <div className="text-xs text-gray-600">
              Percentage:{' '}
              <span className="font-medium">
                {total > 0 ? ((Number(value) / total) * 100).toFixed(1) : 0}%
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
