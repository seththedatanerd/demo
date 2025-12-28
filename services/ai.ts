import { GoogleGenerativeAI } from '@google/generative-ai'
import { Patient, Appointment, Invoice } from '@/store/slices/data'
import { Plan } from '@/types/core'

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI("AIzaSyB0DRh5LqSBuI4X2axwgIyKmJzVExmmbhw")

interface AIContext {
  patients: Patient[]
  appointments: Appointment[]
  invoices: Invoice[]
  role: 'reception' | 'clinician' | 'manager'
  currentTime: string
}

export class PracticeAI {
  private model = genAI.getGenerativeModel({ model: "gemini-pro" })
  
  /**
   * Generate varied, human-like descriptions for plan steps
   */
  async generateStepDescription(baseAction: string, context: AIContext): Promise<string> {
    const prompt = `You are generating natural, varied descriptions for medical practice management tasks. Make them feel human and conversational while staying professional.

BASE ACTION: "${baseAction}"
ROLE: ${context.role}
TIME: ${context.currentTime}

Generate ONE natural, human-like description for this task. Be specific and add relevant context when possible.

EXAMPLES:
- "Draft invoice" → "Preparing invoice for today's consultation - including insurance details"
- "Send reminder" → "Sending a friendly appointment reminder with parking info"
- "Update patient record" → "Adding today's notes to Mrs Smith's file"

RULES:
1. Keep it professional but conversational
2. Add relevant details when appropriate  
3. Use active voice
4. Max 80 characters
5. No quotes in response - just the description

RESPONSE: (description only)`

    try {
      const result = await this.model.generateContent(prompt)
      const response = result.response.text().trim()
      return response || baseAction
    } catch (error) {
      console.error('AI step description failed:', error)
      return baseAction
    }
  }

  /**
   * DEPRECATED: Keeping command understanding simple with pattern matching
   */
  async understandCommand(userInput: string, context: AIContext): Promise<{
    intent: string
    confidence: number
    suggestedAction: string
    reasoning: string
  }> {
    const prompt = `You are an AI assistant for a medical practice management system. You help healthcare staff by understanding their commands and suggesting specific, actionable plans.

CONTEXT:
- Current role: ${context.role}
- Current time: ${context.currentTime}
- Patients in system: ${context.patients.length} patients
- Upcoming appointments: ${context.appointments.length} appointments
- Outstanding invoices: ${context.invoices.length} invoices

AVAILABLE ACTIONS (respond with exactly these phrases):
- "clinical wrap-up for [patient name]"
- "chase batch for overdue invoices"
- "send appointment reminder to [patient name]"
- "schedule [patient name] for [time/date]"
- "send more surveys"
- "optimize schedule"
- "review pricing"
- "setup reminders"
- "verify coverage for [patient name]"
- "setup payment plans for overdue accounts"
- "schedule follow-ups for similar patients"

USER INPUT: "${userInput}"

PATIENTS IN SYSTEM:
${context.patients.map(p => `- ${p.name} (${p.insurer}, last seen: ${p.lastSeen}, risk factors: ${p.riskFactors?.join(', ') || 'none'})`).join('\n')}

RESPONSE FORMAT (JSON):
{
  "intent": "brief description of what user wants",
  "confidence": 0.0-1.0,
  "suggestedAction": "exact action phrase from list above",
  "reasoning": "why this action makes sense given the context"
}

RULES:
1. ONLY understand SPECIFIC commands - no vague inputs
2. Commands should be actionable like "clinical wrap-up for Mrs Smith"
3. If command is too vague, return low confidence
4. Keep reasoning practical and brief (max 50 words)
5. Always respond with valid JSON only

Examples:
- "clinical wrap-up for Mrs Smith" → "clinical wrap-up for Mrs Smith" (confidence: 0.95)
- "chase batch for overdue invoices" → "chase batch for overdue invoices" (confidence: 0.9)
- "help me with something" → low confidence, ask for specificity
- "I'm stressed" → low confidence, ask for specific action needed`

    // For now, just do basic validation - keep commands specific
    const isSpecific = userInput.includes('for ') || 
                      userInput.includes('batch') ||
                      userInput.includes('setup') ||
                      userInput.includes('schedule') ||
                      userInput.includes('send') && userInput.length > 20

    if (isSpecific) {
      return {
        intent: `Execute: ${userInput}`,
        confidence: 0.9,
        suggestedAction: userInput,
        reasoning: 'Specific command detected'
      }
    } else {
      return {
        intent: 'Need more specific command',
        confidence: 0.3,
        suggestedAction: userInput,
        reasoning: 'Please be more specific about what you want to accomplish'
      }
    }
  }

