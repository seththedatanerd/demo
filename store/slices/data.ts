import { StateCreator } from 'zustand'

// Types for data entities
export interface Patient {
  id: string
  name: string
  dob: string
  phone: string
  insurer: string
  insuranceExpiry?: string
  lastSeen?: string
  preferences?: {
    communication: 'email' | 'sms' | 'phone'
    appointmentTime: 'morning' | 'afternoon' | 'evening'
    reminders: boolean
  }
  riskFactors?: string[]
  nextDue?: string
}

// Appointment delivery types
export type AppointmentDeliveryType = 'f2f' | 'video' | 'phone' | 'home-visit'

export interface Appointment {
  id: string
  patientId: string
  start: string
  end: string
  // Legacy fields for early demo pages
  clinician?: string
  room?: string
  // Enhanced calendar fields
  practitionerId?: string
  practitionerName?: string
  roomId?: string
  roomName?: string
  siteId?: string
  siteName?: string
  appointmentType?: string // e.g., "GP Consultation", "Blood Test"
  deliveryType?: AppointmentDeliveryType // How the appointment is delivered
  status?: 'scheduled' | 'confirmed' | 'arrived' | 'dna' | 'completed' | 'cancelled'
  notes?: string
}

export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Partially Paid' | 'Overdue' | 'Voided' | 'Refunded'

export interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  rate: number
  amount: number
  appointmentId?: string // Link to appointment if applicable
  appointmentDate?: string
  serviceCode?: string
}

export interface InvoicePayment {
  id: string
  date: string
  amount: number
  method: 'Bank Transfer' | 'Card Payment' | 'Cash' | 'Cheque' | 'Insurance' | 'Refund'
  reference?: string
}

export interface Invoice {
  id: string
  patientId: string
  status: InvoiceStatus
  amount: number
  amountPaid: number
  balance: number
  dueDate: string
  createdDate: string
  payer: string
  lineItems: InvoiceLineItem[]
  payments: InvoicePayment[]
  notes?: string
  voidedDate?: string
  voidedReason?: string
  refundedDate?: string
  refundAmount?: number
  refundReason?: string
}

export interface Clinician {
  id: string
  name: string
  role: 'GP' | 'Nurse' | 'Admin' | 'Specialist'
  email?: string
}

export interface Service {
  code: string
  name: string
  price: number
}

export interface Note {
  id: string
  patientId: string
  author: string
  createdAt: string
  type: 'consultation' | 'lab' | 'referral' | 'admin'
  text: string
}

// Medication/Prescription types
export interface MedicationInfo {
  id: string
  name: string
  genericName?: string
  pharmaceuticalClass: string
  contraindications: string[]
  warnings: string[]
  interactions: string[]
  sideEffects: string[]
  indications: string[]
  dosageGuidelines: {
    adults?: string
    children?: string
  }
  quantities: string[] // Available quantity options
}

export interface Prescription {
  id: string
  patientId: string
  medicationId: string
  medicationName: string
  dosage: string
  quantity: string
  isRepeatPrescription: boolean
  isDispensed: boolean
  batchNumber?: string
  expiryDate?: string
  comments?: string
  showInSummary: boolean
  prescribedBy: string
  prescribedDate: string
  status: 'active' | 'completed' | 'cancelled'
}

export interface Practitioner {
  id: string
  name: string
  title: string
  specialty: string
  color: string
}

export interface Site {
  id: string
  name: string
  address: string
}

export interface Room {
  siteId: string
  id: string
  name: string
}

export interface DataSlice {
  patients: Patient[]
  appointments: Appointment[]
  invoices: Invoice[]
  clinicians: Clinician[]
  services: Service[]
  notes: Note[]
  practitioners: Practitioner[]
  sites: Site[]
  rooms: Room[]
  documents: { id: string; patientId: string; title: string; type: string }[]
  tasks: { id: string; patientId?: string; title: string; status: 'open' | 'done' }[]
  messages: { id: string; to: string; body: string; status: 'draft' | 'sent' }[]
  mutationLocked?: boolean
  
  // Actions
  addPatient: (patient: Patient) => void
  updatePatient: (id: string, updates: Partial<Patient>) => void
  addAppointment: (appointment: Appointment) => void
  updateAppointment: (id: string, updates: Partial<Appointment>) => void
  removeAppointment: (id: string) => void
  addInvoice: (invoice: Invoice) => void
  updateInvoice: (id: string, updates: Partial<Invoice>) => void
  markInvoicePaid: (id: string) => void
  addNote: (note: Note) => void
  updateNote: (id: string, updates: Partial<Note>) => void
  removeNote: (id: string) => void
  prescriptions: Prescription[]
  addPrescription: (prescription: Prescription) => void
  updatePrescription: (id: string, updates: Partial<Prescription>) => void
  removePrescription: (id: string) => void
  addClinician: (clinician: Clinician) => void
  addService: (service: Service) => void
  addDocument: (doc: { id: string; patientId: string; title: string; type: string }) => void
  removeDocument: (id: string) => void
  addTask: (task: { id: string; patientId?: string; title: string }) => void
  completeTask: (id: string) => void
  removeTask: (id: string) => void
  addMessage: (msg: { id: string; to: string; body: string; status?: 'draft' | 'sent' }) => void
  removeMessage: (id: string) => void
  loadDemoData: () => void
  loadFromJson: () => Promise<void>
  setMutationLocked: (locked: boolean) => void
}

// Demo seed data (enhanced with richer context for AI suggestions)
const DEMO_PATIENTS: Patient[] = [
  { 
    id: "p1", 
    name: "Amelia Ali", 
    dob: "1987-03-14", 
    phone: "+44 7700 900123", 
    insurer: "Bupa",
    insuranceExpiry: "2025-12-31",
    lastSeen: "2024-08-15",
    preferences: {
      communication: 'email',
      appointmentTime: 'morning',
      reminders: true
    },
    riskFactors: ['diabetes', 'family_history_heart'],
    nextDue: "6-month-checkup"
  },
  { 
    id: "p2", 
    name: "Sarah Jones", 
    dob: "1994-09-10", 
    phone: "+44 7700 900456", 
    insurer: "Self-pay",
    insuranceExpiry: null as unknown as string,
    lastSeen: "2024-09-10",
    preferences: {
      communication: 'sms',
      appointmentTime: 'afternoon',
      reminders: true
    },
    riskFactors: [],
    nextDue: "annual-screening"
  },
  { 
    id: "p3", 
    name: "Mrs Smith", 
    dob: "1963-01-22", 
    phone: "+44 7700 900789", 
    insurer: "AXA",
    insuranceExpiry: "2025-03-15",
    lastSeen: "2024-03-10",
    preferences: {
      communication: 'phone',
      appointmentTime: 'morning',
      reminders: false
    },
    riskFactors: ['hypertension', 'osteoporosis'],
    nextDue: "6-month-checkup"
  },
  {
    id: "p4",
    name: "Georgia O'Keeffe",
    dob: "1978-05-22",
    phone: "+44 7700 900234",
    insurer: "Vitality",
    insuranceExpiry: "2026-01-15",
    lastSeen: "2024-11-01",
    preferences: {
      communication: 'email',
      appointmentTime: 'morning',
      reminders: true
    },
    riskFactors: ['asthma'],
    nextDue: "asthma-review"
  },
  {
    id: "p5",
    name: "James Henderson",
    dob: "1955-08-30",
    phone: "+44 7700 900567",
    insurer: "Bupa",
    insuranceExpiry: "2025-06-30",
    lastSeen: "2024-10-15",
    preferences: {
      communication: 'phone',
      appointmentTime: 'afternoon',
      reminders: true
    },
    riskFactors: ['diabetes', 'hypertension', 'copd'],
    nextDue: "diabetes-review"
  },
  {
    id: "p6",
    name: "Emma Watson",
    dob: "1990-04-15",
    phone: "+44 7700 900890",
    insurer: "Self-pay",
    insuranceExpiry: null as unknown as string,
    lastSeen: "2024-12-01",
    preferences: {
      communication: 'sms',
      appointmentTime: 'evening',
      reminders: true
    },
    riskFactors: [],
    nextDue: "annual-screening"
  },
  {
    id: "p7",
    name: "Robert Chen",
    dob: "1982-11-08",
    phone: "+44 7700 900345",
    insurer: "AXA",
    insuranceExpiry: "2025-09-20",
    lastSeen: "2024-09-28",
    preferences: {
      communication: 'email',
      appointmentTime: 'morning',
      reminders: true
    },
    riskFactors: ['anxiety'],
    nextDue: "mental-health-review"
  },
  {
    id: "p8",
    name: "Margaret Thompson",
    dob: "1948-02-14",
    phone: "+44 7700 900678",
    insurer: "Bupa",
    insuranceExpiry: "2025-04-10",
    lastSeen: "2024-08-20",
    preferences: {
      communication: 'phone',
      appointmentTime: 'morning',
      reminders: true
    },
    riskFactors: ['mobility_issues', 'heart_failure'],
    nextDue: "home-visit-review"
  }
]

