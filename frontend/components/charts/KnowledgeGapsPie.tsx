'use client'

import { ResponsivePie } from '@nivo/pie'

interface KnowledgeGapsPieProps {
  total: number
  resolved: number
}

export default function KnowledgeGapsPie({ total, resolved }: KnowledgeGapsPieProps) {
  const unresolved = total - resolved

  const data = [
    {
      id: 'resolved',
      label: 'Resolved',
      value: resolved,
      color: '#10b981',
    },
    {
      id: 'unresolved',
      label: 'Unresolved',
      value: unresolved,
      color: '#ef4444',
    },
  ].filter(item => item.value > 0)

  if (total === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        No knowledge gaps yet
      </div>
    )
  }

  return (
    <div className="h-64 w-full">
      <ResponsivePie
        data={data}
        margin={{ top: 20, right: 80, bottom: 20, left: 80 }}
        innerRadius={0.5}
        padAngle={2}
        cornerRadius={4}
        activeOuterRadiusOffset={8}
        colors={{ datum: 'data.color' }}
        borderWidth={2}
        borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
        arcLinkLabelsSkipAngle={10}
        arcLinkLabelsTextColor="#333333"
        arcLinkLabelsThickness={2}
        arcLinkLabelsColor={{ from: 'color' }}
        arcLabelsSkipAngle={10}
        arcLabelsTextColor="#ffffff"
        tooltip={({ datum }: { datum: any }) => (
          <div className="rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
            <div className="text-sm font-semibold text-gray-900">{datum.label}</div>
            <div className="text-xs text-gray-600">
              Count: <span className="font-medium">{datum.value}</span>
            </div>
            <div className="text-xs text-gray-600">
              Percentage: <span className="font-medium">{datum.formattedValue}</span>
            </div>
          </div>
        )}
        theme={{
          labels: {
            text: {
              fontSize: 12,
              fill: '#ffffff',
              fontWeight: 600,
            },
          },
          tooltip: {
            container: {
              background: 'white',
            },
          },
        }}
        legends={[
          {
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
