'use client'

import type { 
  ConversationMessage, 
  ConversationContext, 
  AIResponseType,
  ConversationAction,
  Plan
} from '@/types/core'
import { practiceAI } from './ai'
import { v4 as uuidv4 } from 'uuid'
import type { SystemRole } from '@/types/roles'

class ConversationalAIService {
  private conversations: Map<string, ConversationContext> = new Map()

  // Start a new conversation or get existing one
  getOrCreateConversation(sessionId: string, userRole: SystemRole, currentPage?: string): ConversationContext {
    if (!this.conversations.has(sessionId)) {
      this.conversations.set(sessionId, {
        sessionId,
        messages: [],
        userContext: {
          role: userRole,
          recentCommands: [],
          currentPage
        }
      })
    }
    return this.conversations.get(sessionId)!
  }

  // Add user message to conversation
  addUserMessage(sessionId: string, content: string, command?: string): ConversationMessage {
    const conversation = this.conversations.get(sessionId)
    if (!conversation) throw new Error('Conversation not found')

    const message: ConversationMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: new Date(),
      relatedCommand: command
    }

    conversation.messages.push(message)
    if (command) {
      conversation.currentCommand = command
      conversation.userContext.recentCommands.unshift(command)
      // Keep only last 5 commands
      conversation.userContext.recentCommands = conversation.userContext.recentCommands.slice(0, 5)
    }
    