// Appointment templates for generating recurring weekly patterns
// Spread across the day with realistic gaps - 3-4 per day max for cleaner display
interface AppointmentTemplate {
  dayOffset: number // 0=Mon, 1=Tue, etc
  hourOffset: number // hours from 9am
  duration: number // minutes
  patientIds: string[] // pool to pick from
  practitionerId: string
  practitionerName: string
  appointmentType: string
  deliveryType: AppointmentDeliveryType
}

const APPOINTMENT_TEMPLATES: AppointmentTemplate[] = [
  // Monday - 3 appointments spread across the day
  { dayOffset: 0, hourOffset: 0, duration: 30, patientIds: ['p1', 'p2', 'p3'], practitionerId: 'prac1', practitionerName: 'Dr Sarah Patel', appointmentType: 'GP Consultation', deliveryType: 'f2f' },
  { dayOffset: 0, hourOffset: 3, duration: 30, patientIds: ['p4', 'p5'], practitionerId: 'prac2', practitionerName: 'Dr James Wilson', appointmentType: 'Cardiology Review', deliveryType: 'f2f' },
  { dayOffset: 0, hourOffset: 6, duration: 30, patientIds: ['p6', 'p7'], practitionerId: 'prac4', practitionerName: 'Dr Michael Chen', appointmentType: 'Video Consultation', deliveryType: 'video' },

  // Tuesday - 4 appointments
  { dayOffset: 1, hourOffset: 0, duration: 30, patientIds: ['p4', 'p6'], practitionerId: 'prac1', practitionerName: 'Dr Sarah Patel', appointmentType: 'Asthma Review', deliveryType: 'video' },
  { dayOffset: 1, hourOffset: 2, duration: 45, patientIds: ['p7', 'p8'], practitionerId: 'prac5', practitionerName: 'Dr Lisa Rodriguez', appointmentType: 'Mental Health Review', deliveryType: 'video' },
  { dayOffset: 1, hourOffset: 5, duration: 30, patientIds: ['p3', 'p5'], practitionerId: 'prac4', practitionerName: 'Dr Michael Chen', appointmentType: 'GP Consultation', deliveryType: 'f2f' },
  { dayOffset: 1, hourOffset: 7, duration: 30, patientIds: ['p1', 'p2'], practitionerId: 'prac3', practitionerName: 'Dr Emma Thompson', appointmentType: 'Skin Check', deliveryType: 'f2f' },

  // Wednesday - 3 appointments including a home visit
  { dayOffset: 2, hourOffset: 0, duration: 45, patientIds: ['p8'], practitionerId: 'prac4', practitionerName: 'Dr Michael Chen', appointmentType: 'Home Visit', deliveryType: 'home-visit' },
  { dayOffset: 2, hourOffset: 3, duration: 30, patientIds: ['p1', 'p4'], practitionerId: 'prac1', practitionerName: 'Dr Sarah Patel', appointmentType: 'Diabetes Review', deliveryType: 'f2f' },
  { dayOffset: 2, hourOffset: 6, duration: 45, patientIds: ['p5', 'p2'], practitionerId: 'prac2', practitionerName: 'Dr James Wilson', appointmentType: 'Phone Follow-up', deliveryType: 'phone' },

  // Thursday - 4 appointments
  { dayOffset: 3, hourOffset: 0, duration: 30, patientIds: ['p2', 'p1'], practitionerId: 'prac1', practitionerName: 'Dr Sarah Patel', appointmentType: 'GP Consultation', deliveryType: 'f2f' },
  { dayOffset: 3, hourOffset: 2, duration: 45, patientIds: ['p7', 'p6'], practitionerId: 'prac5', practitionerName: 'Dr Lisa Rodriguez', appointmentType: 'Therapy Session', deliveryType: 'video' },
  { dayOffset: 3, hourOffset: 5, duration: 45, patientIds: ['p3', 'p8'], practitionerId: 'prac1', practitionerName: 'Dr Sarah Patel', appointmentType: 'Home Visit', deliveryType: 'home-visit' },
  { dayOffset: 3, hourOffset: 8, duration: 30, patientIds: ['p4', 'p5'], practitionerId: 'prac4', practitionerName: 'Dr Michael Chen', appointmentType: 'Phone Consultation', deliveryType: 'phone' },

  // Friday - 3 appointments
  { dayOffset: 4, hourOffset: 0, duration: 30, patientIds: ['p1', 'p6'], practitionerId: 'prac1', practitionerName: 'Dr Sarah Patel', appointmentType: 'Video Consultation', deliveryType: 'video' },
  { dayOffset: 4, hourOffset: 3, duration: 30, patientIds: ['p5', 'p3'], practitionerId: 'prac2', practitionerName: 'Dr James Wilson', appointmentType: 'ECG Follow-up', deliveryType: 'f2f' },
  { dayOffset: 4, hourOffset: 6, duration: 30, patientIds: ['p2', 'p7'], practitionerId: 'prac3', practitionerName: 'Dr Emma Thompson', appointmentType: 'Results Call', deliveryType: 'phone' },

  // Saturday (lighter) - 2 appointments
  { dayOffset: 5, hourOffset: 0, duration: 30, patientIds: ['p4', 'p1'], practitionerId: 'prac4', practitionerName: 'Dr Michael Chen', appointmentType: 'GP Consultation', deliveryType: 'f2f' },
  { dayOffset: 5, hourOffset: 2, duration: 45, patientIds: ['p7', 'p6'], practitionerId: 'prac5', practitionerName: 'Dr Lisa Rodriguez', appointmentType: 'Video Therapy', deliveryType: 'video' },
]

