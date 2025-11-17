'use client'

import { useState, useEffect, useRef } from 'react'
import Layout from '@/components/Layout'
import api from '@/lib/api'
import EmptyState from '@/components/EmptyState'
import LoadingSpinner from '@/components/LoadingSpinner'
import Button from '@/components/Button'

interface Message {
  id?: number
  role: 'user' | 'assistant'
  content: string
  citations?: Array<any>
  created_at?: string
}

export default function TutorPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      let convId = conversationId
      if (!convId) {
        // Create new conversation
        const convResponse = await api.post('/tutoring/conversations/', {})
        convId = convResponse.data.id
        setConversationId(convId)
      }

      // Send message
      const response = await api.post(`/tutoring/conversations/${convId}/send_message/`, {
        message: userMessage.content,
      })

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.assistant_message.content,
        citations: response.data.assistant_message.citations,
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error: any) {
      console.error('Failed to send message:', error)
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>
      <div className="flex h-[calc(100vh-8rem)] flex-col rounded-xl bg-white shadow-soft">
        <div className="border-b border-gray-200 bg-gradient-to-r from-primary-50 to-white px-6 py-4">
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
                  const input = document.querySelector('input[type="text"]') as HTMLInputElement
                  input?.focus()
                },
              }}
            />
          ) : (
            <div className="space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex animate-slide-up ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3xl rounded-xl px-4 py-3 shadow-sm transition-all duration-200 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:shadow-md'
                        : 'bg-gray-100 text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-2 border-t border-gray-300 pt-2">
                        <p className="text-xs font-medium">Sources:</p>
                        {msg.citations.map((citation: any, cIdx: number) => (
                          <p key={cIdx} className="text-xs">
                            {citation.display_name || citation.file}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-lg bg-gray-100 px-4 py-3">
                    <LoadingSpinner size="sm" text="Thinking..." />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask a question..."
              className="input-enhanced flex-1"
              disabled={loading}
            />
            <Button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              isLoading={loading}
              size="md"
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
