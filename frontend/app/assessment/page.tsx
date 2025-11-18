'use client'

import { Suspense, useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Layout from '@/components/Layout'
import Button from '@/components/Button'
import api from '@/lib/api'
import CircleAnimation from '@/components/CircleAnimation'
import EmptyState from '@/components/EmptyState'

interface Question {
  id: string
  question: string
  options: string[]
  correct_answer: string
  explanation?: string
}

interface Assessment {
  id: string
  subject: string
  topic: string
  questions: Question[]
}

function AssessmentPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [availableSubjects, setAvailableSubjects] = useState<string[]>([])
  const [subjectFromUrl, setSubjectFromUrl] = useState<string | null>(null)
  const [subject, setSubject] = useState<string | null>(null)
  const topic = searchParams.get('topic') || 'Mixed Topics'

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isMountedRef = useRef(true)
  const latestRequestRef = useRef(0)
  const isLoadingRef = useRef(false)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Fetch available subjects from content
  useEffect(() => {
    const fetchAvailableSubjects = async () => {
      try {
        const response = await api.get('/content/files/')
        const contents = response.data.results || response.data
        // Extract unique subjects from indexed content
        const subjects = Array.from(new Set(
          contents
            .filter((c: any) => c.indexed && c.subject)
            .map((c: any) => c.subject as string)
        )) as string[]
        setAvailableSubjects(subjects)
        
        // Get subject from URL
        const urlSubject = searchParams.get('subject')
        setSubjectFromUrl(urlSubject)
        
        // Determine which subject to use
        if (urlSubject && urlSubject !== 'General') {
          // Use subject from URL if it's valid
          setSubject(urlSubject)
        } else if (subjects.length > 0) {
          // Use first available subject if no subject in URL or URL has "General"
          setSubject(subjects[0])
          // Update URL if it was "General" or missing
          if (!urlSubject || urlSubject === 'General') {
            router.replace(`/assessment?subject=${encodeURIComponent(subjects[0])}&topic=${encodeURIComponent(topic)}`)
          }
        } else {
          // No subjects available
          setSubject(null)
        }
      } catch (error) {
        console.error('Failed to fetch available subjects:', error)
        setSubject(null)
      }
    }
    
    fetchAvailableSubjects()
  }, [searchParams, topic, router])

  const loadAssessment = useCallback(async () => {
    // Don't load if no subject is available
    if (!subject) {
      setLoading(false)
      return
    }
    // Prevent multiple simultaneous requests
    if (isLoadingRef.current) {
      console.log('Assessment load already in progress, skipping...')
      return
    }

    const requestId = latestRequestRef.current + 1
    latestRequestRef.current = requestId
    isLoadingRef.current = true
    
    try {
      setLoading(true)
      setError(null)

      // Generate personalized assessment using AI
      // Use longer timeout for assessment generation (5 minutes)
      const response = await api.get('/auth/generate-assessment/', {
        params: {
          subject,
          topic,
          num_questions: 5
        },
        timeout: 300000 // 5 minutes for assessment generation with AI
      })

      // Check if this request is still valid (only check requestId, not mount status)
      // React StrictMode causes unmount/remount in dev, so we only check requestId
      if (latestRequestRef.current !== requestId) {
        console.log('Request cancelled - newer request started')
        isLoadingRef.current = false
        return
      }

      // Validate response data
      if (!response.data || !response.data.questions || !Array.isArray(response.data.questions)) {
        throw new Error('Invalid assessment response format')
      }

      const assessmentData: Assessment = {
        id: response.data.id,
        subject: response.data.subject,
        topic: response.data.topic,
        questions: response.data.questions.map((q: any, index: number) => ({
          id: q.id || `q${index + 1}`,
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation
        }))
      }

      setAssessment(assessmentData)
      setAnswers({})
      setCurrentQuestionIndex(0)
      setShowResults(false)
      setLoading(false)
      isLoadingRef.current = false
    } catch (error: any) {
      console.error('Failed to load assessment:', error)

      // Check if this request is still valid (only check requestId)
      if (latestRequestRef.current !== requestId) {
        isLoadingRef.current = false
        return
      }

      // Show error message - no fallback assessment
      // Prioritize details over error for more specific messages
      const errorMessage = error.response?.data?.details ||
                          error.response?.data?.error || 
                          error.message ||
                          'Failed to generate assessment. Please try again.'
      setError(errorMessage)
      setAssessment(null)
      setLoading(false)
      isLoadingRef.current = false
    }
  }, [subject, topic])

  // Load assessment when subject is determined
  useEffect(() => {
    if (subject && !isLoadingRef.current) {
      setAssessment(null)
      setError(null)
      setLoading(true)
      loadAssessment()
    }
  }, [subject, loadAssessment])

  const handleAnswerSelect = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < (assessment?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  const handleSubmit = async () => {
    if (!assessment) return

    try {
      setSubmitting(true)

      // Calculate score
      let correct = 0
      assessment.questions.forEach(question => {
        if (answers[question.id] === question.correct_answer) {
          correct++
        }
      })

      const score = (correct / assessment.questions.length) * 100

      // Submit assessment to backend
      await api.post('/auth/assessments/', {
        subject: assessment.subject,
        topic: assessment.topic,
        score: Math.round(score),
        max_score: 100,
        metadata: {
          total_questions: assessment.questions.length,
          correct_answers: correct,
          answers: answers
        }
      })

      setShowResults(true)
    } catch (error) {
      console.error('Failed to submit assessment:', error)
      alert('Failed to submit assessment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRestart = () => {
    setAnswers({})
    setCurrentQuestionIndex(0)
    setShowResults(false)
  }

  const handleBackToDashboard = () => {
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <CircleAnimation
            type="interconnecting-waves"
            size="lg"
            text="Generating personalized assessment..."
            title="AI Processing"
            color="#0ea5e9"
          />
          {error && (
            <div className="mt-4 max-w-md">
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <Button onClick={loadAssessment} variant="secondary">
                Try Again
              </Button>
            </div>
          )}
        </div>
      </Layout>
    )
  }

  // Show empty state if no subject is available
  if (!subject && !loading) {
    return (
      <Layout>
        <EmptyState
          icon={
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          }
          title="No Content Available"
          description="You need to upload and index educational content first before assessments can be generated. Upload your materials to get started with personalized assessments."
          action={{
            label: 'Upload Content',
            href: '/content'
          }}
          secondaryAction={{
            label: 'Back to Dashboard',
            href: '/dashboard'
          }}
        />
      </Layout>
    )
  }

  if (!assessment && !loading) {
    // Determine empty state message based on error
    const isNoContentError = error?.toLowerCase().includes('no educational content') || 
                             error?.toLowerCase().includes('upload content') ||
                             error?.toLowerCase().includes('cannot generate \'general\'')
    
    const emptyStateTitle = isNoContentError 
      ? 'No Content Available'
      : 'Assessment Generation Failed'
    
    const emptyStateDescription = isNoContentError
      ? 'You need to upload educational content first before assessments can be generated. Upload your materials to get started with personalized assessments.'
      : error || 'Unable to generate assessment at this time. Please try again or contact support if the issue persists.'

    const emptyStateIcon = (
      <svg
        className="mx-auto h-16 w-16 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    )

    return (
      <Layout>
        <EmptyState
          icon={emptyStateIcon}
          title={emptyStateTitle}
          description={emptyStateDescription}
          action={
            isNoContentError
              ? {
                  label: 'Upload Content',
                  href: '/content'
                }
              : {
                  label: 'Try Again',
                  href: '#',
                  onClick: () => {
                    loadAssessment()
                  }
                }
          }
          secondaryAction={
            !isNoContentError
              ? {
                  label: 'Back to Dashboard',
                  href: '/dashboard'
                }
              : undefined
          }
        />
      </Layout>
    )
  }

  // At this point, assessment must exist (TypeScript guard)
  if (!assessment) {
    return null
  }

  const currentQuestion = assessment.questions[currentQuestionIndex]
  const isAnswered = answers[currentQuestion.id]
  const isLastQuestion = currentQuestionIndex === assessment.questions.length - 1

  if (showResults) {
    let correct = 0
    assessment.questions.forEach(question => {
      if (answers[question.id] === question.correct_answer) {
        correct++
      }
    })
    const score = (correct / assessment.questions.length) * 100

    return (
      <Layout>
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div className="rounded-xl bg-white p-8 shadow-soft">
            <div className="text-center">
              <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${
                score >= 80 ? 'bg-green-100 text-green-600' :
                score >= 60 ? 'bg-yellow-100 text-yellow-600' :
                'bg-red-100 text-red-600'
              }`}>
                <span className="text-2xl font-bold">{Math.round(score)}%</span>
              </div>

              <h1 className="mb-2 text-2xl font-bold text-gray-900">Assessment Complete!</h1>
              <p className="mb-6 text-gray-600">
                You scored {correct} out of {assessment.questions.length} questions correctly
              </p>

              <div className="mb-8">
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Performance</span>
                    <span>{Math.round(score)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        score >= 80 ? 'bg-green-500' :
                        score >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${score}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button onClick={handleRestart} variant="secondary">
                  Take Again
                </Button>
                <Button onClick={handleBackToDashboard}>
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{assessment.subject} Assessment</h1>
              <p className="text-gray-600">{assessment.topic}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                Question {currentQuestionIndex + 1} of {assessment.questions.length}
              </div>
              <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                <div
                  className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${((currentQuestionIndex + 1) / assessment.questions.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-white p-8 shadow-soft">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              {currentQuestion.question}
            </h2>

            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <label
                  key={index}
                  className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    answers[currentQuestion.id] === option
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option}
                    checked={answers[currentQuestion.id] === option}
                    onChange={() => handleAnswerSelect(currentQuestion.id, option)}
                    className="mr-3 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-gray-900">{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              variant="secondary"
            >
              Previous
            </Button>

            <div className="flex gap-3">
              {!isLastQuestion ? (
                <Button
                  onClick={handleNext}
                  disabled={!isAnswered}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!isAnswered || submitting}
                  isLoading={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Assessment'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default function AssessmentPage() {
  return (
    <Suspense fallback={
      <Layout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <CircleAnimation
            type="interconnecting-waves"
            size="lg"
            text="Loading..."
            title="Loading Assessment"
            color="#0ea5e9"
          />
        </div>
      </Layout>
    }>
      <AssessmentPageContent />
    </Suspense>
  )
}