// Seeded random number generator for consistent results
const seededRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// Helper function to generate demo appointments - called lazily to avoid hydration issues
// Generates appointments from current week through end of March 2026
const generateDemoAppointments = (): Appointment[] => {
  const appointments: Appointment[] = []
  
  // Get current week's Monday at 9am
  const now = new Date()
  const currentMonday = (() => { 
    const d = new Date(now)
    const day = d.getDay() || 7
    if (day !== 1) d.setDate(d.getDate() - (day - 1))
    d.setHours(9, 0, 0, 0)
    return d 
  })()
  
  // End date: March 31, 2026
  const endDate = new Date(2026, 2, 31) // Month is 0-indexed, so 2 = March
  
  const dayMs = 24 * 60 * 60 * 1000
  const hourMs = 60 * 60 * 1000
  const minMs = 60 * 1000
  const weekMs = 7 * dayMs
  
  let weekOffset = 0
  let appointmentId = 1
  
  // Generate appointments for each week until end date
  while (true) {
    const weekStart = new Date(currentMonday.getTime() + weekOffset * weekMs)
    
    // Stop if we've passed the end date
    if (weekStart > endDate) break
    
    // Generate appointments from templates for this week
    for (const template of APPOINTMENT_TEMPLATES) {
      // Use seeded random to pick patient (consistent across sessions)
      const seed = weekOffset * 100 + template.dayOffset * 10 + template.hourOffset
      const patientIndex = Math.floor(seededRandom(seed) * template.patientIds.length)
      const patientId = template.patientIds[patientIndex]
      
      // Calculate start time
      const appointmentStart = new Date(
        weekStart.getTime() + 
        template.dayOffset * dayMs + 
        template.hourOffset * hourMs
      )
      
      // Skip if appointment is in the past (more than a week ago)
      const oneWeekAgo = new Date(now.getTime() - weekMs)
      if (appointmentStart < oneWeekAgo) {
        appointmentId++
        continue
      }
      
      const appointmentEnd = new Date(appointmentStart.getTime() + template.duration * minMs)
      
      // Determine status based on time
      let status: 'scheduled' | 'confirmed' | 'completed' = 'scheduled'
      if (appointmentStart < now) {
        status = 'completed'
      } else if (seededRandom(seed + 1000) > 0.5) {
        status = 'confirmed'
      }
      
      appointments.push({
        id: `apt-${appointmentId}`,
        patientId,
        start: appointmentStart.toISOString(),
        end: appointmentEnd.toISOString(),
        clinician: template.practitionerName.replace('Dr ', 'Dr '),
        room: template.deliveryType === 'home-visit' || template.deliveryType === 'phone' ? '-' : '1',
        practitionerId: template.practitionerId,
        practitionerName: template.practitionerName,
        appointmentType: template.appointmentType,
        deliveryType: template.deliveryType,
        status
      })
      
      appointmentId++
    }
    
    weekOffset++
  }
  
  return appointments
}

// Lazy-load the appointments to avoid server/client date mismatch
let _cachedAppointments: Appointment[] | null = null
const getDemoAppointments = (): Appointment[] => {
  if (_cachedAppointments === null) {
    _cachedAppointments = generateDemoAppointments()
  }
  return _cachedAppointments
}

