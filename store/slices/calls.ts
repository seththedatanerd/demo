import { StateCreator } from 'zustand'

export interface CallRecord {
  id: string
  phone: string
  patientId?: string
  patientName?: string
  startTime: string
  endTime?: string
  mode: 'capture' | 'shadow'
  status: 'active' | 'completed'
  intent?: 'reschedule' | 'new_booking' | 'prescription' | 'billing' | 'inquiry' | 'test_results' | 'admin_request' | 'other'
  summary?: string
  keyDetails?: string
  transcript?: string[] // Placeholder lines for demo
  consentGiven?: boolean // Patient consented to AI note-taking
}

export interface CallSlice {
  activeCall: CallRecord | null
  recentCalls: CallRecord[]
  
  // Actions
  startCall: (phone: string, patientId?: string) => void
  endCall: (summary?: Partial<CallRecord>) => CallRecord | null
  updateCall: (updates: Partial<CallRecord>) => void
  getCallById: (id: string) => CallRecord | undefined
}

// Demo call history data
const DEMO_CALLS: CallRecord[] = [
  {
    id: 'call-001',
    phone: '+44 7789 123456',
    patientId: 'p2', // Sarah Jones
    patientName: 'Sarah Jones',
    status: 'completed',
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    endTime: new Date(Date.now() - 2 * 60 * 60 * 1000 + 4 * 60 * 1000).toISOString(), // 4 min call
    mode: 'capture',
    summary: 'Patient wants to reschedule Tuesday appointment due to work conflict',
    intent: 'reschedule',
    keyDetails: 'Moved appointment from Tuesday 2:30pm to Thursday 2:30pm',
    transcript: [
      'Receptionist: Good morning, how can I help you today?',
      'Caller: Hi, it\'s Sarah Jones. I need to reschedule my appointment for Tuesday.',
      'Receptionist: Of course, let me pull up your appointment. I can see you\'re booked with Dr Patel at 2:30pm.',
      'Caller: Yes, that\'s right. I have a work conflict that came up. Could we move it to next week?',
      'Receptionist: Let me check Dr Patel\'s availability... I have Thursday the 19th at 2:30pm or Friday the 20th at 10am.',
      'Caller: Thursday at 2:30 would be perfect.',
      'Receptionist: Great! I\'ll move your appointment to Thursday September 19th at 2:30pm. I\'ll send you a confirmation SMS.',
      'Caller: Thank you so much, that\'s really helpful.',
      'Receptionist: You\'re very welcome. Is there anything else I can help with today?',
      'Caller: No, that\'s everything. Have a great day!',
      'Receptionist: You too, see you next Thursday!'
    ]
  },
  {
    id: 'call-002',
    phone: '+44 7123 456789',
    patientId: 'p1', // Amelia Ali
    patientName: 'Amelia Ali',
    status: 'completed',
    startTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    endTime: new Date(Date.now() - 5 * 60 * 60 * 1000 + 6 * 60 * 1000).toISOString(), // 6 min call
    mode: 'capture',
    summary: 'Query about outstanding invoice and payment plan options',
    intent: 'billing',
    keyDetails: 'Set up payment plan: £72.50 now, £72.50 next month',
    transcript: [
      'Receptionist: Good morning, how can I help you today?',
      'Caller: Hi, I received an invoice and wanted to ask about payment options.',
      'Receptionist: Of course! May I take your name please?',
      'Caller: It\'s Amelia Ali.',
      'Receptionist: Thank you Amelia. I can see your recent invoice for £145. What would you like to know?',
      'Caller: I was wondering if I could pay in installments? Money\'s a bit tight this month.',
      'Receptionist: Absolutely, we can arrange a payment plan. Would paying half now and half next month work for you?',
      'Caller: That would be perfect, thank you.',
      'Receptionist: No problem at all. I can send you a secure payment link for the first £72.50 now.',
      'Caller: That\'s great. Will you send it by text?',
      'Receptionist: Yes, I\'ll send it to your mobile ending in 123 in just a moment.',
      'Caller: Brilliant, thank you so much for being flexible.',
      'Receptionist: You\'re very welcome. We\'re always happy to help our patients.'
    ]
  },
  {
    id: 'call-003',
    phone: '+44 7456 789012',
    patientId: 'p3', // Mrs Smith
    patientName: 'Mrs Smith',
    status: 'completed',
    startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 3 * 60 * 1000).toISOString(), // 3 min call
    mode: 'capture',
    summary: 'Patient reporting side effects from current medication, needs review',
    intent: 'prescription',
    keyDetails: 'Dr Patel to call back between 2-4pm about blood pressure medication',
    transcript: [
      'Receptionist: Good morning, how can I help you today?',
      'Caller: Hello, it\'s Mrs Smith. I\'m having some issues with my new medication.',
      'Receptionist: I\'m sorry to hear that. What kind of issues are you experiencing?',
      'Caller: I\'ve been getting quite dizzy since I started the new blood pressure tablets.',
      'Receptionist: That doesn\'t sound pleasant. When did you start taking them?',
      'Caller: About a week ago. Dr Patel prescribed them at my last appointment.',
      'Receptionist: I think it would be best if Dr Patel reviews this with you. Would you like me to arrange a call back or book an appointment?',
      'Caller: A call back would be good if possible.',
      'Receptionist: I\'ll ask Dr Patel to call you this afternoon. Is your number still ending in 789?',
      'Caller: Yes, that\'s right.',
      'Receptionist: Perfect. In the meantime, do continue taking the medication unless Dr Patel advises otherwise.',
      'Caller: Okay, thank you for your help.',
      'Receptionist: You\'re welcome. Dr Patel should call you between 2 and 4pm today.'
    ]
  },
  {
    id: 'call-004',
    phone: '+44 7987 654321',
    patientId: undefined, // Unknown caller
    patientName: 'Michael Thompson',
    status: 'completed',
    startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000).toISOString(), // Yesterday afternoon
    endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000 + 8 * 60 * 1000).toISOString(), // 8 min call
    mode: 'capture',
    summary: 'New patient requesting initial consultation for diabetes management',
    intent: 'new_booking',
    keyDetails: 'Booked: Tuesday 3pm with Dr Patel, new patient registration required',
    transcript: [
      'Receptionist: Good morning, how can I help you today?',
      'Caller: Hi, I\'d like to book an appointment please. I\'m a new patient.',
      'Receptionist: Of course! May I take your name and date of birth?',
      'Caller: It\'s Michael Thompson, date of birth 15th March 1985.',
      'Receptionist: Thank you Michael. What type of appointment are you looking for?',
      'Caller: I need an initial consultation. My GP referred me for diabetes management.',
      'Receptionist: I can book you with Dr Patel who specializes in diabetes care. I have availability next Tuesday at 3pm or Wednesday at 10am.',
      'Caller: Tuesday at 3pm works well for me.',
      'Receptionist: Perfect! I\'ll book that for you. Can I take a contact number and confirm your address?',
      'Caller: Yes, it\'s 07789 123456, and I live at 42 Oak Street, London SW1A 2BB.',
      'Receptionist: Excellent. I\'ll send you a confirmation with our address and parking information.',
      'Caller: That\'s great, thank you very much.',
      'Receptionist: You\'re welcome! We look forward to seeing you next Tuesday.'
    ]
  },
  {
    id: 'call-005',
    phone: '+44 7555 888999',
    patientId: undefined,
    patientName: 'Unknown Caller',
    status: 'completed',
    startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(), // 5 min call
    mode: 'capture',
    summary: 'General inquiry about services and diabetes treatment options',
    intent: 'inquiry',
    keyDetails: 'Provided service information, caller to call back to book',
    transcript: [
      'Receptionist: Good morning, how can I help you today?',
      'Caller: Hi, I\'m calling to ask about your services. Do you treat diabetes patients?',
      'Receptionist: Yes, we do! Dr Patel specializes in diabetes management and we see many diabetic patients.',
      'Caller: That\'s great. What does an initial consultation involve?',
      'Receptionist: The first appointment is usually about 30 minutes. Dr Patel will review your medical history, current medications, and discuss a management plan.',
      'Caller: And what are your consultation fees?',
      'Receptionist: Our initial consultation is £120, and follow-up appointments are £80.',
      'Caller: Do you accept Bupa insurance?',
      'Receptionist: Yes, we work with most major insurers including Bupa. We can check your coverage when you book.',
      'Caller: Perfect. What\'s your availability like?',
      'Receptionist: We usually have appointments available within a week. Would you like me to check some specific times for you?',
      'Caller: Not right now, but I\'ll call back to book soon. Thank you for the information.',
      'Receptionist: You\'re very welcome! Feel free to call anytime.'
    ]
  },
  {
    id: 'call-006',
    phone: '+44 7111 222333',
    patientId: 'p1', // Amelia Ali again
    patientName: 'Amelia Ali',
    status: 'completed',
    startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    endTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 1000).toISOString(), // 2 min call
    mode: 'capture',
    summary: 'Quick appointment confirmation call',
    intent: 'inquiry',
    keyDetails: 'Confirmed appointment for 10:30am tomorrow, reminded to bring medication list',
    transcript: [
      'Receptionist: Good morning, how can I help you today?',
      'Caller: Hi, it\'s Amelia Ali. I just wanted to confirm my appointment for tomorrow.',
      'Receptionist: Of course! Let me check... Yes, you\'re booked with Dr Patel at 10:30am tomorrow.',
      'Caller: Perfect, that\'s what I thought. Do I need to bring anything specific?',
      'Receptionist: Just bring your current medication list and any test results since your last visit.',
      'Caller: Great, I\'ll see you tomorrow then.',
      'Receptionist: Looking forward to seeing you tomorrow, Amelia!'
    ]
  },
  {
    id: 'call-007',
    phone: '+44 7333 444555',
    patientId: 'p2', // Sarah Jones
    patientName: 'Sarah Jones',
    status: 'completed',
    startTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    endTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000 + 7 * 60 * 1000).toISOString(), // 7 min call
    mode: 'capture',
    summary: 'Patient requesting test results and follow-up appointment',
    intent: 'inquiry',
    keyDetails: 'Test results normal, booked follow-up in 3 months',
    transcript: [
      'Receptionist: Good morning, how can I help you today?',
      'Caller: Hi, it\'s Sarah Jones. I had some blood tests done last week and wanted to check if the results are in.',
      'Receptionist: Let me check for you... Yes, I can see Dr Patel has reviewed your results.',
      'Caller: Great! Are they okay?',
      'Receptionist: Dr Patel has marked them as normal, but he\'d like to discuss them with you properly.',
      'Caller: That sounds good. When can I book in?',
      'Receptionist: I have availability next Thursday at 11am or Friday at 2:30pm.',
      'Caller: Thursday at 11am works perfectly.',
      'Receptionist: Excellent, I\'ll book that for you. Dr Patel will go through everything in detail then.',
      'Caller: Thank you so much, that\'s really reassuring.',
      'Receptionist: You\'re very welcome! See you next Thursday.'
    ]
  }
]

