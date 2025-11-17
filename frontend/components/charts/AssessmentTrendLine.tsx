'use client'

import { ResponsiveLine } from '@nivo/line'

interface Assessment {
  id: number
  subject: string
  topic: string
  score: number
  completed_at: string
}

interface AssessmentTrendLineProps {
  assessments: Assessment[]
}

export default function AssessmentTrendLine({ assessments }: AssessmentTrendLineProps) {
  if (!assessments || assessments.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-gray-500">
        No assessment data available
      </div>
    )
  }

  // Group assessments by subject and create time series
  const subjects = Array.from(new Set(assessments.map(a => a.subject)))
  const data = subjects.map(subject => {
    const subjectAssessments = assessments
      .filter(a => a.subject === subject)
      .sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime())

    return {
      id: subject,
      color: `hsl(${Math.random() * 360}, 70%, 50%)`,
      data: subjectAssessments.map((assessment, index) => ({
        x: index + 1,
        y: assessment.score,
        date: new Date(assessment.completed_at).toLocaleDateString(),
        topic: assessment.topic,
      })),
    }
  })

  return (
    <div className="h-64 w-full">
      <ResponsiveLine
        data={data}
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
