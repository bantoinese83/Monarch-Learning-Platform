'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import Link from 'next/link'
import EmptyState from '@/components/EmptyState'
import LoadingSpinner from '@/components/LoadingSpinner'
import SkeletonLoader from '@/components/SkeletonLoader'
import SubjectPerformanceBar from '@/components/charts/SubjectPerformanceBar'
import KnowledgeGapsPie from '@/components/charts/KnowledgeGapsPie'
import AssessmentTrendLine from '@/components/charts/AssessmentTrendLine'
import LearningPathsProgress from '@/components/charts/LearningPathsProgress'

interface ProgressData {
  subject_scores: Array<{ subject: string; avg_score: number; count: number }>
  knowledge_gaps: { total: number; resolved: number; resolution_rate: number }
  learning_paths: { total: number; completed: number; progress: Array<any> }
  recent_assessments: Array<any>
}

export default function DashboardPage() {
  const [progress, setProgress] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProgress()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchProgress = async () => {
    try {
      const response = await api.get('/analytics/progress/')
      setProgress(response.data)
    } catch (error) {
      console.error('Failed to fetch progress:', error)
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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="stat-card group">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Knowledge Gaps</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {progress?.knowledge_gaps.total || 0}
                </p>
                <p className="mt-1 flex items-center gap-1 text-sm text-gray-600">
                  <span
                    className={`inline-flex h-2 w-2 rounded-full ${
                      (progress?.knowledge_gaps.resolution_rate || 0) >= 70
                        ? 'bg-success-500'
                        : (progress?.knowledge_gaps.resolution_rate || 0) >= 50
                          ? 'bg-warning-500'
                          : 'bg-error-500'
                    }`}
                  />
                  {progress?.knowledge_gaps.resolution_rate || 0}% resolved
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
                  {progress?.learning_paths.total || 0}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {progress?.learning_paths.completed || 0} completed
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
                <h3 className="text-sm font-medium text-gray-500">Recent Assessments</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {progress?.recent_assessments.length || 0}
                </p>
                <p className="mt-1 text-sm text-gray-600">Last 10 assessments</p>
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
            {progress && progress.subject_scores && progress.subject_scores.length > 0 ? (
              <SubjectPerformanceBar data={progress.subject_scores} />
            ) : (
              <EmptyState
                title="No assessments yet"
                description="Complete assessments to see your subject performance here."
                action={{
                  label: 'Take Assessment',
                  href: '/analytics',
                }}
              />
            )}
          </div>

          <div className="card-hover rounded-xl bg-white p-6 shadow-soft">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Knowledge Gaps</h2>
            <KnowledgeGapsPie
              total={progress?.knowledge_gaps.total || 0}
              resolved={progress?.knowledge_gaps.resolved || 0}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card-hover rounded-xl bg-white p-6 shadow-soft">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Assessment Trends</h2>
            <AssessmentTrendLine assessments={progress?.recent_assessments || []} />
          </div>

          <div className="card-hover rounded-xl bg-white p-6 shadow-soft">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Learning Paths Progress</h2>
            <LearningPathsProgress
              total={progress?.learning_paths.total || 0}
              completed={progress?.learning_paths.completed || 0}
            />
          </div>
        </div>

        <div className="card-hover rounded-xl bg-white p-6 shadow-soft">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Link
              href="/content"
              className="group flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3 text-center font-medium text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:from-primary-700 hover:to-primary-800 hover:shadow-lg active:scale-[0.98]"
            >
              <svg
                className="h-5 w-5 transition-transform duration-200 group-hover:scale-110"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              Upload Content
            </Link>
            <Link
              href="/tutor"
              className="group flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-center font-medium text-gray-700 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-gray-50 hover:shadow-md active:scale-[0.98]"
            >
              <svg
                className="h-5 w-5 transition-transform duration-200 group-hover:scale-110"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              Ask Tutor Bot
            </Link>
            <Link
              href="/analytics"
              className="group flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-center font-medium text-gray-700 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-gray-50 hover:shadow-md active:scale-[0.98]"
            >
              <svg
                className="h-5 w-5 transition-transform duration-200 group-hover:scale-110"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              View Analytics
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}
