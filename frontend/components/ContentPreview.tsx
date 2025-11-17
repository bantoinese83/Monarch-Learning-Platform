'use client'

import { useState, useEffect, useRef } from 'react'
import mammoth from 'mammoth'

interface ContentPreviewProps {
  file: File | null
  formData: {
    title: string
    description: string
    subject: string
    difficulty: string
    author: string
    publication_year: string
  }
}

export default function ContentPreview({ file, formData }: ContentPreviewProps) {
  const [previewContent, setPreviewContent] = useState<string>('')
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [docxHtml, setDocxHtml] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fileType, setFileType] = useState<string>('')
  const [previewError, setPreviewError] = useState<string>('')
  const pdfUrlRef = useRef<string | null>(null)
  const isCancelledRef = useRef<boolean>(false)

  useEffect(() => {
    // Early return if no file to prevent unnecessary state updates
    if (!file) {
      // Cleanup previous blob URL if it exists
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current)
        pdfUrlRef.current = null
      }
      setPreviewContent('')
      setFileType('')
      setPdfUrl(null)
      setDocxHtml(null)
      setPreviewError('')
      return
    }

    // Cleanup previous blob URL if it exists (before processing new file)
    if (pdfUrlRef.current) {
      URL.revokeObjectURL(pdfUrlRef.current)
      pdfUrlRef.current = null
    }

    // Reset cancellation flag for new file processing
    isCancelledRef.current = false

    setLoading(true)
    setPreviewError('')
    const type = file.type || file.name.split('.').pop()?.toLowerCase() || ''
    setFileType(type)

    // Handle different file types
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      // Optimize: For large files, read only first chunk to avoid memory issues
      const maxPreviewSize = 2000
      const reader = new FileReader()
      reader.onload = e => {
        if (isCancelledRef.current) return
        const text = e.target?.result as string
        // Efficient substring: only process what we need
        const preview = text.length > maxPreviewSize 
          ? text.substring(0, maxPreviewSize) + '...' 
          : text
        setPreviewContent(preview)
        setLoading(false)
      }
      reader.onerror = () => {
        if (isCancelledRef.current) return
        setPreviewContent('Error reading file')
        setPreviewError('Failed to read text file')
        setLoading(false)
      }
      // For large files, only read first portion to save memory
      if (file.size > 100000) { // 100KB
        const blob = file.slice(0, maxPreviewSize * 2) // Read slightly more for context
        reader.readAsText(blob)
      } else {
        reader.readAsText(file)
      }
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      // Create blob URL for PDF preview
      const url = URL.createObjectURL(file)
      if (!isCancelledRef.current) {
        pdfUrlRef.current = url
        setPdfUrl(url)
        setLoading(false)
      } else {
        URL.revokeObjectURL(url)
      }
    } else if (
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      file.name.endsWith('.docx')
    ) {
      // Convert DOCX to HTML for preview using mammoth
      const reader = new FileReader()
      reader.onload = async e => {
        if (isCancelledRef.current) return
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer
          const result = await mammoth.convertToHtml({ arrayBuffer })
          if (!isCancelledRef.current) {
            setDocxHtml(result.value)
            setLoading(false)
          }
        } catch (error) {
          if (isCancelledRef.current) return
          console.error('DOCX conversion error:', error)
          setPreviewContent('Failed to preview DOCX file. File will be processed after upload.')
          setPreviewError('Failed to convert DOCX to HTML')
          setLoading(false)
        }
      }
      reader.onerror = () => {
        if (isCancelledRef.current) return
        setPreviewContent('Error reading DOCX file')
        setPreviewError('Failed to read DOCX file')
        setLoading(false)
      }
      reader.readAsArrayBuffer(file)
    } else {
      if (!isCancelledRef.current) {
        setPreviewContent('Preview not available for this file type.')
        setLoading(false)
      }
    }

    // Cleanup blob URL on unmount or file change
    return () => {
      isCancelledRef.current = true
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current)
        pdfUrlRef.current = null
      }
    }
  }, [file])

  if (!file) {
    return null
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const getFileIcon = () => {
    if (file.name.endsWith('.pdf')) {
      return (
        <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012 2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      )
    }
    if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
      return (
        <svg
          className="h-8 w-8 text-blue-600"
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
      )
    }
    return (
      <svg className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    )
  }

  return (
    <div className="mt-6 animate-fade-in rounded-xl border border-gray-200 bg-white shadow-soft">
      <div className="border-b border-gray-200 bg-gradient-to-r from-primary-50 to-white px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">{getFileIcon()}</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">Content Preview</h3>
            <p className="text-sm text-gray-600">Review your content before uploading</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* File Information */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h4 className="mb-3 text-sm font-semibold text-gray-700">File Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">File Name:</span>
              <span className="font-medium text-gray-900">{file.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">File Size:</span>
              <span className="font-medium text-gray-900">{formatFileSize(file.size)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">File Type:</span>
              <span className="font-medium text-gray-900">{file.type || 'Unknown'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Last Modified:</span>
              <span className="font-medium text-gray-900">
                {new Date(file.lastModified).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Form Data Preview */}
        {(formData.title || formData.description || formData.subject) && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h4 className="mb-3 text-sm font-semibold text-gray-700">Content Metadata</h4>
            <div className="space-y-3 text-sm">
              {formData.title && (
                <div>
                  <span className="text-gray-600">Title:</span>
                  <p className="mt-1 font-medium text-gray-900">{formData.title}</p>
                </div>
              )}
              {formData.description && (
                <div>
                  <span className="text-gray-600">Description:</span>
                  <p className="mt-1 text-gray-900">{formData.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {formData.subject && (
                  <div>
                    <span className="text-gray-600">Subject:</span>
                    <p className="mt-1 font-medium text-gray-900">{formData.subject}</p>
                  </div>
                )}
                {formData.difficulty && (
                  <div>
                    <span className="text-gray-600">Difficulty:</span>
                    <p className="mt-1 font-medium capitalize text-gray-900">
                      {formData.difficulty}
                    </p>
                  </div>
                )}
              </div>
              {(formData.author || formData.publication_year) && (
                <div className="grid grid-cols-2 gap-4">
                  {formData.author && (
                    <div>
                      <span className="text-gray-600">Author:</span>
                      <p className="mt-1 font-medium text-gray-900">{formData.author}</p>
                    </div>
                  )}
                  {formData.publication_year && (
                    <div>
                      <span className="text-gray-600">Year:</span>
                      <p className="mt-1 font-medium text-gray-900">{formData.publication_year}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* File Content Preview */}
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h4 className="mb-3 text-sm font-semibold text-gray-700">File Content Preview</h4>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex flex-col items-center gap-2">
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
                <p className="text-sm text-gray-600">Loading preview...</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-md bg-primary-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-primary-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012 2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="text-sm font-medium text-primary-700">PDF Preview</p>
                </div>
                <p className="text-xs text-gray-600">Scroll to navigate • Click controls to zoom</p>
              </div>
              <div className="relative h-[600px] w-full overflow-hidden rounded-md border border-gray-300 bg-gray-100">
                <iframe
                  src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                  className="h-full w-full"
                  title="PDF Preview"
                  style={{ border: 'none' }}
                />
                <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between border-t border-gray-300 bg-white/95 px-4 py-2 backdrop-blur-sm">
                  <p className="text-xs text-gray-600">Use browser controls to navigate the PDF</p>
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded-md bg-primary-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-primary-700"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    Open Fullscreen
                  </a>
                </div>
              </div>
              <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                <div className="flex items-start gap-2">
                  <svg
                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-blue-900">PDF Preview Tips</p>
                    <ul className="mt-1 space-y-1 text-xs text-blue-700">
                      <li>• Use mouse wheel or scrollbar to navigate pages</li>
                      <li>• Click the fullscreen button for a better viewing experience</li>
                      <li>
                        • Some browsers may require you to open in a new tab for full functionality
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : docxHtml ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-md bg-primary-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-primary-600"
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
                  <p className="text-sm font-medium text-primary-700">DOCX Preview</p>
                </div>
                <p className="text-xs text-gray-600">Formatted document preview</p>
              </div>
              <div className="relative max-h-[600px] w-full overflow-y-auto rounded-md border border-gray-300 bg-white p-6">
                <div
                  className="docx-preview [&_p]:mb-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:mb-3 [&_li]:mb-1 [&_table]:border-collapse [&_table]:w-full [&_table]:mb-4 [&_th]:border [&_th]:border-gray-300 [&_th]:px-3 [&_th]:py-2 [&_th]:bg-gray-100 [&_th]:font-semibold [&_td]:border [&_td]:border-gray-300 [&_td]:px-3 [&_td]:py-2 [&_strong]:font-bold [&_em]:italic"
                  dangerouslySetInnerHTML={{ __html: docxHtml }}
                />
              </div>
              <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                <div className="flex items-start gap-2">
                  <svg
                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-blue-900">DOCX Preview Tips</p>
                    <ul className="mt-1 space-y-1 text-xs text-blue-700">
                      <li>• This is a formatted preview of your document</li>
                      <li>• Some complex formatting may not be fully preserved</li>
                      <li>• The full document will be processed after upload</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto rounded-md bg-gray-50 p-4">
              {previewContent ? (
                <pre className="whitespace-pre-wrap break-words font-mono text-xs text-gray-800">
                  {previewContent}
                </pre>
              ) : (
                <p className="text-sm text-gray-500">No preview available</p>
              )}
            </div>
          )}
          {previewContent && previewContent.length > 2000 && (
            <p className="mt-2 text-xs text-gray-500">
              Showing first 2000 characters. Full content will be available after upload.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
