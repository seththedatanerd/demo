'use client'

import { useState, useRef, useEffect } from 'react'
import { useStore, useRole } from '@/store'
import { createPlan } from '@/services/planner'
import { askQuestion } from '@/services/ask-engine'
import { conversationalAI } from '@/services/conversational-ai'
import { Sparkles, Send, MessageSquare, Paperclip, Mic } from 'lucide-react'
import { Plan, ConversationMessage } from '@/types/core'
// Using regular HTML buttons instead of UI library
// import { toast } from 'sonner' // Not available, using console.log for now
import { v4 as uuidv4 } from 'uuid'
import { usePathname } from 'next/navigation'

interface ChatGPTCommandBarProps {
  onPlanCreated: (plan: Plan) => void
  onOpenConversation: () => void
}

export default function ChatGPTCommandBar({ onPlanCreated, onOpenConversation }: ChatGPTCommandBarProps) {
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [mode, setMode] = useState<'do' | 'ask'>('do')
  const inputRef = useRef<HTMLInputElement>(null)
  
  const { autopilotMode, patients, appointments, invoices } = useStore()
  const { currentRole } = useRole()
  const pathname = usePathname()

  // Auto-focus on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Helper to get or create the active tab's session ID
  const getActiveTabSessionId = (): string => {
    const savedTabs = sessionStorage.getItem('conversationTabs')
    const savedActiveTabId = sessionStorage.getItem('activeConversationTabId')
    
    if (savedTabs && savedActiveTabId) {
      try {
        const tabs = JSON.parse(savedTabs)
        const activeTab = tabs.find((t: any) => t.id === savedActiveTabId)
        if (activeTab?.sessionId) {
          return activeTab.sessionId
        }
      } catch (e) {
        // Fall through to create new
      }
    }
    
    // No active tab exists yet - we'll create one when conversation panel opens
    // For now, use a temporary session that will be picked up
    const newSessionId = uuidv4()
    const newTabId = uuidv4()
    const newTab = { id: newTabId, name: 'Chat 1', sessionId: newSessionId, messages: [] }
    
    sessionStorage.setItem('conversationTabs', JSON.stringify([newTab]))
    sessionStorage.setItem('activeConversationTabId', newTabId)
    
    // Initialize the conversation in the AI service
    conversationalAI.getOrCreateConversation(newSessionId, currentRole, pathname)
    
    return newSessionId
  }

  // Notify the conversation panel to refresh
  const notifyConversationUpdate = (sessionId: string, tabName?: string) => {
    window.dispatchEvent(new CustomEvent('conversationUpdated', { 
      detail: { sessionId, tabName } 
    }))
  }

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || isProcessing) return

    const command = input.trim()
    setInput('')
    setIsProcessing(true)

    // Get the active tab's session ID
    const sessionId = getActiveTabSessionId()

    try {
      // Add user message to conversation
      const userMessage: ConversationMessage = {
        id: uuidv4(),
        role: 'user',
        content: command,
        timestamp: new Date(),
      }
      conversationalAI.addMessage(sessionId, userMessage)

      // Update tab name based on first real user message
      const shortName = command.slice(0, 20) + (command.length > 20 ? '...' : '')
      
      if (mode === 'ask') {
        // Process the ask query
        const response = await askQuestion(command, { 
          patients, 
          appointments, 
          invoices, 
          role: currentRole 
        })
        
        const aiMessage: ConversationMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: `Here's what I found for "${command}":`,
          timestamp: new Date(),
          type: 'information',
          data: response,
          relatedCommand: command,
        }
        
        conversationalAI.addMessage(sessionId, aiMessage)
        notifyConversationUpdate(sessionId, shortName)
        
        // Open the conversation panel to show results
        onOpenConversation()
        console.log('Query processed - check the conversation panel')
      } else {
        // For Do mode, try to create a plan directly
        const plan = await createPlan(command, {
          actor: 'user',
          source: 'cmdk',
          role: currentRole,
          autopilotMode,
          patients,
          appointments,
          invoices
        } as any)

        if (plan) {
          if (plan.needsClarification) {
            // Add clarification message to conversation
            const clarificationMessage: ConversationMessage = {
              id: uuidv4(),
              role: 'assistant',
              content: `I need a bit more information to complete this task: "${command}". Can you clarify?`,
              timestamp: new Date(),
              type: 'clarification',
              relatedCommand: command,
              planId: plan.id,
            }
            conversationalAI.addMessage(sessionId, clarificationMessage)
            notifyConversationUpdate(sessionId, shortName)
            
            // Open conversation for clarification
            onOpenConversation()
            console.log('I need more details - check the conversation panel')
          } else {
            // Plan is ready - add confirmation message to conversation
            const confirmMessage: ConversationMessage = {
              id: uuidv4(),
              role: 'assistant',
              content: `I've drafted a plan for "${command}". Please review before executing.`,
              timestamp: new Date(),
              type: 'confirmation',
              relatedCommand: command,
              planId: plan.id,
              data: plan,
              actions: [
                { id: 'review', label: 'Review Plan', type: 'primary', action: 'show_data', payload: { planId: plan.id } },
                { id: 'execute', label: 'Execute Now', type: 'secondary', action: 'execute_plan', payload: { planId: plan.id } },
                { id: 'modify', label: 'Modify Command', type: 'secondary', action: 'modify_command' },
                { id: 'cancel', label: 'Cancel', type: 'danger', action: 'dismiss' }
              ]
            }
            conversationalAI.addMessage(sessionId, confirmMessage)
            notifyConversationUpdate(sessionId, shortName)
            
            // Open preview
            onPlanCreated(plan)
            console.log('Plan created successfully')
          }
        } else {
          // Fallback - add a generic response
          const fallbackMessage: ConversationMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: `I'll help you with: "${command}". Let me process that...`,
            timestamp: new Date(),
            type: 'information',
            relatedCommand: command,
          }
          conversationalAI.addMessage(sessionId, fallbackMessage)
          notifyConversationUpdate(sessionId, shortName)
          
          // Open conversation
          onOpenConversation()
          console.log('Let me help you with that - check the conversation panel')
        }
      }
    } catch (error: any) {
      console.error('Command processing failed:', error)
      
      // Add error message to conversation
      const errorMessage: ConversationMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: `I encountered an error processing your request: ${error.message || 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
        type: 'error',
        relatedCommand: command,
      }
      conversationalAI.addMessage(sessionId, errorMessage)
      notifyConversationUpdate(sessionId)
      
      console.error(`Error: ${error.message || 'Failed to process command'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const placeholderText = mode === 'do' 
    ? 'Type an instruction... e.g., "Chase invoices >30d and confirm SMS"'
    : 'Ask a question... e.g., "What\'s our monthly revenue trend?"'

  return (
    <div className="sticky bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 shadow-lg z-40 relative">
      {/* Subtle cyan glow line at the top of the bar */}
      <div className="absolute -top-px inset-x-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />
      <div className="max-w-4xl mx-auto p-4">
        <form onSubmit={handleSubmit} className="relative">
          {/* Mode Toggle */}
          <div className="flex items-center justify-center mb-3">
            <div className="flex items-center bg-gray-100 rounded-full p-1.5">
              <button
                type="button"
                onClick={() => setMode('do')}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-base font-medium transition-all ${
                  mode === 'do'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Sparkles className="w-5 h-5" />
                <span>DO</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('ask')}
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-full text-base font-medium transition-all ${
                  mode === 'ask'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                <span>ASK</span>
              </button>
            </div>
          </div>

          {/* Input Container with cyan AI glow */}
          <div className="group relative">
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-cyan-400/40 via-cyan-300/30 to-cyan-400/40 blur-sm opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity" />
            <div className="relative flex items-center rounded-xl border border-cyan-200/60 bg-white/80 backdrop-blur px-0 shadow-[0_0_0_1px_rgba(103,232,249,0.25)] hover:shadow-[0_0_0_2px_rgba(34,211,238,0.35)] focus-within:ring-2 focus-within:ring-cyan-400">
            {/* Attachment Button */}
            <button
              type="button"
              className="absolute left-3 p-2 text-cyan-700/60 hover:text-cyan-700 transition-colors"
              title="Attach file"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Main Input */}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholderText}
              disabled={isProcessing}
              className="w-full pl-12 pr-20 py-4 bg-transparent rounded-xl text-base placeholder:text-cyan-700/60 focus:outline-none disabled:opacity-50"
            />

            {/* Voice Input Button */}
            <button
              type="button"
              className="absolute right-12 p-2 text-cyan-700/60 hover:text-cyan-700 transition-colors"
              title="Voice input"
            >
              <Mic className="w-4 h-4" />
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className={`absolute right-2 p-2 rounded-lg transition-all ${
                input.trim() && !isProcessing
                  ? mode === 'do' 
                    ? 'bg-cyan-600 text-white hover:bg-cyan-700' 
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>Press Enter to send</span>
              <span>•</span>
              <button
                type="button"
                onClick={onOpenConversation}
                className="hover:text-gray-700 transition-colors"
              >
                View conversation history
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">
                {currentRole} mode
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
