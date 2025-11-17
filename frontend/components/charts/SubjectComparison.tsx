'use client'

import { ResponsiveBar } from '@nivo/bar'

interface SubjectScore {
  subject: string
  avg_score: number
  count: number
}

interface SubjectComparisonProps {
  data: SubjectScore[]
}

export default function SubjectComparison({ data }: SubjectComparisonProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        No subject data available
      </div>
    )
  }

  const chartData = data.map(item => ({
    subject: item.subject,
    'Average Score': item.avg_score,
    'Assessment Count': item.count,
  }))

  return (
    <div className="h-80 w-full">
      <ResponsiveBar
        data={chartData}
        keys={['Average Score', 'Assessment Count']}
        indexBy="subject"
        margin={{ top: 20, right: 80, bottom: 50, left: 60 }}
        padding={0.3}
        valueScale={{ type: 'linear' }}
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
          legend: 'Value',
          legendPosition: 'middle',
          legendOffset: -50,
        }}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
        animate={true}
        motionConfig="gentle"
        tooltip={({
          id,
          value,
          indexValue,
          data,
        }: {
          id: any
          value: any
          indexValue: any
          data: any
        }) => (
          <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
            <div className="text-sm font-semibold text-gray-900">{indexValue}</div>
            <div className="text-xs text-gray-600">
              {id === 'Average Score' ? 'Average Score' : 'Assessment Count'}:{' '}
              <span className="font-medium">{id === 'Average Score' ? `${value}%` : value}</span>
            </div>
            {id === 'Average Score' && (
              <div className="text-xs text-gray-600">
                Total Assessments: <span className="font-medium">{data['Assessment Count']}</span>
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
            dataFrom: 'keys',
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