// Helper to generate realistic demo invoices
const generateDemoInvoices = (): Invoice[] => {
  const now = new Date()
  const dayMs = 24 * 60 * 60 * 1000
  
  return [
    // Overdue invoice - insurance claim rejected
    {
      id: "INV-2024-001",
      patientId: "p1",
      status: "Overdue",
      amount: 385.00,
      amountPaid: 0,
      balance: 385.00,
      dueDate: new Date(now.getTime() - 14*dayMs).toISOString().slice(0,10),
      createdDate: new Date(now.getTime() - 28*dayMs).toISOString().slice(0,10),
      payer: "Bupa",
      lineItems: [
        { id: "li-1", description: "Extended GP Consultation", quantity: 1, rate: 120.00, amount: 120.00, serviceCode: "CONS-EXT" },
        { id: "li-2", description: "Blood Test Panel", quantity: 1, rate: 85.00, amount: 85.00, serviceCode: "LAB-BLOOD" },
        { id: "li-3", description: "ECG", quantity: 1, rate: 95.00, amount: 95.00, serviceCode: "DIAG-ECG" },
        { id: "li-4", description: "Medical Report", quantity: 1, rate: 85.00, amount: 85.00, serviceCode: "ADMIN-RPT" }
      ],
      payments: [],
      notes: "Bupa claim rejected - pre-authorization expired. Patient notified."
    },
    
    // Partially paid invoice
    {
      id: "INV-2024-002",
      patientId: "p5",
      status: "Partially Paid",
      amount: 450.00,
      amountPaid: 200.00,
      balance: 250.00,
      dueDate: new Date(now.getTime() + 7*dayMs).toISOString().slice(0,10),
      createdDate: new Date(now.getTime() - 21*dayMs).toISOString().slice(0,10),
      payer: "Self-pay",
      lineItems: [
        { id: "li-5", description: "Health Check (Comprehensive)", quantity: 1, rate: 350.00, amount: 350.00, serviceCode: "SCREEN-COMP" },
        { id: "li-6", description: "Flu Vaccination", quantity: 1, rate: 25.00, amount: 25.00, serviceCode: "VAC-FLU" },
        { id: "li-7", description: "Vitamin D Test", quantity: 1, rate: 75.00, amount: 75.00, serviceCode: "LAB-VITD" }
      ],
      payments: [
        { id: "pay-1", date: new Date(now.getTime() - 14*dayMs).toISOString().slice(0,10), amount: 200.00, method: "Card Payment", reference: "TXN-8847291" }
      ],
      notes: "Payment plan agreed - £200 deposit, £250 due on next visit"
    },
    
    // Draft invoice - future appointment
    {
      id: "INV-2024-003",
      patientId: "p2",
      status: "Draft",
      amount: 145.00,
      amountPaid: 0,
      balance: 145.00,
      dueDate: new Date(now.getTime() + 14*dayMs).toISOString().slice(0,10),
      createdDate: new Date(now.getTime()).toISOString().slice(0,10),
      payer: "Self-pay",
      lineItems: [
        { id: "li-8", description: "Standard GP Consultation", quantity: 1, rate: 75.00, amount: 75.00, appointmentId: "apt-future-1", appointmentDate: new Date(now.getTime() + 7*dayMs).toISOString().slice(0,10), serviceCode: "CONS-STD" },
        { id: "li-9", description: "Prescription Fee", quantity: 2, rate: 15.00, amount: 30.00, serviceCode: "ADMIN-RX" },
        { id: "li-10", description: "Travel Vaccination Consult", quantity: 1, rate: 40.00, amount: 40.00, serviceCode: "VAC-TRAVEL" }
      ],
      payments: [],
      notes: "Pre-invoiced for upcoming travel clinic appointment"
    },
    
    // Sent invoice awaiting payment
    {
      id: "INV-2024-004",
      patientId: "p3",
      status: "Sent",
      amount: 215.00,
      amountPaid: 0,
      balance: 215.00,
      dueDate: new Date(now.getTime() + 10*dayMs).toISOString().slice(0,10),
      createdDate: new Date(now.getTime() - 4*dayMs).toISOString().slice(0,10),
      payer: "AXA",
      lineItems: [
        { id: "li-11", description: "Video Consultation", quantity: 1, rate: 65.00, amount: 65.00, appointmentId: "apt-12", serviceCode: "CONS-VID" },
        { id: "li-12", description: "Asthma Review", quantity: 1, rate: 50.00, amount: 50.00, serviceCode: "CHRONIC-ASTH" },
        { id: "li-13", description: "Spirometry", quantity: 1, rate: 75.00, amount: 75.00, serviceCode: "DIAG-SPIRO" },
        { id: "li-14", description: "Fit Note", quantity: 1, rate: 25.00, amount: 25.00, serviceCode: "ADMIN-FIT" }
      ],
      payments: [],
      notes: "Submitted to AXA - claim ref: AXA-2024-887421"
    },
    
    // Paid invoice
    {
      id: "INV-2024-005",
      patientId: "p4",
      status: "Paid",
      amount: 175.00,
      amountPaid: 175.00,
      balance: 0,
      dueDate: new Date(now.getTime() - 7*dayMs).toISOString().slice(0,10),
      createdDate: new Date(now.getTime() - 21*dayMs).toISOString().slice(0,10),
      payer: "Vitality",
      lineItems: [
        { id: "li-15", description: "Standard GP Consultation", quantity: 1, rate: 75.00, amount: 75.00, appointmentId: "apt-8", serviceCode: "CONS-STD" },
        { id: "li-16", description: "Cervical Smear", quantity: 1, rate: 65.00, amount: 65.00, serviceCode: "SCREEN-SMEAR" },
        { id: "li-17", description: "Lab Processing Fee", quantity: 1, rate: 35.00, amount: 35.00, serviceCode: "LAB-PROC" }
      ],
      payments: [
        { id: "pay-2", date: new Date(now.getTime() - 10*dayMs).toISOString().slice(0,10), amount: 175.00, method: "Insurance", reference: "VIT-CLM-992847" }
      ],
      notes: "Vitality claim settled in full"
    },
    
    // Another partially paid - payment plan
    {
      id: "INV-2024-006",
      patientId: "p6",
      status: "Partially Paid",
      amount: 580.00,
      amountPaid: 290.00,
      balance: 290.00,
      dueDate: new Date(now.getTime() + 21*dayMs).toISOString().slice(0,10),
      createdDate: new Date(now.getTime() - 35*dayMs).toISOString().slice(0,10),
      payer: "Self-pay",
      lineItems: [
        { id: "li-18", description: "Minor Surgery - Mole Removal", quantity: 1, rate: 180.00, amount: 180.00, serviceCode: "PROC-MINOR" },
        { id: "li-19", description: "Local Anaesthetic", quantity: 1, rate: 45.00, amount: 45.00, serviceCode: "PROC-ANAES" },
        { id: "li-20", description: "Histology", quantity: 1, rate: 120.00, amount: 120.00, serviceCode: "LAB-HIST" },
        { id: "li-21", description: "Follow-up Consultation", quantity: 2, rate: 75.00, amount: 150.00, serviceCode: "CONS-FUP" },
        { id: "li-22", description: "Dressing Pack", quantity: 1, rate: 25.00, amount: 25.00, serviceCode: "SUPPLIES" },
        { id: "li-23", description: "Suture Removal", quantity: 1, rate: 60.00, amount: 60.00, serviceCode: "PROC-SUTURE" }
      ],
      payments: [
        { id: "pay-3", date: new Date(now.getTime() - 35*dayMs).toISOString().slice(0,10), amount: 180.00, method: "Card Payment", reference: "TXN-7738291" },
        { id: "pay-4", date: new Date(now.getTime() - 14*dayMs).toISOString().slice(0,10), amount: 110.00, method: "Bank Transfer", reference: "BACS-EW2847" }
      ],
      notes: "3-month payment plan: £180 deposit + 2x £200. Final payment due 15th Jan"
    },
    
    // Voided invoice
    {
      id: "INV-2024-007",
      patientId: "p7",
      status: "Voided",
      amount: 120.00,
      amountPaid: 0,
      balance: 0,
      dueDate: new Date(now.getTime() - 5*dayMs).toISOString().slice(0,10),
      createdDate: new Date(now.getTime() - 12*dayMs).toISOString().slice(0,10),
      payer: "AXA",
      lineItems: [
        { id: "li-24", description: "Standard GP Consultation", quantity: 1, rate: 75.00, amount: 75.00, serviceCode: "CONS-STD" },
        { id: "li-25", description: "Blood Test", quantity: 1, rate: 35.00, amount: 35.00, serviceCode: "LAB-BLOOD" },
        { id: "li-26", description: "Prescription Fee", quantity: 1, rate: 10.00, amount: 10.00, serviceCode: "ADMIN-RX" }
      ],
      payments: [],
      voidedDate: new Date(now.getTime() - 3*dayMs).toISOString().slice(0,10),
      voidedReason: "Duplicate invoice - services already billed on INV-2024-004",
      notes: "Voided - duplicate billing error"
    },
    
    // Refunded invoice
    {
      id: "INV-2024-008",
      patientId: "p8",
      status: "Refunded",
      amount: 95.00,
      amountPaid: 95.00,
      balance: 0,
      dueDate: new Date(now.getTime() - 20*dayMs).toISOString().slice(0,10),
      createdDate: new Date(now.getTime() - 30*dayMs).toISOString().slice(0,10),
      payer: "Self-pay",
      lineItems: [
        { id: "li-27", description: "Telephone Consultation", quantity: 1, rate: 45.00, amount: 45.00, serviceCode: "CONS-TEL" },
        { id: "li-28", description: "Prescription Fee", quantity: 1, rate: 15.00, amount: 15.00, serviceCode: "ADMIN-RX" },
        { id: "li-29", description: "Admin Fee", quantity: 1, rate: 35.00, amount: 35.00, serviceCode: "ADMIN-FEE" }
      ],
      payments: [
        { id: "pay-5", date: new Date(now.getTime() - 25*dayMs).toISOString().slice(0,10), amount: 95.00, method: "Card Payment", reference: "TXN-5529183" },
        { id: "pay-6", date: new Date(now.getTime() - 8*dayMs).toISOString().slice(0,10), amount: -95.00, method: "Refund", reference: "REF-5529183" }
      ],
      refundedDate: new Date(now.getTime() - 8*dayMs).toISOString().slice(0,10),
      refundAmount: 95.00,
      refundReason: "Appointment cancelled with >24h notice - full refund per policy",
      notes: "Full refund processed"
    },
    
    // Large overdue invoice
    {
      id: "INV-2024-009",
      patientId: "p5",
      status: "Overdue",
      amount: 1250.00,
      amountPaid: 0,
      balance: 1250.00,
      dueDate: new Date(now.getTime() - 45*dayMs).toISOString().slice(0,10),
      createdDate: new Date(now.getTime() - 60*dayMs).toISOString().slice(0,10),
      payer: "Bupa",
      lineItems: [
        { id: "li-30", description: "Health Check (Executive)", quantity: 1, rate: 750.00, amount: 750.00, serviceCode: "SCREEN-EXEC" },
        { id: "li-31", description: "MRI Referral", quantity: 1, rate: 350.00, amount: 350.00, serviceCode: "REF-MRI" },
        { id: "li-32", description: "Specialist Report", quantity: 1, rate: 150.00, amount: 150.00, serviceCode: "ADMIN-SPEC" }
      ],
      payments: [],
      notes: "Bupa dispute - pre-auth required. Patient contacted for self-pay option."
    },
    
    // Recently paid invoice
    {
      id: "INV-2024-010",
      patientId: "p1",
      status: "Paid",
      amount: 90.00,
      amountPaid: 90.00,
      balance: 0,
      dueDate: new Date(now.getTime() + 5*dayMs).toISOString().slice(0,10),
      createdDate: new Date(now.getTime() - 3*dayMs).toISOString().slice(0,10),
      payer: "Self-pay",
      lineItems: [
        { id: "li-33", description: "Standard GP Consultation", quantity: 1, rate: 75.00, amount: 75.00, appointmentId: "apt-19", serviceCode: "CONS-STD" },
        { id: "li-34", description: "Prescription Fee", quantity: 1, rate: 15.00, amount: 15.00, serviceCode: "ADMIN-RX" }
      ],
      payments: [
        { id: "pay-7", date: new Date(now.getTime() - 1*dayMs).toISOString().slice(0,10), amount: 90.00, method: "Card Payment", reference: "TXN-9982716" }
      ],
      notes: "Paid at reception after appointment"
    }
  ]
}

