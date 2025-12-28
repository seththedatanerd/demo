'use client'

import { useState, useEffect, useMemo } from 'react'
import { useCalls, useTimeline, useData, useAIActions, useRole } from '@/store'
import { CallRecord } from '@/store/slices/calls'
import { 
  X, Phone, User, Clock, MessageSquare, Calendar, CheckSquare, CreditCard, 
  UserPlus, Shield, ChevronDown, ChevronUp, Edit3, AlertCircle, Check,
  Send, FileText, ClipboardList, Mail, Loader2, Eye, EyeOff, Info
} from 'lucide-react'
import { DEMO_CALL_DURATION } from './AICallHeader'

interface CallSummaryModalProps {
  call: CallRecord
  onClose: () => void
}

// Intent categories for admin classification
type IntentCategory = 
  | 'appointment_change' 
  | 'prescription_request' 
  | 'test_results' 
  | 'billing_query' 
  | 'admin_request' 
  | 'clinical_query'
  | 'other'

interface AdminAction {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  type: 'primary' | 'secondary'
  assignee: string
  dueDate: string
  priority: 'low' | 'medium' | 'high'
  note: string
  whyReason: string
  transcriptSnippets: string[]
  enabled: boolean
}

// Map call intent to admin-appropriate category
function categorizeIntent(intent?: string, summary?: string): IntentCategory {
  if (intent === 'reschedule') return 'appointment_change'
  if (intent === 'new_booking') return 'appointment_change'
  if (intent === 'prescription') return 'prescription_request'
  if (intent === 'billing') return 'billing_query'
  
  // Check summary for additional classification
  const lowerSummary = (summary || '').toLowerCase()
  if (lowerSummary.includes('test') || lowerSummary.includes('result')) return 'test_results'
  if (lowerSummary.includes('letter') || lowerSummary.includes('form') || lowerSummary.includes('fit note')) return 'admin_request'
  if (lowerSummary.includes('symptom') || lowerSummary.includes('medication') || lowerSummary.includes('side effect')) return 'clinical_query'
  
  return 'other'
}

// Get transcript snippets relevant to an action
function extractTranscriptSnippets(transcript: string[], keywords: string[]): string[] {
  return transcript
    .filter(line => 
      line.startsWith('Caller:') && 
      keywords.some(kw => line.toLowerCase().includes(kw.toLowerCase()))
    )
    .slice(0, 2)
    .map(line => `"${line.replace('Caller: ', '')}"`)
}

