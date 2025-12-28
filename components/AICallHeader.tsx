'use client'

import { useState, useEffect } from 'react'
import { useCalls, useData } from '@/store'
import { Phone, PhoneCall, Square, Mic, Clock, CheckCircle, Circle, Shield } from 'lucide-react'

// Demo caller data - consistent across all UI
const DEMO_CALLERS = [
  { 
    phone: '+44 7946 0958', 
    patientId: 'p2',
    name: 'Sarah Jones'
  },
  { 
    phone: '+44 7123 4567', 
    patientId: 'p1',
    name: 'Amelia Ali'
  },
  { 
    phone: '+44 7789 0123', 
    patientId: undefined,
    name: 'Donna Hill' // New patient
  },
]

// Hard-coded demo duration for consistency
export const DEMO_CALL_DURATION = '5 minutes'

export default function AICallHeader() {
  const { activeCall, startCall, endCall, updateCall } = useCalls()
  const { patients } = useData() as any
  const [showCallSim, setShowCallSim] = useState(false)
  const [selectedCaller, setSelectedCaller] = useState(DEMO_CALLERS[0])
  const [callTimer, setCallTimer] = useState(0)
  const [patientConsent, setPatientConsent] = useState(false)

  // Listen for simulate call event from header button
  useEffect(() => {
    const handleSimulateCall = () => setShowCallSim(true)
    window.addEventListener('simulateCall', handleSimulateCall)
    return () => window.removeEventListener('simulateCall', handleSimulateCall)
  }, [])

  // Call timer for display (but we'll use hard-coded duration in summary)
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (activeCall) {
      interval = setInterval(() => {
        setCallTimer(prev => prev + 1)
      }, 1000)
    } else {
      setCallTimer(0)
    }
    return () => clearInterval(interval)
  }, [activeCall])

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Demo: simulate incoming call with selected caller
  const simulateIncomingCall = () => {
    setPatientConsent(false) // Reset consent for new call
    startCall(selectedCaller.phone, selectedCaller.patientId)
    // Update with consistent name
    setTimeout(() => {
      updateCall({ patientName: selectedCaller.name })
    }, 100)
    setShowCallSim(false)
  }

  const handleStartNotes = () => {
    if (activeCall) {
      updateCall({ mode: 'capture' })
    }
  }

  const handleEndCall = () => {
    if (activeCall) {
      // Get caller info for consistent identity
      const callerInfo = DEMO_CALLERS.find(c => c.phone === activeCall.phone) || selectedCaller
      const patientName = callerInfo.name

      // Intent-based transcripts with consistent caller identity
      const transcripts: Record<string, string[]> = {
        reschedule: [
          'Receptionist: Good morning, Ceda GP Practice. How can I help you today?',
          `Caller: Hi, it's ${patientName}. I need to reschedule my appointment for Tuesday.`,
          'Receptionist: Of course, let me pull up your appointment.',
          `Caller: I have a work conflict that came up. Could we move it to next week?`,
          'Receptionist: Let me check availability... I have Thursday the 19th at 2:30pm or Friday at 10am.',
          'Caller: Thursday at 2:30 would be perfect.',
          'Receptionist: Great! I\'ll move your appointment to Thursday. I\'ll send you a confirmation SMS.',
          'Caller: Thank you so much.',
          'Receptionist: You\'re welcome. Is there anything else I can help with today?',
          'Caller: No, that\'s everything. Thanks!'
        ],
        new_booking: [
          'Receptionist: Good morning, Ceda GP Practice. How can I help you today?',
          `Caller: Hi, it's ${patientName}. I'd like to book an appointment please.`,
          'Receptionist: Of course! What type of appointment are you looking for?',
          'Caller: I need to see a GP about some test results my hospital sent over.',
          'Receptionist: I can book you with Dr Patel. I have availability Tuesday at 3pm or Wednesday at 10am.',
          'Caller: Tuesday at 3pm works well for me.',
          'Receptionist: Perfect! I\'ll book that for you. I\'ll send you a confirmation.',
          'Caller: That\'s great, thank you very much.'
        ],
        prescription: [
          'Receptionist: Good morning, Ceda GP Practice. How can I help you today?',
          `Caller: Hello, it's ${patientName}. I'm calling about my medication.`,
          'Receptionist: I see. What can I help you with regarding your medication?',
          'Caller: I need to request a repeat prescription for my usual tablets.',
          'Receptionist: I can put that request through for the doctor to review.',
          'Caller: How long will it take?',
          'Receptionist: Usually 48 working hours. We\'ll text you when it\'s ready.',
          'Caller: That\'s fine, thank you.'
        ],
        billing: [
          'Receptionist: Good morning, Ceda GP Practice. How can I help you today?',
          `Caller: Hi, it's ${patientName}. I received an invoice and have a question.`,
          'Receptionist: Of course! Let me pull up your account.',
          'Caller: I was wondering if I could pay in installments?',
          'Receptionist: Absolutely, we can arrange a payment plan. Would half now and half next month work?',
          'Caller: That would be perfect, thank you.',
          'Receptionist: I\'ll send you a secure payment link for the first half now.',
          'Caller: Brilliant, thank you for being flexible.'
        ],
        test_results: [
          'Receptionist: Good morning, Ceda GP Practice. How can I help you today?',
          `Caller: Hi, it's ${patientName}. I had some blood tests done last week.`,
          'Receptionist: Let me check the system for you.',
          'Caller: Are the results back yet?',
          'Receptionist: Yes, I can see they\'ve come through. The doctor needs to review them first.',
          'Caller: When can someone call me about them?',
          'Receptionist: I\'ll create a task for Dr Patel to call you back today.',
          'Caller: Thank you, I appreciate that.'
        ],
        admin_request: [
          'Receptionist: Good morning, Ceda GP Practice. How can I help you today?',
          `Caller: Hello, it's ${patientName}. I need a letter for my employer.`,
          'Receptionist: What kind of letter do you need?',
          'Caller: A fit note confirming my recovery after my procedure.',
          'Receptionist: I\'ll put that request through. There\'s usually a small admin fee.',
          'Caller: That\'s fine. How long will it take?',
          'Receptionist: Usually 3-5 working days. We\'ll contact you when it\'s ready.',
          'Caller: Perfect, thank you.'
        ]
      }

      const summaries: Record<string, string> = {
        reschedule: `${patientName} needs to reschedule Tuesday appointment due to work conflict. Requested move to next week.`,
        new_booking: `${patientName} requesting to book an appointment to discuss hospital test results with GP.`,
        prescription: `${patientName} requesting repeat prescription for regular medication.`,
        billing: `${patientName} queried about outstanding invoice and requested payment plan options.`,
        test_results: `${patientName} calling to check on blood test results from last week.`,
        admin_request: `${patientName} requested fit note letter for employer following recent procedure.`
      }

      // Randomly select intent for demo
      const intents = ['reschedule', 'new_booking', 'prescription', 'billing', 'test_results', 'admin_request'] as const
      const intent = intents[Math.floor(Math.random() * intents.length)]

      endCall({
        intent: intent === 'test_results' || intent === 'admin_request' ? 'other' : intent as any,
        summary: summaries[intent],
        keyDetails: `Call duration: ${DEMO_CALL_DURATION}`, // Consistent hard-coded duration
        patientName,
        transcript: transcripts[intent],
        consentGiven: patientConsent // Pass consent status
      })
    }
  }

  // Don't show anything if no active call and not simulating
  if (!activeCall && !showCallSim) {
    return null
  }

  // Call simulation panel
  if (showCallSim) {
    return (
      <div className="fixed top-20 right-6 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 w-80">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">Simulate Incoming Call</h3>
          <button 
            onClick={() => setShowCallSim(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Demo: Select a caller to test the AI call assistant
        </p>
        
        {/* Caller Selection */}
        <div className="space-y-2 mb-4">
          {DEMO_CALLERS.map((caller) => (
            <button
              key={caller.phone}
              onClick={() => setSelectedCaller(caller)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                selectedCaller.phone === caller.phone
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="font-medium text-gray-900">{caller.name}</div>
              <div className="text-sm text-gray-500">{caller.phone}</div>
              <div className="text-xs text-gray-400 mt-1">
                {caller.patientId ? 'Existing patient' : 'New caller'}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={simulateIncomingCall}
          className="w-full px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 flex items-center justify-center"
        >
          <PhoneCall className="w-4 h-4 mr-2" />
          Start Call with {selectedCaller.name}
        </button>
      </div>
    )
  }

  // Active call header - use consistent caller name
  const callerInfo = DEMO_CALLERS.find(c => c.phone === activeCall?.phone)
  const callerName = activeCall?.patientName || callerInfo?.name || 'Unknown Caller'

  return (
    <div className="bg-blue-600 text-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
            <PhoneCall className="w-5 h-5" />
            <span className="font-medium">
              Active Call — {callerName}
            </span>
          </div>
          
          <div className="text-sm opacity-90">
            {activeCall?.phone}
          </div>

          {/* Call timer */}
          <div className="flex items-center space-x-1 text-sm opacity-75">
            <Clock className="w-4 h-4" />
            <span>{formatTimer(callTimer)}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Patient Consent Toggle */}
          <button
            onClick={() => setPatientConsent(!patientConsent)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              patientConsent 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'bg-white/20 hover:bg-white/30 text-white border border-white/40'
            }`}
          >
            {patientConsent ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Consent Given</span>
              </>
            ) : (
              <>
                <Circle className="w-4 h-4" />
                <span>No Consent</span>
              </>
            )}
          </button>

          {/* AI Notes Status */}
          {patientConsent && (
            <div className="flex items-center space-x-2 text-sm bg-green-500/30 px-3 py-1.5 rounded-md">
              <div className="flex space-x-1">
                <div className="w-1 h-3 bg-white/80 rounded animate-pulse" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1 h-3 bg-white/80 rounded animate-pulse" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1 h-3 bg-white/80 rounded animate-pulse" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="opacity-90">AI listening</span>
            </div>
          )}

          {!patientConsent && (
            <div className="text-xs opacity-75 hidden lg:block max-w-[200px]">
              Ask: "Are you comfortable with AI taking notes?"
            </div>
          )}

          <button
            onClick={handleEndCall}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md text-sm font-medium transition-colors flex items-center"
          >
            <Square className="w-4 h-4 mr-2" />
            End Call
          </button>
        </div>
      </div>
    </div>
  )
}
