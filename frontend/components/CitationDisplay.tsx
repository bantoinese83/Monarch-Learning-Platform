'use client'

import { useState } from 'react'

interface Citation {
  display_name?: string
  file?: string
  uri?: string
  title?: string
  page?: number
  content?: string
}

interface CitationDisplayProps {
  citations: Citation[]
  className?: string
}

export default function CitationDisplay({ citations, className = "" }: CitationDisplayProps) {
  const [expandedCitation, setExpandedCitation] = useState<number | null>(null)

  if (!citations || citations.length === 0) return null

  return (
    <div className={`mt-3 border-t border-gray-200 pt-3 ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-xs font-medium text-gray-700">Sources ({citations.length})</span>
      </div>

      <div className="space-y-2">
        {citations.map((citation, index) => (
          <div
            key={index}
            className="group relative bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-gray-300 transition-colors duration-150"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs font-medium">
                    {index + 1}
                  </span>
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {citation.display_name || citation.title || citation.file || `Source ${index + 1}`}
                  </h4>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {citation.file && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      {citation.file}
                    </span>
                  )}

                  {citation.page && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a.997.997 0 01-1.414 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      Page {citation.page}
                    </span>
                  )}
                </div>

                {citation.content && citation.content.length > 100 && (
                  <button
                    onClick={() => setExpandedCitation(expandedCitation === index ? null : index)}
                    className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors duration-150"
                  >
                    {expandedCitation === index ? 'Show less' : 'Show excerpt'}
                  </button>
                )}
              </div>

              <button
                onClick={() => setExpandedCitation(expandedCitation === index ? null : index)}
                className="p-1 rounded-md hover:bg-gray-200 transition-colors duration-150 opacity-0 group-hover:opacity-100"
              >
                <svg
                  className={`w-4 h-4 text-gray-500 transition-transform duration-150 ${expandedCitation === index ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {citation.content && (expandedCitation === index || citation.content.length <= 100) && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {citation.content}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