  /**
   * Generate human-like timeline event descriptions
   */
  async generateEventDescription(eventType: string, context: { patientName?: string, details?: any }): Promise<string> {
    const prompt = `Generate a natural, human-like description for this medical practice event.

EVENT TYPE: "${eventType}"
PATIENT: ${context.patientName || 'N/A'}
DETAILS: ${JSON.stringify(context.details || {})}

Create ONE conversational description that feels human-written, not robotic.

EXAMPLES:
- "invoice.drafted" → "Created invoice for Sarah's consultation including insurance details"
- "reminder.sent" → "Sent friendly appointment reminder to Mrs Smith with parking info"
- "notes.updated" → "Added comprehensive consultation notes to patient record"

RULES:
1. Be conversational but professional
2. Add relevant context when possible
3. Max 100 characters
4. Use active voice
5. No quotes in response

RESPONSE: (description only)`

    try {
      const result = await this.model.generateContent(prompt)
      return result.response.text().trim() || eventType
    } catch (error) {
      console.error('AI event description failed:', error)
      return eventType.replace('.', ' ').replace('_', ' ')
    }
  }

  /**
   * Generate intelligent follow-up suggestions based on completed plan
   */
  async generateFollowUps(completedPlan: Plan, context: AIContext): Promise<Array<{
    id: string
    title: string
    description: string
    reasoning: string
    actionPhrase: string
    priority: 'high' | 'medium' | 'low'
    category: 'scheduling' | 'insurance' | 'workflow' | 'patient-care'
  }>> {
    const prompt = `You are an AI assistant analyzing a completed medical practice task to suggest intelligent follow-ups.

COMPLETED TASK: "${completedPlan.title}"
STEPS COMPLETED: ${completedPlan.steps.map(s => s.label).join(', ')}
CURRENT ROLE: ${context.role}
CURRENT TIME: ${context.currentTime}

PRACTICE DATA:
PATIENTS:
${context.patients.map(p => `- ${p.name}: ${p.insurer} insurance (expires: ${p.insuranceExpiry || 'unknown'}), last seen: ${p.lastSeen || 'unknown'}, risk factors: ${p.riskFactors?.join(', ') || 'none'}, prefers: ${p.preferences?.communication || 'unknown'}`).slice(0, 10).join('\n')}

APPOINTMENTS: ${context.appointments.length} scheduled
INVOICES: ${context.invoices.filter(i => i.status === 'Overdue').length} overdue invoices

GENERATE 2-4 INTELLIGENT FOLLOW-UP SUGGESTIONS based on:
1. The completed task
2. Patient data patterns
3. Practice workflow optimization
4. Preventive care opportunities

AVAILABLE ACTION PHRASES:
- "schedule [patient] for [time]"
- "verify coverage for [patient]"
- "setup payment plans for overdue accounts"
- "schedule follow-ups for similar patients"
- "optimize high risk appointment slots"
- "setup reminders"
- "send more surveys"

RESPONSE FORMAT (JSON array):
[
  {
    "id": "unique-id",
    "title": "Clear, actionable suggestion (max 60 chars)",
    "description": "Brief benefit description (max 80 chars)", 
    "reasoning": "Why this makes sense now (max 100 chars)",
    "actionPhrase": "exact phrase from available actions",
    "priority": "high|medium|low",
    "category": "scheduling|insurance|workflow|patient-care"
  }
]

RULES:
1. Suggest realistic, contextual follow-ups
2. Consider timing and workflow efficiency
3. Be specific with patient names when relevant
4. Prioritize high-impact, low-effort actions
5. Max 4 suggestions total
6. Valid JSON only
7. Keep all text concise and professional`

    try {
      const result = await this.model.generateContent(prompt)
      const response = result.response.text()
      
      // Parse JSON response
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return Array.isArray(parsed) ? parsed : []
      } else {
        throw new Error('Invalid JSON response from AI')
      }
    } catch (error) {
      console.error('AI follow-up generation failed:', error)
      return []
    }
  }

  /**
   * Generate intelligent KPI insights with real data analysis
   */
  async generateKPIInsight(metric: string, value: any, context: AIContext): Promise<{
    insight: string
    recommendation: string
    actionPhrase?: string
  }> {
    const prompt = `You are analyzing practice data to provide actionable insights for healthcare management.

METRIC: ${metric}
CURRENT VALUE: ${value}
ROLE: ${context.role}
TIME: ${context.currentTime}

PRACTICE DATA SUMMARY:
- Patients: ${context.patients.length}
- Appointments: ${context.appointments.length} 
- Overdue invoices: ${context.invoices.filter(i => i.status === 'Overdue').length}
- Patient communication preferences: ${context.patients.map(p => p.preferences?.communication).filter(Boolean).join(', ')}

Generate ONE specific, actionable insight about this metric.

RESPONSE FORMAT (JSON):
{
  "insight": "Brief observation about the data pattern (max 120 chars)",
  "recommendation": "Specific action recommendation (max 100 chars)", 
  "actionPhrase": "optional exact action phrase if actionable"
}

RULES:
1. Be specific and data-driven
2. Consider the role's responsibilities
3. Suggest concrete actions when possible
4. Keep insights realistic and professional
5. Valid JSON only`

    try {
      const result = await this.model.generateContent(prompt)
      const response = result.response.text()
      
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          insight: parsed.insight || `${metric}: ${value}`,
          recommendation: parsed.recommendation || 'Monitor trends',
          actionPhrase: parsed.actionPhrase
        }
      } else {
        throw new Error('Invalid JSON response from AI')
      }
    } catch (error) {
      console.error('AI KPI insight generation failed:', error)
      return {
        insight: `${metric}: ${value}`,
        recommendation: 'Monitor trends and patterns'
      }
    }
  }

  /**
   * Generate a complete plan for ANY command - this is the fallback magic!
   */
  async generateGenericPlan(userCommand: string, context: AIContext, planContext: any): Promise<Plan> {
    const prompt = `You are an AI assistant for a medical practice management system. A user has given you a command, and you need to create a realistic execution plan.

USER COMMAND: "${userCommand}"
USER ROLE: ${context.role}
CURRENT TIME: ${context.currentTime}

Your job is to break this command into 3-5 realistic steps that a practice management system would actually do. Make it feel like the system is genuinely capable of doing this task.

Return your response as a JSON object with this EXACT structure:
{
  "title": "Brief title for the overall task",
  "steps": [
    {
      "label": "Step 1 description (conversational, 60-80 chars)",
      "action": "What the system would actually do"
    },
    {
      "label": "Step 2 description (conversational, 60-80 chars)", 
      "action": "What the system would actually do"
    }
  ]
}

EXAMPLES:
Command: "Send birthday wishes to all patients born this month"
Response: {
  "title": "Send birthday messages to patients",
  "steps": [
    {"label": "Finding patients with birthdays this month", "action": "Query patient database for birth dates"},
    {"label": "Drafting personalized birthday messages", "action": "Generate custom messages with practice branding"},
    {"label": "Sending messages via preferred communication method", "action": "Send SMS/email based on patient preferences"},
    {"label": "Logging outreach activity in patient records", "action": "Update patient communication history"}
  ]
}

Command: "Update all insurance information for AXA patients"
Response: {
  "title": "Update AXA patient insurance details",
  "steps": [
    {"label": "Identifying AXA patients requiring updates", "action": "Filter patient list by AXA insurance"},
    {"label": "Verifying current coverage and eligibility", "action": "Check AXA portal for coverage status"},
    {"label": "Updating patient records with new information", "action": "Save updated insurance details to database"},
    {"label": "Flagging any coverage issues for review", "action": "Create alerts for expired or problematic policies"}
  ]
}

RULES:
1. Always generate 3-5 steps
2. Steps should be logical and realistic for a medical practice
3. Use conversational, professional language
4. Make it sound like the system can actually do this
5. Step labels should be 60-80 characters
6. Return ONLY valid JSON, no other text
7. Make the title concise and action-oriented

RESPONSE: (JSON only)`

    try {
      const result = await this.model.generateContent(prompt)
      const responseText = result.response.text().trim()
      
      // Try to parse the JSON response
      let planData
      try {
        // Remove any markdown formatting if present
        const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        planData = JSON.parse(cleanJson)
      } catch (parseError) {
        console.error('Failed to parse AI plan JSON:', parseError)
        throw new Error('Invalid JSON response from AI')
      }

      // Convert Gemini's response to our Plan format
      const steps = planData.steps.map((step: any, index: number) => ({
        id: `step-${index + 1}`,
        label: step.label,
        run: async () => {
          console.log(`AI executing: ${step.action}`)
          await new Promise(resolve => setTimeout(resolve, Math.random() * 1200 + 400))
        },
        undo: async () => {
          console.log(`AI reversing: ${step.action}`)
        }
      }))

      return {
        id: `plan-${Date.now()}`,
        title: planData.title,
        actor: planContext.actor,
        source: planContext.source,
        steps,
        status: 'pending'
      }
    } catch (error) {
      console.error('AI generic plan generation failed:', error)
      
      // Fallback to a simple generic plan
      return {
        id: `plan-${Date.now()}`,
        title: `Complete: ${userCommand}`,
        actor: planContext.actor,
        source: planContext.source,
        steps: [
          {
            id: 'step-1',
            label: `Analyzing request: ${userCommand.substring(0, 50)}...`,
            run: async () => {
              console.log(`Processing command: ${userCommand}`)
              await new Promise(resolve => setTimeout(resolve, 800))
            },
            undo: async () => {
              console.log(`Reversed command: ${userCommand}`)
            }
          },
          {
            id: 'step-2',
            label: 'Executing requested action',
            run: async () => {
              console.log('Completing the requested task')
              await new Promise(resolve => setTimeout(resolve, 1000))
            },
            undo: async () => {
              console.log('Undoing the requested action')
            }
          },
          {
            id: 'step-3',
            label: 'Finalizing and updating records',
            run: async () => {
              console.log('Saving changes and updating logs')
              await new Promise(resolve => setTimeout(resolve, 600))
            },
            undo: async () => {
              console.log('Reverting record updates')
            }
          }
        ],
        status: 'pending'
      }
    }
  }

  /**
   * Enhanced plan creation with clarification detection and contextual steps
   */
  async createEnhancedPlan(command: string, context: AIContext, planContext: any): Promise<Plan> {
    const prompt = `You are an AI assistant for a medical practice management system. Analyze this command and create a realistic execution plan: "${command}"

Available Context:
- Patients: ${context.patients.length} patients in system
- Recent appointments: ${context.appointments.slice(0, 5).map(a => `${a.patientName} - ${a.type} on ${a.date}`).join(', ') || 'None'}
- Outstanding invoices: ${context.invoices.filter(i => i.status === 'pending').length}
- Current user role: ${context.role}

SAMPLE PATIENTS:
${context.patients.slice(0, 10).map(p => `- ${p.name} (DOB: ${p.dateOfBirth || 'unknown'}, Phone: ${p.phone || 'unknown'}, Insurance: ${p.insurer})`).join('\n')}

CRITICAL: First determine if this command is ambiguous and needs clarification.

Respond with JSON in this exact format:
{
  "needsClarification": boolean,
  "clarificationQuestions": [
    {
      "id": "q1",
      "question": "Which patient? I found multiple matches:",
      "type": "single_choice",
      "options": ["Sarah Clark (last visit: Jan 15)", "Sarah Johnson (last visit: Dec 3)"],
      "required": true
    }
  ],
  "title": "Clear, specific plan title",
  "steps": [
    "Step 1: Locating patient record for John Smith (DOB: 1985-03-15)",
    "Step 2: Retrieving outstanding Invoice #INV-2024-0847 (£145.00, overdue 14 days)",
    "Step 3: Composing personalized payment reminder SMS to +44 7987 654321",
    "Step 4: Scheduling delivery for optimal engagement time (2:00 PM today)",
    "Step 5: Setting automated follow-up reminder in 7 days if payment not received"
  ]
}

CLARIFICATION TRIGGERS:
- Multiple patients with same name (e.g., "Sarah", "John")
- Vague commands (e.g., "book appointment", "send reminder" without specifics)
- Missing critical info (time, date, amount, specific service)
- Ambiguous references ("the patient", "that invoice")

REALISTIC STEP EXAMPLES:
- "Locating patient record for Emma Thompson (DOB: 1992-07-23, NHS: 485 777 3456)"
- "Retrieving Invoice #INV-2024-1247 (£127.50, issued 12 days ago to Bupa)"
- "Composing personalized SMS reminder to +44 7892 445 678"
- "Scheduling appointment with Dr. Martinez for Tuesday 2:30 PM (Room 3)"
- "Verifying insurance coverage with AXA (Policy: AX-9847-2024)"
- "Preparing clinic pack: consent forms, treatment plan, aftercare instructions"

RULES:
- If command mentions common names, check for multiple matches
- Include specific details: phone numbers (+44 format), invoice numbers, amounts, times
- Use realistic UK NHS numbers (485 777 1234 format), postcodes (SW1A 1AA format)
- Make steps sound like actual healthcare operations
- If ambiguous, set needsClarification: true and ask specific questions
- Steps should be 60-100 characters each
- Always respond with valid JSON only`

    try {
      const result = await this.model.generateContent(prompt)
      const responseText = result.response.text().trim()
      
      let planData
      try {
        const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        planData = JSON.parse(cleanJson)
      } catch (parseError) {
        console.error('Failed to parse enhanced plan JSON:', parseError)
        // Fallback to generic plan
        return this.generateGenericPlan(command, context, planContext)
      }

      // If needs clarification, return a plan with clarification questions
      if (planData.needsClarification && planData.clarificationQuestions) {
        return {
          id: `plan-${Date.now()}`,
          title: planData.title || `Clarification needed for: ${command}`,
          originalCommand: command,
          needsClarification: true,
          clarificationQuestions: planData.clarificationQuestions,
          actor: planContext.actor,
          source: planContext.source,
          steps: [],
          status: 'pending'
        }
      }

      // Convert steps to our format with realistic execution
      const steps = planData.steps.map((stepLabel: string, index: number) => ({
        id: `step-${index + 1}`,
        label: stepLabel,
        run: async () => {
          console.log(`AI executing: ${stepLabel}`)
          await new Promise(resolve => setTimeout(resolve, Math.random() * 1500 + 600))
        },
        undo: async () => {
          console.log(`AI reversing: ${stepLabel}`)
        }
      }))

      return {
        id: `plan-${Date.now()}`,
        title: planData.title,
        originalCommand: command,
        actor: planContext.actor,
        source: planContext.source,
        steps,
        status: 'pending'
      }
    } catch (error) {
      console.error('Enhanced plan creation failed:', error)
      // Fallback to generic plan
      return this.generateGenericPlan(command, context, planContext)
    }
  }

  // Answer questions about practice data using Gemini
  async answerQuestion(question: string, context?: any) {
    try {
      // Build context summary for the AI
      const contextSummary = context ? `
PRACTICE DATA CONTEXT:
- Role: ${context.role || 'staff'}
- Total Patients: ${context.patients?.length || 0}
- Total Appointments: ${context.appointments?.length || 0}
- Total Invoices: ${context.invoices?.length || 0}
- Pending Invoices: ${context.invoices?.filter((i: any) => i.status === 'pending' || i.status === 'Overdue').length || 0}

SAMPLE PATIENT DATA:
${context.patients?.slice(0, 5).map((p: any) => `- ${p.name}: ${p.insurer} insurance, last seen ${p.lastSeen || 'unknown'}`).join('\n') || 'No patient data'}

SAMPLE APPOINTMENTS:
${context.appointments?.slice(0, 5).map((a: any) => `- ${a.patientName}: ${a.type} on ${a.date} at ${a.time}`).join('\n') || 'No appointment data'}

SAMPLE INVOICES:
${context.invoices?.slice(0, 5).map((i: any) => `- ${i.patientName}: £${i.amount} (${i.status})`).join('\n') || 'No invoice data'}
` : ''

      const prompt = `You are a helpful AI assistant for a healthcare practice management system. A user is asking you a question. Provide a clear, informative, and professional response.

USER QUESTION: "${question}"

${contextSummary}

INSTRUCTIONS:
1. Answer the question directly and conversationally
2. Use the context data when relevant
3. Be specific with numbers and details when available
4. Keep the response concise but informative (2-4 sentences typically)
5. If the question relates to data you don't have, provide a helpful general response
6. Be professional and healthcare-appropriate

RESPONSE FORMAT (JSON):
{
  "answer": "Your conversational response here. Be specific and helpful.",
  "type": "text",
  "confidence": 0.85,
  "sources": ["Practice Data", "AI Analysis"],
  "suggestions": ["Optional follow-up question 1", "Optional follow-up question 2"]
}

RULES:
- Respond ONLY with valid JSON
- The "answer" field should be 2-4 sentences, conversational and helpful
- Include relevant statistics when the data is available
- Suggest 1-2 follow-up questions the user might want to ask
- Type should usually be "text" unless showing tables/charts
- Confidence should be 0.7-0.95 based on data availability`

      const result = await this.model.generateContent(prompt)
      const responseText = result.response.text().trim()
      
      // Try to parse JSON
      try {
        const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const parsed = JSON.parse(cleanJson)
        return {
          answer: parsed.answer || responseText,
          type: parsed.type || 'text',
          confidence: parsed.confidence || 0.8,
          sources: parsed.sources || ['AI Analysis'],
          suggestions: parsed.suggestions
        }
      } catch {
        // If JSON parsing fails, return the raw text
        return {
          answer: responseText,
          type: 'text',
          confidence: 0.75,
          sources: ['AI Analysis']
        }
      }
    } catch (error) {
      console.error('AI question answering failed:', error)
      return null
    }
  }
}

// Export singleton instance
export const practiceAI = new PracticeAI()