export default function CallSummaryModal({ call, onClose }: CallSummaryModalProps) {
  const { executePlan } = useTimeline()
  const { patients, addTimelineEntry } = useData() as any
  const { logAIAction } = useAIActions()
  const { currentRole } = useRole()
  const [showPlanPreview, setShowPlanPreview] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionProgress, setExecutionProgress] = useState(0)
  
  // Editable state
  const [editableSummary, setEditableSummary] = useState(call.summary || '')
  const [isEditingSummary, setIsEditingSummary] = useState(false)
  
  // Consent state - initialize from call record
  const [consentConfirmed, setConsentConfirmed] = useState(call.consentGiven ?? false)
  
  // Expandable "Why?" sections
  const [expandedWhys, setExpandedWhys] = useState<Set<string>>(new Set())

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !showPlanPreview) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose, showPlanPreview])

  const patient = call.patientId ? patients.find((p: any) => p.id === call.patientId) : null
  const callerName = call.patientName || patient?.name || 'Unknown Caller'
  const intentCategory = categorizeIntent(call.intent, call.summary)

  // Generate admin actions based on intent category
  const [actions, setActions] = useState<AdminAction[]>([])

  useEffect(() => {
    const transcript = call.transcript || []
    const generatedActions = getActionsForIntent(intentCategory, callerName, transcript)
    setActions(generatedActions)
  }, [intentCategory, callerName, call.transcript])

  function getActionsForIntent(category: IntentCategory, patientName: string, transcript: string[]): AdminAction[] {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    
    const today = new Date().toISOString().split('T')[0]

    switch (category) {
      case 'appointment_change':
        return [
          {
            id: 'reschedule',
            label: 'Open Reschedule Flow',
            description: 'Open calendar to reschedule appointment',
            icon: <Calendar className="w-5 h-5" />,
            type: 'primary',
            assignee: 'Reception',
            dueDate: today,
            priority: 'high',
            note: '',
            whyReason: 'Caller explicitly requested to change their appointment time.',
            transcriptSnippets: extractTranscriptSnippets(transcript, ['reschedule', 'move', 'change', 'conflict', 'cancel']),
            enabled: true
          },
          {
            id: 'send_confirmation',
            label: 'Send Confirmation SMS',
            description: 'Send new appointment details to patient',
            icon: <Send className="w-5 h-5" />,
            type: 'secondary',
            assignee: 'Auto',
            dueDate: today,
            priority: 'medium',
            note: '',
            whyReason: 'Patient should receive confirmation of their new appointment time.',
            transcriptSnippets: extractTranscriptSnippets(transcript, ['confirm', 'text', 'sms', 'send']),
            enabled: true
          },
          {
            id: 'update_notes',
            label: 'Update Appointment Notes',
            description: 'Add reason for reschedule to patient record',
            icon: <ClipboardList className="w-5 h-5" />,
            type: 'secondary',
            assignee: 'Reception',
            dueDate: today,
            priority: 'low',
            note: 'Work conflict',
            whyReason: 'Recording the reason helps track patterns and supports future scheduling.',
            transcriptSnippets: extractTranscriptSnippets(transcript, ['reason', 'because', 'conflict', 'work']),
            enabled: true
          }
        ]

      case 'prescription_request':
        return [
          {
            id: 'clinician_task',
            label: 'Create Clinician Review Task',
            description: 'Request clinician to review prescription request',
            icon: <CheckSquare className="w-5 h-5" />,
            type: 'primary',
            assignee: 'Dr Patel',
            dueDate: tomorrowStr,
            priority: 'medium',
            note: 'Repeat prescription request',
            whyReason: 'Prescription requests require clinician authorisation before processing.',
            transcriptSnippets: extractTranscriptSnippets(transcript, ['prescription', 'medication', 'repeat', 'tablets', 'medicine']),
            enabled: true
          },
          {
            id: 'send_ack',
            label: 'Send Acknowledgement Message',
            description: 'Confirm request received, processing in 48hrs',
            icon: <Mail className="w-5 h-5" />,
            type: 'secondary',
            assignee: 'Auto',
            dueDate: today,
            priority: 'low',
            note: '',
            whyReason: 'Patient expects confirmation their request has been received.',
            transcriptSnippets: extractTranscriptSnippets(transcript, ['how long', 'when', 'ready']),
            enabled: true
          },
          {
            id: 'book_optional',
            label: 'Suggest Booking Review (Optional)',
            description: 'Patient may need medication review appointment',
            icon: <Calendar className="w-5 h-5" />,
            type: 'secondary',
            assignee: 'Reception',
            dueDate: tomorrowStr,
            priority: 'low',
            note: 'Only if required by clinician',
            whyReason: 'Some prescription renewals require a medication review appointment.',
            transcriptSnippets: [],
            enabled: false
          }
        ]

      case 'test_results':
        return [
          {
            id: 'clinician_callback',
            label: 'Create Clinician Callback Task',
            description: 'Request clinician to call patient about results',
            icon: <Phone className="w-5 h-5" />,
            type: 'primary',
            assignee: 'Dr Patel',
            dueDate: today,
            priority: 'high',
            note: 'Patient enquiring about test results',
            whyReason: 'Test results should be discussed by a clinician, not reception.',
            transcriptSnippets: extractTranscriptSnippets(transcript, ['test', 'result', 'blood', 'back']),
            enabled: true
          },
          {
            id: 'send_holding',
            label: 'Send "We\'ll Get Back to You" Message',
            description: 'Acknowledge request, clinician will call',
            icon: <Mail className="w-5 h-5" />,
            type: 'secondary',
            assignee: 'Auto',
            dueDate: today,
            priority: 'medium',
            note: '',
            whyReason: 'Sets patient expectations for when they\'ll hear back.',
            transcriptSnippets: extractTranscriptSnippets(transcript, ['call', 'when', 'today']),
            enabled: true
          }
        ]

      case 'billing_query':
        return [
          {
            id: 'verify_account',
            label: 'Verify Account & Eligibility',
            description: 'Check patient account and any insurance coverage',
            icon: <Shield className="w-5 h-5" />,
            type: 'primary',
            assignee: 'Accounts',
            dueDate: today,
            priority: 'medium',
            note: '',
            whyReason: 'Account verification needed before processing payment queries.',
            transcriptSnippets: extractTranscriptSnippets(transcript, ['invoice', 'bill', 'pay', 'account']),
            enabled: true
          },
          {
            id: 'create_billing_task',
            label: 'Create Billing Task',
            description: 'Follow up on payment arrangement',
            icon: <CheckSquare className="w-5 h-5" />,
            type: 'secondary',
            assignee: 'Accounts',
            dueDate: tomorrowStr,
            priority: 'medium',
            note: 'Payment plan requested',
            whyReason: 'Billing queries often require follow-up after initial call.',
            transcriptSnippets: extractTranscriptSnippets(transcript, ['installment', 'plan', 'half', 'month']),
            enabled: true
          },
          {
            id: 'send_payment',
            label: 'Send Payment Link',
            description: 'Generate and send secure payment link',
            icon: <CreditCard className="w-5 h-5" />,
            type: 'secondary',
            assignee: 'Auto',
            dueDate: today,
            priority: 'high',
            note: '',
            whyReason: 'Patient agreed to make a payment during the call.',
            transcriptSnippets: extractTranscriptSnippets(transcript, ['link', 'send', 'text', 'pay']),
            enabled: true
          }
        ]

      case 'admin_request':
        return [
          {
            id: 'create_admin_task',
            label: 'Create Admin Task',
            description: 'Process letter/form request',
            icon: <FileText className="w-5 h-5" />,
            type: 'primary',
            assignee: 'Admin Team',
            dueDate: tomorrowStr,
            priority: 'medium',
            note: 'Letter/form request from patient',
            whyReason: 'Administrative requests need to be tracked and fulfilled.',
            transcriptSnippets: extractTranscriptSnippets(transcript, ['letter', 'form', 'fit note', 'employer', 'document']),
            enabled: true
          },
          {
            id: 'send_form_link',
            label: 'Send Form Link (if applicable)',
            description: 'Send link to any required online forms',
            icon: <Mail className="w-5 h-5" />,
            type: 'secondary',
            assignee: 'Auto',
            dueDate: today,
            priority: 'low',
            note: '',
            whyReason: 'Some requests require the patient to complete additional forms.',
            transcriptSnippets: [],
            enabled: false
          },
          {
            id: 'request_info',
            label: 'Request Missing Information',
            description: 'Follow up for any details needed',
            icon: <Info className="w-5 h-5" />,
            type: 'secondary',
            assignee: 'Reception',
            dueDate: tomorrowStr,
            priority: 'low',
            note: '',
            whyReason: 'May need additional details to complete the request.',
            transcriptSnippets: [],
            enabled: false
          }
        ]

      case 'clinical_query':
        return [
          {
            id: 'route_clinician',
            label: 'Route to Clinician',
            description: 'Create task for clinical review — not an admin decision',
            icon: <CheckSquare className="w-5 h-5" />,
            type: 'primary',
            assignee: 'Dr Patel',
            dueDate: today,
            priority: 'high',
            note: 'Clinical query requiring clinician review',
            whyReason: 'Clinical matters must be reviewed by a qualified clinician.',
            transcriptSnippets: extractTranscriptSnippets(transcript, ['symptom', 'side effect', 'pain', 'dizzy', 'worried']),
            enabled: true
          },
          {
            id: 'send_ack_clinical',
            label: 'Send Acknowledgement',
            description: 'Confirm query received, clinician will respond',
            icon: <Mail className="w-5 h-5" />,
            type: 'secondary',
            assignee: 'Auto',
            dueDate: today,
            priority: 'medium',
            note: '',
            whyReason: 'Patient should know their query has been escalated appropriately.',
            transcriptSnippets: [],
            enabled: true
          }
        ]

      default:
        return [
          {
            id: 'create_task',
            label: 'Create Follow-up Task',
            description: 'General follow-up task for this call',
            icon: <CheckSquare className="w-5 h-5" />,
            type: 'primary',
            assignee: 'Reception',
            dueDate: tomorrowStr,
            priority: 'medium',
            note: '',
            whyReason: 'Call may require follow-up action.',
            transcriptSnippets: [],
            enabled: true
          }
        ]
    }
  }

  const toggleWhy = (actionId: string) => {
    setExpandedWhys(prev => {
      const next = new Set(prev)
      if (next.has(actionId)) {
        next.delete(actionId)
      } else {
        next.add(actionId)
      }
      return next
    })
  }

  const updateAction = (actionId: string, updates: Partial<AdminAction>) => {
    setActions(prev => prev.map(a => 
      a.id === actionId ? { ...a, ...updates } : a
    ))
  }

  const enabledActions = actions.filter(a => a.enabled)

  const handleProceedToPreview = () => {
    if (enabledActions.length === 0) {
      onClose()
        return
    }
    setShowPlanPreview(true)
  }

  const handleExecutePlan = async () => {
    setIsExecuting(true)
    setExecutionProgress(0)

    // Simulate execution with progress
    for (let i = 0; i < enabledActions.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800))
      setExecutionProgress(Math.round(((i + 1) / enabledActions.length) * 100))
    }

    // Log AI Action to the conversation history
    logAIAction({
      type: 'call_followup',
      title: `Call Follow-up: ${callerName}`,
      description: editableSummary,
      source: 'call',
      caller: callerName,
      phone: call.phone,
      patientId: call.patientId,
      patientName: callerName,
      intent: intentCategory,
      actionsExecuted: enabledActions.map(a => ({
        label: a.label,
        assignee: a.assignee,
        dueDate: a.dueDate,
        priority: a.priority,
        note: a.note,
        status: 'completed'
      })),
      evidence: enabledActions
        .flatMap(a => a.transcriptSnippets)
        .filter(Boolean)
        .slice(0, 4),
      executedBy: currentRole
    })

    setIsExecuting(false)
    
    // Show success and close
    onClose()
  }

  const getIntentIcon = (category: IntentCategory) => {
    switch (category) {
      case 'appointment_change': return <Calendar className="w-5 h-5 text-blue-600" />
      case 'prescription_request': return <FileText className="w-5 h-5 text-purple-600" />
      case 'test_results': return <ClipboardList className="w-5 h-5 text-amber-600" />
      case 'billing_query': return <CreditCard className="w-5 h-5 text-orange-600" />
      case 'admin_request': return <FileText className="w-5 h-5 text-gray-600" />
      case 'clinical_query': return <AlertCircle className="w-5 h-5 text-red-600" />
      default: return <Phone className="w-5 h-5 text-gray-600" />
    }
  }

  const getIntentLabel = (category: IntentCategory) => {
    switch (category) {
      case 'appointment_change': return 'Appointment Change'
      case 'prescription_request': return 'Prescription Request'
      case 'test_results': return 'Test Results Query'
      case 'billing_query': return 'Billing Query'
      case 'admin_request': return 'Admin Request'
      case 'clinical_query': return 'Clinical Query'
      default: return 'General Enquiry'
    }
  }

  const getIntentColor = (category: IntentCategory) => {
    switch (category) {
      case 'appointment_change': return 'bg-blue-100 text-blue-800'
      case 'prescription_request': return 'bg-purple-100 text-purple-800'
      case 'test_results': return 'bg-amber-100 text-amber-800'
      case 'billing_query': return 'bg-orange-100 text-orange-800'
      case 'admin_request': return 'bg-gray-100 text-gray-800'
      case 'clinical_query': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Plan Preview View
  if (showPlanPreview) {
    return (
      <div 
        className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isExecuting) {
            setShowPlanPreview(false)
          }
        }}
      >
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
            <div>
            <h2 className="text-xl font-semibold text-gray-900">Plan Preview</h2>
              <p className="text-sm text-gray-600 mt-1">
                {enabledActions.length} action{enabledActions.length !== 1 ? 's' : ''} for {callerName}
              </p>
            </div>
            {!isExecuting && (
            <button 
              onClick={() => setShowPlanPreview(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
            )}
          </div>
          
          <div className="p-6 max-h-[60vh] overflow-y-auto">
            {/* Execution Progress */}
            {isExecuting && (
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-600">Executing actions...</span>
                  <span className="font-medium">{executionProgress}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
                    style={{ width: `${executionProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Call Summary</h4>
              <p className="text-sm text-blue-800">{editableSummary}</p>
            </div>
            
            {/* Actions to be executed */}
            <h4 className="text-sm font-medium text-gray-900 mb-3">Actions to Execute</h4>
            <div className="space-y-3">
              {enabledActions.map((action, index) => (
                <div 
                  key={action.id} 
                  className={`p-4 rounded-lg border transition-all ${
                    isExecuting && executionProgress > (index / enabledActions.length) * 100
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      isExecuting && executionProgress > (index / enabledActions.length) * 100
                        ? 'bg-green-600 text-white'
                        : 'bg-blue-600 text-white'
                    }`}>
                      {isExecuting && executionProgress > (index / enabledActions.length) * 100
                        ? <Check className="w-5 h-5" />
                        : action.icon
                      }
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{action.label}</div>
                      <div className="text-sm text-gray-600 mt-1">{action.description}</div>
                      
                      {/* Action details */}
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Assignee:</span>
                          <span className="ml-1 font-medium text-gray-900">{action.assignee}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Due:</span>
                          <span className="ml-1 font-medium text-gray-900">{action.dueDate}</span>
                  </div>
                  <div>
                          <span className="text-gray-500">Priority:</span>
                          <span className={`ml-1 font-medium capitalize ${
                            action.priority === 'high' ? 'text-red-600' :
                            action.priority === 'medium' ? 'text-amber-600' : 'text-gray-600'
                          }`}>{action.priority}</span>
                        </div>
                      </div>
                      
                      {action.note && (
                        <div className="mt-2 text-xs text-gray-600 italic">
                          Note: {action.note}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* AI Trail Preview */}
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">AI Trail Entry (will be created)</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <div><span className="font-medium">Type:</span> Call Follow-up</div>
                <div><span className="font-medium">Intent:</span> {getIntentLabel(intentCategory)}</div>
                <div><span className="font-medium">Caller:</span> {callerName} ({call.phone})</div>
                <div><span className="font-medium">Actions:</span> {enabledActions.length} executed</div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={() => setShowPlanPreview(false)}
              disabled={isExecuting}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
            <button
              onClick={handleExecutePlan}
              disabled={isExecuting}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Executing...
                </>
              ) : (
                'Execute Plan'
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Main Call Summary View
  return (
    <div 
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Phone className="w-6 h-6 text-blue-600" />
            <div>
            <h2 className="text-xl font-semibold text-gray-900">Call Summary</h2>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                Administrative assistant — not medical advice
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {/* Consent Status Banner */}
          <div className={`flex items-center justify-between p-3 rounded-lg border ${
            consentConfirmed 
              ? 'bg-green-50 border-green-200' 
              : 'bg-amber-50 border-amber-200'
          }`}>
            <div className="flex items-center space-x-3">
              {consentConfirmed ? (
                <div className="p-1.5 bg-green-100 rounded-full">
                  <Eye className="w-4 h-4 text-green-600" />
                </div>
              ) : (
                <div className="p-1.5 bg-amber-100 rounded-full">
                  <EyeOff className="w-4 h-4 text-amber-600" />
                </div>
              )}
              <div>
                <span className={`text-sm font-medium ${consentConfirmed ? 'text-green-800' : 'text-amber-800'}`}>
                  AI Consent: {consentConfirmed ? 'Given' : 'Not Given'}
                </span>
                <p className={`text-xs ${consentConfirmed ? 'text-green-600' : 'text-amber-600'}`}>
                  {consentConfirmed 
                    ? 'Patient agreed to AI note-taking during call' 
                    : 'Patient did not consent to AI listening'}
                </p>
              </div>
            </div>
            <button 
              onClick={() => setConsentConfirmed(!consentConfirmed)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                consentConfirmed 
                  ? 'bg-green-600 text-white hover:bg-green-700' 
                  : 'bg-amber-600 text-white hover:bg-amber-700'
              }`}
            >
              {consentConfirmed ? 'Mark as Revoked' : 'Mark as Consented'}
            </button>
        </div>
        
          {/* Call Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Caller Card */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Caller</span>
              </div>
              <div className="font-semibold text-gray-900">{callerName}</div>
              <div className="text-sm text-gray-600">{call.phone}</div>
              {patient && (
                <div className="text-xs text-blue-600 mt-1">
                  Existing patient • ID: {call.patientId}
                </div>
              )}
              {!patient && call.patientId === undefined && (
                <div className="text-xs text-amber-600 mt-1">
                  New caller / Not in system
                </div>
              )}
            </div>
            
            {/* Intent Card */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                {getIntentIcon(intentCategory)}
                <span className="text-sm font-medium text-gray-700">Category</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getIntentColor(intentCategory)}`}>
                  {getIntentLabel(intentCategory)}
                </span>
              </div>
            </div>
            
            {/* Duration Card */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Duration</span>
              </div>
              <div className="font-semibold text-gray-900">{DEMO_CALL_DURATION}</div>
              <div className="text-sm text-gray-600">
                {new Date(call.startTime).toLocaleTimeString('en-GB', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          </div>

          {/* Editable Summary - only shown with consent */}
          {consentConfirmed && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-medium text-gray-900">AI Summary</h3>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    AI Generated
                  </span>
                </div>
                <button
                  onClick={() => setIsEditingSummary(!isEditingSummary)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  {isEditingSummary ? 'Done' : 'Edit'}
                </button>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                {isEditingSummary ? (
                  <textarea
                    value={editableSummary}
                    onChange={(e) => setEditableSummary(e.target.value)}
                    className="w-full bg-white border border-blue-300 rounded p-2 text-gray-700 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                ) : (
                  <p className="text-gray-700">{editableSummary}</p>
                )}
              </div>
            </div>
          )}

          {/* AI Recommendations */}
          {consentConfirmed && (
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <h3 className="text-lg font-medium text-gray-900">AI Recommendations</h3>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                Based on call analysis
              </span>
            </div>
            <div className="space-y-3">
              {actions.map(action => (
                <div
                  key={action.id}
                  className={`p-4 rounded-lg border transition-all ${
                    action.enabled
                      ? action.type === 'primary' 
                        ? 'border-blue-200 bg-blue-50' 
                        : 'border-gray-200 bg-white'
                      : 'border-gray-100 bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Enable checkbox */}
                    <div className="pt-1">
                      <input
                        type="checkbox"
                        checked={action.enabled}
                        onChange={(e) => updateAction(action.id, { enabled: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </div>
                    
                    {/* Icon */}
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      action.enabled 
                        ? action.type === 'primary' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {action.icon}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${action.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                        {action.label}
                        </span>
                        {action.type === 'primary' && action.enabled && (
                          <span className="px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                      
                      {/* Editable fields when enabled */}
                      {action.enabled && (
                        <div className="mt-3 grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs text-gray-500">Assignee</label>
                            <select
                              value={action.assignee}
                              onChange={(e) => updateAction(action.id, { assignee: e.target.value })}
                              className="w-full mt-1 text-sm border border-gray-200 rounded px-2 py-1"
                            >
                              <option>Reception</option>
                              <option>Dr Patel</option>
                              <option>Admin Team</option>
                              <option>Accounts</option>
                              <option>Auto</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Due Date</label>
                            <input
                              type="date"
                              value={action.dueDate}
                              onChange={(e) => updateAction(action.id, { dueDate: e.target.value })}
                              className="w-full mt-1 text-sm border border-gray-200 rounded px-2 py-1"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500">Priority</label>
                            <select
                              value={action.priority}
                              onChange={(e) => updateAction(action.id, { priority: e.target.value as any })}
                              className="w-full mt-1 text-sm border border-gray-200 rounded px-2 py-1"
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                          </div>
                        </div>
                      )}
                      
                      {/* Optional note */}
                      {action.enabled && (
                        <div className="mt-2">
                          <input
                            type="text"
                            placeholder="Add a note (optional)"
                            value={action.note}
                            onChange={(e) => updateAction(action.id, { note: e.target.value })}
                            className="w-full text-sm border border-gray-200 rounded px-2 py-1 text-gray-700"
                          />
                        </div>
                      )}
                      
                      {/* Why? expandable */}
                      {action.enabled && (
                        <div className="mt-3">
                          <button
                            onClick={() => toggleWhy(action.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                          >
                            {expandedWhys.has(action.id) ? (
                              <ChevronUp className="w-3 h-3 mr-1" />
                            ) : (
                              <ChevronDown className="w-3 h-3 mr-1" />
                            )}
                            Why this action?
                          </button>
                          
                          {expandedWhys.has(action.id) && (
                            <div className="mt-2 p-3 bg-white border border-gray-100 rounded text-xs text-gray-600">
                              <p className="mb-2">{action.whyReason}</p>
                              {action.transcriptSnippets.length > 0 && (
                                <div className="mt-2 space-y-1">
                                  <p className="font-medium text-gray-700">Evidence from call:</p>
                                  {action.transcriptSnippets.map((snippet, i) => (
                                    <p key={i} className="italic text-gray-500 pl-2 border-l-2 border-gray-200">
                                      {snippet}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* No Consent Message - AI features unavailable */}
          {!consentConfirmed && (
            <div className="p-6 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-amber-100 rounded-full">
                  <EyeOff className="w-6 h-6 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-amber-900 mb-2">AI Features Unavailable</h4>
                  <p className="text-sm text-amber-800 mb-3">
                    Patient did not consent to AI note-taking during this call. AI recommendations, transcript analysis, and automated follow-ups are not available.
                  </p>
                  <div className="text-sm text-amber-700">
                    <p className="font-medium mb-2">Manual options:</p>
                    <ul className="list-disc list-inside space-y-1 text-amber-600">
                      <li>Create a follow-up task manually</li>
                      <li>Add notes to patient record</li>
                      <li>Schedule a callback if needed</li>
                    </ul>
                  </div>
                  
                  {/* Manual action button */}
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => {
                        // In real app, would open task creation
                        alert('In production, this would open the manual task creation form.')
                      }}
                      className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-md hover:bg-amber-700 transition-colors"
                    >
                      Create Manual Task
                    </button>
                    <button
                      onClick={() => setConsentConfirmed(true)}
                      className="px-4 py-2 bg-white text-amber-700 text-sm font-medium rounded-md border border-amber-300 hover:bg-amber-50 transition-colors"
                    >
                      Patient Now Consents
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transcript Preview */}
          {consentConfirmed && call.transcript && call.transcript.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Call Transcript</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                <div className="space-y-2 text-sm">
                  {call.transcript.map((line, index) => (
                    <div key={index} className={
                      line.startsWith('Receptionist:') 
                        ? 'text-blue-700' 
                        : line.startsWith('Caller:') 
                        ? 'text-gray-700' 
                        : 'text-gray-500 italic'
                    }>
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            {consentConfirmed ? (
              <>{enabledActions.length} AI recommendation{enabledActions.length !== 1 ? 's' : ''} selected</>
            ) : (
              <span className="text-amber-600">AI features disabled (no consent)</span>
            )}
          </div>
          <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
            {consentConfirmed && (
              <button
                onClick={handleProceedToPreview}
                disabled={enabledActions.length === 0}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enabledActions.length > 0 ? 'Preview & Execute' : 'No Actions Selected'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
