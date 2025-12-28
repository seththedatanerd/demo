'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useDemo, useData, useRole } from '@/store'
import { 
  RefreshCw, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  BarChart3, 
  Target, 
  TrendingDown,
  Phone,
  Clock,
  ClipboardList,
  Car,
  Mail,
  Bell,
  Stethoscope,
  Pill,
  FileText,
  Activity,
  FlaskConical,
  Calendar,
  Users,
  MessageSquare,
  CreditCard,
  Send,
  UserCheck,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Search,
  PhoneCall,
  PhoneIncoming,
  Inbox,
  ListTodo,
  ArrowRight,
  Zap,
  TrendingUp as TrendUp,
  Sparkles,
  X,
  User,
  MapPin,
  CalendarClock,
  CircleDot,
  Banknote,
  Play,
  Mic,
  ClipboardCheck,
  FileEdit,
  TestTube,
  Heart,
  AlertOctagon,
  FilePen,
  UserCog,
  Clipboard,
  Timer,
  FileSignature,
  Eye,
  PenLine,
  Forward,
  Share2,
  ClipboardPlus
} from 'lucide-react'

// ============================================================
// SHARED TYPES & UTILITIES
// ============================================================

interface WorkQueueItem {
  id: string
  type: 'call' | 'message' | 'checkin' | 'task'
  patient: string
  patientId?: string
  summary: string
  urgency: 'high' | 'medium' | 'low'
  time?: string
  action: {
    label: string
    href?: string
    onClick?: () => void
  }
}

// Icon mapping for insights
const insightIcons: Record<string, any> = {
  'trending-up': TrendingUp,
  'dollar': DollarSign,
  'alert': AlertTriangle,
  'chart': BarChart3,
  'target': Target,
  'trending-down': TrendingDown,
  'phone': Phone,
  'clock': Clock,
  'clipboard': ClipboardList,
  'car': Car,
  'mail': Mail,
  'bell': Bell,
  'stethoscope': Stethoscope,
  'pill': Pill,
  'file': FileText,
  'activity': Activity,
  'flask': FlaskConical,
  'calendar': Calendar,
  'zap': Zap,
  'sparkles': Sparkles
}

// Role-specific AI insights
const roleInsights = {
  manager: [
    {
      icon: 'trending-up',
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
      title: 'Practice efficiency up 12%',
      subtitle: 'this week compared to last week',
      detail: 'Automated appointment reminders reduced no-shows by 8%',
      actionLabel: 'View Report',
      actionHref: '/insights'
    },
    {
      icon: 'dollar',
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100',
      title: 'Revenue trending 15% above target',
      subtitle: 'for this quarter',
      detail: 'Private consultations and follow-ups driving growth',
      actionLabel: 'View Finances',
      actionHref: '/billing'
    },
    {
      icon: 'alert',
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
      title: '3 staff members approaching overtime',
      subtitle: 'this pay period',
      detail: 'Consider redistributing shifts to optimise labour costs',
      actionLabel: 'View Schedule',
      actionHref: '/calendar'
    },
    {
      icon: 'chart',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      title: 'Patient satisfaction at 94%',
      subtitle: 'up from 89% last month',
      detail: 'Reduced wait times and improved communication cited most',
      actionLabel: 'View Details',
      actionHref: '/insights'
    },
    {
      icon: 'target',
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100',
      title: 'Cost per patient visit down £4.20',
      subtitle: 'compared to industry average',
      detail: 'Streamlined intake process saving 12 minutes per visit',
      actionLabel: 'See Breakdown',
      actionHref: '/insights'
    },
    {
      icon: 'trending-down',
      iconColor: 'text-teal-600',
      iconBg: 'bg-teal-100',
      title: 'Cancellation rate dropped to 6%',
      subtitle: 'from 11% last quarter',
      detail: 'SMS reminders 24h before appointments proving effective',
      actionLabel: 'View Stats',
      actionHref: '/insights'
    }
  ],
  reception: [
    {
      icon: 'alert',
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
      title: '3 appointments likely to DNA today',
      subtitle: 'based on attendance patterns',
      detail: 'Send confirmation SMS to reduce no-shows?',
      actionLabel: 'Send Confirmations',
      actionHref: '/communications'
    },
    {
      icon: 'zap',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      title: 'You can fill 2 gaps from waitlist',
      subtitle: 'suggested patients: Mrs. Thompson, Mr. Ali',
      detail: 'Both patients are flexible and live nearby',
      actionLabel: 'View Waitlist',
      actionHref: '/calendar'
    },
    {
      icon: 'clipboard',
      iconColor: 'text-indigo-600',
      iconBg: 'bg-indigo-100',
      title: '5 patients have incomplete intake forms',
      subtitle: 'appointments in next 2 days',
      detail: 'Chase now to avoid delays at check-in',
      actionLabel: 'Send Reminders',
      actionHref: '/communications'
    },
    {
      icon: 'clock',
      iconColor: 'text-orange-600',
      iconBg: 'bg-orange-100',
      title: 'Dr. Patel running 15 mins behind',
      subtitle: 'starting from 11:30 AM',
      detail: 'Consider informing waiting patients',
      actionLabel: 'Notify Patients',
      actionHref: '/communications'
    },
    {
      icon: 'sparkles',
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100',
      title: 'Quiet period in 30 mins',
      subtitle: 'good time for admin tasks',
      detail: '4 recalls due, 2 insurance verifications pending',
      actionLabel: 'View Tasks',
      actionHref: '/tasks'
    },
    {
      icon: 'bell',
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-100',
      title: '£2,340 in payments due at check-in',
      subtitle: 'across 8 patients today',
      detail: 'Prepare payment reminders for arrivals',
      actionLabel: 'View Invoices',
      actionHref: '/billing'
    }
  ],
  clinician: [
    {
      icon: 'stethoscope',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      title: '5 patients flagged for follow-up',
      subtitle: 'based on recent test results',
      detail: 'Blood work results require clinical review before end of week',
      actionLabel: 'Review Results',
      actionHref: '/patients'
    },
    {
      icon: 'pill',
      iconColor: 'text-violet-600',
      iconBg: 'bg-violet-100',
      title: '3 prescription renewals due',
      subtitle: 'for chronic condition patients',
      detail: 'Mrs. Thompson, Mr. Patel, and Ms. Garcia need refills',
      actionLabel: 'Process Renewals',
      actionHref: '/tasks'
    },
    {
      icon: 'file',
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
      title: '2 clinical notes incomplete',
      subtitle: 'from yesterday\'s consultations',
      detail: 'Complete before EOD for billing submission',
      actionLabel: 'Complete Notes',
      actionHref: '/scribe'
    },
    {
      icon: 'activity',
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100',
      title: 'High-risk patient alert',
      subtitle: 'Mr. Jenkins BP reading elevated',
      detail: 'Last 3 readings trending upward - consider medication review',
      actionLabel: 'View Patient',
      actionHref: '/patients'
    },
    {
      icon: 'flask',
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
      title: '7 lab results arrived',
      subtitle: 'since your last login',
      detail: '2 marked urgent requiring same-day review',
      actionLabel: 'Review Labs',
      actionHref: '/patients'
    },
    {
      icon: 'calendar',
      iconColor: 'text-cyan-600',
      iconBg: 'bg-cyan-100',
      title: 'Your next patient in 12 mins',
      subtitle: 'Sarah Mitchell - Follow-up consultation',
      detail: 'Previous visit: knee pain, referred for X-ray (results available)',
      actionLabel: 'View Record',
      actionHref: '/patients'
    }
  ]
}

// ============================================================
// RECEPTIONIST CONTROL ROOM
// ============================================================

// KPI Detail Modal Component
function KPIDetailModal({ 
  isOpen, 
  onClose, 
  title, 
  icon: Icon, 
  iconColor, 
  iconBg,
  children 
}: { 
  isOpen: boolean
  onClose: () => void
  title: string
  icon: any
  iconColor: string
  iconBg: string
  children: React.ReactNode
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  )
}

// Types for demo data
interface ArrivingPatient {
  id: number
  time: string
  patient: string
  type: string
  practitioner: string
  status: 'checked-in' | 'arrived' | 'confirmed' | 'pending'
  room: string
}

interface GapSlot {
  id: number
  time: string
  duration: string
  practitioner: string
  reason: string
  waitlistMatch: string | null
}

interface WaitingItem {
  id: number
  type: 'call' | 'message'
  patient: string
  phone?: string
  channel?: string
  time: string
  summary: string
  priority: 'high' | 'medium' | 'low'
}

interface PaymentItem {
  id: number
  patient: string
  apptTime: string
  amount: number
  type: string
  status: 'due' | 'outstanding'
  daysOverdue?: number
  method: string
}

