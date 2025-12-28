'use client'

import { useState, useEffect } from 'react'
import { useData, useAutopilot } from '@/store'
import { createPlan } from '@/services/planner'
import { Lightbulb, X, Clock, AlertTriangle, TrendingUp } from 'lucide-react'
import ActionablePlanCard from '@/components/ActionablePlanCard'
import PlanPreviewModal from '@/components/PlanPreviewModal'

interface Suggestion {
  id: string
  type: 'urgent' | 'optimization' | 'maintenance'
  icon: React.ReactNode
  title: string
  description: string
  reasoning: string
  actionPhrase: string
  dismissed?: boolean
  metrics: {
    affected?: number
    projected?: string
    timeEstimate?: string
    confidence?: number
  }
  risks?: string[]
  steps?: string[]
  beforeAfter?: {
    before: string[]
    after: string[]
  }
  apiCalls?: {
    service: string
    endpoint: string
    purpose: string
  }[]
}

interface AISuggestionsPanelProps {
  onPlanCreated: (plan: any) => void
}

export default function AISuggestionsPanel({ onPlanCreated }: AISuggestionsPanelProps) {
  const { patients, invoices, appointments } = useData()
  const { role, autopilotMode } = useAutopilot()
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean
    suggestion: Suggestion | null
  }>({ isOpen: false, suggestion: null })

  // Generate AI suggestions based on data patterns
  useEffect(() => {
    const newSuggestions: Suggestion[] = []

    // Pattern 1: Overdue invoices
    const overdueInvoices = invoices.filter(inv => inv.status === 'Overdue')
    if (overdueInvoices.length > 0) {
      const totalOverdue = overdueInvoices.reduce((sum, inv) => sum + inv.amount, 0)
      newSuggestions.push({
        id: 'overdue-invoices',
        type: 'urgent',
        icon: <AlertTriangle className="w-5 h-5" />,
        title: `${overdueInvoices.length} overdue payments detected`,
        description: 'Multiple invoices past due date require attention',
        reasoning: `Detected ${overdueInvoices.length} invoices with "Overdue" status. Average days overdue: ~15 days.`,
        actionPhrase: 'chase invoices >30d and confirm SMS delivery',
        metrics: {
          affected: overdueInvoices.length,
          projected: `£${totalOverdue.toFixed(0)}`,
          timeEstimate: '15 min',
          confidence: 0.92
        },
        risks: [
          'Some patients may have already paid - check before sending',
          'Consider payment plans for amounts >£200',
          'Weekend SMS delivery may have lower response rates'
        ],
        steps: [
          `Identify ${overdueInvoices.length} overdue invoices >30 days`,
          'Cross-reference with recent payment records',
          'Generate personalized SMS reminders with payment links',
          'Schedule delivery for optimal engagement times (2-4 PM)',
          'Set automated follow-up reminders for non-responders'
        ],
        beforeAfter: {
          before: [
            `${overdueInvoices.length} invoices overdue (avg 15 days)`,
            `£${totalOverdue.toFixed(0)} outstanding revenue`,
            'Manual follow-up process taking 2-3 hours/week'
          ],
          after: [
            'Automated SMS reminders sent to all overdue accounts',
            'Payment links provided for immediate settlement',
            'Follow-up schedule established for non-responders',
            'Expected 60-70% response rate within 48 hours'
          ]
        },
        apiCalls: [
          {
            service: 'SMS Gateway',
            endpoint: '/api/sms/bulk-send',
            purpose: 'Send personalized payment reminders'
          },
          {
            service: 'Payment Portal',
            endpoint: '/api/payments/generate-links',
            purpose: 'Create secure payment URLs for each invoice'
          }
        ]
      })
    }

    // Pattern 2: Patients overdue for appointments (simulate 6-month check)
    const lastSeenPatient = patients.find(p => p.name === 'Mrs Smith')
    if (lastSeenPatient) {
      newSuggestions.push({
        id: 'overdue-checkup',
        type: 'maintenance',
        icon: <Clock className="w-5 h-5" />,
        title: `${lastSeenPatient.name} due for 6-month check`,
        description: 'Regular checkup overdue based on appointment history',
        reasoning: 'Last appointment was >6 months ago. Insurance (AXA) covers preventive care.',
        actionPhrase: `schedule ${lastSeenPatient.name} for next Tuesday at 2pm`,
        metrics: {
          affected: 1,
          timeEstimate: '5 min',
          confidence: 0.88
        },
        risks: [
          'Patient may prefer different appointment time',
          'Check practitioner availability first'
        ],
        steps: [
          'Check patient availability for next Tuesday 2pm',
          'Verify practitioner Dr. Martinez is available',
          'Book appointment slot in system',
          'Send confirmation SMS with appointment details',
          'Add to practitioner\'s schedule'
        ]
      })
    }

    // Pattern 3: Tomorrow's appointments need verification (if role is reception/manager)
    if (role === 'reception' || role === 'manager') {
      const tomorrowAppts = appointments.filter(apt => {
        const apptDate = new Date(apt.start)
        const tomorrow = new Date()
        tomorrow.setDate(tomorrow.getDate() + 1)
        return apptDate.toDateString() === tomorrow.toDateString()
      })

      if (tomorrowAppts.length > 0) {
        newSuggestions.push({
          id: 'verify-tomorrow',
          type: 'optimization',
          icon: <TrendingUp className="w-5 h-5" />,
          title: `Verify coverage for tomorrow's appointments`,
          description: 'Proactive insurance verification prevents delays',
          reasoning: `${tomorrowAppts.length} appointments scheduled. Insurance verification reduces check-in time by 3 minutes average.`,
          actionPhrase: 'verify coverage for tomorrow\'s appointments',
          metrics: {
            affected: tomorrowAppts.length,
            timeEstimate: '8 min',
            confidence: 0.94
          },
          risks: [
            'Some insurers may have system downtime',
            'Weekend verifications may be delayed'
          ],
          steps: [
            `Check insurance details for ${tomorrowAppts.length} scheduled patients`,
            'Run eligibility verification with each insurer',
            'Flag any coverage issues or expired policies',
            'Notify reception team of any problems',
            'Update patient records with verification status'
          ],
          beforeAfter: {
            before: [
              `${tomorrowAppts.length} appointments with unverified insurance`,
              'Potential delays during check-in process',
              'Risk of declined claims or payment issues'
            ],
            after: [
              'All insurance coverage verified and confirmed',
              'Smooth check-in process for all patients',
              'Reduced risk of payment complications'
            ]
          }
        })
      }
    }

    setSuggestions(newSuggestions)
  }, [patients, invoices, appointments, role])

  const handleSuggestionClick = async (suggestion: Suggestion) => {
    try {
      const plan = await createPlan(suggestion.actionPhrase, {
        actor: 'user',
        source: 'kpi',
        role,
        autopilotMode
      })

      if (plan) {
        onPlanCreated(plan)
        // Auto-dismiss after action
        setDismissedIds(prev => new Set(Array.from(prev).concat([suggestion.id])))
      }
    } catch (error) {
      console.error('Failed to create plan from suggestion:', error)
    }
  }

  const handleDismiss = (suggestionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDismissedIds(prev => new Set(Array.from(prev).concat([suggestionId])))
  }

  const visibleSuggestions = suggestions.filter(s => !dismissedIds.has(s.id))

  if (visibleSuggestions.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">AI Assistant</h3>
            <p className="text-sm text-gray-600 mt-1">All caught up! I'll notify you when I spot patterns that need attention.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 border border-blue-200/60 rounded-xl p-6 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">AI Alerts</h3>
            <p className="text-sm text-red-700">Requires attention</p>
          </div>
        </div>

        <div className="space-y-4">
          {visibleSuggestions.map((suggestion) => (
            <ActionablePlanCard
              key={suggestion.id}
              id={suggestion.id}
              type={suggestion.type}
              title={suggestion.title}
              description={suggestion.description}
              metrics={suggestion.metrics}
              risks={suggestion.risks}
              onCreatePlan={() => handleSuggestionClick(suggestion)}
              onSchedule={() => {
                console.log('Schedule:', suggestion.id)
              }}
              onPreview={() => {
                setPreviewModal({
                  isOpen: true,
                  suggestion
                })
              }}
            />
          ))}
        </div>

        {autopilotMode === 'ask' && visibleSuggestions.length > 0 && (
          <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <p className="text-xs text-purple-700">
                <strong>Autopilot Mode:</strong> I can run these automatically if you'd like. Just say "proceed" or switch to Scheduled mode.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Plan Preview Modal */}
      {previewModal.isOpen && previewModal.suggestion && (
        <PlanPreviewModal
          isOpen={previewModal.isOpen}
          onClose={() => setPreviewModal({ isOpen: false, suggestion: null })}
          title={previewModal.suggestion.title}
          description={previewModal.suggestion.description}
          steps={previewModal.suggestion.steps || []}
          metrics={previewModal.suggestion.metrics}
          beforeAfter={previewModal.suggestion.beforeAfter}
          roleChecks={{
            required: ['reception', 'manager'],
            current: role,
            hasPermission: ['reception', 'manager'].includes(role)
          }}
          apiCalls={previewModal.suggestion.apiCalls}
          risks={previewModal.suggestion.risks}
          onRun={() => {
            handleSuggestionClick(previewModal.suggestion!)
            setPreviewModal({ isOpen: false, suggestion: null })
          }}
          onSchedule={() => {
            console.log('Schedule:', previewModal.suggestion?.id)
            setPreviewModal({ isOpen: false, suggestion: null })
          }}
        />
      )}
    </>
  )
}