export const createCallSlice: StateCreator<CallSlice> = (set, get) => ({
  activeCall: null,
  recentCalls: [...DEMO_CALLS],

  startCall: (phone: string, patientId?: string) => {
    const newCall: CallRecord = {
      id: `call-${Date.now()}`,
      phone,
      patientId,
      patientName: patientId ? `Patient ${patientId}` : undefined, // Will be resolved by component
      startTime: new Date().toISOString(),
      mode: 'capture',
      status: 'active'
    }
    
    set({ activeCall: newCall })
  },

  endCall: (summary?: Partial<CallRecord>) => {
    const { activeCall } = get()
    if (!activeCall) return null

    const completedCall: CallRecord = {
      ...activeCall,
      ...summary,
      endTime: new Date().toISOString(),
      status: 'completed'
    }

    set(state => ({
      activeCall: null,
      recentCalls: [completedCall, ...state.recentCalls.slice(0, 49)] // Keep last 50
    }))

    return completedCall
  },

  updateCall: (updates: Partial<CallRecord>) => {
    set(state => ({
      activeCall: state.activeCall ? { ...state.activeCall, ...updates } : null
    }))
  },

  getCallById: (id: string) => {
    const { activeCall, recentCalls } = get()
    if (activeCall?.id === id) return activeCall
    return recentCalls.find(call => call.id === id)
  }
})