const DEMO_CLINICIANS: Clinician[] = [
  { id: 'c1', name: 'Dr Patel', role: 'GP', email: 'patel@example.com' },
  { id: 'c2', name: 'Nurse Lee', role: 'Nurse', email: 'lee@example.com' },
  { id: 'c3', name: 'Dr Jones', role: 'Specialist', email: 'jones@example.com' }
]

const DEMO_SERVICES: Service[] = [
  { code: 'CONS', name: 'Consultation', price: 120 },
  { code: 'FUP', name: 'Follow-up', price: 80 },
  { code: 'LAB-HBA1C', name: 'HbA1c Test', price: 35 }
]

// Medications database with clinical information
export const MEDICATIONS_DATABASE: MedicationInfo[] = [
  {
    id: 'med-1',
    name: 'Amoxicillin',
    genericName: 'Amoxicillin',
    pharmaceuticalClass: 'Penicillins',
    contraindications: ['Hypersensitivity to penicillins, cephalosporins or other β-lactams', 'Infectious mononucleosis'],
    warnings: ['Renal impairment (CrCl <30ml/min), hepatic impairment', 'Risk of crystalluria with high doses; ensure hydration', 'Risk of seizures. Long-term therapy; monitor renal, hepatic and haematological function'],
    interactions: ['Anticoagulants, allopurinol, tetracyclines, methotrexate'],
    sideEffects: ['Hypersensitivity reactions, GI upset, rash', 'Reports of pseudomembranous colitis, drug-induced enterocolitis syndrome and acute generalised exanthematous pustulosis'],
    indications: ['Acute bacterial sinusitis, acute otitis media, acute streptococcal tonsillitis and pharyngitis', 'Acute exacerbations of chronic bronchitis, community-acquired pneumonia', 'Acute cystitis, asymptomatic bacteriuria in pregnancy', 'Acute pyelonephritis, typhoid and paratyphoid, dental abscess'],
    dosageGuidelines: {
      adults: 'Sinusitis, UTI, dental abscess, 250–500mg every 8 hrs or 750mg–1g every 12 hrs; severe infections, 750mg–1g every 8 hrs. Acute cystitis, 3g twice daily for 1 day. ENT infections, bronchitis, 500mg every 8 hrs or 750mg–1g every 12 hrs; severe infections, 750mg–1g every 8 hrs for 10 days. Pneumonia, prosthetic joint infections, 500mg–1g every 8 hrs. Typhoid/paratyphoid, 500mg–2g every 8 hrs. Lyme disease, early-stage, 500mg–1g every 8 hrs (max 4g daily) in divided doses for 14 days.',
      children: 'Under 40kg: sinusitis, otitis, pneumonia, UTI, dental abscess, 20–90mg/kg daily in divided doses. Tonsillitis, pharyngitis, 40–90mg/kg daily in divided doses. Typhoid/paratyphoid, 100mg/kg daily in three divided doses. Lyme disease, early stage, 25–50mg/kg daily in three divided doses for 10–21 days. Over 40kg: as adult.'
    },
    quantities: ['250mg cap, 15', '250mg cap, 21', '500mg cap, 15', '500mg cap, 21']
  },
  {
    id: 'med-2',
    name: 'Omeprazole',
    genericName: 'Omeprazole',
    pharmaceuticalClass: 'Proton Pump Inhibitors',
    contraindications: ['Hypersensitivity to omeprazole or other PPIs'],
    warnings: ['May mask symptoms of gastric cancer', 'Risk of Clostridium difficile infection', 'Hypomagnesaemia with prolonged use', 'Risk of bone fractures with long-term use'],
    interactions: ['Clopidogrel (reduced efficacy)', 'Methotrexate (increased levels)', 'Atazanavir, nelfinavir (reduced absorption)'],
    sideEffects: ['Headache, diarrhoea, nausea, vomiting', 'Abdominal pain, constipation, flatulence'],
    indications: ['GORD, dyspepsia', 'Peptic ulcer disease', 'H. pylori eradication', 'Zollinger-Ellison syndrome', 'NSAID-associated ulcers'],
    dosageGuidelines: {
      adults: 'GORD: 20mg once daily for 4 weeks. Duodenal ulcer: 20mg once daily for 4 weeks. Gastric ulcer: 20mg once daily for 8 weeks. H. pylori eradication: 20mg twice daily with antibiotics.',
      children: '1–2mg/kg once daily (max 40mg). Severe GORD in children over 10kg.'
    },
    quantities: ['10mg cap, 28', '20mg cap, 28', '40mg cap, 28']
  },
  {
    id: 'med-3',
    name: 'Metformin',
    genericName: 'Metformin Hydrochloride',
    pharmaceuticalClass: 'Biguanides',
    contraindications: ['Diabetic ketoacidosis', 'Severe renal impairment (eGFR <30)', 'Acute conditions with potential to alter renal function', 'Tissue hypoxia conditions'],
    warnings: ['Risk of lactic acidosis', 'Suspend before iodinated contrast procedures', 'Monitor renal function regularly', 'Vitamin B12 deficiency with long-term use'],
    interactions: ['Alcohol (increased risk of lactic acidosis)', 'ACE inhibitors (increased hypoglycaemic effect)', 'Corticosteroids (reduced effect)', 'Iodinated contrast media'],
    sideEffects: ['GI disturbances (nausea, vomiting, diarrhoea, abdominal pain)', 'Taste disturbance', 'Lactic acidosis (rare but serious)', 'Vitamin B12 deficiency'],
    indications: ['Type 2 diabetes mellitus', 'Polycystic ovary syndrome (off-label)'],
    dosageGuidelines: {
      adults: 'Initially 500mg once daily with meals, increased gradually to 500mg 2–3 times daily or 850mg twice daily. Maximum 2g daily in 2–3 divided doses. Modified-release: initially 500mg once daily, max 2g once daily.',
      children: 'Over 10 years: Initially 500mg once daily, increased to max 2g daily in 2–3 divided doses.'
    },
    quantities: ['500mg tab, 28', '500mg tab, 84', '850mg tab, 56', '1000mg tab, 56']
  },
  {
    id: 'med-4',
    name: 'Amlodipine',
    genericName: 'Amlodipine Besilate',
    pharmaceuticalClass: 'Calcium Channel Blockers',
    contraindications: ['Cardiogenic shock', 'Unstable angina', 'Significant aortic stenosis'],
    warnings: ['Hepatic impairment', 'Heart failure', 'Severe hypotension'],
    interactions: ['Simvastatin (increased myopathy risk, limit simvastatin to 20mg)', 'CYP3A4 inhibitors (increased amlodipine levels)', 'Grapefruit juice'],
    sideEffects: ['Oedema, flushing, headache', 'Dizziness, fatigue, palpitations', 'Abdominal pain, nausea'],
    indications: ['Hypertension', 'Prophylaxis of angina'],
    dosageGuidelines: {
      adults: 'Hypertension: Initially 5mg once daily, max 10mg daily. Angina: 5–10mg once daily.',
      children: '6–17 years: 2.5–5mg once daily.'
    },
    quantities: ['5mg tab, 28', '10mg tab, 28']
  },
  {
    id: 'med-5',
    name: 'Salbutamol',
    genericName: 'Salbutamol (Albuterol)',
    pharmaceuticalClass: 'Beta-2 Agonists (Short-acting)',
    contraindications: ['Hypersensitivity to salbutamol'],
    warnings: ['Cardiovascular disease, arrhythmias', 'Hyperthyroidism', 'Susceptibility to QT prolongation', 'Diabetes mellitus (risk of hyperglycaemia and ketoacidosis)'],
    interactions: ['Beta-blockers (antagonism)', 'Corticosteroids, theophylline, diuretics (hypokalaemia)', 'Digoxin (reduced levels)'],
    sideEffects: ['Tremor, headache, palpitations', 'Tachycardia, muscle cramps', 'Hypokalaemia with high doses'],
    indications: ['Acute asthma', 'Reversible airways obstruction', 'Prophylaxis of exercise-induced bronchospasm'],
    dosageGuidelines: {
      adults: 'Inhaler: 100–200 micrograms (1–2 puffs) as required, max 800 micrograms daily. Nebuliser: 2.5–5mg up to 4 times daily.',
      children: 'Inhaler: 100–200 micrograms as required. Nebuliser: Under 5 years 2.5mg, 5–12 years 2.5–5mg.'
    },
    quantities: ['100mcg inhaler, 1', '100mcg inhaler, 2', 'Accuhaler 200mcg, 1', 'Nebules 2.5mg/2.5ml, 20', 'Nebules 5mg/2.5ml, 20']
  },
  {
    id: 'med-6',
    name: 'Atorvastatin',
    genericName: 'Atorvastatin Calcium',
    pharmaceuticalClass: 'HMG-CoA Reductase Inhibitors (Statins)',
    contraindications: ['Active liver disease', 'Unexplained persistent elevations in serum transaminases', 'Pregnancy and breastfeeding'],
    warnings: ['Monitor liver function', 'Risk of myopathy/rhabdomyolysis', 'Interstitial lung disease reported rarely'],
    interactions: ['CYP3A4 inhibitors (increased statin levels)', 'Fibrates, niacin (increased myopathy risk)', 'Warfarin (monitor INR)', 'Grapefruit juice'],
    sideEffects: ['Headache, GI disturbances, myalgia', 'Raised liver enzymes', 'Sleep disturbances, dizziness'],
    indications: ['Primary hypercholesterolaemia', 'Primary prevention of cardiovascular events', 'Secondary prevention post-MI/stroke'],
    dosageGuidelines: {
      adults: 'Primary hypercholesterolaemia: Initially 10mg once daily, usual range 10–80mg daily. Primary prevention: 20mg daily. Secondary prevention: 80mg daily.',
      children: 'Heterozygous familial hypercholesterolaemia in children 10–17 years: Initially 10mg daily, max 20mg daily.'
    },
    quantities: ['10mg tab, 28', '20mg tab, 28', '40mg tab, 28', '80mg tab, 28']
  },
  {
    id: 'med-7',
    name: 'Sertraline',
    genericName: 'Sertraline Hydrochloride',
    pharmaceuticalClass: 'Selective Serotonin Reuptake Inhibitors (SSRIs)',
    contraindications: ['Concomitant MAOIs', 'Unstable epilepsy'],
    warnings: ['Risk of suicidal thoughts in under-25s initially', 'Discontinuation symptoms', 'Risk of bleeding, especially with NSAIDs', 'Hyponatraemia in elderly'],
    interactions: ['MAOIs (serotonin syndrome)', 'Triptans (serotonin syndrome)', 'Warfarin (increased bleeding)', 'Lithium (increased levels)'],
    sideEffects: ['Nausea, diarrhoea, dry mouth', 'Headache, dizziness, insomnia', 'Sexual dysfunction, sweating'],
    indications: ['Depression', 'Obsessive-compulsive disorder', 'Panic disorder', 'Social anxiety disorder', 'PTSD'],
    dosageGuidelines: {
      adults: 'Depression, OCD: Initially 50mg daily, increased if necessary in steps of 50mg over several weeks, max 200mg daily. Panic disorder, social anxiety, PTSD: Initially 25mg daily, increased after 1 week to 50mg daily, max 200mg daily.',
      children: 'OCD in children 6–12 years: Initially 25mg daily, max 200mg daily. 13–17 years: Initially 50mg daily, max 200mg daily.'
    },
    quantities: ['50mg tab, 28', '100mg tab, 28']
  },
  {
    id: 'med-8',
    name: 'Ibuprofen',
    genericName: 'Ibuprofen',
    pharmaceuticalClass: 'Non-Steroidal Anti-Inflammatory Drugs (NSAIDs)',
    contraindications: ['Active GI ulceration/bleeding', 'Severe heart failure', 'Severe renal impairment', 'History of GI bleeding with NSAIDs'],
    warnings: ['Cardiovascular risk with prolonged use', 'GI toxicity', 'Renal impairment', 'Asthma may be exacerbated'],
    interactions: ['Anticoagulants (increased bleeding)', 'Antihypertensives (reduced effect)', 'Lithium, methotrexate (increased toxicity)', 'SSRIs (increased GI bleeding)'],
    sideEffects: ['GI disturbances, nausea, dyspepsia', 'Headache, dizziness', 'Fluid retention, oedema'],
    indications: ['Mild to moderate pain', 'Inflammation', 'Pyrexia', 'Dysmenorrhoea', 'Musculoskeletal disorders'],
    dosageGuidelines: {
      adults: 'Pain and inflammation: 300–400mg 3–4 times daily, increased if necessary to max 2.4g daily. Dysmenorrhoea: 300–400mg up to 3 times daily.',
      children: '3 months–12 years: 5–10mg/kg 3–4 times daily, max 30mg/kg daily.'
    },
    quantities: ['200mg tab, 24', '200mg tab, 48', '400mg tab, 24', '400mg tab, 84']
  },
  {
    id: 'med-9',
    name: 'Fluticasone/Salmeterol',
    genericName: 'Fluticasone Propionate / Salmeterol Xinafoate',
    pharmaceuticalClass: 'Corticosteroid + Long-acting Beta-2 Agonist',
    contraindications: ['Active or quiescent pulmonary tuberculosis', 'Untreated fungal, bacterial or viral infections'],
    warnings: ['Not for acute bronchospasm', 'Paradoxical bronchospasm', 'Systemic corticosteroid effects with high doses', 'Transfer from oral corticosteroids'],
    interactions: ['CYP3A4 inhibitors (ritonavir, ketoconazole - increased corticosteroid exposure)', 'Beta-blockers (antagonism)'],
    sideEffects: ['Oral candidiasis, hoarseness', 'Headache, tremor, palpitations', 'Paradoxical bronchospasm'],
    indications: ['Asthma not adequately controlled with ICS alone', 'COPD'],
    dosageGuidelines: {
      adults: 'Asthma: 1 puff twice daily. COPD: Seretide 500 Accuhaler, 1 inhalation twice daily.',
      children: '4–11 years: Seretide 50 Evohaler, 2 puffs twice daily. 12+ years: as adult.'
    },
    quantities: ['Evohaler 50/25mcg, 1', 'Evohaler 125/25mcg, 1', 'Evohaler 250/25mcg, 1', 'Accuhaler 100/50mcg, 1', 'Accuhaler 250/50mcg, 1', 'Accuhaler 500/50mcg, 1']
  },
  {
    id: 'med-10',
    name: 'Lisinopril',
    genericName: 'Lisinopril',
    pharmaceuticalClass: 'ACE Inhibitors',
    contraindications: ['History of angioedema', 'Hereditary/idiopathic angioedema', 'Concomitant use with aliskiren in diabetics/renal impairment', 'Pregnancy'],
    warnings: ['First-dose hypotension', 'Renal artery stenosis', 'Monitor renal function and potassium', 'Risk of hyperkalaemia'],
    interactions: ['NSAIDs (reduced effect, increased renal risk)', 'Potassium supplements, potassium-sparing diuretics (hyperkalaemia)', 'Lithium (increased levels)'],
    sideEffects: ['Dry persistent cough', 'Hypotension, dizziness', 'Headache, fatigue', 'Hyperkalaemia'],
    indications: ['Hypertension', 'Heart failure', 'Post-MI with LV dysfunction', 'Diabetic nephropathy'],
    dosageGuidelines: {
      adults: 'Hypertension: Initially 10mg daily, usual maintenance 20mg daily, max 80mg daily. Heart failure: Initially 2.5mg daily, usual maintenance 5–35mg daily.',
      children: '6–16 years: Initially 70 micrograms/kg once daily (max 5mg), adjusted according to response, max 600 micrograms/kg daily (max 40mg).'
    },
    quantities: ['2.5mg tab, 28', '5mg tab, 28', '10mg tab, 28', '20mg tab, 28']
  }
]

