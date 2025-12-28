'use client'

import { useState, useEffect, useRef } from 'react'
import { useStore, useRole } from '@/store'
import { createPlan } from '@/services/planner'
import { askQuestion } from '@/services/ask-engine'
import { conversationalAI } from '@/services/conversational-ai'
import type { ConversationMessage, ConversationAction, Plan } from '@/types/core'
import { 
  Brain, 
  Sparkles, 
  MessageSquare, 
  Send, 
  Lightbulb, 
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  User,
  Bot
} from 'lucide-react'
import AskResponse from '@/components/AskResponse'
import ClarificationModal from '@/components/ClarificationModal'

interface ConversationalCommandBarProps {
  isOpen: boolean
  onClose: () => void
  onPlanCreated: (plan: any) => void
}

export default function ConversationalCommandBar({ isOpen, onClose, onPlanCreated }: ConversationalCommandBarProps) {
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'do' | 'ask'>('do')
  const [isProcessing, setIsProcessing] = useState(false)
  const [conversation, setConversation] = useState<ConversationMessage[]>([])
  const [sessionId] = useState(() => `session-${Date.now()}`)
  const [askResponse, setAskResponse] = useState<any>(null)
  const [clarificationPlan, setClarificationPlan] = useState<any>(null)
  const [showClarificationModal, setShowClarificationModal] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { autopilotMode, patients, appointments, invoices } = useStore()
  const { currentRole } = useRole()

  // Auto-focus and scroll to bottom
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation])

  // Initialize conversation context
  useEffect(() => {
    if (isOpen) {
      conversationalAI.getOrCreateConversation(sessionId, currentRole, window.location.pathname)
    }
  }, [isOpen, sessionId, currentRole])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isProcessing) return

    const userMessage = input.trim()
    setInput('')
    setIsProcessing(true)

    try {
      // Add user message to conversation
      const userMsg = conversationalAI.addUserMessage(sessionId, userMessage, userMessage)
      setConversation(prev => [...prev, userMsg])

      if (mode === 'ask') {
        // Handle Ask mode
        const response = await askQuestion(userMessage, { role: currentRole })
        setAskResponse(response)
        
        const aiMsg: ConversationMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: 'Here\'s what I found:',
          timestamp: new Date(),
          type: 'information',
          data: response
        }
        
        const aiResponse = await conversationalAI.generateResponse(sessionId, userMessage, { data: response })
        setConversation(prev => [...prev, aiResponse])
      } else {
        // Handle Do mode - try to create plan
        try {
          const plan = await createPlan(userMessage, {
            actor: 'user',
            source: 'cmdk',
            role: currentRole,
            autopilotMode,
            patients,
            appointments,
            invoices
          })

          if (plan) {
            if (plan.needsClarification && plan.clarificationQuestions) {
              // Show clarification modal
              setClarificationPlan(plan)
              setShowClarificationModal(true)
              
              const aiResponse: ConversationMessage = {
                id: `ai-${Date.now()}`,
                role: 'assistant',
                content: 'I need some clarification to proceed with this request.',
                timestamp: new Date(),
                type: 'clarification',
                planId: plan.id
              }
              setConversation(prev => [...prev, aiResponse])
            } else {
              // Generate confirmation response
              const aiResponse = await conversationalAI.generateResponse(sessionId, userMessage, { plan })
              setConversation(prev => [...prev, aiResponse])
            }
          }
        } catch (error) {
          // Generate error response
          const aiResponse = await conversationalAI.generateResponse(sessionId, userMessage, { 
            error: error instanceof Error ? error.message : 'Something went wrong' 
          })
          setConversation(prev => [...prev, aiResponse])
        }
      }
    } catch (error) {
      console.error('Error processing command:', error)
      const errorMsg: ConversationMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
        type: 'error'
      }
      setConversation(prev => [...prev, errorMsg])
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    inputRef.current?.focus()
  }

  const handleActionClick = async (action: ConversationAction) => {
    setIsProcessing(true)
    
    try {
      if (action.action === 'execute_plan' && action.payload?.planId) {
        // Find the plan and execute it
        const plan = clarificationPlan // This should be retrieved properly
        if (plan) {
          onPlanCreated(plan)
          onClose()
          return
        }
      }

      const aiResponse = await conversationalAI.handleAction(sessionId, action.id, action.payload)
      if (aiResponse) {
        setConversation(prev => [...prev, aiResponse])
      }
    } catch (error) {
      console.error('Error handling action:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const getMessageIcon = (type?: string) => {
    switch (type) {
      case 'clarification': return <MessageSquare className="w-4 h-4 text-blue-600" />
      case 'suggestion': return <Lightbulb className="w-4 h-4 text-yellow-600" />
      case 'confirmation': return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'information': 
      default: return <Info className="w-4 h-4 text-blue-600" />
    }
  }

  const getMessageBorderColor = (type?: string) => {
    switch (type) {
      case 'clarification': return 'border-l-blue-500'
      case 'suggestion': return 'border-l-yellow-500'
      case 'confirmation': return 'border-l-green-500'
      case 'error': return 'border-l-red-500'
      case 'success': return 'border-l-green-500'
      case 'information': 
      default: return 'border-l-blue-500'
    }
  }

  const clearConversation = () => {
    setConversation([])
    conversationalAI.clearConversation(sessionId)
    setAskResponse(null)
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />
      <div className="fixed inset-x-4 top-4 bottom-4 md:inset-x-auto md:left-1/2 md:transform md:-translate-x-1/2 md:w-full md:max-w-4xl bg-white rounded-lg shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setMode('do')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  mode === 'do' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Brain className="w-4 h-4 inline mr-1" />
                Do
              </button>
              <button
                onClick={() => setMode('ask')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  mode === 'ask' 
                    ? 'bg-purple-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Sparkles className="w-4 h-4 inline mr-1" />
                Ask
              </button>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              AI Assistant
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {conversation.length > 0 && (
              <button
                onClick={clearConversation}
                className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
              >
                Clear
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conversation Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {conversation.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {mode === 'do' ? <Brain className="w-8 h-8 text-blue-600" /> : <Sparkles className="w-8 h-8 text-purple-600" />}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {mode === 'do' ? 'What can I help you do?' : 'What would you like to know?'}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {mode === 'do' 
                  ? 'I can help you manage your practice with natural language commands.' 
                  : 'Ask me questions about your patients, appointments, or practice data.'
                }
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {mode === 'do' ? [
                  'Schedule Sarah Jones for tomorrow at 2pm',
                  'Request AI intake for upcoming patients',
                  'Send payment reminders to overdue accounts',
                  'Create a task to call Michael Brown'
                ].map((example) => (
                  <button
                    key={example}
                    onClick={() => handleSuggestionClick(example)}
                    className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {example}
                  </button>
                )) : [
                  'How many appointments do we have today?',
                  'Which patients have overdue payments?',
                  'Show me this week\'s revenue',
                  'What are our busiest appointment times?'
                ].map((example) => (
                  <button
                    key={example}
                    onClick={() => handleSuggestionClick(example)}
                    className="text-xs px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            conversation.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                  {message.role === 'assistant' && (
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <Bot className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs text-gray-500">AI Assistant</span>
                    </div>
                  )}
                  
                  <div className={`px-4 py-3 rounded-lg ${
                    message.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : `bg-gray-50 text-gray-900 border-l-4 ${getMessageBorderColor(message.type)}`
                  }`}>
                    {message.role === 'assistant' && message.type && (
                      <div className="flex items-center space-x-2 mb-2">
                        {getMessageIcon(message.type)}
                        <span className="text-xs font-medium text-gray-600 uppercase">
                          {message.type}
                        </span>
                      </div>
                    )}
                    
                    <p className="text-sm">{message.content}</p>
                    
                    {/* Ask Response Data */}
                    {message.data && message.data.type && (
                      <div className="mt-3">
                        <AskResponse response={message.data} />
                      </div>
                    )}
                    
                    {/* Suggestions */}
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {message.suggestions.map((suggestion, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    {message.actions && message.actions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {message.actions.map((action) => (
                          <button
                            key={action.id}
                            onClick={() => handleActionClick(action)}
                            className={`text-xs px-3 py-1.5 rounded font-medium transition-colors ${
                              action.type === 'primary' 
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : action.type === 'danger'
                                ? 'bg-red-600 text-white hover:bg-red-700'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {message.role === 'user' && (
                    <div className="flex items-center justify-end space-x-2 mt-1">
                      <span className="text-xs text-gray-500">You</span>
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="w-3 h-3 text-gray-600" />
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
          
          {isProcessing && (
            <div className="flex justify-start">
              <div className="max-w-xs lg:max-w-md">
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    <Bot className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs text-gray-500">AI Assistant</span>
                </div>
                <div className="bg-gray-50 px-4 py-3 rounded-lg border-l-4 border-l-blue-500">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    <span className="text-sm text-gray-600">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          <form onSubmit={handleSubmit} className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={mode === 'do' 
                  ? "Type an instruction... e.g., 'Schedule Sarah for tomorrow at 2pm'"
                  : "Ask a question... e.g., 'How many appointments today?'"
                }
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isProcessing}
              />
              <button
                type="submit"
                disabled={!input.trim() || isProcessing}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>
              {mode === 'do' ? 'AI will help execute your requests' : 'AI will analyze your data'}
            </span>
            <span>Press Enter to send</span>
          </div>
        </div>
      </div>

      {/* Clarification Modal */}
      {showClarificationModal && clarificationPlan && (
        <ClarificationModal
          isOpen={showClarificationModal}
          plan={clarificationPlan}
          onClose={() => setShowClarificationModal(false)}
          onSubmit={(answers) => {
            setShowClarificationModal(false)
            // Process clarification answers
            onPlanCreated(clarificationPlan)
          }}
        />
      )}
    </>
  )
}