function ReceptionistControlRoom() {
  const router = useRouter()
  const { patients, appointments, invoices, tasks, messages } = useData()
  const [insightIndex, setInsightIndex] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeModal, setActiveModal] = useState<'arriving' | 'gaps' | 'waiting' | 'payments' | null>(null)

  const insights = roleInsights.reception
  const currentInsight = insights[insightIndex % insights.length]

  const handleRefreshInsight = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setInsightIndex((prev) => (prev + 1) % insights.length)
      setIsRefreshing(false)
    }, 300)
  }

  // ============================================================
  // DEMO DATA - All KPIs are derived from this data
  // ============================================================

  // Arriving Today Data (47 patients, 8 in next hour marked with status)
  const arrivingTodayData: ArrivingPatient[] = useMemo(() => [
    // Already processed (checked-in) - 12 patients
    { id: 1, time: '08:00', patient: 'Mrs. Sarah Thompson', type: 'Follow-up', practitioner: 'Dr. Patel', status: 'checked-in', room: 'Room 1' },
    { id: 2, time: '08:15', patient: 'Mr. David Kim', type: 'Consultation', practitioner: 'Dr. Jones', status: 'checked-in', room: 'Room 2' },
    { id: 3, time: '08:30', patient: 'Ms. Rachel Green', type: 'Blood Test', practitioner: 'Nurse Lee', status: 'checked-in', room: 'Room 3' },
    { id: 4, time: '08:45', patient: 'Mr. Tom Bradley', type: 'ECG', practitioner: 'Nurse Lee', status: 'checked-in', room: 'Room 3' },
    { id: 5, time: '09:00', patient: 'Mrs. Emma Watson', type: 'New Patient', practitioner: 'Dr. Patel', status: 'checked-in', room: 'Room 1' },
    { id: 6, time: '09:00', patient: 'Mr. James Wilson', type: 'Consultation', practitioner: 'Dr. Jones', status: 'checked-in', room: 'Room 2' },
    { id: 7, time: '09:15', patient: 'Ms. Olivia Brown', type: 'Follow-up', practitioner: 'Dr. Patel', status: 'checked-in', room: 'Room 1' },
    { id: 8, time: '09:15', patient: 'Mr. Noah Davis', type: 'Vaccination', practitioner: 'Nurse Lee', status: 'checked-in', room: 'Room 3' },
    { id: 9, time: '09:30', patient: 'Mrs. Sophia Miller', type: 'Prescription Review', practitioner: 'Dr. Jones', status: 'checked-in', room: 'Room 2' },
    { id: 10, time: '09:30', patient: 'Mr. Liam Garcia', type: 'Blood Test', practitioner: 'Nurse Lee', status: 'checked-in', room: 'Room 3' },
    { id: 11, time: '09:45', patient: 'Ms. Ava Martinez', type: 'Consultation', practitioner: 'Dr. Patel', status: 'checked-in', room: 'Room 1' },
    { id: 12, time: '09:45', patient: 'Mr. Ethan Rodriguez', type: 'Follow-up', practitioner: 'Dr. Jones', status: 'checked-in', room: 'Room 2' },
    // Waiting in reception (arrived) - 4 patients
    { id: 13, time: '10:00', patient: 'Mrs. Isabella Lee', type: 'New Patient', practitioner: 'Dr. Patel', status: 'arrived', room: 'Room 1' },
    { id: 14, time: '10:00', patient: 'Mr. Mason White', type: 'ECG', practitioner: 'Nurse Lee', status: 'arrived', room: 'Room 3' },
    { id: 15, time: '10:15', patient: 'Ms. Mia Harris', type: 'Consultation', practitioner: 'Dr. Jones', status: 'arrived', room: 'Room 2' },
    { id: 16, time: '10:15', patient: 'Mr. Lucas Clark', type: 'Follow-up', practitioner: 'Dr. Patel', status: 'arrived', room: 'Room 1' },
    // Next hour - confirmed (8 patients)
    { id: 17, time: '10:30', patient: 'Mrs. Charlotte Lewis', type: 'Prescription Review', practitioner: 'Dr. Jones', status: 'confirmed', room: 'Room 2' },
    { id: 18, time: '10:30', patient: 'Mr. Benjamin Walker', type: 'Blood Test', practitioner: 'Nurse Lee', status: 'confirmed', room: 'Room 3' },
    { id: 19, time: '10:45', patient: 'Ms. Amelia Hall', type: 'New Patient', practitioner: 'Dr. Patel', status: 'confirmed', room: 'Room 1' },
    { id: 20, time: '10:45', patient: 'Mr. Henry Allen', type: 'Consultation', practitioner: 'Dr. Jones', status: 'confirmed', room: 'Room 2' },
    { id: 21, time: '11:00', patient: 'Mrs. Evelyn Young', type: 'Follow-up', practitioner: 'Dr. Patel', status: 'confirmed', room: 'Room 1' },
    { id: 22, time: '11:00', patient: 'Mr. Alexander King', type: 'Vaccination', practitioner: 'Nurse Lee', status: 'confirmed', room: 'Room 3' },
    { id: 23, time: '11:15', patient: 'Ms. Harper Wright', type: 'ECG', practitioner: 'Nurse Lee', status: 'confirmed', room: 'Room 3' },
    { id: 24, time: '11:15', patient: 'Mr. Sebastian Scott', type: 'Consultation', practitioner: 'Dr. Jones', status: 'confirmed', room: 'Room 2' },
    // Afternoon - pending confirmation (23 patients)
    { id: 25, time: '12:00', patient: 'Mrs. Abigail Adams', type: 'Follow-up', practitioner: 'Dr. Patel', status: 'pending', room: 'Room 1' },
    { id: 26, time: '12:00', patient: 'Mr. Jack Baker', type: 'Consultation', practitioner: 'Dr. Jones', status: 'pending', room: 'Room 2' },
    { id: 27, time: '12:15', patient: 'Ms. Emily Nelson', type: 'Blood Test', practitioner: 'Nurse Lee', status: 'pending', room: 'Room 3' },
    { id: 28, time: '12:30', patient: 'Mr. Michael Carter', type: 'New Patient', practitioner: 'Dr. Patel', status: 'pending', room: 'Room 1' },
    { id: 29, time: '13:00', patient: 'Mrs. Elizabeth Mitchell', type: 'Prescription Review', practitioner: 'Dr. Jones', status: 'pending', room: 'Room 2' },
    { id: 30, time: '13:15', patient: 'Mr. Daniel Perez', type: 'Follow-up', practitioner: 'Dr. Patel', status: 'pending', room: 'Room 1' },
    { id: 31, time: '13:30', patient: 'Ms. Victoria Roberts', type: 'Consultation', practitioner: 'Dr. Jones', status: 'pending', room: 'Room 2' },
    { id: 32, time: '13:45', patient: 'Mr. Matthew Turner', type: 'ECG', practitioner: 'Nurse Lee', status: 'pending', room: 'Room 3' },
    { id: 33, time: '14:00', patient: 'Mrs. Grace Phillips', type: 'Blood Test', practitioner: 'Nurse Lee', status: 'pending', room: 'Room 3' },
    { id: 34, time: '14:15', patient: 'Mr. Joseph Campbell', type: 'Vaccination', practitioner: 'Nurse Lee', status: 'pending', room: 'Room 3' },
    { id: 35, time: '14:30', patient: 'Ms. Chloe Parker', type: 'Follow-up', practitioner: 'Dr. Patel', status: 'pending', room: 'Room 1' },
    { id: 36, time: '14:45', patient: 'Mr. Andrew Evans', type: 'New Patient', practitioner: 'Dr. Jones', status: 'pending', room: 'Room 2' },
    { id: 37, time: '15:00', patient: 'Mrs. Lily Edwards', type: 'Consultation', practitioner: 'Dr. Patel', status: 'pending', room: 'Room 1' },
    { id: 38, time: '15:15', patient: 'Mr. Ryan Collins', type: 'Prescription Review', practitioner: 'Dr. Jones', status: 'pending', room: 'Room 2' },
    { id: 39, time: '15:30', patient: 'Ms. Zoey Stewart', type: 'Follow-up', practitioner: 'Dr. Patel', status: 'pending', room: 'Room 1' },
    { id: 40, time: '15:45', patient: 'Mr. Nathan Sanchez', type: 'Blood Test', practitioner: 'Nurse Lee', status: 'pending', room: 'Room 3' },
    { id: 41, time: '16:00', patient: 'Mrs. Hannah Morris', type: 'Consultation', practitioner: 'Dr. Jones', status: 'pending', room: 'Room 2' },
    { id: 42, time: '16:15', patient: 'Mr. Samuel Rogers', type: 'ECG', practitioner: 'Nurse Lee', status: 'pending', room: 'Room 3' },
    { id: 43, time: '16:30', patient: 'Ms. Ella Reed', type: 'New Patient', practitioner: 'Dr. Patel', status: 'pending', room: 'Room 1' },
    { id: 44, time: '16:45', patient: 'Mr. Christopher Cook', type: 'Follow-up', practitioner: 'Dr. Jones', status: 'pending', room: 'Room 2' },
    { id: 45, time: '17:00', patient: 'Mrs. Aria Morgan', type: 'Prescription Review', practitioner: 'Dr. Patel', status: 'pending', room: 'Room 1' },
    { id: 46, time: '17:15', patient: 'Mr. Dylan Bell', type: 'Consultation', practitioner: 'Dr. Jones', status: 'pending', room: 'Room 2' },
    { id: 47, time: '17:30', patient: 'Ms. Scarlett Murphy', type: 'Follow-up', practitioner: 'Dr. Patel', status: 'pending', room: 'Room 1' },
  ], [])

  // Gaps Data (3 gaps, 2 fillable from waitlist)
  const gapsData: GapSlot[] = useMemo(() => [
    { id: 1, time: '11:30', duration: '30 min', practitioner: 'Dr. Patel', reason: 'Cancellation', waitlistMatch: 'Mrs. Thompson (flexible)' },
    { id: 2, time: '14:00', duration: '15 min', practitioner: 'Dr. Jones', reason: 'DNA', waitlistMatch: 'Mr. Ali (urgent)' },
    { id: 3, time: '15:45', duration: '30 min', practitioner: 'Dr. Patel', reason: 'Cancellation', waitlistMatch: null },
  ], [])

  // Waiting Response Data (5 calls + 12 messages = 17 total)
  const waitingResponseData: WaitingItem[] = useMemo(() => [
    // 5 Calls
    { id: 1, type: 'call', patient: 'Mrs. Thompson', phone: '07*** ***456', time: '9:15 AM', summary: 'Prescription query - urgent', priority: 'high' },
    { id: 2, type: 'call', patient: 'Mr. Patel', phone: '07*** ***789', time: '9:32 AM', summary: 'Wants to reschedule Thursday appt', priority: 'medium' },
    { id: 3, type: 'call', patient: 'Ms. Garcia', phone: '07*** ***123', time: '10:05 AM', summary: 'Asking about test results', priority: 'low' },
    { id: 4, type: 'call', patient: 'Mr. Johnson', phone: '07*** ***234', time: '10:22 AM', summary: 'New patient enquiry', priority: 'medium' },
    { id: 5, type: 'call', patient: 'Mrs. Williams', phone: '07*** ***567', time: '10:45 AM', summary: 'Insurance question', priority: 'low' },
    // 12 Messages
    { id: 6, type: 'message', patient: 'Sarah Mitchell', channel: 'Patient Portal', time: '8:45 AM', summary: 'Requesting sick note for employer', priority: 'medium' },
    { id: 7, type: 'message', patient: 'James Wilson', channel: 'Email', time: '9:20 AM', summary: 'Insurance pre-auth question', priority: 'low' },
    { id: 8, type: 'message', patient: 'Emma Roberts', channel: 'SMS', time: '9:55 AM', summary: 'Confirm tomorrow\'s appointment', priority: 'low' },
    { id: 9, type: 'message', patient: 'Oliver Smith', channel: 'Patient Portal', time: '10:10 AM', summary: 'Request for referral letter', priority: 'medium' },
    { id: 10, type: 'message', patient: 'Sophie Brown', channel: 'Email', time: '10:30 AM', summary: 'Query about medication dosage', priority: 'high' },
    { id: 11, type: 'message', patient: 'Harry Jones', channel: 'SMS', time: '10:48 AM', summary: 'Running 10 mins late', priority: 'low' },
    { id: 12, type: 'message', patient: 'Amelia Davis', channel: 'Patient Portal', time: '11:05 AM', summary: 'Booking request for next week', priority: 'low' },
    { id: 13, type: 'message', patient: 'George Taylor', channel: 'Email', time: '11:15 AM', summary: 'Repeat prescription request', priority: 'medium' },
    { id: 14, type: 'message', patient: 'Isla Thomas', channel: 'SMS', time: '11:22 AM', summary: 'Asking about lab hours', priority: 'low' },
    { id: 15, type: 'message', patient: 'Oscar Moore', channel: 'Patient Portal', time: '11:35 AM', summary: 'Follow-up appointment request', priority: 'low' },
    { id: 16, type: 'message', patient: 'Poppy Jackson', channel: 'Email', time: '11:42 AM', summary: 'Documents for insurance', priority: 'medium' },
    { id: 17, type: 'message', patient: 'Charlie Martin', channel: 'SMS', time: '11:58 AM', summary: 'Confirming address for referral', priority: 'low' },
  ], [])

  // Payments Data (8 patients, totaling £2,340)
  const paymentsData: PaymentItem[] = useMemo(() => [
    { id: 1, patient: 'Mrs. Thompson', apptTime: '09:00', amount: 180, type: 'Consultation', status: 'due', method: 'Insurance (Bupa)' },
    { id: 2, patient: 'Mr. Wilson', apptTime: '09:15', amount: 220, type: 'New Patient', status: 'outstanding', daysOverdue: 14, method: 'Self-pay' },
    { id: 3, patient: 'Ms. Chen', apptTime: '09:30', amount: 65, type: 'Blood Test', status: 'due', method: 'Self-pay' },
    { id: 4, patient: 'Mr. Brown', apptTime: '09:45', amount: 340, type: 'Consultation + ECG', status: 'outstanding', daysOverdue: 7, method: 'Insurance (AXA)' },
    { id: 5, patient: 'Mrs. Martinez', apptTime: '10:00', amount: 450, type: 'Comprehensive Check', status: 'due', method: 'Self-pay' },
    { id: 6, patient: 'Mr. Lee', apptTime: '10:15', amount: 185, type: 'Follow-up', status: 'outstanding', daysOverdue: 21, method: 'Insurance (Vitality)' },
    { id: 7, patient: 'Ms. Taylor', apptTime: '10:30', amount: 280, type: 'New Patient', status: 'due', method: 'Self-pay' },
    { id: 8, patient: 'Mr. Anderson', apptTime: '10:45', amount: 620, type: 'ECG + Consultation', status: 'outstanding', daysOverdue: 30, method: 'Self-pay' },
  ], []) // Total: £2,340

  // ============================================================
  // DERIVED KPIs - Computed from demo data
  // ============================================================
  
  const kpis = useMemo(() => ({
    // Arriving today
    arrivingToday: arrivingTodayData.length,
    arrivingNext60: arrivingTodayData.filter(a => a.status === 'confirmed').length,
    checkedIn: arrivingTodayData.filter(a => a.status === 'checked-in').length,
    waiting: arrivingTodayData.filter(a => a.status === 'arrived').length,
    // Gaps
    gapsToday: gapsData.length,
    fillableSlots: gapsData.filter(g => g.waitlistMatch !== null).length,
    // Messages & Calls
    callsWaiting: waitingResponseData.filter(w => w.type === 'call').length,
    unreadMessages: waitingResponseData.filter(w => w.type === 'message').length,
    // Payments
    paymentsDueToday: paymentsData.length,
    outstandingAtCheckin: paymentsData.reduce((sum, p) => sum + p.amount, 0),
  }), [arrivingTodayData, gapsData, waitingResponseData, paymentsData])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'checked-in': return 'bg-emerald-100 text-emerald-700'
      case 'arrived': return 'bg-blue-100 text-blue-700'
      case 'confirmed': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-gray-100 text-gray-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200'
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'low': return 'bg-gray-100 text-gray-600 border-gray-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  // Generate work queue items (using demo data for consistency)
  const workQueueItems: WorkQueueItem[] = useMemo(() => {
    const items: WorkQueueItem[] = []
    
    // Calls to return (from waitingResponseData)
    waitingResponseData.filter(w => w.type === 'call').slice(0, 3).forEach((call, i) => {
      items.push({
        id: `call-${call.id}`,
        type: 'call',
        patient: call.patient,
        summary: call.summary,
        urgency: call.priority,
        time: call.time,
        action: { label: 'Call Back', href: '/calls' }
      })
    })
    
    // Messages to reply (from waitingResponseData)
    waitingResponseData.filter(w => w.type === 'message').slice(0, 2).forEach((msg) => {
      items.push({
        id: `msg-${msg.id}`,
        type: 'message',
        patient: msg.patient,
        summary: msg.summary,
        urgency: msg.priority,
        time: msg.time,
        action: { label: 'Reply', href: '/messages' }
      })
    })
    
    // Check-ins to process (patients with 'arrived' status from arrivingTodayData)
    arrivingTodayData.filter(apt => apt.status === 'arrived').forEach((apt, i) => {
      items.push({
        id: `checkin-${apt.id}`,
        type: 'checkin',
        patient: apt.patient,
        summary: `${apt.type} with ${apt.practitioner}`,
        urgency: i === 0 ? 'high' : 'medium',
        time: apt.time,
        action: { label: 'Check In', href: '/patients' }
      })
    })
    
    // Tasks due today
    items.push(
      { id: 'task-1', type: 'task', patient: 'Mrs. Ali', summary: 'Verify insurance details before appt', urgency: 'medium', action: { label: 'Complete', href: '/tasks' } },
      { id: 'task-2', type: 'task', patient: 'General', summary: 'Order prescription pads - low stock', urgency: 'low', action: { label: 'Complete', href: '/tasks' } },
      { id: 'task-3', type: 'task', patient: 'Mr. Thompson', summary: 'Chase referral letter from hospital', urgency: 'medium', action: { label: 'Complete', href: '/tasks' } }
    )

    // Sort by urgency
    const urgencyOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
    return items.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency])
  }, [arrivingTodayData, waitingResponseData])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call': return <PhoneIncoming className="w-4 h-4" />
      case 'message': return <Mail className="w-4 h-4" />
      case 'checkin': return <UserCheck className="w-4 h-4" />
      case 'task': return <ListTodo className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'call': return 'text-blue-600 bg-blue-50'
      case 'message': return 'text-violet-600 bg-violet-50'
      case 'checkin': return 'text-emerald-600 bg-emerald-50'
      case 'task': return 'text-amber-600 bg-amber-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getUrgencyStyles = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200'
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'low': return 'bg-gray-100 text-gray-600 border-gray-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  // Simple trends for reception (not deep revenue)
  const trends = {
    checkInsToday: kpis.checkedIn,
    checkInsChange: '+12%',
    avgWaitTime: '8 mins',
    waitTimeChange: '-2 mins',
    confirmationRate: '94%',
    confirmationChange: '+3%'
  }

  // Current time for header display
  const now = new Date()

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
      <div>
          <h1 className="text-2xl font-bold text-gray-900">Front Desk</h1>
          <p className="text-sm text-gray-500 mt-1">
            {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} • {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Reception Open
        </div>
      </div>

      {/* KPI Strip - "What matters today" */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Patients Arriving */}
        <button 
          onClick={() => setActiveModal('arriving')}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-blue-200 transition-all text-left group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Arriving Today</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{kpis.arrivingToday}</p>
              <p className="text-xs text-blue-600 mt-1 font-medium">{kpis.arrivingNext60} in next hour</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs text-gray-500">View schedule</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
        </button>

        {/* Gaps & Cancellations */}
        <button 
          onClick={() => setActiveModal('gaps')}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-amber-200 transition-all text-left group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Gaps Today</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{kpis.gapsToday}</p>
              <p className="text-xs text-emerald-600 mt-1 font-medium">{kpis.fillableSlots} fillable from waitlist</p>
            </div>
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs text-gray-500">View gaps & waitlist</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
        </button>

        {/* Messages & Calls */}
        <button 
          onClick={() => setActiveModal('waiting')}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-violet-200 transition-all text-left group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Waiting Response</p>
              <p className="text-3xl font-bold text-violet-600 mt-1">{kpis.unreadMessages + kpis.callsWaiting}</p>
              <p className="text-xs text-gray-500 mt-1">{kpis.callsWaiting} calls • {kpis.unreadMessages} messages</p>
            </div>
            <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center group-hover:bg-violet-100 transition-colors">
              <Inbox className="w-5 h-5 text-violet-600" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs text-gray-500">View all</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
        </button>

        {/* Payments Due */}
        <button 
          onClick={() => setActiveModal('payments')}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-emerald-200 transition-all text-left group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Payments at Check-in</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">£{kpis.outstandingAtCheckin.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">{kpis.paymentsDueToday} patients owe</p>
            </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <CreditCard className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs text-gray-500">View payments</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Work Queue - Centerpiece (2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <ListTodo className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Work Queue</h2>
                <p className="text-xs text-gray-500">{workQueueItems.length} items need action</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Sorted by urgency</span>
            </div>
          </div>
          
          <div className="divide-y divide-gray-50 max-h-[420px] overflow-y-auto">
            {workQueueItems.map((item) => (
              <div 
                key={item.id}
                className="px-5 py-3 hover:bg-gray-50 transition-colors flex items-center gap-4 group"
              >
                {/* Type Icon */}
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${getTypeColor(item.type)}`}>
                  {getTypeIcon(item.type)}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{item.patient}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getUrgencyStyles(item.urgency)}`}>
                      {item.urgency}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate mt-0.5">{item.summary}</p>
                </div>
                
                {/* Time */}
                {item.time && (
                  <div className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">
                    {item.time}
                  </div>
                )}
                
                {/* Action Button */}
                <button
                  onClick={() => item.action.href && router.push(item.action.href)}
                  className="px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100"
                >
                  {item.action.label}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          
          {/* View All Link */}
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
            <button
              onClick={() => router.push('/tasks')}
              className="text-sm text-gray-600 hover:text-blue-600 font-medium flex items-center gap-1"
            >
              View all tasks
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column - AI Insights + Quick Actions */}
        <div className="space-y-6">
      {/* AI Insights */}
          <div className="bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 rounded-xl border border-blue-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <h2 className="text-sm font-semibold text-gray-900">AI Recommendation</h2>
              </div>
              <button
                onClick={handleRefreshInsight}
                disabled={isRefreshing}
                className="p-1.5 text-cyan-600 hover:bg-cyan-100 rounded-lg transition-colors disabled:opacity-50"
                title="Get new insight"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            <div className={`p-4 transition-opacity duration-300 ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 ${currentInsight.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  {(() => {
                    const IconComponent = insightIcons[currentInsight.icon]
                    return IconComponent ? <IconComponent className={`w-4.5 h-4.5 ${currentInsight.iconColor}`} /> : null
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{currentInsight.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{currentInsight.subtitle}</p>
                  <p className="text-xs text-gray-500 mt-2">{currentInsight.detail}</p>
                </div>
              </div>
              
              {currentInsight.actionLabel && (
                <button
                  onClick={() => currentInsight.actionHref && router.push(currentInsight.actionHref)}
                  className="mt-3 w-full py-2 text-sm font-medium text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-1"
                >
                  {currentInsight.actionLabel}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => router.push('/calendar')}
                className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-colors group"
              >
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <Calendar className="w-4.5 h-4.5 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-gray-700">Book Appt</span>
              </button>
              
              <button
                onClick={() => router.push('/patients')}
                className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-100 hover:bg-emerald-50 hover:border-emerald-200 transition-colors group"
              >
                <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <UserCheck className="w-4.5 h-4.5 text-emerald-600" />
                </div>
                <span className="text-xs font-medium text-gray-700">Check In</span>
              </button>
              
              <button
                onClick={() => router.push('/communications')}
                className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-100 hover:bg-violet-50 hover:border-violet-200 transition-colors group"
              >
                <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                  <Send className="w-4.5 h-4.5 text-violet-600" />
                </div>
                <span className="text-xs font-medium text-gray-700">Send SMS</span>
              </button>
              
              <button
                onClick={() => router.push('/billing')}
                className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-100 hover:bg-amber-50 hover:border-amber-200 transition-colors group"
              >
                <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                  <CreditCard className="w-4.5 h-4.5 text-amber-600" />
                </div>
                <span className="text-xs font-medium text-gray-700">Payment</span>
              </button>
              
              <button
                onClick={() => {
                  // Trigger global search
                  window.dispatchEvent(new KeyboardEvent('keydown', { key: '/', metaKey: true }))
                }}
                className="col-span-2 flex items-center justify-center gap-2 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 hover:border-gray-200 transition-colors group"
              >
                <Search className="w-4 h-4 text-gray-500" />
                <span className="text-xs font-medium text-gray-700">Find Patient</span>
                <kbd className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">⌘/</kbd>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trends Strip - "Are we winning?" */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendUp className="w-4 h-4 text-gray-400" />
          Today's Performance
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{trends.checkInsToday}</p>
            <p className="text-xs text-gray-500 mt-1">Check-ins</p>
            <p className="text-xs text-emerald-600 font-medium mt-1">{trends.checkInsChange} vs yesterday</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{trends.avgWaitTime}</p>
            <p className="text-xs text-gray-500 mt-1">Avg Wait Time</p>
            <p className="text-xs text-emerald-600 font-medium mt-1">{trends.waitTimeChange} vs avg</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{trends.confirmationRate}</p>
            <p className="text-xs text-gray-500 mt-1">Confirmation Rate</p>
            <p className="text-xs text-emerald-600 font-medium mt-1">{trends.confirmationChange} this week</p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* KPI DETAIL MODALS */}
      {/* ============================================================ */}

      {/* Arriving Today Modal */}
      <KPIDetailModal
        isOpen={activeModal === 'arriving'}
        onClose={() => setActiveModal(null)}
        title="Today's Appointments"
        icon={Users}
        iconColor="text-blue-600"
        iconBg="bg-blue-50"
      >
        <div className="space-y-4">
          {/* Summary Banner */}
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Arriving Today</p>
                <p className="text-3xl font-bold">{kpis.arrivingToday}</p>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-sm">In Next Hour</p>
                <p className="text-2xl font-bold">{kpis.arrivingNext60}</p>
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">{kpis.arrivingToday}</p>
              <p className="text-xs text-blue-600">Total</p>
            </div>
            <div className="bg-emerald-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-emerald-700">{kpis.checkedIn}</p>
              <p className="text-xs text-emerald-600">Checked In</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-amber-700">{kpis.waiting}</p>
              <p className="text-xs text-amber-600">Waiting</p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{kpis.arrivingNext60}</p>
              <p className="text-xs text-green-600">Confirmed</p>
            </div>
          </div>

          {/* Appointments Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Time</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Patient</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Practitioner</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {arrivingTodayData.map((apt) => (
                  <tr key={apt.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-900">{apt.time}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-gray-500" />
                        </div>
                        <span className="text-gray-900">{apt.patient}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-gray-600">{apt.type}</td>
                    <td className="px-4 py-2.5 text-gray-600">{apt.practitioner}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(apt.status)}`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button 
                        onClick={() => { setActiveModal(null); router.push('/patients'); }}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {apt.status === 'arrived' ? 'Check In' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </KPIDetailModal>

      {/* Gaps Today Modal */}
      <KPIDetailModal
        isOpen={activeModal === 'gaps'}
        onClose={() => setActiveModal(null)}
        title="Gaps & Cancellations"
        icon={Calendar}
        iconColor="text-amber-600"
        iconBg="bg-amber-50"
      >
        <div className="space-y-4">
          {/* Summary Banner */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">Gaps Today</p>
                <p className="text-3xl font-bold">{kpis.gapsToday}</p>
              </div>
              <div className="text-right">
                <p className="text-amber-100 text-sm">Fillable from Waitlist</p>
                <p className="text-2xl font-bold">{kpis.fillableSlots}</p>
              </div>
            </div>
          </div>

          {/* Action Prompt */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Zap className="w-5 h-5 text-emerald-600" />
              <div>
                <p className="text-sm font-medium text-emerald-800">
                  {kpis.fillableSlots} slots can be filled from your waitlist
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">Click "Fill Slot" to contact waitlist patients</p>
              </div>
            </div>
          </div>

          {/* Gaps List */}
        <div className="space-y-3">
            {gapsData.map((gap) => (
              <div key={gap.id} className="border border-gray-200 rounded-lg p-4 hover:border-amber-200 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <CalendarClock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{gap.time} • {gap.duration}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{gap.practitioner}</p>
                      <p className="text-xs text-gray-500 mt-1">Reason: {gap.reason}</p>
                    </div>
                  </div>
                  {gap.waitlistMatch ? (
                    <div className="text-right">
                      <p className="text-xs text-emerald-600 font-medium">Waitlist match:</p>
                      <p className="text-sm text-gray-900">{gap.waitlistMatch}</p>
                      <button 
                        onClick={() => { setActiveModal(null); router.push('/calendar'); }}
                        className="mt-2 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
                      >
                        Fill Slot
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => { setActiveModal(null); router.push('/calendar'); }}
                      className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                      View in Calendar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Waitlist Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Waitlist Summary</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Patients on waitlist</span>
              <span className="font-medium text-gray-900">12 patients</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-600">Flexible availability</span>
              <span className="font-medium text-gray-900">8 patients</span>
            </div>
            <button 
              onClick={() => { setActiveModal(null); router.push('/calendar'); }}
              className="mt-3 w-full py-2 text-sm font-medium text-blue-600 bg-white border border-blue-200 rounded-lg hover:bg-blue-50"
            >
              View Full Waitlist
            </button>
          </div>
        </div>
      </KPIDetailModal>

      {/* Waiting Response Modal */}
      <KPIDetailModal
        isOpen={activeModal === 'waiting'}
        onClose={() => setActiveModal(null)}
        title="Calls & Messages Waiting"
        icon={Inbox}
        iconColor="text-violet-600"
        iconBg="bg-violet-50"
      >
        <div className="space-y-4">
          {/* Summary Banner */}
          <div className="bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-violet-100 text-sm">Total Waiting</p>
                <p className="text-3xl font-bold">{kpis.callsWaiting + kpis.unreadMessages}</p>
              </div>
              <div className="flex gap-6 text-right">
                <div>
                  <p className="text-violet-100 text-sm">Calls</p>
                  <p className="text-2xl font-bold">{kpis.callsWaiting}</p>
                </div>
                <div>
                  <p className="text-violet-100 text-sm">Messages</p>
                  <p className="text-2xl font-bold">{kpis.unreadMessages}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 border-b border-gray-200 pb-2">
            <button className="px-3 py-1.5 text-sm font-medium text-violet-700 bg-violet-50 rounded-lg">
              All ({kpis.callsWaiting + kpis.unreadMessages})
            </button>
            <button className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-lg">
              Calls ({kpis.callsWaiting})
            </button>
            <button className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:bg-gray-50 rounded-lg">
              Messages ({kpis.unreadMessages})
            </button>
          </div>

          {/* Items List */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {waitingResponseData.map((item) => (
              <div 
                key={item.id} 
                className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:border-violet-200 hover:bg-violet-50/30 transition-colors"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.type === 'call' ? 'bg-blue-50' : 'bg-violet-50'}`}>
                  {item.type === 'call' ? (
                    <PhoneIncoming className="w-4 h-4 text-blue-600" />
                  ) : (
                    <Mail className="w-4 h-4 text-violet-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{item.patient}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getPriorityBadge(item.priority)}`}>
                      {item.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{item.summary}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {item.type === 'call' ? item.phone : item.channel} • {item.time}
                  </p>
                </div>
                <button 
                  onClick={() => { setActiveModal(null); router.push(item.type === 'call' ? '/calls' : '/messages'); }}
                  className="px-3 py-1.5 text-xs font-medium text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100"
                >
                  {item.type === 'call' ? 'Call Back' : 'Reply'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </KPIDetailModal>

      {/* Payments Modal */}
      <KPIDetailModal
        isOpen={activeModal === 'payments'}
        onClose={() => setActiveModal(null)}
        title="Payments Due at Check-in"
        icon={CreditCard}
        iconColor="text-emerald-600"
        iconBg="bg-emerald-50"
      >
        <div className="space-y-4">
          {/* Total Banner */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">Total Outstanding</p>
                <p className="text-3xl font-bold">£{kpis.outstandingAtCheckin.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-emerald-100 text-sm">Across</p>
                <p className="text-2xl font-bold">{kpis.paymentsDueToday} patients</p>
              </div>
            </div>
          </div>

          {/* Breakdown Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-50 rounded-lg p-4">
              <p className="text-xs text-emerald-600 font-medium">Due Today</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">
                £{paymentsData.filter(p => p.status === 'due').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
              </p>
              <p className="text-xs text-emerald-600 mt-1">{paymentsData.filter(p => p.status === 'due').length} invoices</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-xs text-red-600 font-medium">Overdue</p>
              <p className="text-2xl font-bold text-red-700 mt-1">
                £{paymentsData.filter(p => p.status === 'outstanding').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
              </p>
              <p className="text-xs text-red-600 mt-1">{paymentsData.filter(p => p.status === 'outstanding').length} invoices</p>
            </div>
          </div>
          
          {/* Payments Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Appt</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Patient</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Service</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Amount</th>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paymentsData.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-900">{payment.apptTime}</td>
                    <td className="px-4 py-2.5 text-gray-900">{payment.patient}</td>
                    <td className="px-4 py-2.5 text-gray-600">{payment.type}</td>
                    <td className="px-4 py-2.5 text-right font-medium text-gray-900">£{payment.amount}</td>
                    <td className="px-4 py-2.5">
                      {payment.status === 'due' ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">Due today</span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                          {payment.daysOverdue}d overdue
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button 
                        onClick={() => { setActiveModal(null); router.push('/billing'); }}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        Collect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Payment Method Breakdown */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Payment Methods</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Self-pay</span>
                <span className="font-medium text-gray-900">
                  £{paymentsData.filter(p => p.method === 'Self-pay').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Insurance</span>
                <span className="font-medium text-gray-900">
                  £{paymentsData.filter(p => p.method.includes('Insurance')).reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </KPIDetailModal>
    </div>
  )
}

// ============================================================
// CLINICIAN CONTROL ROOM ("My Day" vibe)
// ============================================================

// Types for clinician demo data
interface ClinicianPatient {
  id: number
  time: string
  patient: string
  type: string
  status: 'seen' | 'in-progress' | 'waiting' | 'upcoming'
  age: number
  reason: string
  lastVisit?: string
  alerts?: string[]
}

interface DraftNote {
  id: number
  patient: string
  type: string
  createdAt: string
  status: 'draft' | 'pending-sign'
}

interface ResultToReview {
  id: number
  patient: string
  testType: string
  urgency: 'urgent' | 'routine'
  receivedAt: string
  abnormal: boolean
}

interface PrescriptionRenewal {
  id: number
  patient: string
  medication: string
  lastIssued: string
  daysOverdue: number
}

interface ClinicianAction {
  id: string
  type: 'sign' | 'approve' | 'call' | 'review' | 'refer'
  patient: string
  summary: string
  urgency: 'high' | 'medium' | 'low'
  time?: string
}

function ClinicianControlRoom() {
  const router = useRouter()
  const [insightIndex, setInsightIndex] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeModal, setActiveModal] = useState<'patients' | 'notes' | 'results' | 'prescriptions' | null>(null)

  const insights = roleInsights.clinician
  const currentInsight = insights[insightIndex % insights.length]

  const handleRefreshInsight = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setInsightIndex((prev) => (prev + 1) % insights.length)
      setIsRefreshing(false)
    }, 300)
  }

  // ============================================================
  // CLINICIAN DEMO DATA
  // ============================================================

  // Today's patients (14 total, 6 seen, 1 in progress, 2 waiting, 5 upcoming)
  const patientsToday: ClinicianPatient[] = useMemo(() => [
    // Already seen
    { id: 1, time: '09:00', patient: 'Mrs. Sarah Thompson', type: 'Follow-up', status: 'seen', age: 67, reason: 'Hypertension review', lastVisit: '3 months ago' },
    { id: 2, time: '09:20', patient: 'Mr. James Wilson', type: 'New Patient', status: 'seen', age: 45, reason: 'Persistent cough', alerts: ['Smoker'] },
    { id: 3, time: '09:40', patient: 'Ms. Emily Chen', type: 'Consultation', status: 'seen', age: 32, reason: 'Anxiety & sleep issues', lastVisit: '6 weeks ago' },
    { id: 4, time: '10:00', patient: 'Mr. Robert Brown', type: 'Follow-up', status: 'seen', age: 58, reason: 'Diabetes check', alerts: ['High HbA1c', 'Overweight'], lastVisit: '4 months ago' },
    { id: 5, time: '10:20', patient: 'Mrs. Linda Martinez', type: 'Results', status: 'seen', age: 71, reason: 'Blood test results', alerts: ['Kidney function'] },
    { id: 6, time: '10:40', patient: 'Mr. David Lee', type: 'Consultation', status: 'seen', age: 39, reason: 'Skin rash - dermatology query' },
    // Currently in progress
    { id: 7, time: '11:00', patient: 'Ms. Jessica Taylor', type: 'New Patient', status: 'in-progress', age: 28, reason: 'Fatigue & weight gain', alerts: ['Family history thyroid'] },
    // Waiting
    { id: 8, time: '11:20', patient: 'Mr. Michael Anderson', type: 'Follow-up', status: 'waiting', age: 52, reason: 'Back pain review', lastVisit: '2 weeks ago' },
    { id: 9, time: '11:40', patient: 'Mrs. Patricia White', type: 'Urgent', status: 'waiting', age: 64, reason: 'Chest tightness', alerts: ['Cardiac history', 'Priority'] },
    // Upcoming
    { id: 10, time: '12:00', patient: 'Mr. Christopher Harris', type: 'Consultation', status: 'upcoming', age: 41, reason: 'Mental health review' },
    { id: 11, time: '14:00', patient: 'Mrs. Jennifer Clark', type: 'Follow-up', status: 'upcoming', age: 55, reason: 'Menopause symptoms' },
    { id: 12, time: '14:20', patient: 'Mr. Daniel Lewis', type: 'Results', status: 'upcoming', age: 38, reason: 'Cholesterol results' },
    { id: 13, time: '14:40', patient: 'Ms. Amanda Walker', type: 'New Patient', status: 'upcoming', age: 29, reason: 'Contraception advice' },
    { id: 14, time: '15:00', patient: 'Mr. Kevin Hall', type: 'Follow-up', status: 'upcoming', age: 73, reason: 'COPD review', alerts: ['High-risk', 'Multiple meds'] },
  ], [])

  // Draft notes / open charts (4 notes)
  const draftNotes: DraftNote[] = useMemo(() => [
    { id: 1, patient: 'Mrs. Sarah Thompson', type: 'Consultation Note', createdAt: '09:25', status: 'draft' },
    { id: 2, patient: 'Mr. James Wilson', type: 'New Patient Assessment', createdAt: '09:45', status: 'pending-sign' },
    { id: 3, patient: 'Mr. Robert Brown', type: 'Diabetes Review', createdAt: '10:35', status: 'draft' },
    { id: 4, patient: 'Mrs. Linda Martinez', type: 'Results Discussion', createdAt: '11:05', status: 'pending-sign' },
  ], [])

  // Results to review (7 results, 2 urgent)
  const resultsToReview: ResultToReview[] = useMemo(() => [
    { id: 1, patient: 'Mr. Jenkins', testType: 'HbA1c', urgency: 'urgent', receivedAt: 'Today 08:30', abnormal: true },
    { id: 2, patient: 'Mrs. Thompson', testType: 'Kidney Function', urgency: 'urgent', receivedAt: 'Today 07:45', abnormal: true },
    { id: 3, patient: 'Mr. Patel', testType: 'Liver Function', urgency: 'routine', receivedAt: 'Yesterday', abnormal: false },
    { id: 4, patient: 'Ms. Garcia', testType: 'Thyroid Panel', urgency: 'routine', receivedAt: 'Yesterday', abnormal: true },
    { id: 5, patient: 'Mr. Wilson', testType: 'Full Blood Count', urgency: 'routine', receivedAt: '2 days ago', abnormal: false },
    { id: 6, patient: 'Mrs. Davis', testType: 'Lipid Profile', urgency: 'routine', receivedAt: '2 days ago', abnormal: true },
    { id: 7, patient: 'Mr. Brown', testType: 'PSA', urgency: 'routine', receivedAt: '3 days ago', abnormal: false },
  ], [])

  // Prescription renewals due (3 renewals)
  const prescriptionRenewals: PrescriptionRenewal[] = useMemo(() => [
    { id: 1, patient: 'Mrs. Thompson', medication: 'Amlodipine 5mg', lastIssued: '28 days ago', daysOverdue: 0 },
    { id: 2, patient: 'Mr. Patel', medication: 'Metformin 500mg', lastIssued: '35 days ago', daysOverdue: 7 },
    { id: 3, patient: 'Ms. Garcia', medication: 'Levothyroxine 50mcg', lastIssued: '32 days ago', daysOverdue: 4 },
  ], [])

  // ============================================================
  // DERIVED KPIs
  // ============================================================

  const kpis = useMemo(() => {
    const remaining = patientsToday.filter(p => p.status !== 'seen').length
    const nextPatient = patientsToday.find(p => p.status === 'waiting' || p.status === 'in-progress')
    const urgentResults = resultsToReview.filter(r => r.urgency === 'urgent').length
    
    return {
      // Appointments
      appointmentsRemaining: remaining,
      appointmentsTotal: patientsToday.length,
      patientsSeen: patientsToday.filter(p => p.status === 'seen').length,
      nextPatientName: nextPatient?.patient || 'No one waiting',
      nextPatientTime: nextPatient?.time || '-',
      timeToNext: nextPatient ? '5 min' : '-',
      // Notes
      notesOutstanding: draftNotes.length,
      notesPendingSign: draftNotes.filter(n => n.status === 'pending-sign').length,
      notesDraft: draftNotes.filter(n => n.status === 'draft').length,
      // Results
      resultsToReview: resultsToReview.length,
      resultsUrgent: urgentResults,
      resultsAbnormal: resultsToReview.filter(r => r.abnormal).length,
      // Prescriptions
      prescriptionsDue: prescriptionRenewals.length,
      prescriptionsOverdue: prescriptionRenewals.filter(p => p.daysOverdue > 0).length,
    }
  }, [patientsToday, draftNotes, resultsToReview, prescriptionRenewals])

  // Work Queue - Actions waiting on clinician
  const workQueueItems: ClinicianAction[] = useMemo(() => {
    const items: ClinicianAction[] = []

    // Notes pending signature
    draftNotes.filter(n => n.status === 'pending-sign').forEach(note => {
      items.push({
        id: `sign-${note.id}`,
        type: 'sign',
        patient: note.patient,
        summary: `Sign ${note.type}`,
        urgency: 'medium',
        time: note.createdAt
      })
    })

    // Urgent results to review
    resultsToReview.filter(r => r.urgency === 'urgent').forEach(result => {
      items.push({
        id: `review-${result.id}`,
        type: 'review',
        patient: result.patient,
        summary: `Review ${result.testType} - ${result.abnormal ? 'ABNORMAL' : 'Normal'}`,
        urgency: 'high',
        time: result.receivedAt
      })
    })

    // Prescription renewals
    prescriptionRenewals.filter(p => p.daysOverdue > 0).forEach(rx => {
      items.push({
        id: `rx-${rx.id}`,
        type: 'approve',
        patient: rx.patient,
        summary: `Renew ${rx.medication}`,
        urgency: rx.daysOverdue > 5 ? 'high' : 'medium'
      })
    })

    // Patient callbacks (demo)
    items.push(
      { id: 'call-1', type: 'call', patient: 'Mr. Jenkins', summary: 'Discuss elevated BP results', urgency: 'high' },
      { id: 'call-2', type: 'call', patient: 'Mrs. Adams', summary: 'Follow-up on medication change', urgency: 'medium' }
    )

    // Referrals to complete
    items.push(
      { id: 'refer-1', type: 'refer', patient: 'Mr. Lee', summary: 'Complete dermatology referral', urgency: 'low' }
    )

    // Sort by urgency
    const urgencyOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
    return items.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency])
  }, [draftNotes, resultsToReview, prescriptionRenewals])

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'sign': return <FileSignature className="w-4 h-4" />
      case 'approve': return <Pill className="w-4 h-4" />
      case 'call': return <Phone className="w-4 h-4" />
      case 'review': return <TestTube className="w-4 h-4" />
      case 'refer': return <Share2 className="w-4 h-4" />
      default: return <ClipboardCheck className="w-4 h-4" />
    }
  }

  const getActionColor = (type: string) => {
    switch (type) {
      case 'sign': return 'text-blue-600 bg-blue-50'
      case 'approve': return 'text-violet-600 bg-violet-50'
      case 'call': return 'text-amber-600 bg-amber-50'
      case 'review': return 'text-rose-600 bg-rose-50'
      case 'refer': return 'text-cyan-600 bg-cyan-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getUrgencyStyles = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200'
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'low': return 'bg-gray-100 text-gray-600 border-gray-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'seen': return 'bg-emerald-100 text-emerald-700'
      case 'in-progress': return 'bg-blue-100 text-blue-700'
      case 'waiting': return 'bg-amber-100 text-amber-700'
      case 'upcoming': return 'bg-gray-100 text-gray-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  // Current time for header
  const now = new Date()

  // Trends
  const trends = {
    consultTime: '18 min',
    consultChange: '-2 min',
    patientsSeen: kpis.patientsSeen,
    patientsTarget: patientsToday.length,
    completionRate: Math.round((kpis.patientsSeen / patientsToday.length) * 100) + '%'
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Day</h1>
          <p className="text-sm text-gray-500 mt-1">
            {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} • Good {now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'}, Dr. Patel
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            In Clinic
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Appointments Remaining */}
        <button 
          onClick={() => setActiveModal('patients')}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-blue-200 transition-all text-left group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Appointments</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {kpis.appointmentsRemaining}<span className="text-lg text-gray-400">/{kpis.appointmentsTotal}</span>
              </p>
              <p className="text-xs text-blue-600 mt-1 font-medium">Next: {kpis.timeToNext}</p>
          </div>
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs text-gray-500">View schedule</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </button>

        {/* Notes Outstanding */}
        <button 
          onClick={() => setActiveModal('notes')}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-amber-200 transition-all text-left group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Notes Outstanding</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{kpis.notesOutstanding}</p>
              <p className="text-xs text-gray-500 mt-1">{kpis.notesPendingSign} pending signature</p>
            </div>
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs text-gray-500">View notes</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </button>

        {/* Results to Review */}
        <button 
          onClick={() => setActiveModal('results')}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-rose-200 transition-all text-left group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Results to Review</p>
              <p className="text-3xl font-bold text-rose-600 mt-1">{kpis.resultsToReview}</p>
              <p className="text-xs text-red-600 mt-1 font-medium">{kpis.resultsUrgent} urgent</p>
            </div>
            <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center group-hover:bg-rose-100 transition-colors">
              <TestTube className="w-5 h-5 text-rose-600" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs text-gray-500">Review results</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </button>

        {/* Prescriptions Due */}
        <button 
          onClick={() => setActiveModal('prescriptions')}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-violet-200 transition-all text-left group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Rx Renewals Due</p>
              <p className="text-3xl font-bold text-violet-600 mt-1">{kpis.prescriptionsDue}</p>
              <p className="text-xs text-gray-500 mt-1">{kpis.prescriptionsOverdue} overdue</p>
            </div>
            <div className="w-10 h-10 bg-violet-50 rounded-lg flex items-center justify-center group-hover:bg-violet-100 transition-colors">
              <Pill className="w-5 h-5 text-violet-600" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs text-gray-500">Process renewals</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Work Queue - Actions (2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <ClipboardCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Actions Required</h2>
                <p className="text-xs text-gray-500">{workQueueItems.length} items need your attention</p>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
            {workQueueItems.map((item) => (
              <div 
                key={item.id}
                className="px-5 py-3 hover:bg-gray-50 transition-colors flex items-center gap-4 group"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${getActionColor(item.type)}`}>
                  {getActionIcon(item.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{item.patient}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getUrgencyStyles(item.urgency)}`}>
                      {item.urgency}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate mt-0.5">{item.summary}</p>
                </div>
                
                {item.time && (
                  <div className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">
                    {item.time}
                  </div>
                )}
                
                <button
                  onClick={() => router.push('/patients')}
                  className="px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100"
                >
                  Action
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - AI Insights + Quick Actions */}
        <div className="space-y-6">
          {/* AI Insights */}
          <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-indigo-50 rounded-xl border border-indigo-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-indigo-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <h2 className="text-sm font-semibold text-gray-900">AI Recommendation</h2>
              </div>
              <button
                onClick={handleRefreshInsight}
                disabled={isRefreshing}
                className="p-1.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            <div className={`p-4 transition-opacity duration-300 ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 ${currentInsight.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  {(() => {
                    const IconComponent = insightIcons[currentInsight.icon]
                    return IconComponent ? <IconComponent className={`w-4.5 h-4.5 ${currentInsight.iconColor}`} /> : null
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{currentInsight.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{currentInsight.subtitle}</p>
                  <p className="text-xs text-gray-500 mt-2">{currentInsight.detail}</p>
                </div>
              </div>
              
              {currentInsight.actionLabel && (
                <button
                  onClick={() => currentInsight.actionHref && router.push(currentInsight.actionHref)}
                  className="mt-3 w-full py-2 text-sm font-medium text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1"
                >
                  {currentInsight.actionLabel}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h2>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/patients')}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-colors group"
              >
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                  <Play className="w-4.5 h-4.5 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Start Consultation</span>
              </button>
              
              <button
                onClick={() => router.push('/scribe')}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-emerald-50 hover:border-emerald-200 transition-colors group"
              >
                <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                  <Mic className="w-4.5 h-4.5 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Ambient Scribe</span>
              </button>
              
              <button
                onClick={() => router.push('/messages')}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-violet-50 hover:border-violet-200 transition-colors group"
              >
                <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                  <MessageSquare className="w-4.5 h-4.5 text-violet-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Message Patient</span>
              </button>
              
              <button
                onClick={() => router.push('/tasks')}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-amber-50 hover:border-amber-200 transition-colors group"
              >
                <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center group-hover:bg-amber-100 transition-colors">
                  <ClipboardPlus className="w-4.5 h-4.5 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Task to Reception</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trends Strip */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendUp className="w-4 h-4 text-gray-400" />
          Today's Progress
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{trends.patientsSeen}/{trends.patientsTarget}</p>
            <p className="text-xs text-gray-500 mt-1">Patients Seen</p>
            <p className="text-xs text-emerald-600 font-medium mt-1">{trends.completionRate} complete</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{trends.consultTime}</p>
            <p className="text-xs text-gray-500 mt-1">Avg Consult Time</p>
            <p className="text-xs text-emerald-600 font-medium mt-1">{trends.consultChange} vs target</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{kpis.notesOutstanding}</p>
            <p className="text-xs text-gray-500 mt-1">Open Notes</p>
            <p className="text-xs text-amber-600 font-medium mt-1">{kpis.notesPendingSign} need signing</p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* CLINICIAN KPI MODALS */}
      {/* ============================================================ */}

      {/* Today's Patients Modal */}
      <KPIDetailModal
        isOpen={activeModal === 'patients'}
        onClose={() => setActiveModal(null)}
        title="Today's Schedule"
        icon={Calendar}
        iconColor="text-blue-600"
        iconBg="bg-blue-50"
      >
        <div className="space-y-4">
          {/* Summary Banner */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Remaining Today</p>
                <p className="text-3xl font-bold">{kpis.appointmentsRemaining}</p>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-sm">Total Booked</p>
                <p className="text-2xl font-bold">{kpis.appointmentsTotal}</p>
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-emerald-50 rounded-lg p-2 text-center">
              <p className="text-xl font-bold text-emerald-700">{patientsToday.filter(p => p.status === 'seen').length}</p>
              <p className="text-xs text-emerald-600">Seen</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-2 text-center">
              <p className="text-xl font-bold text-blue-700">{patientsToday.filter(p => p.status === 'in-progress').length}</p>
              <p className="text-xs text-blue-600">In Progress</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-2 text-center">
              <p className="text-xl font-bold text-amber-700">{patientsToday.filter(p => p.status === 'waiting').length}</p>
              <p className="text-xs text-amber-600">Waiting</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2 text-center">
              <p className="text-xl font-bold text-gray-700">{patientsToday.filter(p => p.status === 'upcoming').length}</p>
              <p className="text-xs text-gray-600">Upcoming</p>
            </div>
          </div>

          {/* Patient List */}
          <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[350px] overflow-y-auto">
            {patientsToday.map((patient) => (
              <div 
                key={patient.id} 
                className={`px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${patient.status === 'in-progress' ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-center w-12">
                      <p className="text-sm font-bold text-gray-900">{patient.time}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{patient.patient}</p>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(patient.status)}`}>
                          {patient.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{patient.type} • {patient.reason}</p>
                      {patient.alerts && patient.alerts.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {patient.alerts.map((alert, i) => (
                            <span key={i} className="px-1.5 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                              {alert}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button 
                    onClick={() => { setActiveModal(null); router.push('/patients'); }}
                    className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100"
                  >
                    {patient.status === 'waiting' ? 'Start' : 'View'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </KPIDetailModal>

      {/* Notes Modal */}
      <KPIDetailModal
        isOpen={activeModal === 'notes'}
        onClose={() => setActiveModal(null)}
        title="Outstanding Notes"
        icon={FileText}
        iconColor="text-amber-600"
        iconBg="bg-amber-50"
      >
        <div className="space-y-4">
          {/* Summary Banner */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">Total Outstanding</p>
                <p className="text-3xl font-bold">{kpis.notesOutstanding}</p>
              </div>
              <div className="flex gap-6 text-right">
                <div>
                  <p className="text-amber-100 text-sm">Draft</p>
                  <p className="text-2xl font-bold">{kpis.notesDraft}</p>
                </div>
                <div>
                  <p className="text-amber-100 text-sm">Pending Sign</p>
                  <p className="text-2xl font-bold">{kpis.notesPendingSign}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes List */}
          <div className="space-y-3">
            {draftNotes.map((note) => (
              <div key={note.id} className="border border-gray-200 rounded-lg p-4 hover:border-amber-200 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${note.status === 'pending-sign' ? 'bg-amber-100' : 'bg-gray-100'}`}>
                      {note.status === 'pending-sign' ? (
                        <FileSignature className="w-5 h-5 text-amber-600" />
                      ) : (
                        <PenLine className="w-5 h-5 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{note.patient}</p>
                      <p className="text-sm text-gray-600">{note.type}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Created at {note.createdAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${note.status === 'pending-sign' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
                      {note.status === 'pending-sign' ? 'Pending Signature' : 'Draft'}
                    </span>
                    <button 
                      onClick={() => { setActiveModal(null); router.push('/scribe'); }}
                      className="px-3 py-1.5 text-xs font-medium text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100"
                    >
                      {note.status === 'pending-sign' ? 'Sign' : 'Edit'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </KPIDetailModal>

      {/* Results Modal */}
      <KPIDetailModal
        isOpen={activeModal === 'results'}
        onClose={() => setActiveModal(null)}
        title="Results to Review"
        icon={TestTube}
        iconColor="text-rose-600"
        iconBg="bg-rose-50"
      >
        <div className="space-y-4">
          {/* Summary Banner */}
          <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-rose-100 text-sm">Total to Review</p>
                <p className="text-3xl font-bold">{kpis.resultsToReview}</p>
              </div>
              <div className="flex gap-6 text-right">
                <div>
                  <p className="text-rose-100 text-sm">Urgent</p>
                  <p className="text-2xl font-bold">{kpis.resultsUrgent}</p>
                </div>
                <div>
                  <p className="text-rose-100 text-sm">Abnormal</p>
                  <p className="text-2xl font-bold">{kpis.resultsAbnormal}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Results List */}
          <div className="space-y-2">
            {resultsToReview.map((result) => (
              <div 
                key={result.id} 
                className={`flex items-center gap-3 p-3 border rounded-lg hover:border-rose-200 transition-colors ${result.urgency === 'urgent' ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${result.abnormal ? 'bg-red-100' : 'bg-green-100'}`}>
                  {result.abnormal ? (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{result.patient}</span>
                    {result.urgency === 'urgent' && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">URGENT</span>
                    )}
                    {result.abnormal && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">Abnormal</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{result.testType} • Received {result.receivedAt}</p>
                </div>
                <button 
                  onClick={() => { setActiveModal(null); router.push('/patients'); }}
                  className="px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100"
                >
                  Review
                </button>
              </div>
            ))}
          </div>
        </div>
      </KPIDetailModal>

      {/* Prescriptions Modal */}
      <KPIDetailModal
        isOpen={activeModal === 'prescriptions'}
        onClose={() => setActiveModal(null)}
        title="Prescription Renewals"
        icon={Pill}
        iconColor="text-violet-600"
        iconBg="bg-violet-50"
      >
        <div className="space-y-4">
          {/* Summary Banner */}
          <div className="bg-gradient-to-r from-violet-500 to-purple-500 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-violet-100 text-sm">Renewals Due</p>
                <p className="text-3xl font-bold">{kpis.prescriptionsDue}</p>
              </div>
              <div className="text-right">
                <p className="text-violet-100 text-sm">Overdue</p>
                <p className="text-2xl font-bold">{kpis.prescriptionsOverdue}</p>
              </div>
            </div>
          </div>

          {/* Prescriptions List */}
          <div className="space-y-3">
            {prescriptionRenewals.map((rx) => (
              <div key={rx.id} className="border border-gray-200 rounded-lg p-4 hover:border-violet-200 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${rx.daysOverdue > 0 ? 'bg-red-100' : 'bg-violet-100'}`}>
                      <Pill className={`w-5 h-5 ${rx.daysOverdue > 0 ? 'text-red-600' : 'text-violet-600'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{rx.patient}</p>
                      <p className="text-sm text-gray-600">{rx.medication}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Last issued: {rx.lastIssued}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {rx.daysOverdue > 0 ? (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">
                        {rx.daysOverdue}d overdue
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                        Due now
                      </span>
                    )}
                    <button 
                      onClick={() => { setActiveModal(null); router.push('/patients'); }}
                      className="px-3 py-1.5 text-xs font-medium text-violet-600 bg-violet-50 rounded-lg hover:bg-violet-100"
                    >
                      Renew
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Batch Actions</p>
            <div className="flex gap-2">
              <button className="flex-1 py-2 text-sm font-medium text-violet-600 bg-white border border-violet-200 rounded-lg hover:bg-violet-50">
                Renew All ({kpis.prescriptionsDue})
              </button>
              <button className="flex-1 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                Review First
              </button>
            </div>
          </div>
        </div>
      </KPIDetailModal>
    </div>
  )
}

// ============================================================
// MANAGER CONTROL ROOM ("Operations" vibe)
// ============================================================

// Types for manager demo data
interface Escalation {
  id: string
  type: 'claim-rejected' | 'overdue-balance' | 'repeated-dna' | 'staffing-gap' | 'compliance'
  severity: 'critical' | 'high' | 'medium'
  title: string
  detail: string
  amount?: number
  patient?: string
  action: { label: string; href: string }
}

interface RevenueData {
  today: number
  todayTarget: number
  week: number
  weekTarget: number
  vsLastWeek: number
}

interface InvoiceData {
  outstanding: number
  totalAmount: number
  avgDaysOutstanding: number
  over30Days: number
  over60Days: number
  over90Days: number
}

interface UtilisationData {
  overall: number
  target: number
  practitioners: { name: string; utilisation: number; color: string }[]
  cancellationsToday: number
  cancellationsWeek: number
}

interface NoShowData {
  rate: number
  target: number
  count: number
  costPerWeek: number
  trend: string
}

function ManagerControlRoom() {
  const router = useRouter()
  const [insightIndex, setInsightIndex] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeModal, setActiveModal] = useState<'revenue' | 'invoices' | 'utilisation' | 'noshows' | null>(null)

  // Manager-specific insights
  const managerInsights = useMemo(() => [
    {
      icon: 'dollar',
      iconColor: 'text-red-600',
      iconBg: 'bg-red-100',
      title: "You're losing £1,840/week to DNAs",
      subtitle: '— enable deposit rule for new patients?',
      detail: 'New patient appointments have 18% DNA rate vs 6% for regulars. A £25 deposit could recover £1,200/week.',
      actionLabel: 'Configure Deposits',
      actionHref: '/care'
    },
    {
      icon: 'alert',
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
      title: 'Billing backlog: 115 invoices unsent',
      subtitle: '— assign to Alice today?',
      detail: '£34,500 in revenue at risk. Average age: 12 days. Auto-assign bulk task to clear backlog.',
      actionLabel: 'Assign Tasks',
      actionHref: '/tasks'
    },
    {
      icon: 'chart',
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      title: 'Practitioner utilisation gap detected',
      subtitle: '',
      detail: 'Dr. Patel at 92%, Dr. Jones at 61%. Consider moving 2 afternoon slots from Patel to Jones.',
      actionLabel: 'View Schedule',
      actionHref: '/calendar'
    },
    {
      icon: 'trending-down',
      iconColor: 'text-rose-600',
      iconBg: 'bg-rose-100',
      title: 'Patient churn rising with Bupa',
      subtitle: '— investigate denial delays',
      detail: '23% of Bupa patients haven\'t rebooked in 6 months vs 12% average. 8 claims pending >30 days.',
      actionLabel: 'View Claims',
      actionHref: '/billing'
    },
    {
      icon: 'target',
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-100',
      title: 'Revenue on track for record month',
      subtitle: '',
      detail: '£124,500 collected, £18,000 ahead of target. Private consultations up 23% from last month.',
      actionLabel: 'View Report',
      actionHref: '/insights'
    },
    {
      icon: 'clock',
      iconColor: 'text-violet-600',
      iconBg: 'bg-violet-100',
      title: '3 staff approaching overtime threshold',
      subtitle: '',
      detail: 'Alice (38h), Marcus (37h), Dr. Patel (39h). Consider redistributing shifts to avoid overtime costs.',
      actionLabel: 'View Rota',
      actionHref: '/calendar'
    },
  ], [])

  const currentInsight = managerInsights[insightIndex % managerInsights.length]

  const handleRefreshInsight = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setInsightIndex((prev) => (prev + 1) % managerInsights.length)
      setIsRefreshing(false)
    }, 300)
  }

  // ============================================================
  // MANAGER DEMO DATA
  // ============================================================

  // Revenue data
  const revenueData: RevenueData = useMemo(() => ({
    today: 4850,
    todayTarget: 4200,
    week: 28450,
    weekTarget: 25000,
    vsLastWeek: 12
  }), [])

  // Outstanding invoices
  const invoiceData: InvoiceData = useMemo(() => ({
    outstanding: 47,
    totalAmount: 34580,
    avgDaysOutstanding: 18,
    over30Days: 12,
    over60Days: 5,
    over90Days: 2
  }), [])

  // Utilisation
  const utilisationData: UtilisationData = useMemo(() => ({
    overall: 78,
    target: 85,
    practitioners: [
      { name: 'Dr. Patel', utilisation: 92, color: 'emerald' },
      { name: 'Dr. Jones', utilisation: 61, color: 'amber' },
      { name: 'Dr. Wilson', utilisation: 84, color: 'blue' },
      { name: 'Nurse Lee', utilisation: 88, color: 'emerald' },
    ],
    cancellationsToday: 4,
    cancellationsWeek: 18
  }), [])

  // No-show data
  const noShowData: NoShowData = useMemo(() => ({
    rate: 8.2,
    target: 5,
    count: 26,
    costPerWeek: 1840,
    trend: '+1.2%'
  }), [])

  // Escalations (shorter but more severe)
  const escalations: Escalation[] = useMemo(() => [
    {
      id: 'esc-1',
      type: 'claim-rejected',
      severity: 'critical',
      title: 'Bupa claim rejected - £2,400',
      detail: 'Mrs. Thompson - "Pre-authorization expired". Appeal deadline: 3 days',
      amount: 2400,
      patient: 'Mrs. Thompson',
      action: { label: 'Appeal', href: '/billing' }
    },
    {
      id: 'esc-2',
      type: 'overdue-balance',
      severity: 'critical',
      title: 'Balance over 90 days - £3,850',
      detail: 'Mr. Henderson - Multiple payment plans failed. Consider collections.',
      amount: 3850,
      patient: 'Mr. Henderson',
      action: { label: 'Review', href: '/billing' }
    },
    {
      id: 'esc-3',
      type: 'repeated-dna',
      severity: 'high',
      title: 'Repeated DNA - 3rd in 2 months',
      detail: 'Ms. Garcia - Cost impact: £180. Block future bookings without deposit?',
      patient: 'Ms. Garcia',
      action: { label: 'Set Policy', href: '/patients' }
    },
    {
      id: 'esc-4',
      type: 'staffing-gap',
      severity: 'high',
      title: 'Staffing gap tomorrow AM',
      detail: 'Nurse Lee called in sick. 8 appointments at risk. On-call: Sarah M.',
      action: { label: 'Manage', href: '/calendar' }
    },
    {
      id: 'esc-5',
      type: 'compliance',
      severity: 'medium',
      title: 'CQC documentation due in 7 days',
      detail: 'Annual infection control audit. 3 items pending: training logs, equipment checks.',
      action: { label: 'View Tasks', href: '/tasks' }
    },
    {
      id: 'esc-6',
      type: 'claim-rejected',
      severity: 'high',
      title: 'AXA pre-auth pending >14 days',
      detail: '4 claims totaling £1,680 stuck in review. Chase required.',
      amount: 1680,
      action: { label: 'Chase', href: '/billing' }
    },
  ], [])

  // KPIs derived from data
  const kpis = useMemo(() => ({
    revenueToday: revenueData.today,
    revenueWeek: revenueData.week,
    revenueVsTarget: Math.round(((revenueData.week - revenueData.weekTarget) / revenueData.weekTarget) * 100),
    outstandingInvoices: invoiceData.outstanding,
    outstandingAmount: invoiceData.totalAmount,
    avgDaysOutstanding: invoiceData.avgDaysOutstanding,
    utilisation: utilisationData.overall,
    utilisationTarget: utilisationData.target,
    cancellations: utilisationData.cancellationsWeek,
    noShowRate: noShowData.rate,
    noShowTarget: noShowData.target,
    noShowCost: noShowData.costPerWeek,
    escalationCount: escalations.filter(e => e.severity === 'critical' || e.severity === 'high').length
  }), [revenueData, invoiceData, utilisationData, noShowData, escalations])

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200'
      case 'high': return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'medium': return 'bg-blue-100 text-blue-700 border-blue-200'
      default: return 'bg-gray-100 text-gray-600 border-gray-200'
    }
  }

  const getEscalationIcon = (type: string) => {
    switch (type) {
      case 'claim-rejected': return <AlertOctagon className="w-4 h-4" />
      case 'overdue-balance': return <Banknote className="w-4 h-4" />
      case 'repeated-dna': return <UserCog className="w-4 h-4" />
      case 'staffing-gap': return <Users className="w-4 h-4" />
      case 'compliance': return <ClipboardCheck className="w-4 h-4" />
      default: return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getEscalationColor = (type: string) => {
    switch (type) {
      case 'claim-rejected': return 'text-red-600 bg-red-50'
      case 'overdue-balance': return 'text-rose-600 bg-rose-50'
      case 'repeated-dna': return 'text-amber-600 bg-amber-50'
      case 'staffing-gap': return 'text-violet-600 bg-violet-50'
      case 'compliance': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  // Current time
  const now = new Date()

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operations Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} • Week {Math.ceil((now.getDate()) / 7)}
          </p>
          </div>
        <div className="flex items-center gap-3">
          {kpis.escalationCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 rounded-full text-sm font-medium">
              <AlertTriangle className="w-4 h-4" />
              {kpis.escalationCount} escalations
            </div>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-emerald-500 rounded-full" />
            Practice Open
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <button 
          onClick={() => setActiveModal('revenue')}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-emerald-200 transition-all text-left group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Revenue (Week)</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">£{(kpis.revenueWeek / 1000).toFixed(1)}k</p>
              <p className="text-xs text-emerald-600 mt-1 font-medium">+{kpis.revenueVsTarget}% vs target</p>
        </div>
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <DollarSign className="w-5 h-5 text-emerald-600" />
        </div>
        </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs text-gray-500">View breakdown</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </button>

        {/* Outstanding Invoices */}
        <button 
          onClick={() => setActiveModal('invoices')}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-amber-200 transition-all text-left group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Outstanding</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">£{(kpis.outstandingAmount / 1000).toFixed(1)}k</p>
              <p className="text-xs text-gray-500 mt-1">{kpis.outstandingInvoices} invoices • Avg {kpis.avgDaysOutstanding}d</p>
            </div>
            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <CreditCard className="w-5 h-5 text-amber-600" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs text-gray-500">View aging</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </button>

        {/* Utilisation */}
        <button 
          onClick={() => setActiveModal('utilisation')}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-blue-200 transition-all text-left group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Utilisation</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{kpis.utilisation}%</p>
              <p className="text-xs text-gray-500 mt-1">Target: {kpis.utilisationTarget}% • {kpis.cancellations} cancelled</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs text-gray-500">View by practitioner</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </button>

        {/* No-Show Rate */}
        <button 
          onClick={() => setActiveModal('noshows')}
          className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-rose-200 transition-all text-left group"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">No-Show Rate</p>
              <p className="text-3xl font-bold text-rose-600 mt-1">{kpis.noShowRate}%</p>
              <p className="text-xs text-rose-600 mt-1 font-medium">£{kpis.noShowCost.toLocaleString()}/week lost</p>
            </div>
            <div className="w-10 h-10 bg-rose-50 rounded-lg flex items-center justify-center group-hover:bg-rose-100 transition-colors">
              <Target className="w-5 h-5 text-rose-600" />
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs text-gray-500">View analysis</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Escalations Queue (2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-red-50 to-amber-50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-amber-500 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Escalations & Exceptions</h2>
                <p className="text-xs text-gray-500">{escalations.length} items require attention</p>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-50 max-h-[380px] overflow-y-auto">
            {escalations.map((item) => (
              <div 
                key={item.id}
                className="px-5 py-3 hover:bg-gray-50 transition-colors flex items-center gap-4 group"
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${getEscalationColor(item.type)}`}>
                  {getEscalationIcon(item.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{item.title}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getSeverityStyles(item.severity)}`}>
                      {item.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 truncate mt-0.5">{item.detail}</p>
                </div>
                
                <button
                  onClick={() => router.push(item.action.href)}
                  className="px-3 py-1.5 text-sm font-medium text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100"
                >
                  {item.action.label}
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column - AI Insights + Quick Actions */}
        <div className="space-y-6">
          {/* AI Insights */}
          <div className="bg-gradient-to-br from-slate-50 via-gray-50 to-slate-50 rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gradient-to-br from-slate-700 to-gray-900 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <h2 className="text-sm font-semibold text-gray-900">AI Insights</h2>
              </div>
              <button
                onClick={handleRefreshInsight}
                disabled={isRefreshing}
                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            <div className={`p-4 transition-opacity duration-300 ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 ${currentInsight.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  {(() => {
                    const IconComponent = insightIcons[currentInsight.icon]
                    return IconComponent ? <IconComponent className={`w-4.5 h-4.5 ${currentInsight.iconColor}`} /> : null
                  })()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{currentInsight.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{currentInsight.subtitle}</p>
                  <p className="text-xs text-gray-500 mt-2">{currentInsight.detail}</p>
                </div>
              </div>
              
              {currentInsight.actionLabel && (
                <button
                  onClick={() => currentInsight.actionHref && router.push(currentInsight.actionHref)}
                  className="mt-3 w-full py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-1"
                >
                  {currentInsight.actionLabel}
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
      </div>

      {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h2>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/care')}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-blue-50 hover:border-blue-200 transition-colors group"
              >
                <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center group-hover:bg-blue-100">
                  <ClipboardCheck className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Configure Policies</span>
              </button>
              
              <button
                onClick={() => router.push('/tasks')}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-violet-50 hover:border-violet-200 transition-colors group"
              >
                <div className="w-9 h-9 bg-violet-50 rounded-lg flex items-center justify-center group-hover:bg-violet-100">
                  <ListTodo className="w-4 h-4 text-violet-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Assign Bulk Tasks</span>
              </button>
              
              <button
                onClick={() => router.push('/insights')}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-emerald-50 hover:border-emerald-200 transition-colors group"
              >
                <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-100">
                  <FileText className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Export Reports</span>
              </button>
              
              <button
                onClick={() => router.push('/calendar')}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-amber-50 hover:border-amber-200 transition-colors group"
              >
                <div className="w-9 h-9 bg-amber-50 rounded-lg flex items-center justify-center group-hover:bg-amber-100">
                  <Users className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Staff Performance</span>
              </button>
              
              <button
                onClick={() => router.push('/care')}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-cyan-50 hover:border-cyan-200 transition-colors group"
              >
                <div className="w-9 h-9 bg-cyan-50 rounded-lg flex items-center justify-center group-hover:bg-cyan-100">
                  <Zap className="w-4 h-4 text-cyan-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Care Autopilot</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trends Strip */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendUp className="w-4 h-4 text-gray-400" />
          Weekly Metrics
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="text-center p-3 bg-emerald-50 rounded-lg">
            <p className="text-2xl font-bold text-emerald-700">£{(revenueData.week / 1000).toFixed(1)}k</p>
            <p className="text-xs text-emerald-600 mt-1">Revenue</p>
            <p className="text-xs text-emerald-700 font-medium mt-1">+{revenueData.vsLastWeek}% vs last week</p>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-700">{utilisationData.overall}%</p>
            <p className="text-xs text-blue-600 mt-1">Utilisation</p>
            <p className="text-xs text-blue-700 font-medium mt-1">Target: {utilisationData.target}%</p>
          </div>
          <div className="text-center p-3 bg-amber-50 rounded-lg">
            <p className="text-2xl font-bold text-amber-700">{invoiceData.outstanding}</p>
            <p className="text-xs text-amber-600 mt-1">Open Invoices</p>
            <p className="text-xs text-amber-700 font-medium mt-1">£{(invoiceData.totalAmount / 1000).toFixed(1)}k value</p>
          </div>
          <div className="text-center p-3 bg-rose-50 rounded-lg">
            <p className="text-2xl font-bold text-rose-700">{noShowData.rate}%</p>
            <p className="text-xs text-rose-600 mt-1">DNA Rate</p>
            <p className="text-xs text-rose-700 font-medium mt-1">{noShowData.trend} this week</p>
          </div>
          <div className="text-center p-3 bg-violet-50 rounded-lg">
            <p className="text-2xl font-bold text-violet-700">24</p>
            <p className="text-xs text-violet-600 mt-1">New Patients</p>
            <p className="text-xs text-violet-700 font-medium mt-1">+18% vs avg</p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MANAGER KPI MODALS */}
      {/* ============================================================ */}

      {/* Revenue Modal */}
      <KPIDetailModal
        isOpen={activeModal === 'revenue'}
        onClose={() => setActiveModal(null)}
        title="Revenue Breakdown"
        icon={DollarSign}
        iconColor="text-emerald-600"
        iconBg="bg-emerald-50"
      >
        <div className="space-y-4">
          {/* Summary Banner */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
      <div>
                <p className="text-emerald-100 text-sm">This Week</p>
                <p className="text-3xl font-bold">£{revenueData.week.toLocaleString()}</p>
            </div>
              <div className="text-right">
                <p className="text-emerald-100 text-sm">vs Target</p>
                <p className="text-2xl font-bold">+{kpis.revenueVsTarget}%</p>
              </div>
            </div>
          </div>

          {/* Daily Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 font-medium">Today</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">£{revenueData.today.toLocaleString()}</p>
              <p className="text-xs text-emerald-600 mt-1">Target: £{revenueData.todayTarget.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs text-gray-500 font-medium">Week Target</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">£{revenueData.weekTarget.toLocaleString()}</p>
              <p className="text-xs text-emerald-600 mt-1">+£{(revenueData.week - revenueData.weekTarget).toLocaleString()} ahead</p>
            </div>
          </div>

          {/* Revenue by Type */}
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">By Service Type</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Consultations</span>
                <span className="text-sm font-medium text-gray-900">£12,400</span>
            </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '44%' }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Procedures</span>
                <span className="text-sm font-medium text-gray-900">£8,200</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '29%' }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Lab Tests</span>
                <span className="text-sm font-medium text-gray-900">£4,850</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-violet-500 h-2 rounded-full" style={{ width: '17%' }} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Other</span>
                <span className="text-sm font-medium text-gray-900">£3,000</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div className="bg-gray-400 h-2 rounded-full" style={{ width: '10%' }} />
              </div>
            </div>
          </div>
        </div>
      </KPIDetailModal>

      {/* Invoices Modal */}
      <KPIDetailModal
        isOpen={activeModal === 'invoices'}
        onClose={() => setActiveModal(null)}
        title="Outstanding Invoices"
        icon={CreditCard}
        iconColor="text-amber-600"
        iconBg="bg-amber-50"
      >
        <div className="space-y-4">
          {/* Summary Banner */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">Total Outstanding</p>
                <p className="text-3xl font-bold">£{invoiceData.totalAmount.toLocaleString()}</p>
            </div>
              <div className="text-right">
                <p className="text-amber-100 text-sm">Invoices</p>
                <p className="text-2xl font-bold">{invoiceData.outstanding}</p>
        </div>
      </div>
          </div>

          {/* Aging Breakdown */}
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-green-700">{invoiceData.outstanding - invoiceData.over30Days}</p>
              <p className="text-xs text-green-600">&lt;30 days</p>
            </div>
            <div className="bg-amber-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-amber-700">{invoiceData.over30Days - invoiceData.over60Days}</p>
              <p className="text-xs text-amber-600">30-60 days</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-orange-700">{invoiceData.over60Days - invoiceData.over90Days}</p>
              <p className="text-xs text-orange-600">60-90 days</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-red-700">{invoiceData.over90Days}</p>
              <p className="text-xs text-red-600">&gt;90 days</p>
            </div>
          </div>

          {/* Top Overdue */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-700">Top Overdue Balances</p>
            </div>
            <div className="divide-y divide-gray-100">
              <div className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Mr. Henderson</p>
                  <p className="text-xs text-gray-500">95 days overdue</p>
                </div>
                <p className="font-bold text-red-600">£3,850</p>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Mrs. Thompson</p>
                  <p className="text-xs text-gray-500">67 days overdue</p>
                </div>
                <p className="font-bold text-orange-600">£2,400</p>
              </div>
              <div className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Mr. Patel</p>
                  <p className="text-xs text-gray-500">45 days overdue</p>
                </div>
                <p className="font-bold text-amber-600">£1,680</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => { setActiveModal(null); router.push('/billing'); }}
            className="w-full py-2.5 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100"
          >
            View All Invoices
          </button>
        </div>
      </KPIDetailModal>

      {/* Utilisation Modal */}
      <KPIDetailModal
        isOpen={activeModal === 'utilisation'}
        onClose={() => setActiveModal(null)}
        title="Capacity Utilisation"
        icon={BarChart3}
        iconColor="text-blue-600"
        iconBg="bg-blue-50"
      >
        <div className="space-y-4">
          {/* Summary Banner */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Overall Utilisation</p>
                <p className="text-3xl font-bold">{utilisationData.overall}%</p>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-sm">Target</p>
                <p className="text-2xl font-bold">{utilisationData.target}%</p>
              </div>
            </div>
          </div>

          {/* By Practitioner */}
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">By Practitioner</p>
            <div className="space-y-4">
              {utilisationData.practitioners.map((prac) => (
                <div key={prac.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">{prac.name}</span>
                    <span className={`text-sm font-medium ${prac.utilisation >= 85 ? 'text-emerald-600' : prac.utilisation >= 70 ? 'text-blue-600' : 'text-amber-600'}`}>
                      {prac.utilisation}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${prac.utilisation >= 85 ? 'bg-emerald-500' : prac.utilisation >= 70 ? 'bg-blue-500' : 'bg-amber-500'}`} 
                      style={{ width: `${prac.utilisation}%` }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cancellations */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-rose-50 rounded-lg p-4">
              <p className="text-xs text-rose-600 font-medium">Cancellations Today</p>
              <p className="text-2xl font-bold text-rose-700 mt-1">{utilisationData.cancellationsToday}</p>
            </div>
            <div className="bg-rose-50 rounded-lg p-4">
              <p className="text-xs text-rose-600 font-medium">This Week</p>
              <p className="text-2xl font-bold text-rose-700 mt-1">{utilisationData.cancellationsWeek}</p>
            </div>
          </div>
        </div>
      </KPIDetailModal>

      {/* No-Shows Modal */}
      <KPIDetailModal
        isOpen={activeModal === 'noshows'}
        onClose={() => setActiveModal(null)}
        title="No-Show Analysis"
        icon={Target}
        iconColor="text-rose-600"
        iconBg="bg-rose-50"
      >
        <div className="space-y-4">
          {/* Summary Banner */}
          <div className="bg-gradient-to-r from-rose-500 to-red-500 rounded-lg p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-rose-100 text-sm">DNA Rate</p>
                <p className="text-3xl font-bold">{noShowData.rate}%</p>
              </div>
              <div className="text-right">
                <p className="text-rose-100 text-sm">Weekly Cost</p>
                <p className="text-2xl font-bold">£{noShowData.costPerWeek.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-gray-900">{noShowData.count}</p>
              <p className="text-xs text-gray-500">DNAs this week</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-gray-900">{noShowData.target}%</p>
              <p className="text-xs text-gray-500">Target rate</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-xl font-bold text-rose-600">{noShowData.trend}</p>
              <p className="text-xs text-gray-500">Trend</p>
            </div>
          </div>

          {/* By Appointment Type */}
          <div className="border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">By Appointment Type</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">New Patient</span>
                <span className="text-sm font-medium text-red-600">18%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Follow-up</span>
                <span className="text-sm font-medium text-amber-600">8%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Procedure</span>
                <span className="text-sm font-medium text-green-600">3%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Lab/Test</span>
                <span className="text-sm font-medium text-green-600">5%</span>
              </div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">AI Recommendation</p>
                <p className="text-xs text-blue-700 mt-1">
                  Enable £25 deposit for New Patient appointments. This could reduce DNA rate by 60% and recover ~£1,200/week.
                </p>
                <button
                  onClick={() => { setActiveModal(null); router.push('/care'); }}
                  className="mt-2 px-3 py-1.5 text-xs font-medium text-blue-700 bg-white border border-blue-200 rounded-lg hover:bg-blue-50"
                >
                  Configure Deposit Rule
                </button>
              </div>
            </div>
          </div>
        </div>
      </KPIDetailModal>
    </div>
  )
}

// ============================================================
// MAIN EXPORT - Role-based routing
// ============================================================

export default function PracticeHome() {
  const { currentRole } = useRole()

  // Render role-specific control room
  if (currentRole === 'reception') {
    return <ReceptionistControlRoom />
  }

  if (currentRole === 'clinician') {
    return <ClinicianControlRoom />
  }

  // Default to manager/owner view
  return <ManagerControlRoom />
}