    return message
  }

  // Add message to conversation (generic method for backward compatibility)
  addMessage(sessionId: string, message: ConversationMessage): ConversationMessage {
    const conversation = this.conversations.get(sessionId)
    if (!conversation) throw new Error('Conversation not found')

    conversation.messages.push(message)
    return message
  }

  // Update user context
  updateUserContext(sessionId: string, context: Partial<{ role: SystemRole; currentPage?: string }>): void {
    const conversation = this.conversations.get(sessionId)
    if (!conversation) throw new Error('Conversation not found')

    if (context.role) {
      conversation.userContext.role = context.role
    }
    if (context.currentPage) {
      conversation.userContext.currentPage = context.currentPage
    }
  }

  // Get conversation messages
  getConversationMessages(sessionId: string): ConversationMessage[] {
    const conversation = this.conversations.get(sessionId)
    if (!conversation) return []
    return conversation.messages
  }

  // Generate AI response based on context
  async generateResponse(
    sessionId: string, 
    userMessage: string, 
    context?: { plan?: Plan; error?: string; data?: any }
  ): Promise<ConversationMessage> {
    const conversation = this.conversations.get(sessionId)
    if (!conversation) throw new Error('Conversation not found')

    // Determine response type and content based on context
    const response = await this.createContextualResponse(conversation, userMessage, context)
    
    conversation.messages.push(response)
    return response
  }

  private async createContextualResponse(
    conversation: ConversationContext,
    userMessage: string,
    context?: { plan?: Plan; error?: string; data?: any }
  ): Promise<ConversationMessage> {
    const userRole = conversation.userContext.role
    const recentCommands = conversation.userContext.recentCommands
    const currentPage = conversation.userContext.currentPage

    // Handle different scenarios
    if (context?.error) {
      return this.createErrorResponse(userMessage, context.error)
    }

    if (context?.plan) {
      return this.createPlanConfirmationResponse(context.plan, userMessage)
    }

    // Check if command needs clarification
    if (await this.needsClarification(userMessage)) {
      return this.createClarificationResponse(userMessage, userRole)
    }

    // Check if we can offer suggestions
    if (await this.canOfferSuggestions(userMessage, userRole, currentPage)) {
      return this.createSuggestionResponse(userMessage, userRole, currentPage)
    }

    // Provide informational response
    return this.createInformationResponse(userMessage, userRole, recentCommands)
  }

  private createErrorResponse(userMessage: string, error: string): ConversationMessage {
    return {
      id: uuidv4(),
      role: 'assistant',
      content: `I couldn't process "${userMessage}". ${error}`,
      timestamp: new Date(),
      type: 'error',
      suggestions: [
        'Try rephrasing your request',
        'Ask for help with available commands',
        'Check the examples'
      ]
    }
  }

  private createPlanConfirmationResponse(plan: Plan, userMessage: string): ConversationMessage {
    const stepCount = plan.steps.length
    const estimatedTime = Math.ceil(stepCount * 0.8) // Rough estimate

    return {
      id: uuidv4(),
      role: 'assistant',
      content: `I understand you want to "${plan.title}". This will involve ${stepCount} steps and take approximately ${estimatedTime} minutes. Would you like me to proceed?`,
      timestamp: new Date(),
      type: 'confirmation',
      planId: plan.id,
      actions: [
        {
          id: 'execute',
          label: 'Yes, proceed',
          type: 'primary',
          action: 'execute_plan',
          payload: { planId: plan.id }
        },
        {
          id: 'modify',
          label: 'Let me modify this',
          type: 'secondary',
          action: 'modify_command',
          payload: { originalCommand: userMessage }
        },
        {
          id: 'cancel',
          label: 'Cancel',
          type: 'secondary',
          action: 'dismiss'
        }
      ]
    }
  }

  private async createClarificationResponse(userMessage: string, userRole: string): Promise<ConversationMessage> {
    // Use AI to generate contextual clarification questions
    const clarificationPrompt = `
    User role: ${userRole}
    User said: "${userMessage}"
    
    This command is ambiguous or incomplete. Generate a helpful clarification question and 3-4 specific suggestions to help them be more precise.
    
    Respond in JSON format:
    {
      "question": "clarifying question",
      "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
    }
    `

    try {
      const aiResponse = await practiceAI.generateResponse(clarificationPrompt, {})
      const parsed = JSON.parse(aiResponse)

      return {
        id: uuidv4(),
        role: 'assistant',
        content: parsed.question,
        timestamp: new Date(),
        type: 'clarification',
        suggestions: parsed.suggestions,
        relatedCommand: userMessage
      }
    } catch (error) {
      // Fallback to generic clarification
      return {
        id: uuidv4(),
        role: 'assistant',
        content: `I need more details to help with "${userMessage}". Could you be more specific?`,
        timestamp: new Date(),
        type: 'clarification',
        suggestions: [
          'Which patient are you referring to?',
          'What timeframe do you mean?',
          'Which specific action do you want?'
        ],
        relatedCommand: userMessage
      }
    }
  }

  private async createSuggestionResponse(userMessage: string, userRole: string, currentPage?: string): Promise<ConversationMessage> {
    // Generate contextual suggestions based on role and current page
    const suggestions = this.getContextualSuggestions(userMessage, userRole, currentPage)

    return {
      id: uuidv4(),
      role: 'assistant',
      content: `I can help you with "${userMessage}". Here are some options:`,
      timestamp: new Date(),
      type: 'suggestion',
      suggestions,
      actions: [
        {
          id: 'show-examples',
          label: 'Show me examples',
          type: 'secondary',
          action: 'show_data',
          payload: { type: 'examples', context: userMessage }
        }
      ]
    }
  }

  private createInformationResponse(userMessage: string, userRole: string, recentCommands: string[]): ConversationMessage {
    // Provide helpful information or context
    const info = this.getContextualInformation(userMessage, userRole, recentCommands)

    return {
      id: uuidv4(),
      role: 'assistant',
      content: info.content,
      timestamp: new Date(),
      type: 'information',
      suggestions: info.suggestions,
      data: info.data
    }
  }

  private async needsClarification(userMessage: string): Promise<boolean> {
    // Simple heuristics for now - can be enhanced with AI
    const ambiguousPatterns = [
      /^(that|this|it|them)$/i,
      /^(schedule|cancel|update|send|create)$/i,
      /patient\s*$/i,
      /appointment\s*$/i,
      /^(help|what|how)$/i
    ]

    return ambiguousPatterns.some(pattern => pattern.test(userMessage.trim()))
  }

  private async canOfferSuggestions(userMessage: string, userRole: string, currentPage?: string): Promise<boolean> {
    // Check if we should offer suggestions instead of executing directly
    const suggestionTriggers = [
      /^(what can|show me|help with|options for)/i,
      /^(how do i|how to)/i,
      /^(find|search|look for)/i
    ]

    return suggestionTriggers.some(pattern => pattern.test(userMessage))
  }

  private getContextualSuggestions(userMessage: string, userRole: string, currentPage?: string): string[] {
    const baseSuggestions = [
      'Schedule an appointment for Sarah Jones tomorrow at 2pm',
      'Send payment reminder to overdue patients',
      'Create a task to call Michael Brown',
      'Request AI intake for Jennifer Wilson'
    ]

    // Role-specific suggestions
    if (userRole === 'clinician') {
      return [
        'Start ambient scribe for current patient',
        'Generate clinical note for John Smith',
        'Request AI intake for tomorrow\'s patients',
        'Review care gaps for diabetes cohort'
      ]
    }

    if (userRole === 'manager') {
      return [
        'Show me today\'s revenue summary',
        'Send batch confirmations for tomorrow',
        'Review overdue invoices >30 days',
        'Generate monthly performance report'
      ]
    }

    // Page-specific suggestions
    if (currentPage === '/patients') {
      return [
        'Add new patient John Doe',
        'Update contact info for Sarah Jones',
        'Schedule follow-up for Michael Brown',
        'Send appointment reminder to Emma Davis'
      ]
    }

    if (currentPage === '/care') {
      return [
        'Enroll Margaret to diabetes pathway',
        'Order HbA1c for 12 patients',
        'Send BP reminders to hypertension cohort',
        'Review care signals for high-risk patients'
      ]
    }

    return baseSuggestions
  }

  private getContextualInformation(userMessage: string, userRole: string, recentCommands: string[]): {
    content: string;
    suggestions: string[];
    data?: any;
  } {
    // Provide helpful context based on the message
    if (userMessage.toLowerCase().includes('help')) {
      return {
        content: `As a ${userRole}, you can use natural language commands to manage your practice. I can help with scheduling, patient management, billing, and AI features.`,
        suggestions: [
          'What commands can I use?',
          'Show me examples for my role',
          'How do I schedule appointments?',
          'Tell me about AI features'
        ]
      }
    }

    if (userMessage.toLowerCase().includes('command')) {
      return {
        content: 'Here are some popular commands you can try:',
        suggestions: [
          'Schedule Sarah Jones for tomorrow at 2pm',
          'Send payment reminders to overdue patients',
          'Request AI intake for upcoming appointments',
          'Show me today\'s revenue'
        ],
        data: {
          type: 'command-examples',
          examples: this.getExampleCommands(userRole)
        }
      }
    }

    // Default informational response
    return {
      content: `I'm here to help you with "${userMessage}". I can assist with scheduling, patient management, billing, and AI-powered features.`,
      suggestions: [
        'Show me what I can do',
        'Give me some examples',
        'Help with my current task'
      ]
    }
  }

  private getExampleCommands(userRole: string): string[] {
    const common = [
      'Schedule [patient] for [date/time]',
      'Send reminder to [patient]',
      'Create task: [description]',
      'Show me [data/report]'
    ]

    if (userRole === 'clinician') {
      return [
        ...common,
        'Start ambient scribe for [patient]',
        'Generate note for [patient]',
        'Request AI intake for [patient]',
        'Review care gaps for [condition]'
      ]
    }

    if (userRole === 'manager') {
      return [
        ...common,
        'Generate [report type] report',
        'Review overdue invoices',
        'Send batch [action]',
        'Show practice metrics'
      ]
    }

    return common
  }

  // Get conversation history
  getConversation(sessionId: string): ConversationContext | undefined {
    return this.conversations.get(sessionId)
  }

  // Clear conversation
  clearConversation(sessionId: string): void {
    this.conversations.delete(sessionId)
  }

  // Handle action button clicks
  async handleAction(sessionId: string, actionId: string, payload?: any): Promise<ConversationMessage | null> {
    const conversation = this.conversations.get(sessionId)
    if (!conversation) return null

    switch (actionId) {
      case 'execute':
        if (payload?.planId) {
          return {
            id: uuidv4(),
            role: 'assistant',
            content: 'Great! I\'ll execute this plan now. You can monitor progress in the AI Trail.',
            timestamp: new Date(),
            type: 'success',
            planId: payload.planId
          }
        }
        break

      case 'modify':
        return {
          id: uuidv4(),
          role: 'assistant',
          content: 'What would you like to change about this command?',
          timestamp: new Date(),
          type: 'clarification',
          suggestions: [
            'Change the patient',
            'Modify the timing',
            'Adjust the action',
            'Cancel this request'
          ]
        }

      case 'show-examples':
        const examples = this.getExampleCommands(conversation.userContext.role)
        return {
          id: uuidv4(),
          role: 'assistant',
          content: 'Here are some example commands you can try:',
          timestamp: new Date(),
          type: 'information',
          data: { type: 'examples', examples }
        }

      case 'dismiss':
        return {
          id: uuidv4(),
          role: 'assistant',
          content: 'No problem! Let me know if you need help with anything else.',
          timestamp: new Date(),
          type: 'information'
        }
    }

    return null
  }
}

export const conversationalAI = new ConversationalAIService()