// Generate demo prescriptions
const generateDemoPrescriptions = (): Prescription[] => {
  const now = new Date()
  const dayMs = 24 * 60 * 60 * 1000
  
  return [
    {
      id: 'rx-1',
      patientId: 'p1',
      medicationId: 'med-3',
      medicationName: 'Metformin',
      dosage: '500mg twice daily with meals',
      quantity: '500mg tab, 84',
      isRepeatPrescription: true,
      isDispensed: true,
      batchNumber: 'MET-2024-1847',
      expiryDate: '2026-03-15',
      comments: 'Take with food to reduce GI side effects. Monitor blood glucose regularly.',
      showInSummary: true,
      prescribedBy: 'Dr Sarah Patel',
      prescribedDate: new Date(now.getTime() - 30*dayMs).toISOString().slice(0,10),
      status: 'active'
    },
    {
      id: 'rx-2',
      patientId: 'p1',
      medicationId: 'med-6',
      medicationName: 'Atorvastatin',
      dosage: '20mg once daily at night',
      quantity: '20mg tab, 28',
      isRepeatPrescription: true,
      isDispensed: true,
      batchNumber: 'ATV-2024-2291',
      expiryDate: '2025-11-20',
      comments: '',
      showInSummary: true,
      prescribedBy: 'Dr Sarah Patel',
      prescribedDate: new Date(now.getTime() - 60*dayMs).toISOString().slice(0,10),
      status: 'active'
    },
    {
      id: 'rx-3',
      patientId: 'p3',
      medicationId: 'med-4',
      medicationName: 'Amlodipine',
      dosage: '5mg once daily in the morning',
      quantity: '5mg tab, 28',
      isRepeatPrescription: true,
      isDispensed: false,
      comments: 'For blood pressure control. May cause ankle swelling.',
      showInSummary: true,
      prescribedBy: 'Dr James Wilson',
      prescribedDate: new Date(now.getTime() - 14*dayMs).toISOString().slice(0,10),
      status: 'active'
    },
    {
      id: 'rx-4',
      patientId: 'p5',
      medicationId: 'med-5',
      medicationName: 'Salbutamol',
      dosage: '100-200mcg as required, max 8 puffs daily',
      quantity: '100mcg inhaler, 2',
      isRepeatPrescription: true,
      isDispensed: true,
      batchNumber: 'SAL-2024-0892',
      expiryDate: '2025-08-30',
      comments: 'Use for symptom relief. Seek medical advice if using more frequently.',
      showInSummary: true,
      prescribedBy: 'Dr Sarah Patel',
      prescribedDate: new Date(now.getTime() - 45*dayMs).toISOString().slice(0,10),
      status: 'active'
    },
    {
      id: 'rx-5',
      patientId: 'p7',
      medicationId: 'med-7',
      medicationName: 'Sertraline',
      dosage: '50mg once daily in the morning',
      quantity: '50mg tab, 28',
      isRepeatPrescription: true,
      isDispensed: true,
      batchNumber: 'SRT-2024-3341',
      expiryDate: '2026-01-15',
      comments: 'May take 2-4 weeks to feel full benefit. Do not stop suddenly.',
      showInSummary: true,
      prescribedBy: 'Dr Lisa Rodriguez',
      prescribedDate: new Date(now.getTime() - 21*dayMs).toISOString().slice(0,10),
      status: 'active'
    },
    {
      id: 'rx-6',
      patientId: 'p2',
      medicationId: 'med-1',
      medicationName: 'Amoxicillin',
      dosage: '500mg three times daily for 7 days',
      quantity: '500mg cap, 21',
      isRepeatPrescription: false,
      isDispensed: true,
      batchNumber: 'AMX-2024-7782',
      expiryDate: '2025-06-20',
      comments: 'Complete the full course even if feeling better.',
      showInSummary: false,
      prescribedBy: 'Dr Michael Chen',
      prescribedDate: new Date(now.getTime() - 5*dayMs).toISOString().slice(0,10),
      status: 'completed'
    },
    {
      id: 'rx-7',
      patientId: 'p6',
      medicationId: 'med-9',
      medicationName: 'Fluticasone/Salmeterol',
      dosage: '1 puff twice daily (morning and evening)',
      quantity: 'Accuhaler 250/50mcg, 1',
      isRepeatPrescription: true,
      isDispensed: false,
      comments: 'Preventer inhaler. Rinse mouth after use to prevent thrush.',
      showInSummary: true,
      prescribedBy: 'Dr Sarah Patel',
      prescribedDate: new Date(now.getTime() - 10*dayMs).toISOString().slice(0,10),
      status: 'active'
    }
  ]
}

