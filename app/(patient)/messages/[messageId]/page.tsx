'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface Message {
  id: string
  sender: 'doctor' | 'patient' | 'system'
  content: string
  timestamp: string
  actions?: Array<{
    id: string
    label: string
    action: () => void
    color?: string
  }>
}

interface MessageThread {
  id: string
  title: string
  practitioner: string
  lastMessage: string
  unread: number
  messages: Message[]
}

const mockThreads: Record<string, MessageThread> = {
  'msg-101': {
    id: 'msg-101',
    title: 'Blood Pressure Follow-up',
    practitioner: 'Dr. Smith',
    lastMessage: 'Your blood pressure looks great...',
    unread: 2,
    messages: [
      {
        id: 'm1',
        sender: 'doctor',
        content: 'Hi Sarah! I wanted to follow up on your blood pressure readings from last week. The numbers look excellent - 118/76 is right in the ideal range.',
        timestamp: '2025-01-20 14:30'
      },
      {
        id: 'm2', 
        sender: 'doctor',
        content: 'It seems the lifestyle changes we discussed are working well. Keep up the regular walks and the reduced salt intake!',
        timestamp: '2025-01-20 14:31',
        actions: [
          {
            id: 'confirm-exercise',
            label: 'Yes, I\'m exercising regularly',
            action: () => alert('Great! Keep it up.'),
            color: 'green'
          },
          {
            id: 'ask-question',
            label: 'I have a question',
            action: () => alert('What would you like to ask?'),
            color: 'blue'
          }
        ]
      },
      {
        id: 'm3',
        sender: 'system',
        content: 'Your next routine check-up is scheduled for March 15th. You\'ll receive a reminder closer to the date.',
        timestamp: '2025-01-20 14:32'
      }
    ]
  }
}

export default function PatientMessages() {
  const router = useRouter()
  const params = useParams()
  const messageId = params.messageId as string
  
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)

  const thread = mockThreads[messageId]
  
  if (!thread) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h2 className="font-semibold text-slate-900 mb-2">Message not found</h2>
          <button 
            onClick={() => router.push('/patient')}
            className="w-full bg-slate-900 text-white py-3 px-4 rounded-xl font-medium hover:bg-slate-800 transition-colors mt-4"
          >
            Back to Portal
          </button>
        </div>
      </div>
    )
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return
    
    setSending(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    thread.messages.push({
      id: `m${thread.messages.length + 1}`,
      sender: 'patient',
      content: newMessage,
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
    })
    
    setNewMessage('')
    setSending(false)
    
    setTimeout(() => {
      thread.messages.push({
        id: `m${thread.messages.length + 1}`,
        sender: 'doctor',
        content: 'Thanks for your message, Sarah. I\'ll review this and get back to you within 24 hours.',
        timestamp: new Date().toISOString().slice(0, 16).replace('T', ' ')
      })
    }, 2000)
  }

  const getSenderStyle = (sender: string) => {
    switch (sender) {
      case 'doctor': return 'bg-blue-50 border-blue-200'
      case 'patient': return 'bg-slate-50 border-slate-200 ml-8'
      case 'system': return 'bg-amber-50 border-amber-200'
      default: return 'bg-slate-50 border-slate-200'
    }
  }

  const getSenderIcon = (sender: string) => {
    switch (sender) {
      case 'doctor': return '👨‍⚕️'
      case 'patient': return '👤'
      case 'system': return '🏥'
      default: return '💬'
    }
  }

  const getSenderName = (sender: string) => {
    switch (sender) {
      case 'doctor': return thread.practitioner
      case 'patient': return 'You'
      case 'system': return 'Data Ravens Practice'
      default: return 'Unknown'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.push('/patient')}
              className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="font-semibold text-slate-900">{thread.title}</h1>
              <p className="text-sm text-slate-500">{thread.practitioner}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-6 py-5 space-y-3">
          {thread.messages.map((message) => (
            <div key={message.id} className={`rounded-2xl border p-4 ${getSenderStyle(message.sender)}`}>
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border border-slate-200">
                  <span className="text-sm">{getSenderIcon(message.sender)}</span>
                </div>
                <span className="font-medium text-sm text-slate-900">
                  {getSenderName(message.sender)}
                </span>
                <span className="text-xs text-slate-400 ml-auto">
                  {new Date(message.timestamp).toLocaleString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              
              <p className="text-slate-700 text-sm leading-relaxed mb-3">{message.content}</p>
              
              {message.actions && (
                <div className="flex flex-wrap gap-2">
                  {message.actions.map((action) => (
                    <button
                      key={action.id}
                      onClick={action.action}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                        action.color === 'green' 
                          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                          : action.color === 'blue'
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-slate-600 text-white hover:bg-slate-700'
                      }`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200">
        <div className="max-w-lg mx-auto px-6 py-4">
          {/* Quick Replies */}
          <div className="mb-3">
            <p className="text-xs text-slate-500 mb-2">Quick replies</p>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setNewMessage('Thank you for the update!')}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium hover:bg-slate-200 transition-colors border border-slate-200"
              >
                Thank you
              </button>
              <button 
                onClick={() => setNewMessage('I have a question about my medication.')}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium hover:bg-slate-200 transition-colors border border-slate-200"
              >
                Medication question
              </button>
              <button 
                onClick={() => setNewMessage('Can we schedule a follow-up?')}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium hover:bg-slate-200 transition-colors border border-slate-200"
              >
                Book follow-up
              </button>
            </div>
          </div>

          {/* Message Input */}
          <div className="flex space-x-3">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 border border-slate-200 rounded-xl p-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
              rows={2}
            />
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || sending}
              className="bg-blue-600 text-white px-5 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-end py-3"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Send'
              )}
            </button>
          </div>
          
          <p className="text-xs text-slate-400 mt-3 text-center">
            Response within 24 hours • For urgent matters call 020 7123 4567
          </p>
        </div>
      </div>
    </div>
  )
}
