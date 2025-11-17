'use client'

import { ResponsiveBar } from '@nivo/bar'

interface PathProgress {
  path_id: number
  name: string
  subject: string
  progress: number
  completed: boolean
}

interface LearningPathProgressChartProps {
  progress: PathProgress[]
}

export default function LearningPathProgressChart({ progress }: LearningPathProgressChartProps) {
  if (!progress || progress.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        No learning paths yet
      </div>
    )
  }

  const data = progress.map(path => ({
    name: path.name.length > 20 ? path.name.substring(0, 20) + '...' : path.name,
    progress: path.progress,
    subject: path.subject,
    completedStatus: path.completed ? 'completed' : 'in_progress',
  }))

  return (
    <div className="h-80 w-full">
      <ResponsiveBar
        data={data}
        keys={['progress']}
        indexBy="name"
        margin={{ top: 20, right: 80, bottom: 100, left: 60 }}
        padding={0.3}
        valueScale={{ type: 'linear', min: 0, max: 100 }}
        indexScale={{ type: 'band', round: true }}
        colors={({ data }: { data: any }) =>
          data.completedStatus === 'completed' ? '#10b981' : '#3b82f6'
        }
        borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -45,
          legend: 'Learning Path',
          legendPosition: 'middle',
          legendOffset: 80,
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
          legend: 'Progress (%)',
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
              Subject: <span className="font-medium">{data.subject}</span>
            </div>
            <div className="text-xs text-gray-600">
              Progress: <span className="font-medium">{value}%</span>
            </div>
            <div className="text-xs text-gray-600">
              Status:{' '}
              <span className="font-medium">
                {data.completedStatus === 'completed' ? 'Completed' : 'In Progress'}
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
        legends={[
          {
            dataFrom: 'indexes',
            anchor: 'right',
            direction: 'column',
            justify: false,
            translateX: 20,
            translateY: 0,
            itemsSpacing: 5,
            itemWidth: 100,
            itemHeight: 18,
            itemTextColor: '#666',
            itemDirection: 'left-to-right',
            itemOpacity: 1,
            symbolSize: 12,
            symbolShape: 'circle',
          },
        ]}
      />
    </div>
  )
}
