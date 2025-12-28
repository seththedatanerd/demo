'use client'

import { useState, useEffect, useRef } from 'react'
import { useStore, useRole, useAIActions } from '@/store'
import { createPlan } from '@/services/planner'
import { askQuestion } from '@/services/ask-engine'
import { conversationalAI } from '@/services/conversational-ai'
import { X, Send, Sparkles, MessageSquare, Bot, User, Lightbulb, CheckCircle, AlertCircle, Info, XCircle, Plus, History, Phone, Clock, ChevronRight, Calendar, CreditCard, FileText } from 'lucide-react'
import { ConversationMessage, AIResponseType, ConversationAction, Plan } from '@/types/core'
// Using regular HTML elements instead of UI library components
import AskResponse from '@/components/AskResponse'
import ClarificationModal from '@/components/ClarificationModal'
// import { toast } from 'sonner' // Not available, using console.log for now
import { v4 as uuidv4 } from 'uuid'
import { usePathname } from 'next/navigation'

interface ConversationTab {
  id: string
  name: string
  sessionId: string
  messages: ConversationMessage[]
}

interface ConversationPanelProps {
  isOpen: boolean
  onClose: () => void
  onPlanCreated: (plan: Plan) => void
}

const MAX_TABS = 3

export default function ConversationPanel({ isOpen, onClose, onPlanCreated }: ConversationPanelProps) {
  const [input, setInput] = useState('')
  const [isAIThinking, setIsAIThinking] = useState(false)
  const [mode, setMode] = useState<'do' | 'ask'>('do')
  const [clarificationPlan, setClarificationPlan] = useState<Plan | null>(null)
  const [showClarificationModal, setShowClarificationModal] = useState(false)
  const [tabs, setTabs] = useState<ConversationTab[]>([])
  const [activeTabId, setActiveTabId] = useState<string>('')
  const [showActionHistory, setShowActionHistory] = useState(false)

  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { patients, appointments, invoices } = useStore()
  const { currentRole, hasPermission } = useRole()
  const { todaysActions, aiActions } = useAIActions()
  const pathname = usePathname()

  // Get current active tab's messages and sessionId
  const activeTab = tabs.find(t => t.id === activeTabId)
  const messages = activeTab?.messages || []
  const sessionId = activeTab?.sessionId || ''

  // Load tabs from session storage on mount
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      
      // Try to load existing tabs from session storage
      const savedTabs = sessionStorage.getItem('conversationTabs')
      const savedActiveTabId = sessionStorage.getItem('activeConversationTabId')
      
      if (savedTabs) {
        try {
          const parsedTabs = JSON.parse(savedTabs) as ConversationTab[]
          // Restore messages from conversationalAI for each tab
          const restoredTabs = parsedTabs.map(tab => {
            const context = conversationalAI.getOrCreateConversation(tab.sessionId, currentRole, pathname)
            return {
              ...tab,
              messages: context.messages
            }
          })
          
          // Only update if tabs have changed to avoid infinite loops
          if (JSON.stringify(restoredTabs.map(t => t.id)) !== JSON.stringify(tabs.map(t => t.id)) || tabs.length === 0) {
            setTabs(restoredTabs)
          } else {
            // Just refresh messages for existing tabs
            setTabs(prev => prev.map(tab => {
              const messages = conversationalAI.getConversationMessages(tab.sessionId)
              return { ...tab, messages }
            }))
          }
          
          if (savedActiveTabId && restoredTabs.find(t => t.id === savedActiveTabId)) {
            setActiveTabId(savedActiveTabId)
          } else if (restoredTabs.length > 0 && !activeTabId) {
            setActiveTabId(restoredTabs[0].id)
          }
        } catch (e) {
          // If parsing fails and no tabs exist, create a new tab
          if (tabs.length === 0) {
            createNewTab()
          }
        }
      } else if (tabs.length === 0) {
        // No saved tabs and no existing tabs, create the first one
        createNewTab()
      }
    }
  }, [isOpen])

  // Save tabs to session storage when they change
  useEffect(() => {
    if (tabs.length > 0) {
      // Save tab metadata (not messages, those are in conversationalAI)
      const tabsToSave = tabs.map(({ id, name, sessionId }) => ({ id, name, sessionId, messages: [] }))
      sessionStorage.setItem('conversationTabs', JSON.stringify(tabsToSave))
      sessionStorage.setItem('activeConversationTabId', activeTabId)
    }
  }, [tabs, activeTabId])

  // Update context when role or pathname changes
  useEffect(() => {
    if (sessionId) {
      conversationalAI.updateUserContext(sessionId, { role: currentRole, currentPage: pathname })
    }
  }, [currentRole, pathname, sessionId])

  // Listen for updates from the command bar
  useEffect(() => {
    const handleConversationUpdate = (event: CustomEvent<{ sessionId: string; tabName?: string }>) => {
      const { sessionId: updatedSessionId, tabName } = event.detail
      
      // Find and update the tab with this session ID
      setTabs(prev => prev.map(tab => {
        if (tab.sessionId === updatedSessionId) {
          const updatedMessages = conversationalAI.getConversationMessages(updatedSessionId)
          return {
            ...tab,
            messages: updatedMessages,
            // Update name if provided and tab still has default name
            name: tabName && tab.name.startsWith('Chat ') ? tabName : tab.name
          }
        }
        return tab
      }))
    }

    window.addEventListener('conversationUpdated', handleConversationUpdate as EventListener)
    return () => {
      window.removeEventListener('conversationUpdated', handleConversationUpdate as EventListener)
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Listen for AI action logged events and add notification to chat
  useEffect(() => {
    const handleAIActionLogged = (event: CustomEvent<any>) => {
      const action = event.detail
      
      // Add a notification message to the active chat
      if (sessionId && activeTabId) {
        const notificationMessage: ConversationMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: `✅ AI Action Completed: ${action.title}`,
          timestamp: new Date(),
          type: 'success',
          data: {
            actionType: action.type,
            actionsCount: action.actionsExecuted?.length || 0,
            source: action.source
          }
        }
        conversationalAI.addMessage(sessionId, notificationMessage)
        updateTabMessages(activeTabId, conversationalAI.getConversationMessages(sessionId))
      }
    }

    window.addEventListener('aiActionLogged', handleAIActionLogged as EventListener)
    return () => {
      window.removeEventListener('aiActionLogged', handleAIActionLogged as EventListener)
    }
  }, [sessionId, activeTabId])

  const createNewTab = () => {
    if (tabs.length >= MAX_TABS) return

    const newTabId = uuidv4()
    const newSessionId = uuidv4()
    const tabNumber = tabs.length + 1
    
    // Initialize conversation in the AI service
    conversationalAI.getOrCreateConversation(newSessionId, currentRole, pathname)
    
    const newTab: ConversationTab = {
      id: newTabId,
      name: `Chat ${tabNumber}`,
      sessionId: newSessionId,
      messages: []
    }
    
    setTabs(prev => [...prev, newTab])
    setActiveTabId(newTabId)
    
    // Send welcome message for the new tab
    setTimeout(() => sendAIWelcomeMessage(newSessionId, newTabId), 100)
  }

  const closeTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (tabs.length === 1) return // Don't close the last tab
    
    const tabIndex = tabs.findIndex(t => t.id === tabId)
    const newTabs = tabs.filter(t => t.id !== tabId)
    setTabs(newTabs)
    
    // If closing the active tab, switch to another one
    if (tabId === activeTabId) {
      const newActiveIndex = Math.min(tabIndex, newTabs.length - 1)
      setActiveTabId(newTabs[newActiveIndex].id)
    }
  }

  const switchTab = (tabId: string) => {
    setActiveTabId(tabId)
  }

  const updateTabMessages = (tabId: string, newMessages: ConversationMessage[]) => {
    setTabs(prev => prev.map(tab => 
      tab.id === tabId ? { ...tab, messages: newMessages } : tab
    ))
  }

  const sendAIWelcomeMessage = async (sId: string, tabId?: string) => {
    setIsAIThinking(true)
    const welcomeMessage: ConversationMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: `Hello! I'm your AI assistant. How can I help you today as a ${currentRole}?`,
      timestamp: new Date(),
      type: 'information',
      suggestions: getWelcomeSuggestions()
    }
    conversationalAI.addMessage(sId, welcomeMessage)
    const updatedMessages = conversationalAI.getConversationMessages(sId)
    
    // Update the specific tab's messages
    const targetTabId = tabId || activeTabId
    updateTabMessages(targetTabId, updatedMessages)
    setIsAIThinking(false)
  }

  const getWelcomeSuggestions = () => {
    if (currentRole === 'reception') {
      return [
        "Schedule Sarah Jones for Thu 2:30 and notify via text",
        "Set up payment plan for Amelia £72.50 x3 months",
        "Verify insurance for all tomorrow's appointments"
      ]
    } else if (currentRole === 'clinician') {
      return [
        "Clinical wrap-up for Mrs Johnson - referral to cardiology",
        "Draft urgent referral to Dr Martinez for chest pain",
        "Update treatment plan and schedule 2-week review"
      ]
    } else if (currentRole === 'manager') {
      return [
        "Generate revenue report with insurance breakdown",
        "Review staff utilization and optimize next week's schedule",
        "Chase all overdue accounts >£100 with payment plans"
      ]
    }
    return ["What can I help you with today?"]
  }

  const handleSendMessage = async (command: string) => {
    if (!command.trim() || !sessionId) return

    const userMessage: ConversationMessage = {
      id: uuidv4(),
      role: 'user',
      content: command,
      timestamp: new Date(),
    }
    conversationalAI.addMessage(sessionId, userMessage)
    updateTabMessages(activeTabId, conversationalAI.getConversationMessages(sessionId))
    setInput('')
    setIsAIThinking(true)

    // Update tab name based on first user message if it's still "Chat X"
    const currentTab = tabs.find(t => t.id === activeTabId)
    if (currentTab && currentTab.name.startsWith('Chat ')) {
      const shortName = command.slice(0, 20) + (command.length > 20 ? '...' : '')
      setTabs(prev => prev.map(tab => 
        tab.id === activeTabId ? { ...tab, name: shortName } : tab
      ))
    }

    try {
      let aiResponse: ConversationMessage | null = null
      let plan: Plan | null = null

      if (mode === 'ask') {
        const askResult = await askQuestion(command, { patients, appointments, invoices, role: currentRole })
        aiResponse = {
          id: uuidv4(),
          role: 'assistant',
          content: `Here's what I found for "${command}":`,
          timestamp: new Date(),
          type: 'information',
          data: askResult,
        }
      } else { // 'do' mode
        plan = await createPlan(command, {
          actor: 'user',
          source: 'cmdk',
          role: currentRole,
          autopilotMode: 'manual',
          patients,
          appointments,
          invoices
        } as any)

        if (plan?.needsClarification) {
          setClarificationPlan(plan)
          setShowClarificationModal(true)
          aiResponse = {
            id: uuidv4(),
            role: 'assistant',
            content: `I need a bit more information to complete this task: "${command}". Can you clarify?`,
            timestamp: new Date(),
            type: 'clarification',
            relatedCommand: command,
            planId: plan.id,
          }
        } else if (plan) {
          aiResponse = {
            id: uuidv4(),
            role: 'assistant',
            content: `I've drafted a plan for "${command}". Please review before executing.`,
            timestamp: new Date(),
            type: 'confirmation',
            relatedCommand: command,
            planId: plan.id,
            actions: [
              { id: 'review', label: 'Review Plan', type: 'primary', action: 'show_data', payload: { planId: plan.id } },
              { id: 'execute', label: 'Execute Now', type: 'secondary', action: 'execute_plan', payload: { planId: plan.id } },
              { id: 'modify', label: 'Modify Command', type: 'secondary', action: 'modify_command' },
              { id: 'cancel', label: 'Cancel', type: 'danger', action: 'dismiss' }
            ]
          }
          // Store the plan for later retrieval
          aiResponse.data = plan
        } else {
          aiResponse = await conversationalAI.generateResponse(sessionId, command, plan ? { plan } : undefined)
        }
      }

      if (aiResponse) {
        conversationalAI.addMessage(sessionId, aiResponse)
        updateTabMessages(activeTabId, conversationalAI.getConversationMessages(sessionId))
      }

    } catch (error: any) {
      console.error('Error processing command:', error)
      const errorMessage: ConversationMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: `I encountered an error: ${error.message || 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
        type: 'error',
        relatedCommand: command,
      }
      conversationalAI.addMessage(sessionId, errorMessage)
      updateTabMessages(activeTabId, conversationalAI.getConversationMessages(sessionId))
      console.error(`Error: ${error.message || 'Failed to process command'}`)
    } finally {
      setIsAIThinking(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    handleSendMessage(suggestion)
  }

  const handleActionClick = (action: ConversationAction, message: ConversationMessage) => {
    if (action.action === 'execute_plan' && message.data) {
      onPlanCreated(message.data as Plan)
      onClose()
    } else if (action.action === 'show_data' && message.data) {
      onPlanCreated(message.data as Plan)
      onClose()
    } else if (action.action === 'modify_command' && message.relatedCommand) {
      setInput(message.relatedCommand)
    } else if (action.action === 'dismiss') {
      console.log("Action dismissed.")
    }
  }

  const getMessageIcon = (type?: AIResponseType) => {
    switch (type) {
      case 'clarification': return <AlertCircle className="w-4 h-4 text-amber-500" />
      case 'suggestion': return <Lightbulb className="w-4 h-4 text-purple-500" />
      case 'confirmation': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'information': return <Info className="w-4 h-4 text-blue-500" />
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />
      default: return <Bot className="w-4 h-4 text-gray-500" />
    }
  }

  const getMessageBorderColor = (type?: AIResponseType) => {
    switch (type) {
      case 'clarification': return 'border-l-amber-400'
      case 'suggestion': return 'border-l-purple-400'
      case 'confirmation': return 'border-l-green-400'
      case 'information': return 'border-l-blue-400'
      case 'error': return 'border-l-red-400'
      case 'success': return 'border-l-green-400'
      default: return 'border-l-gray-300'
    }
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div className={`fixed top-0 right-0 h-full w-[420px] bg-white shadow-2xl border-l border-gray-200 z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-semibold text-gray-900">
              {showActionHistory ? 'AI Activity Log' : 'Conversations'}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {/* Action History Toggle */}
            <button
              onClick={() => setShowActionHistory(!showActionHistory)}
              className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                showActionHistory
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="View AI action history"
            >
              <History className="w-3.5 h-3.5" />
              <span>Activity</span>
              {todaysActions.length > 0 && (
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                  showActionHistory ? 'bg-green-200' : 'bg-blue-100 text-blue-700'
                }`}>
                  {todaysActions.length}
                </span>
              )}
            </button>

            {/* Mode Toggle - only show when not in action history */}
            {!showActionHistory && (
            <div className="flex items-center bg-white rounded-full p-0.5 border border-gray-200">
              <button
                onClick={() => setMode('do')}
                className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium transition-all ${
                  mode === 'do'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>DO</span>
              </button>
              <button
                onClick={() => setMode('ask')}
                className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium transition-all ${
                  mode === 'ask'
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <MessageSquare className="w-3 h-3" />
                <span>ASK</span>
              </button>
            </div>
            )}
            <button 
              onClick={onClose} 
              className="h-8 w-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs Bar - only show when not in action history */}
        {!showActionHistory && (
          <div className="flex items-center border-b border-gray-200 bg-gray-50/50 px-2">
            <div className="flex items-center flex-1 overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => switchTab(tab.id)}
                  className={`group flex items-center space-x-1 px-3 py-2 text-xs font-medium border-b-2 transition-all min-w-0 max-w-[120px] ${
                    tab.id === activeTabId
                      ? 'border-blue-600 text-blue-700 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <MessageSquare className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{tab.name}</span>
                  {tabs.length > 1 && (
                    <span
                      onClick={(e) => closeTab(tab.id, e)}
                      className="ml-1 opacity-0 group-hover:opacity-100 hover:bg-gray-300 rounded p-0.5 transition-opacity flex-shrink-0"
                    >
                      <X className="w-3 h-3" />
                    </span>
                  )}
                </button>
              ))}
            </div>
            
            {/* New Tab Button */}
            {tabs.length < MAX_TABS && (
              <button
                onClick={createNewTab}
                className="flex items-center justify-center w-7 h-7 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors ml-1 flex-shrink-0"
                title="New conversation (max 3)"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* AI Action History View */}
        {showActionHistory && (
          <div className="flex-1 h-[calc(100vh-100px)] overflow-y-auto">
            <div className="p-4">
              {/* Today's Activity Summary */}
              <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-green-800">Today's AI Activity</h3>
                  <span className="text-xs text-green-600">
                    {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-green-800 font-medium">{todaysActions.length}</span>
                    <span className="text-green-600">actions completed</span>
                  </div>
                </div>
              </div>

              {/* Action List */}
              {todaysActions.length > 0 ? (
                <div className="space-y-3">
                  {todaysActions.map((action) => (
                    <AIActionCard key={action.id} action={action} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No AI actions today yet</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Actions from calls, commands, and automated tasks will appear here
                  </p>
                </div>
              )}

              {/* Older Actions */}
              {aiActions.filter(a => !todaysActions.includes(a)).length > 0 && (
                <div className="mt-6">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">Previous Activity</h4>
                  <div className="space-y-2 opacity-75">
                    {aiActions
                      .filter(a => !todaysActions.includes(a))
                      .slice(0, 10)
                      .map((action) => (
                        <AIActionCard key={action.id} action={action} compact />
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Messages Area - only show when not in action history */}
        {!showActionHistory && (
        <div className="flex-1 h-[calc(100vh-140px)] overflow-y-auto">
          <div className="p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-lg p-3'
                      : `bg-gray-50 text-gray-800 rounded-lg p-3 border-l-4 ${getMessageBorderColor(msg.type)}`
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex items-center space-x-2 mb-2">
                      {getMessageIcon(msg.type)}
                      <span className="text-xs font-medium text-gray-500 uppercase">
                        {msg.type || 'Assistant'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                  
                  <p className="text-sm leading-relaxed">{msg.content}</p>

                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {msg.suggestions.map((s, i) => (
                        <span
                          key={i}
                          className="cursor-pointer hover:bg-blue-100 transition-colors text-blue-700 text-xs px-2 py-1 bg-gray-100 rounded-full border"
                          onClick={() => handleSuggestionClick(s)}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {msg.actions && msg.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {msg.actions.map((action) => (
                        <button
                          key={action.id}
                          className={`text-xs px-3 py-1 rounded transition-colors ${
                            action.type === 'primary' ? 'bg-blue-600 text-white hover:bg-blue-700' :
                            action.type === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' :
                            'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300'
                          }`}
                          onClick={() => handleActionClick(action, msg)}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {msg.data && msg.type === 'information' && (
                    <div className="mt-3 p-3 bg-white rounded-md border border-gray-200">
                      <AskResponse 
                        response={msg.data} 
                        onSuggestionClick={(suggestion) => {
                          setMode('ask')
                          handleSendMessage(suggestion)
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isAIThinking && (
              <div className="flex justify-start">
                <div className="max-w-[85%] bg-gray-50 text-gray-800 rounded-lg p-3 border-l-4 border-l-gray-300">
                  <div className="flex items-center space-x-2 mb-2">
                    <Bot className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-medium text-gray-500 uppercase">Thinking</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Input Area - only show when not in action history */}
        {!showActionHistory && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(input)}
              placeholder={`Type a ${mode === 'do' ? 'command' : 'question'}...`}
              className="flex-1 text-sm px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              disabled={isAIThinking}
            />
            <button 
              onClick={() => handleSendMessage(input)} 
              disabled={isAIThinking || !input.trim()}
              className={`h-10 w-10 flex items-center justify-center rounded-md transition-colors ${
                isAIThinking || !input.trim() 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Press Enter to send • {currentRole} mode
          </div>
        </div>
        )}

        {/* Clarification Modal */}
        {clarificationPlan && (
        <ClarificationModal
          isOpen={showClarificationModal}
          onClose={() => {
            setShowClarificationModal(false)
            setClarificationPlan(null)
          }}
          plan={clarificationPlan}
          onSubmit={(answers) => {
            setShowClarificationModal(false)
            setClarificationPlan(null)
            console.log("Clarification received. Please re-enter your command with more details.")
          }}
        />
        )}
      </div>
    </>
  )
}

// AI Action Card Component
function AIActionCard({ action, compact = false }: { action: any; compact?: boolean }) {
  const [expanded, setExpanded] = useState(false)

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call_followup': return <Phone className="w-4 h-4" />
      case 'task_created': return <CheckCircle className="w-4 h-4" />
      case 'appointment_scheduled': return <Calendar className="w-4 h-4" />
      case 'payment_processed': return <CreditCard className="w-4 h-4" />
      case 'message_sent': return <MessageSquare className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'call': return { label: 'Call', color: 'bg-blue-100 text-blue-700' }
      case 'command': return { label: 'Command', color: 'bg-purple-100 text-purple-700' }
      case 'autopilot': return { label: 'Autopilot', color: 'bg-green-100 text-green-700' }
      default: return { label: 'Manual', color: 'bg-gray-100 text-gray-700' }
    }
  }

  const sourceBadge = getSourceBadge(action.source)
  const time = new Date(action.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (compact) {
    return (
      <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg text-sm">
        <div className="p-1.5 bg-gray-200 rounded text-gray-600">
          {getTypeIcon(action.type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-700 truncate">{action.title}</p>
        </div>
        <span className="text-xs text-gray-400">{time}</span>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div 
        className="p-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-green-100 rounded-lg text-green-600">
            {getTypeIcon(action.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <span className="font-medium text-gray-900 text-sm">{action.title}</span>
              <span className={`px-1.5 py-0.5 rounded text-xs ${sourceBadge.color}`}>
                {sourceBadge.label}
              </span>
            </div>
            <p className="text-xs text-gray-600 line-clamp-1">{action.description}</p>
            <div className="flex items-center space-x-3 mt-1.5 text-xs text-gray-500">
              <span className="flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>{time}</span>
              </span>
              <span>{action.actionsExecuted?.length || 0} actions</span>
              <span className="capitalize">{action.executedBy}</span>
            </div>
          </div>
          <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-gray-100 pt-3">
          {/* Actions Executed */}
          {action.actionsExecuted && action.actionsExecuted.length > 0 && (
            <div className="mb-3">
              <h5 className="text-xs font-medium text-gray-500 uppercase mb-2">Actions Executed</h5>
              <div className="space-y-1.5">
                {action.actionsExecuted.map((item: any, i: number) => (
                  <div key={i} className="flex items-center space-x-2 text-xs">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700">{item.label}</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-gray-500">{item.assignee}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evidence */}
          {action.evidence && action.evidence.length > 0 && (
            <div>
              <h5 className="text-xs font-medium text-gray-500 uppercase mb-2">Evidence</h5>
              <div className="space-y-1">
                {action.evidence.map((snippet: string, i: number) => (
                  <p key={i} className="text-xs text-gray-600 italic pl-2 border-l-2 border-gray-200">
                    {snippet}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Patient/Caller Info */}
          {(action.caller || action.patientName) && (
            <div className="mt-3 pt-2 border-t border-gray-100 flex items-center space-x-2 text-xs text-gray-500">
              <User className="w-3.5 h-3.5" />
              <span>{action.caller || action.patientName}</span>
              {action.phone && <span>• {action.phone}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
