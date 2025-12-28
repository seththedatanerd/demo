import { StateCreator } from 'zustand'

export interface AIAction {
  id: string
  timestamp: string
  type: 'call_followup' | 'task_created' | 'message_sent' | 'appointment_scheduled' | 'payment_processed' | 'plan_executed' | 'other'
  title: string
  description: string
  source: 'call' | 'command' | 'autopilot' | 'manual'
  caller?: string
  phone?: string
  patientId?: string
  patientName?: string
  intent?: string
  actionsExecuted: {
    label: string
    assignee: string
    dueDate: string
    priority: string
    note?: string
    status: 'completed' | 'pending' | 'failed'
  }[]
  evidence?: string[]
  executedBy: string // Role that executed it
}

export interface AIActionSlice {
  aiActions: AIAction[]
  todaysActions: AIAction[]
  
  // Actions
  logAIAction: (action: Omit<AIAction, 'id' | 'timestamp'>) => void
  clearTodaysActions: () => void
  getActionsByDate: (date: string) => AIAction[]
  getActionsBySource: (source: AIAction['source']) => AIAction[]
}

// Check if two dates are the same day
const isSameDay = (date1: Date, date2: Date) => {
  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
}

export const createAIActionSlice: StateCreator<AIActionSlice> = (set, get) => ({
  aiActions: [],
  todaysActions: [],

  logAIAction: (actionData) => {
    const newAction: AIAction = {
      ...actionData,
      id: `ai-action-${Date.now()}`,
      timestamp: new Date().toISOString()
    }

    set(state => {
      const updatedActions = [newAction, ...state.aiActions]
      const today = new Date()
      const updatedTodaysActions = updatedActions.filter(a => 
        isSameDay(new Date(a.timestamp), today)
      )
      
      return {
        aiActions: updatedActions.slice(0, 100), // Keep last 100 actions
        todaysActions: updatedTodaysActions
      }
    })

    // Dispatch event for ConversationPanel to pick up
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aiActionLogged', { detail: newAction }))
    }
  },

  clearTodaysActions: () => {
    set(state => ({
      todaysActions: []
    }))
  },

  getActionsByDate: (dateStr: string) => {
    const { aiActions } = get()
    const targetDate = new Date(dateStr)
    return aiActions.filter(a => isSameDay(new Date(a.timestamp), targetDate))
  },

  getActionsBySource: (source: AIAction['source']) => {
    const { aiActions } = get()
    return aiActions.filter(a => a.source === source)
  }
})

