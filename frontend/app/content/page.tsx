'use client'

import { useState, useEffect, useCallback } from 'react'
import Confetti from 'react-confetti'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import EmptyState from '@/components/EmptyState'
import CircleAnimation from '@/components/CircleAnimation'
import SkeletonLoader from '@/components/SkeletonLoader'
import FormField from '@/components/FormField'
import Button from '@/components/Button'
import DragDropZone from '@/components/DragDropZone'
import { useToast } from '@/components/ToastContainer'
import ToastContainer from '@/components/ToastContainer'
import ContentPreview from '@/components/ContentPreview'

interface ContentItem {
  id: number
  title: string
  subject: string
  difficulty: string
  indexed: boolean
  indexing_error?: string
  file_url: string
  created_at: string
}

export default function ContentPage() {
  const [contents, setContents] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    difficulty: 'beginner',
    author: '',
    publication_year: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [extractingMetadata, setExtractingMetadata] = useState(false)
  const { toasts, removeToast, showSuccess, showError } = useToast()
  const [showConfetti, setShowConfetti] = useState(false)
  const [justUploadedTitle, setJustUploadedTitle] = useState<string | null>(null)

  const fetchContents = useCallback(async () => {
    try {
      const response = await api.get('/content/files/')
      const newContents = response.data.results || response.data
      setContents(newContents)

      // Check if previously uploaded content is now indexed (for additional celebration)
      if (justUploadedTitle) {
        const uploadedContent = newContents.find(
          (content: ContentItem) => content.title === justUploadedTitle && content.indexed
        )
        if (uploadedContent) {
          // Show confetti again when indexing completes
          setShowConfetti(true)
          setJustUploadedTitle(null)
        }
      }
    } catch (error) {
      console.error('Failed to fetch contents:', error)
    } finally {
      setLoading(false)
    }
  }, [justUploadedTitle])

  useEffect(() => {
    fetchContents()
  }, [fetchContents])


  const extractMetadata = async (selectedFile: File) => {
    setExtractingMetadata(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const response = await api.post('/content/files/extract_metadata/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const metadata = response.data

      // Auto-fill form fields with extracted metadata
      setFormData(prev => ({
        ...prev,
        title: metadata.title || prev.title,
        description: metadata.description || prev.description,
        subject: metadata.subject || prev.subject,
        difficulty: metadata.difficulty || prev.difficulty,
        author: metadata.author || prev.author,
        publication_year: metadata.publication_year || prev.publication_year,
      }))

      showSuccess('Metadata extracted successfully! Form fields have been auto-filled.')
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || 'Failed to extract metadata. You can fill the form manually.'
      console.error('Metadata extraction error:', error)
      showError(errorMessage)
    } finally {
      setExtractingMetadata(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!file) {
      newErrors.file = 'Please select a file to upload'
    }
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }
    if (!formData.subject.trim()) {
      newErrors.subject = 'Subject is required'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) {
      showError('Please fix the errors in the form')
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setJustUploadedTitle(formData.title)
    try {
      const uploadData = new FormData()
      uploadData.append('file', file!)
      uploadData.append('title', formData.title.trim())
      uploadData.append('description', formData.description.trim())
      uploadData.append('subject', formData.subject.trim())
      uploadData.append('difficulty', formData.difficulty)
      if (formData.author.trim()) uploadData.append('author', formData.author.trim())
      if (formData.publication_year)
        uploadData.append('publication_year', formData.publication_year)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)

      await api.post('/content/files/', uploadData, {
        // Don't set Content-Type header - let axios set it automatically for FormData
        headers: {},
        onUploadProgress: progressEvent => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            setUploadProgress(percentCompleted)
          }
        },
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      // Show confetti immediately on successful upload
      setShowConfetti(true)

      showSuccess('File uploaded successfully! It will be indexed shortly.')
      setFormData({
        title: '',
        description: '',
        subject: '',
        difficulty: 'beginner',
        author: '',
        publication_year: '',
      })
      setFile(null)
      setErrors({})
      setTimeout(() => {
        fetchContents()
        setUploadProgress(0)
      }, 500)
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || error.response?.data?.detail || 'Upload failed'
      showError(errorMessage)
      if (error.response?.data) {
        const fieldErrors: Record<string, string> = {}
        Object.keys(error.response.data).forEach(key => {
          if (Array.isArray(error.response.data[key])) {
            fieldErrors[key] = error.response.data[key][0]
          } else {
            fieldErrors[key] = error.response.data[key]
          }
        })
        setErrors(fieldErrors)
      }
    } finally {
      setUploading(false)
    }
  }

  return (
    <Layout>
      {showConfetti && (
        <Confetti
          recycle={false}
          numberOfPieces={500}
          width={typeof window !== 'undefined' ? window.innerWidth : 0}
          height={typeof window !== 'undefined' ? window.innerHeight : 0}
          onConfettiComplete={() => setShowConfetti(false)}
        />
      )}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="card-hover rounded-xl bg-white p-6 shadow-soft">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Upload Content</h2>
              {extractingMetadata && (
                <div className="mb-4 flex animate-fade-in items-center gap-3 rounded-lg border border-primary-200 bg-primary-50 p-3">
                  <svg
                    className="h-5 w-5 animate-spin text-primary-600"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-primary-900">
                      AI is analyzing your file...
                    </p>
                    <p className="text-xs text-primary-700">
                      Extracting title, description, subject, and other metadata
                    </p>
                  </div>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormField
                  label="File"
                  name="file"
                  error={errors.file}
                  required
                  hint="Supported formats: PDF, DOCX, TXT (Max 100MB)"
                >
                  <DragDropZone
                    onFileSelect={async file => {
                      setFile(file)
                      setErrors(prev => ({ ...prev, file: '' }))
                      // Auto-extract metadata when file is selected
                      if (file) {
                        await extractMetadata(file)
                      }
                    }}
                    accept=".pdf,.docx,.txt"
                    maxSize={100 * 1024 * 1024}
                    disabled={uploading || extractingMetadata}
                  />
                  {file && (
                    <div className="mt-3 flex animate-fade-in items-center gap-3 rounded-xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white p-3 shadow-sm">
                      <div className="flex-shrink-0">
                        {extractingMetadata ? (
                          <svg
                            className="h-8 w-8 animate-spin text-primary-600"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-8 w-8 text-primary-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {extractingMetadata
                            ? 'Extracting metadata with AI...'
                            : `${(file.size / 1024 / 1024).toFixed(2)} MB`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={e => {
                          e.preventDefault()
                          setFile(null)
                          setFormData({
                            title: '',
                            description: '',
                            subject: '',
                            difficulty: 'beginner',
                            author: '',
                            publication_year: '',
                          })
                          setErrors(prev => ({ ...prev, file: '' }))
                        }}
                        className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 transition-all duration-200 hover:scale-110 hover:bg-error-100 hover:text-error-600 focus:outline-none focus:ring-2 focus:ring-error-500"
                        disabled={uploading || extractingMetadata}
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </FormField>

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Uploading...</span>
                      <span className="font-medium text-primary-600">{uploadProgress}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full bg-primary-600 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <FormField
                  label="Title"
                  name="title"
                  error={errors.title}
                  required
                  hint={formData.title ? '✓ Auto-filled by AI' : undefined}
                >
                  <div className="relative">
                    <input
                      type="text"
                      id="title"
                      value={formData.title}
                      onChange={e => {
                        setFormData({ ...formData, title: e.target.value })
                        setErrors(prev => ({ ...prev, title: '' }))
                      }}
                      className="input-enhanced"
                      placeholder="Enter content title"
                    />
                    {formData.title && !extractingMetadata && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg
                          className="h-4 w-4 text-success-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </FormField>

                <FormField
                  label="Description"
                  name="description"
                  error={errors.description}
                  hint={
                    formData.description
                      ? '✓ Auto-filled by AI'
                      : 'Optional: Brief description of the content'
                  }
                >
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="input-enhanced"
                    placeholder="Describe the content..."
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Subject"
                    name="subject"
                    error={errors.subject}
                    required
                    hint={formData.subject ? '✓ Auto-filled by AI' : undefined}
                  >
                    <div className="relative">
                      <input
                        type="text"
                        id="subject"
                        value={formData.subject}
                        onChange={e => {
                          setFormData({ ...formData, subject: e.target.value })
                          setErrors(prev => ({ ...prev, subject: '' }))
                        }}
                        className="input-enhanced"
                        placeholder="e.g., Mathematics"
                      />
                      {formData.subject && !extractingMetadata && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <svg
                            className="h-4 w-4 text-success-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </FormField>

                  <FormField
                    label="Difficulty"
                    name="difficulty"
                    error={errors.difficulty}
                    hint={
                      formData.difficulty && formData.difficulty !== 'beginner'
                        ? '✓ Auto-filled by AI'
                        : undefined
                    }
                  >
                    <select
                      id="difficulty"
                      value={formData.difficulty}
                      onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                      className="input-enhanced"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </FormField>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="Author"
                    name="author"
                    error={errors.author}
                    hint={formData.author ? '✓ Auto-filled by AI' : 'Optional'}
                  >
                    <input
                      type="text"
                      id="author"
                      value={formData.author}
                      onChange={e => setFormData({ ...formData, author: e.target.value })}
                      className="input-enhanced"
                      placeholder="Author name"
                    />
                  </FormField>

                  <FormField
                    label="Publication Year"
                    name="publication_year"
                    error={errors.publication_year}
                    hint={formData.publication_year ? '✓ Auto-filled by AI' : 'Optional'}
                  >
                    <input
                      type="number"
                      id="publication_year"
                      value={formData.publication_year}
                      onChange={e => setFormData({ ...formData, publication_year: e.target.value })}
                      min="1900"
                      max={new Date().getFullYear()}
                      className="input-enhanced"
                      placeholder="YYYY"
                    />
                  </FormField>
                </div>

                <div className="flex gap-3">
                  {file && !extractingMetadata && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => extractMetadata(file)}
                      disabled={uploading}
                      className="flex-1"
                    >
                      <svg
                        className="mr-2 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                      Re-extract Metadata
                    </Button>
                  )}
                  <Button
                    type="submit"
                    isLoading={uploading || extractingMetadata}
                    disabled={extractingMetadata}
                    className={file && !extractingMetadata ? 'flex-1' : 'w-full'}
                  >
                    {extractingMetadata
                      ? 'Extracting Metadata...'
                      : uploading
                        ? 'Uploading...'
                        : 'Upload Content'}
                  </Button>
                </div>
              </form>
            </div>

            <div className="card-hover rounded-xl bg-white p-6 shadow-soft">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Uploaded Content</h2>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <SkeletonLoader key={i} variant="rect" className="h-20" />
                  ))}
                </div>
              ) : contents.length === 0 ? (
                <EmptyState
                  icon={
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  }
                  title="No content uploaded yet"
                  description="Upload your first educational content to get started. Supported formats include PDF, DOCX, and TXT files."
                  action={{
                    label: 'Upload Content',
                    href: '#',
                    onClick: () => {
                      document.getElementById('file')?.scrollIntoView({ behavior: 'smooth' })
                      document.getElementById('file')?.focus()
                    },
                  }}
                />
              ) : (
                <div className="space-y-3">
                  {contents.map(content => (
                    <div
                      key={content.id}
                      className="group rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all duration-200 hover:scale-[1.01] hover:border-primary-300 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 group-hover:text-primary-600">
                            {content.title}
                          </h3>
                          <p className="mt-1 text-sm text-gray-600">
                            {content.subject} • {content.difficulty}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                                content.indexed
                                  ? 'bg-green-100 text-green-800'
                                  : content.indexing_error
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {content.indexed ? (
                                <>
                                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Indexed
                                </>
                              ) : content.indexing_error ? (
                                <>
                                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                      fillRule="evenodd"
                                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Failed
                                </>
                              ) : (
                                <>
                                  <svg
                                    className="h-3 w-3 animate-spin"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                  >
                                    <circle
                                      className="opacity-25"
                                      cx="12"
                                      cy="12"
                                      r="10"
                                      stroke="currentColor"
                                      strokeWidth="4"
                                    />
                                    <path
                                      className="opacity-75"
                                      fill="currentColor"
                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                  </svg>
                                  Indexing...
                                </>
                              )}
                            </span>
                            {!content.indexed && (
                              <button
                                onClick={async () => {
                                  try {
                                    await api.post(`/content/files/${content.id}/reindex/`)
                                    showSuccess('Re-indexing started. Please refresh to see status.')
                                    setTimeout(() => fetchContents(), 2000)
                                  } catch (error: any) {
                                    showError(
                                      error.response?.data?.error ||
                                        'Failed to start re-indexing'
                                    )
                                  }
                                }}
                                className="rounded-md bg-primary-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-primary-700"
                                title={content.indexing_error || 'Retry indexing'}
                              >
                                {content.indexing_error ? 'Retry' : 'Cancel'}
                              </button>
                            )}
                            {content.indexing_error && (
                              <span
                                className="cursor-help text-xs text-red-600"
                                title={content.indexing_error}
                              >
                                (Error)
                              </span>
                            )}
                            <span className="text-xs text-gray-500">
                              {new Date(content.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Content Preview */}
          {(file || formData.title || formData.description || formData.subject) && (
            <ContentPreview file={file} formData={formData} />
          )}
        </div>
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </Layout>
  )
}
