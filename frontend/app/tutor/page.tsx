'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import EmptyState from '@/components/EmptyState'
import Button from '@/components/Button'
import MessageActions from '@/components/MessageActions'
import TypingIndicator from '@/components/TypingIndicator'
import CitationDisplay from '@/components/CitationDisplay'
import ErrorMessage from '@/components/ErrorMessage'
import ConnectionStatus from '@/components/ConnectionStatus'

interface Message {
  id?: number
  role: 'user' | 'assistant'
  content: string
  citations?: Array<any>
  created_at?: string
  timestamp?: Date
  status?: 'sending' | 'sent' | 'error'
  error?: string
}

const STORAGE_KEY = 'tutor_conversation'

export default function TutorPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load conversation from localStorage on mount
  useEffect(() => {
    const savedConversation = localStorage.getItem(STORAGE_KEY)
    if (savedConversation) {
      try {
        const data = JSON.parse(savedConversation)
        setMessages(data.messages || [])
        setConversationId(data.conversationId || null)
      } catch (error) {
        console.error('Failed to load conversation from localStorage:', error)
      }
    }
  }, [])

  // Save conversation to localStorage whenever it changes
  useEffect(() => {
    if (messages.length > 0 || conversationId) {
      const conversationData = {
        messages,
        conversationId,
        timestamp: new Date().toISOString()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversationData))
    }
  }, [messages, conversationId])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Utility function to format timestamps
  const formatTimestamp = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date)
  }

  // Copy message to clipboard
  const copyMessage = useCallback(async (content: string) => {
    try {
      await navigator.clipboard.writeText(content)
    } catch (error) {
      console.error('Failed to copy message:', error)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = content
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }, [])

  // Delete message
  const deleteMessage = useCallback((messageIndex: number) => {
    setMessages(prev => prev.filter((_, index) => index !== messageIndex))
  }, [])

  // Regenerate response
  const regenerateResponse = useCallback(async (messageIndex: number) => {
    const messageToRegenerate = messages[messageIndex]
    if (!messageToRegenerate || messageToRegenerate.role !== 'assistant') return

    // Remove the message to regenerate and all subsequent messages
    setMessages(prev => prev.slice(0, messageIndex))
    setError(null)

    // Find the user message that prompted this response
    const userMessageIndex = messageIndex - 1
    if (userMessageIndex >= 0 && messages[userMessageIndex].role === 'user') {
      await sendMessage(messages[userMessageIndex].content, true)
    }
  }, [messages])

  // Clear conversation
  const clearConversation = useCallback(() => {
    setMessages([])
    setConversationId(null)
    setError(null)
    localStorage.removeItem(STORAGE_KEY)
    inputRef.current?.focus()
  }, [])

  const sendMessage = async (customMessage?: string, isRegenerate = false) => {
    const messageToSend = customMessage || input.trim()
    if (!messageToSend || loading) return

    const userMessage: Message = {
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
      status: 'sending'
    }

    if (!isRegenerate) {
      setMessages(prev => [...prev, userMessage])
      setInput('')
    }
    setLoading(true)
    setError(null)

    try {
      let convId = conversationId
      if (!convId) {
        // Create new conversation
        const convResponse = await api.post('/tutoring/conversations/', {})
        convId = convResponse.data.id
        setConversationId(convId)
      }

      // Mark user message as sent
      setMessages(prev => prev.map(msg =>
        msg === userMessage ? { ...msg, status: 'sent' } : msg
      ))

      // Send message
      const response = await api.post(`/tutoring/conversations/${convId}/send_message/`, {
        message: messageToSend,
      })

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.assistant_message.content,
        citations: response.data.assistant_message.citations,
        timestamp: new Date(),
        status: 'sent'
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error: any) {
      console.error('Failed to send message:', error)

      // Mark user message as having an error
      setMessages(prev => prev.map(msg =>
        msg === userMessage ? { ...msg, status: 'error', error: error.message } : msg
      ))

      // Add error message
      const errorMessage: Message = {
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        status: 'error',
        error: error.message || 'Sorry, I encountered an error. Please try again.'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  // Retry failed message
  const retryMessage = useCallback(async (messageIndex: number) => {
    const message = messages[messageIndex]
    if (!message || message.role !== 'user' || message.status !== 'error') return

    // Remove error messages after this user message
    setMessages(prev => {
      const newMessages = [...prev]
      for (let i = messageIndex + 1; i < newMessages.length; i++) {
        if (newMessages[i].status === 'error') {
          newMessages.splice(i, 1)
          i-- // Adjust index after removal
        } else {
          break
        }
      }
      return newMessages
    })

    await sendMessage(message.content, true)
  }, [messages])

  return (
    <Layout>
      <div className="flex h-[calc(100vh-8rem)] flex-col rounded-xl bg-white shadow-soft">
        <div className="border-b border-gray-200 bg-gradient-to-r from-primary-50 to-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary-600 to-primary-700 text-white shadow-md">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Tutor Bot</h1>
                <p className="text-sm text-gray-600">Ask questions about your uploaded content</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ConnectionStatus />
              {messages.length > 0 && (
                <Button
                  onClick={clearConversation}
                  variant="secondary"
                  size="sm"
                  className="text-xs"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {messages.length === 0 ? (
            <EmptyState
              icon={
                <svg
                  className="mx-auto h-16 w-16 text-primary-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              }
              title="Start a conversation"
              description="Ask questions about your uploaded educational content. The tutor bot will help you understand concepts, solve problems, and learn more effectively."
              action={{
                label: 'Ask your first question',
                href: '#',
                onClick: () => {
                  inputRef.current?.focus()
                },
              }}
            />
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`group flex animate-slide-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="max-w-3xl">
                    {/* Message Status Indicator */}
                    {msg.status === 'sending' && (
                      <div className="mb-1 flex items-center gap-2 text-xs text-gray-500">
                        <div className="flex h-3 w-3 items-center justify-center">
                          <div className="h-1.5 w-1.5 animate-ping rounded-full bg-primary-400"></div>
                          <div className="absolute h-1.5 w-1.5 rounded-full bg-primary-500"></div>
                        </div>
                        Sending...
                      </div>
                    )}

                    {/* Message Content */}
                    <div
                      className={`group/message relative rounded-xl px-4 py-3 shadow-sm transition-all duration-200 ${
                        msg.status === 'error'
                          ? 'bg-red-50 border border-red-200 text-red-900'
                          : msg.role === 'user'
                          ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:shadow-md'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {/* Message Actions */}
                      <div className="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <MessageActions
                          onCopy={() => copyMessage(msg.content)}
                          onRegenerate={msg.role === 'assistant' ? () => regenerateResponse(idx) : undefined}
                          onDelete={() => deleteMessage(idx)}
                          isAssistant={msg.role === 'assistant'}
                        />
                      </div>

                      {/* Error Message */}
                      {msg.status === 'error' ? (
                        <ErrorMessage
                          message={msg.error || 'An error occurred'}
                          onRetry={msg.role === 'user' ? () => retryMessage(idx) : undefined}
                          className="mb-0"
                        />
                      ) : msg.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-900 prose-strong:text-gray-900 prose-code:text-gray-900 prose-pre:bg-gray-800 prose-pre:text-gray-100">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}

                      {/* Citations */}
                      {msg.citations && msg.citations.length > 0 && msg.status !== 'error' && (
                        <CitationDisplay citations={msg.citations} />
                      )}

                      {/* Timestamp */}
                      {msg.timestamp && (
                        <div className="mt-2 flex items-center justify-end gap-1 text-xs opacity-60">
                          <span>{formatTimestamp(msg.timestamp)}</span>
                          {msg.status === 'sent' && (
                            <svg className="w-3 h-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-xl bg-gray-100 px-4 py-3 shadow-sm">
                    <TypingIndicator />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                  if (e.key === 'Escape') {
                    setInput('')
                  }
                }}
                placeholder="Ask a question... (Enter to send, Esc to clear)"
                className="input-enhanced flex-1 pr-12"
                disabled={loading}
                maxLength={1000}
              />
              {input.length > 0 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  {input.length}/1000
                </div>
              )}
            </div>
            <Button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              isLoading={loading}
              size="md"
            >
              {loading ? 'Sending...' : 'Send'}
            </Button>
          </div>

          {/* Keyboard shortcuts hint */}
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
            <span>Press Enter to send, Shift+Enter for new line</span>
            <span>Hover messages for actions</span>
          </div>
        </div>
      </div>
    </Layout>
  )
}