// Helper to generate notes with current timestamps
const generateDemoNotes = (): Note[] => [
  { id: 'n1', patientId: 'p1', author: 'Dr Patel', createdAt: new Date().toISOString(), type: 'consultation', text: 'Routine consultation. Discussed lifestyle and medication adherence.' },
  { id: 'n2', patientId: 'p3', author: 'Dr Patel', createdAt: new Date(Date.now() - 86400000).toISOString(), type: 'referral', text: 'Referred to Dr Jones for specialist review.' }
]

export const createDataSlice: StateCreator<DataSlice> = (set, get) => ({
  patients: [...DEMO_PATIENTS],
  appointments: [], // Start empty, load on client side to avoid hydration mismatch
  invoices: [], // Start empty, load on client side
  clinicians: [...DEMO_CLINICIANS],
  services: [...DEMO_SERVICES],
  notes: [], // Start empty, load on client side
  prescriptions: [], // Start empty, load on client side
  practitioners: [
    { id: 'prac1', name: 'Dr Sarah Patel', specialty: 'General Practice', color: '#3B82F6', title: 'GP' },
    { id: 'prac2', name: 'Dr James Wilson', specialty: 'Cardiology', color: '#EF4444', title: 'Cardiologist' },
    { id: 'prac3', name: 'Dr Emma Thompson', specialty: 'Dermatology', color: '#8B5CF6', title: 'Dermatologist' },
    { id: 'prac4', name: 'Dr Michael Chen', specialty: 'General Practice', color: '#10B981', title: 'GP' },
    { id: 'prac5', name: 'Dr Lisa Rodriguez', specialty: 'Mental Health', color: '#F59E0B', title: 'Psychiatrist' }
  ],
  sites: [
    { id: 'site1', name: 'Main Clinic', address: '123 Health Street, London' },
    { id: 'site2', name: 'City Branch', address: '456 Medical Avenue, London' },
    { id: 'site3', name: 'Wellness Center', address: '789 Care Road, London' }
  ],
  rooms: [
    { id: 'room1', name: 'Consultation Room 1', siteId: 'site1' },
    { id: 'room2', name: 'Consultation Room 2', siteId: 'site1' },
    { id: 'room3', name: 'Treatment Room', siteId: 'site1' },
    { id: 'room4', name: 'Procedure Room', siteId: 'site1' },
    { id: 'room5', name: 'Consultation Room A', siteId: 'site2' },
    { id: 'room6', name: 'Consultation Room B', siteId: 'site2' },
    { id: 'room7', name: 'Therapy Room', siteId: 'site2' }
  ],
  documents: [],
  tasks: [],
  messages: [],
  mutationLocked: false,

  addPatient: (patient) => {
    if ((get() as any).mutationLocked) return
    set((state) => ({ patients: [...state.patients, patient] }))
  },
  updatePatient: (id, updates) => {
    if ((get() as any).mutationLocked) return
    set((state) => ({
      patients: state.patients.map(patient => 
        patient.id === id ? { ...patient, ...updates } : patient
      )
    }))
  },

  addAppointment: (appointment) => {
    if ((get() as any).mutationLocked) return
    set((state) => ({ appointments: [...state.appointments, appointment] }))
  },
  updateAppointment: (id, updates) => {
    if ((get() as any).mutationLocked) return
    set((state) => ({
      appointments: state.appointments.map(appointment => 
        appointment.id === id ? { ...appointment, ...updates } : appointment
      )
    }))
  },
  removeAppointment: (id) => {
    if ((get() as any).mutationLocked) return
    set((state) => ({ appointments: state.appointments.filter(a => a.id !== id) }))
  },

  addInvoice: (invoice) => {
    if ((get() as any).mutationLocked) return
    set((state) => ({ invoices: [...state.invoices, invoice] }))
  },
  updateInvoice: (id, updates) => {
    if ((get() as any).mutationLocked) return
    set((state) => ({
      invoices: state.invoices.map(invoice => 
        invoice.id === id ? { ...invoice, ...updates } : invoice
      )
    }))
  },
  markInvoicePaid: (id) => {
    if ((get() as any).mutationLocked) return
    set((state) => ({
      invoices: state.invoices.map(inv => inv.id === id ? { ...inv, status: 'Paid' } : inv)
    }))
  },

  addNote: (note) => {
    if ((get() as any).mutationLocked) return
    set((state) => ({ notes: [...state.notes, note] }))
  },
  updateNote: (id, updates) => {
    if ((get() as any).mutationLocked) return
    set((state) => ({
      notes: state.notes.map(n => n.id === id ? { ...n, ...updates } : n)
    }))
  },
  removeNote: (id) => {
    if ((get() as any).mutationLocked) return
    set((state) => ({ notes: state.notes.filter(n => n.id !== id) }))
  },

  addPrescription: (prescription) => {
    if ((get() as any).mutationLocked) return
    set((state) => ({ prescriptions: [...state.prescriptions, prescription] }))
  },
  updatePrescription: (id, updates) => {
    if ((get() as any).mutationLocked) return
    set((state) => ({
      prescriptions: state.prescriptions.map(rx => rx.id === id ? { ...rx, ...updates } : rx)
    }))
  },
  removePrescription: (id) => {
    if ((get() as any).mutationLocked) return
    set((state) => ({ prescriptions: state.prescriptions.filter(rx => rx.id !== id) }))
  },

  addClinician: (clinician) => {
    if ((get() as any).mutationLocked) return
    set((state) => ({ clinicians: [...state.clinicians, clinician] }))
  },
  addService: (service) => {
    if ((get() as any).mutationLocked) return
    set((state) => ({ services: [...state.services, service] }))
  },

  addDocument: (doc) => {
    if ((get() as any).mutationLocked) return
    set((state) => ({ documents: [...state.documents, doc] }))
  },
  removeDocument: (id) => {
    if ((get() as any).mutationLocked) return
    set((state) => ({ documents: state.documents.filter(d => d.id !== id) }))
  },
  addTask: (task) => {
    if ((get() as any).mutationLocked) return
    set((state) => ({ tasks: [...state.tasks, { ...task, status: 'open' }] }))
  },
  completeTask: (id) => {
    if ((get() as any).mutationLocked) return
    set((state) => ({ tasks: state.tasks.map(t => t.id === id ? { ...t, status: 'done' } : t) }))
  },
  removeTask: (id) => {
    if ((get() as any).mutationLocked) return
    set((state) => ({ tasks: state.tasks.filter(t => t.id !== id) }))
  },
  addMessage: (msg) => {
    if ((get() as any).mutationLocked) return
    set((state) => ({ messages: [...state.messages, { ...msg, status: msg.status || 'draft' }] }))
  },
  removeMessage: (id) => {
    if ((get() as any).mutationLocked) return
    set((state) => ({ messages: state.messages.filter(m => m.id !== id) }))
  },

  loadDemoData: () => {
    set({
      patients: [...DEMO_PATIENTS],
      appointments: getDemoAppointments(),
      invoices: generateDemoInvoices(),
      clinicians: [...DEMO_CLINICIANS],
      services: [...DEMO_SERVICES],
      notes: generateDemoNotes(),
      prescriptions: generateDemoPrescriptions(),
      documents: [],
      tasks: [],
      messages: [],
    })
  },
  loadFromJson: async () => {
    try {
      const [patientsRes, apptsRes, invoicesRes, practitionersRes, sitesRes, roomsRes] = await Promise.all([
        fetch('/data/patients.json'),
        fetch('/data/appointments.json'),
        fetch('/data/invoices.json'),
        fetch('/data/practitioners.json'),
        fetch('/data/sites.json'),
        fetch('/data/rooms.json'),
      ])
      const [patients, appointments, invoices, practitioners, sites, rooms] = await Promise.all([
        patientsRes.json(), apptsRes.json(), invoicesRes.json(), 
        practitionersRes.json(), sitesRes.json(), roomsRes.json()
      ])
      set({ patients, appointments, invoices, practitioners, sites, rooms })
    } catch (e) {
      console.warn('Failed to load JSON seeds, using in-memory defaults', e)
    }
  },
  setMutationLocked: (locked) => set({ mutationLocked: locked })
})
