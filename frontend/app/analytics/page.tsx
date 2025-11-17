'use client'

import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import EmptyState from '@/components/EmptyState'
import LoadingSpinner from '@/components/LoadingSpinner'
import SkeletonLoader from '@/components/SkeletonLoader'
import SubjectPerformanceBar from '@/components/charts/SubjectPerformanceBar'
import KnowledgeGapsPie from '@/components/charts/KnowledgeGapsPie'
import AssessmentTrendLine from '@/components/charts/AssessmentTrendLine'
import ScoreDistribution from '@/components/charts/ScoreDistribution'
import LearningPathProgressChart from '@/components/charts/LearningPathProgressChart'
import SubjectComparison from '@/components/charts/SubjectComparison'
import PerformanceOverTime from '@/components/charts/PerformanceOverTime'

interface AnalyticsData {
  subject_scores: Array<{ subject: string; avg_score: number; count: number }>
  knowledge_gaps: { total: number; resolved: number; resolution_rate: number }
  learning_paths: { total: number; completed: number; progress: Array<any> }
  recent_assessments: Array<any>
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/analytics/progress/')
      setData(response.data)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="space-y-6">
          <SkeletonLoader variant="text" className="h-9 w-64" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[1, 2, 3].map(i => (
              <SkeletonLoader key={i} variant="card" className="h-32" />
            ))}
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <SkeletonLoader variant="card" className="h-64" />
            <SkeletonLoader variant="card" className="h-64" />
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Insights</h1>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="stat-card group">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Knowledge Gaps</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {data?.knowledge_gaps.total || 0}
                </p>
                <p className="mt-1 flex items-center gap-1 text-sm text-gray-600">
                  <span
                    className={`inline-flex h-2 w-2 rounded-full ${
                      (data?.knowledge_gaps.resolution_rate || 0) >= 70
                        ? 'bg-success-500'
                        : (data?.knowledge_gaps.resolution_rate || 0) >= 50
                          ? 'bg-warning-500'
                          : 'bg-error-500'
                    }`}
                  />
                  {data?.knowledge_gaps.resolution_rate || 0}% resolved
                </p>
              </div>
              <div className="rounded-lg bg-primary-50 p-3 text-primary-600 transition-transform duration-200 group-hover:scale-110">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="stat-card group">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Learning Paths</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {data?.learning_paths.total || 0}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {data?.learning_paths.completed || 0} completed
                </p>
              </div>
              <div className="rounded-lg bg-success-50 p-3 text-success-600 transition-transform duration-200 group-hover:scale-110">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="stat-card group">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Average Score</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {data && data.subject_scores && data.subject_scores.length > 0
                    ? (
                        data.subject_scores.reduce((sum, s) => sum + s.avg_score, 0) /
                        data.subject_scores.length
                      ).toFixed(1)
                    : '0'}
                  %
                </p>
                <p className="mt-1 text-sm text-gray-600">Across all subjects</p>
              </div>
              <div className="rounded-lg bg-warning-50 p-3 text-warning-600 transition-transform duration-200 group-hover:scale-110">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card-hover rounded-xl bg-white p-6 shadow-soft">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Subject Performance</h2>
            {data && data.subject_scores && data.subject_scores.length > 0 ? (
              <SubjectPerformanceBar data={data.subject_scores} />
            ) : (
              <EmptyState
                title="No assessments yet"
                description="Complete assessments to see your subject performance analytics."
                action={{
                  label: 'View Dashboard',
                  href: '/dashboard',
                }}
              />
            )}
          </div>

          <div className="card-hover rounded-xl bg-white p-6 shadow-soft">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Knowledge Gaps</h2>
            <KnowledgeGapsPie
              total={data?.knowledge_gaps.total || 0}
              resolved={data?.knowledge_gaps.resolved || 0}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card-hover rounded-xl bg-white p-6 shadow-soft">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Score Distribution</h2>
            <ScoreDistribution assessments={data?.recent_assessments || []} />
          </div>

          <div className="card-hover rounded-xl bg-white p-6 shadow-soft">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Performance Over Time</h2>
            <PerformanceOverTime assessments={data?.recent_assessments || []} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="card-hover rounded-xl bg-white p-6 shadow-soft">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Subject Comparison</h2>
            {data && data.subject_scores && data.subject_scores.length > 0 ? (
              <SubjectComparison data={data.subject_scores} />
            ) : (
              <EmptyState
                title="No subject data"
                description="Complete assessments across multiple subjects to see comparisons."
              />
            )}
          </div>
        </div>

        {data &&
          data.learning_paths &&
          data.learning_paths.progress &&
          data.learning_paths.progress.length > 0 && (
            <div className="card-hover rounded-xl bg-white p-6 shadow-soft">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Learning Paths Progress</h2>
              <LearningPathProgressChart progress={data.learning_paths.progress} />
            </div>
          )}

        <div className="card-hover rounded-xl bg-white p-6 shadow-soft">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent Assessments</h2>
          <div className="space-y-3">
            {data && data.recent_assessments && data.recent_assessments.length > 0 ? (
              data.recent_assessments.map(assessment => (
                <div
                  key={assessment.id}
                  className="group rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all duration-200 hover:scale-[1.01] hover:border-primary-300 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{assessment.topic}</p>
                      <p className="text-sm text-gray-600">{assessment.subject}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{assessment.score}%</p>
                      <p className="text-xs text-gray-500">
                        {new Date(assessment.completed_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState
                title="No assessments yet"
                description="Complete your first assessment to see results here."
                action={{
                  label: 'Take Assessment',
                  href: '/dashboard',
                }}
              />
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
