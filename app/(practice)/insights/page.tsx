'use client'

import { useState, useMemo, useEffect } from 'react'
import { createPlan } from '@/services/planner'
import { useAutopilot, useData } from '@/store'
import PlanPreviewDrawer from '@/components/PlanPreviewDrawer'
import { Plan } from '@/types/core'
import {
  Calendar,
  MapPin,
  User,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  FileText,
  X,
  ArrowRight,
  BarChart3,
  PieChart,
  Activity,
  Download,
  RefreshCw,
  ChevronRight,
  Zap,
  Target,
  AlertTriangle,
  Info,
  List,
  Table,
  HelpCircle
} from 'lucide-react'

// Types
interface InsightTile {
  id: string
  title: string
  value: string | number
  unit?: string
  asOf: string
  status: 'alert' | 'warn' | 'ok' | 'neutral'
  delta: string
  deltaDirection: 'up' | 'down' | 'flat'
  category: 'revenue' | 'operations' | 'patients' | 'claims'
  icon: React.ReactNode
  primaryAction: {
    label: string
    preview: string
    action: () => void
  }
  drilldown: DrilldownData
}

interface DrilldownData {
  definition: string // How the metric is calculated
  trendData: { date: string; value: number }[]
  breakdown: { 
    dimension: string // "By Practitioner" / "By Payer" etc.
    items: { label: string; value: number; percentage: number }[] 
  }
  underlyingList: {
    title: string
    columns: string[]
    rows: { cells: string[]; highlight?: boolean }[]
  }
  actions: {
    label: string
    preview: string
    phrase: string
  }[]
}

interface FilterState {
  dateRange: '7d' | '30d' | '90d' | 'custom'
  customStart?: string
  customEnd?: string
  location: string
  practitioner: string
  payerType: string
}

export default function InsightsPage() {
  const { role, autopilotMode } = useAutopilot()
  const { practitioners } = useData() as any
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null)
  const [planPreviewOpen, setPlanPreviewOpen] = useState(false)
  const [selectedTile, setSelectedTile] = useState<InsightTile | null>(null)
  const [showDrilldown, setShowDrilldown] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Global filters
  const [filters, setFilters] = useState<FilterState>({
    dateRange: '30d',
    location: 'all',
    practitioner: 'all',
    payerType: 'all'
  })

  // Locations and practitioners for filters
  const locations = ['All Locations', 'Main Clinic', 'Branch Office', 'Satellite']
  const practitionerList = practitioners?.length > 0 
    ? ['All Practitioners', ...practitioners.map((p: any) => p.name)]
    : ['All Practitioners', 'Dr. Sarah Chen', 'Dr. James Wilson', 'Dr. Emily Brooks']
  const payerTypes = ['All Payers', 'Self-Pay', 'NHS', 'Bupa', 'AXA', 'Vitality']

  const handleKpiAction = async (phrase: string) => {
    try {
      const plan = await createPlan(phrase, { 
        actor: 'user', 
        source: 'kpi',
        role,
        autopilotMode 
      })
      
      if (plan) {
        setCurrentPlan(plan)
        setPlanPreviewOpen(true)
      }
    } catch (error) {
      console.error('Failed to create plan from KPI:', error)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    setTimeout(() => {
      setLastUpdated(new Date())
      setIsRefreshing(false)
    }, 1500)
  }

  const openDrilldown = (tile: InsightTile) => {
    setSelectedTile(tile)
    setShowDrilldown(true)
  }

  // Format time since last update
  const getLastUpdatedText = () => {
    const now = new Date()
    const diffMs = now.getTime() - lastUpdated.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins === 1) return '1 min ago'
    if (diffMins < 60) return `${diffMins} mins ago`
    return lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  // Generate insight tiles with drilldown data
  const insightTiles: InsightTile[] = useMemo(() => [
    {
      id: 'claims-aging',
      title: 'Claims Aging (>60d)',
      value: 9,
      unit: 'claims',
      asOf: 'as of today',
      status: 'alert',
      delta: '+3 since last week',
      deltaDirection: 'up',
      category: 'claims',
      icon: <FileText className="w-5 h-5" />,
      primaryAction: {
        label: 'Chase aging claims',
        preview: '9 claims • £12,450 at risk',
        action: () => handleKpiAction('prepare chase batch for 9 aging claims totaling £12,450')
      },
      drilldown: {
        definition: 'Count of insurance claims submitted >60 days ago that remain unpaid or unresolved.',
        trendData: [
          { date: 'Week 1', value: 4 },
          { date: 'Week 2', value: 5 },
          { date: 'Week 3', value: 6 },
          { date: 'Week 4', value: 9 }
        ],
        breakdown: {
          dimension: 'By Insurer',
          items: [
            { label: 'Bupa', value: 4, percentage: 44 },
            { label: 'AXA', value: 3, percentage: 33 },
            { label: 'Vitality', value: 2, percentage: 22 }
          ]
        },
        underlyingList: {
          title: 'Claims >60 Days',
          columns: ['Patient', 'Insurer', 'Amount', 'Days', 'Status'],
          rows: [
            { cells: ['Mrs. Thompson', 'Bupa', '£2,400', '64', 'Pre-auth expired'], highlight: true },
            { cells: ['Mr. Henderson', 'AXA', '£3,850', '87', 'Multiple rejections'], highlight: true },
            { cells: ['Ms. Garcia', 'Vitality', '£1,200', '62', 'Missing docs'], highlight: false },
            { cells: ['Mr. Patel', 'Bupa', '£980', '71', 'Under review'], highlight: false },
            { cells: ['Mrs. Williams', 'Bupa', '£1,450', '65', 'Awaiting response'], highlight: false },
            { cells: ['Dr. Ahmed', 'AXA', '£1,100', '68', 'Disputed'], highlight: false },
            { cells: ['Ms. Brown', 'AXA', '£720', '63', 'Info requested'], highlight: false },
            { cells: ['Mr. Davis', 'Vitality', '£450', '61', 'Processing'], highlight: false },
            { cells: ['Mrs. Lee', 'Bupa', '£300', '60', 'Pending'], highlight: false }
          ]
        },
        actions: [
          { label: 'Chase all 9 claims', preview: '£12,450 total', phrase: 'prepare chase batch for 9 aging claims' },
          { label: 'Escalate top 2 to collections', preview: '£6,250', phrase: 'escalate Henderson and Thompson claims to collections review' },
          { label: 'Set up pre-auth expiry alerts', preview: 'Prevent future aging', phrase: 'configure pre-authorization expiry alerts' }
        ]
      }
    },
    {
      id: 'utilization',
      title: 'Appointment Utilization',
      value: 78,
      unit: '%',
      asOf: `last ${filters.dateRange === '7d' ? '7' : filters.dateRange === '30d' ? '30' : '90'} days`,
      status: 'ok',
      delta: '+2% vs last period',
      deltaDirection: 'up',
      category: 'operations',
      icon: <Activity className="w-5 h-5" />,
      primaryAction: {
        label: 'Fill schedule gaps',
        preview: '12 gaps • ~8 hours this week',
        action: () => handleKpiAction('fill 12 schedule gaps this week totaling 8 hours')
      },
      drilldown: {
        definition: 'Percentage of available appointment slots that were booked, calculated as (booked slots / total slots) × 100.',
        trendData: [
          { date: 'Mon', value: 82 },
          { date: 'Tue', value: 85 },
          { date: 'Wed', value: 78 },
          { date: 'Thu', value: 75 },
          { date: 'Fri', value: 70 }
        ],
        breakdown: {
          dimension: 'By Practitioner',
          items: [
            { label: 'Dr. Chen', value: 88, percentage: 88 },
            { label: 'Dr. Wilson', value: 76, percentage: 76 },
            { label: 'Dr. Brooks', value: 71, percentage: 71 }
          ]
        },
        underlyingList: {
          title: 'Schedule Gaps This Week',
          columns: ['Day', 'Time', 'Practitioner', 'Duration', 'Type'],
          rows: [
            { cells: ['Friday', '14:00', 'Dr. Brooks', '30 min', 'Standard'], highlight: true },
            { cells: ['Friday', '14:30', 'Dr. Brooks', '30 min', 'Standard'], highlight: true },
            { cells: ['Friday', '15:00', 'Dr. Brooks', '30 min', 'Standard'], highlight: true },
            { cells: ['Friday', '15:30', 'Dr. Wilson', '30 min', 'Standard'], highlight: false },
            { cells: ['Thursday', '16:00', 'Dr. Wilson', '30 min', 'Extended'], highlight: false },
            { cells: ['Thursday', '16:30', 'Dr. Wilson', '30 min', 'Standard'], highlight: false },
            { cells: ['Wednesday', '11:00', 'Dr. Brooks', '60 min', 'Extended'], highlight: false },
            { cells: ['Wednesday', '17:00', 'Dr. Chen', '30 min', 'Standard'], highlight: false }
          ]
        },
        actions: [
          { label: 'Contact waitlist patients', preview: '8 patients waiting', phrase: 'contact 8 waitlist patients to fill schedule gaps' },
          { label: 'Reduce Friday afternoon slots', preview: '15% avg utilization', phrase: 'review and reduce Friday afternoon availability' },
          { label: 'Reallocate Dr. Brooks mornings', preview: 'Low demand period', phrase: 'reallocate Dr Brooks morning slots to high-demand times' }
        ]
      }
    },
    {
      id: 'no-show-rate',
      title: 'No-Show Rate',
      value: 8.2,
      unit: '%',
      asOf: 'last 30 days',
      status: 'warn',
      delta: '+1.2% vs last month',
      deltaDirection: 'up',
      category: 'operations',
      icon: <Users className="w-5 h-5" />,
      primaryAction: {
        label: 'Configure reminders',
        preview: '45% have no reminder set',
        action: () => handleKpiAction('configure appointment reminders for patients without reminder preferences')
      },
      drilldown: {
        definition: 'Percentage of scheduled appointments where patient did not attend without prior cancellation, calculated as (no-shows / total scheduled) × 100.',
        trendData: [
          { date: 'Week 1', value: 6.5 },
          { date: 'Week 2', value: 7.1 },
          { date: 'Week 3', value: 8.8 },
          { date: 'Week 4', value: 8.2 }
        ],
        breakdown: {
          dimension: 'By Patient Type',
          items: [
            { label: 'New patients', value: 18, percentage: 55 },
            { label: 'Repeat DNAs', value: 10, percentage: 30 },
            { label: 'Follow-ups', value: 5, percentage: 15 }
          ]
        },
        underlyingList: {
          title: 'Recent No-Shows (Last 30 Days)',
          columns: ['Patient', 'Date', 'Time', 'Practitioner', 'Type', 'DNAs'],
          rows: [
            { cells: ['Ms. Garcia', 'Dec 18', '10:00', 'Dr. Chen', 'New', '3'], highlight: true },
            { cells: ['Mr. Thompson', 'Dec 17', '14:30', 'Dr. Wilson', 'Follow-up', '2'], highlight: true },
            { cells: ['Mrs. Patel', 'Dec 16', '09:00', 'Dr. Brooks', 'New', '1'], highlight: false },
            { cells: ['Mr. Lee', 'Dec 15', '11:00', 'Dr. Chen', 'Review', '1'], highlight: false },
            { cells: ['Ms. Brown', 'Dec 14', '15:30', 'Dr. Wilson', 'New', '1'], highlight: false }
          ]
        },
      actions: [
          { label: 'Enable SMS reminders', preview: '48h + 2h before', phrase: 'enable SMS reminders 48 hours and 2 hours before appointments' },
          { label: 'Require deposit for new patients', preview: '£25 • ~£1,200/week saved', phrase: 'enable £25 deposit requirement for new patient bookings' },
          { label: 'Flag repeat no-show patients', preview: '3 patients with 2+ DNAs', phrase: 'flag patients with 2 or more no-shows for deposit requirement' }
        ]
      }
    },
    {
      id: 'revenue-week',
      title: 'Weekly Revenue',
      value: '£28.4k',
      asOf: 'this week',
      status: 'ok',
      delta: '+14% vs target',
      deltaDirection: 'up',
      category: 'revenue',
      icon: <DollarSign className="w-5 h-5" />,
      primaryAction: {
        label: 'View revenue breakdown',
        preview: '142 transactions this week',
        action: () => openDrilldown(insightTiles.find(t => t.id === 'revenue-week')!)
      },
      drilldown: {
        definition: 'Total revenue collected (payments received) during the current Monday–Sunday period.',
        trendData: [
          { date: 'Mon', value: 4200 },
          { date: 'Tue', value: 5800 },
          { date: 'Wed', value: 6100 },
          { date: 'Thu', value: 5900 },
          { date: 'Fri', value: 6400 }
        ],
        breakdown: {
          dimension: 'By Service Category',
          items: [
            { label: 'Consultations', value: 15200, percentage: 54 },
            { label: 'Procedures', value: 8400, percentage: 30 },
            { label: 'Admin fees', value: 4800, percentage: 16 }
          ]
        },
        underlyingList: {
          title: 'Top Transactions This Week',
          columns: ['Patient', 'Service', 'Practitioner', 'Amount', 'Payer'],
          rows: [
            { cells: ['Mr. Henderson', 'Minor Surgery', 'Dr. Chen', '£450', 'Self-pay'], highlight: false },
            { cells: ['Mrs. Williams', 'Health Check (Comp)', 'Dr. Wilson', '£350', 'Bupa'], highlight: false },
            { cells: ['Ms. Patel', 'Extended Consult', 'Dr. Brooks', '£120', 'AXA'], highlight: false },
            { cells: ['Mr. Davis', 'Standard Consult', 'Dr. Chen', '£75', 'Self-pay'], highlight: false },
            { cells: ['Mrs. Lee', 'Vaccination', 'Dr. Wilson', '£45', 'NHS'], highlight: false }
          ]
        },
      actions: [
          { label: 'Review uncaptured revenue', preview: '3 unbilled services', phrase: 'review and bill 3 unbilled services from this week' },
          { label: 'Promote health checks', preview: 'High margin service', phrase: 'create campaign to promote comprehensive health checks' }
        ]
      }
    },
    {
      id: 'outstanding',
      title: 'Outstanding Balance',
      value: '£34.6k',
      asOf: '47 invoices',
      status: 'warn',
      delta: 'Avg 18 days',
      deltaDirection: 'flat',
      category: 'revenue',
      icon: <Clock className="w-5 h-5" />,
      primaryAction: {
        label: 'Chase overdue invoices',
        preview: '23 invoices >14d • £18,200',
        action: () => handleKpiAction('chase 23 overdue invoices over 14 days totaling £18,200')
      },
      drilldown: {
        definition: 'Total unpaid invoice balance across all patients, excluding invoices issued in the last 7 days.',
        trendData: [
          { date: 'Week 1', value: 32100 },
          { date: 'Week 2', value: 35400 },
          { date: 'Week 3', value: 33800 },
          { date: 'Week 4', value: 34600 }
        ],
        breakdown: {
          dimension: 'By Aging Bucket',
          items: [
            { label: '0-14 days', value: 14200, percentage: 41 },
            { label: '14-30 days', value: 11800, percentage: 34 },
            { label: '30-60 days', value: 5400, percentage: 16 },
            { label: '>60 days', value: 3200, percentage: 9 }
          ]
        },
        underlyingList: {
          title: 'Largest Outstanding Balances',
          columns: ['Patient', 'Balance', 'Days', 'Last Payment', 'Status'],
          rows: [
            { cells: ['Mr. Henderson', '£3,850', '87', 'Never', 'Collections review'], highlight: true },
            { cells: ['Mrs. Thompson', '£2,400', '64', '3 months ago', 'Insurance dispute'], highlight: true },
            { cells: ['Corporate #1', '£4,200', '45', '2 weeks ago', 'Payment plan'], highlight: false },
            { cells: ['Ms. Garcia', '£1,800', '32', '1 month ago', 'Reminder sent'], highlight: false },
            { cells: ['Mr. Patel', '£1,450', '28', '2 months ago', 'Awaiting response'], highlight: false }
          ]
        },
      actions: [
          { label: 'Send payment reminders', preview: '23 patients >14 days', phrase: 'send payment reminders to 23 patients with invoices over 14 days' },
          { label: 'Escalate to collections', preview: '2 patients >60 days', phrase: 'escalate Henderson and Thompson to collections review' },
          { label: 'Enable auto-chase', preview: 'At 7 + 14 + 30 days', phrase: 'configure automatic payment chase at 7, 14, and 30 day intervals' }
        ]
      }
    },
    {
      id: 'patient-satisfaction',
      title: 'Patient Satisfaction',
      value: 4.8,
      unit: '/5',
      asOf: 'last 30 reviews',
      status: 'ok',
      delta: '+0.2 improvement',
      deltaDirection: 'up',
      category: 'patients',
      icon: <Target className="w-5 h-5" />,
      primaryAction: {
        label: 'View recent feedback',
        preview: '8 new comments this week',
        action: () => openDrilldown(insightTiles.find(t => t.id === 'patient-satisfaction')!)
      },
      drilldown: {
        definition: 'Average rating from post-visit patient surveys on a 1-5 scale, based on responses from the last 30 days.',
        trendData: [
          { date: 'Jan', value: 4.5 },
          { date: 'Feb', value: 4.6 },
          { date: 'Mar', value: 4.7 },
          { date: 'Apr', value: 4.8 }
        ],
        breakdown: {
          dimension: 'By Category',
          items: [
            { label: 'Staff friendliness', value: 4.9, percentage: 98 },
            { label: 'Care quality', value: 4.8, percentage: 96 },
            { label: 'Facility', value: 4.7, percentage: 94 },
            { label: 'Wait time', value: 4.2, percentage: 84 }
          ]
        },
        underlyingList: {
          title: 'Recent Patient Comments',
          columns: ['Date', 'Patient', 'Rating', 'Comment'],
          rows: [
            { cells: ['Dec 20', 'Mrs. Lee', '5/5', 'Excellent care, very thorough'], highlight: false },
            { cells: ['Dec 19', 'Mr. Patel', '5/5', 'Dr. Chen was fantastic'], highlight: false },
            { cells: ['Dec 18', 'Ms. Brown', '4/5', 'Good but waited 20 mins'], highlight: false },
            { cells: ['Dec 17', 'Mr. Davis', '5/5', 'Quick and professional'], highlight: false },
            { cells: ['Dec 16', 'Mrs. Williams', '3/5', 'Long wait, felt rushed'], highlight: true }
          ]
        },
      actions: [
          { label: 'Address wait time concerns', preview: '3 negative mentions', phrase: 'review appointment scheduling to reduce patient wait times' },
          { label: 'Send more surveys', preview: '45% response rate', phrase: 'increase post-visit survey distribution to improve response rate' }
        ]
      }
    }
  ], [filters.dateRange])

  // Filter date range label
  const getDateRangeLabel = () => {
    switch (filters.dateRange) {
      case '7d': return 'Last 7 days'
      case '30d': return 'Last 30 days'
      case '90d': return 'Last 90 days'
      case 'custom': return 'Custom range'
      default: return 'Last 30 days'
    }
  }

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'alert': return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'text-red-500', badge: 'bg-red-100 text-red-700' }
      case 'warn': return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-500', badge: 'bg-amber-100 text-amber-700' }
      case 'ok': return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'text-emerald-500', badge: 'bg-emerald-100 text-emerald-700' }
      default: return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700', icon: 'text-gray-500', badge: 'bg-gray-100 text-gray-700' }
    }
  }

  // Count active filters
  const activeFilterCount = [
    filters.location !== 'all',
    filters.practitioner !== 'all',
    filters.payerType !== 'all'
  ].filter(Boolean).length

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Insights & Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Trends, breakdowns, and data-driven decisions for your practice
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Global Filter Bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Date Range */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({ ...filters, dateRange: e.target.value as FilterState['dateRange'] })}
                className="text-sm font-medium text-gray-700 bg-transparent border-none focus:ring-0 cursor-pointer pr-8"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="custom">Custom range</option>
              </select>
            </div>

            <div className="h-6 w-px bg-gray-200" />

            {/* Location */}
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <select
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="text-sm text-gray-700 bg-transparent border-none focus:ring-0 cursor-pointer pr-8"
              >
                {locations.map(loc => (
                  <option key={loc} value={loc === 'All Locations' ? 'all' : loc}>{loc}</option>
                ))}
              </select>
            </div>

            <div className="h-6 w-px bg-gray-200" />

            {/* Practitioner */}
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-400" />
              <select
                value={filters.practitioner}
                onChange={(e) => setFilters({ ...filters, practitioner: e.target.value })}
                className="text-sm text-gray-700 bg-transparent border-none focus:ring-0 cursor-pointer pr-8"
              >
                {practitionerList.map((p: string) => (
                  <option key={p} value={p === 'All Practitioners' ? 'all' : p}>{p}</option>
                ))}
              </select>
            </div>
            
            <div className="h-6 w-px bg-gray-200" />

            {/* Payer Type */}
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gray-400" />
              <select
                value={filters.payerType}
                onChange={(e) => setFilters({ ...filters, payerType: e.target.value })}
                className="text-sm text-gray-700 bg-transparent border-none focus:ring-0 cursor-pointer pr-8"
              >
                {payerTypes.map(payer => (
                  <option key={payer} value={payer === 'All Payers' ? 'all' : payer}>{payer}</option>
                ))}
              </select>
            </div>
              </div>

          {/* Right side: Last updated + Clear filters */}
          <div className="flex items-center gap-4">
            {/* Data freshness indicator */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className={`w-2 h-2 rounded-full ${isRefreshing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
              <span>Updated {getLastUpdatedText()}</span>
              <button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
                title="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Clear filters */}
            {activeFilterCount > 0 && (
              <>
                <div className="h-6 w-px bg-gray-200" />
                <button
                  onClick={() => setFilters({ ...filters, location: 'all', practitioner: 'all', payerType: 'all' })}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                  Clear ({activeFilterCount})
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Insight Tiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        {insightTiles.map((tile) => {
          const styles = getStatusStyles(tile.status)
          return (
            <div
              key={tile.id}
              className={`${styles.bg} ${styles.border} border rounded-xl p-5 transition-all hover:shadow-md`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg bg-white/80 ${styles.icon}`}>
                    {tile.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">{tile.title}</h3>
                    <p className="text-xs text-gray-500">{tile.asOf}</p>
                  </div>
                </div>
              </div>

              {/* Value */}
              <div className="mb-4">
                <div className={`text-3xl font-bold ${styles.text}`}>
                  {tile.value}{tile.unit && <span className="text-lg font-medium ml-0.5">{tile.unit}</span>}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {tile.deltaDirection === 'up' && <TrendingUp className={`w-3.5 h-3.5 ${tile.status === 'ok' ? 'text-emerald-500' : 'text-red-500'}`} />}
                  {tile.deltaDirection === 'down' && <TrendingDown className={`w-3.5 h-3.5 ${tile.status === 'ok' ? 'text-emerald-500' : 'text-red-500'}`} />}
                  <span className="text-xs text-gray-600">{tile.delta}</span>
                </div>
              </div>

              {/* Single Primary Action */}
              <button
                onClick={tile.primaryAction.action}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors group mb-2"
              >
                <span className="font-medium text-gray-700">{tile.primaryAction.label}</span>
                <span className="text-xs text-gray-400 group-hover:text-gray-600">{tile.primaryAction.preview}</span>
              </button>
              
              {/* View Details Link */}
              <button
                onClick={() => openDrilldown(tile)}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                View details & breakdown
              </button>
            </div>
          )
        })}
      </div>

      {/* Weekly Summary */}
      <div className="bg-gradient-to-r from-slate-50 to-blue-50 border border-slate-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm">
            <Zap className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">AI Summary — {getDateRangeLabel()}</h2>
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                Your practice is performing well overall with strong utilization (78%) and patient satisfaction (4.8/5). 
              </p>
              <p>
                <strong className="text-amber-700">Key attention areas:</strong> 9 claims are aging over 60 days (£12,450 at risk), 
                and the no-show rate has increased to 8.2%. A £25 deposit for new patients could recover ~£1,200/week.
              </p>
              <p>
                <strong className="text-emerald-700">Wins:</strong> Weekly revenue is 14% above target, and patient satisfaction 
                improved by 0.2 points.
              </p>
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button 
                onClick={() => handleKpiAction('prepare action plan for top 3 issues')}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Zap className="w-4 h-4" />
                Create action plan
              </button>
              <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                Download full report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Drilldown Drawer */}
      {showDrilldown && selectedTile && (
        <div 
          className="fixed inset-0 bg-black/40 z-50 flex justify-end"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowDrilldown(false)
              setSelectedTile(null)
            }
          }}
        >
          <div className="w-full max-w-3xl bg-white shadow-xl overflow-hidden flex flex-col animate-in slide-in-from-right">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${getStatusStyles(selectedTile.status).bg}`}>
                  {selectedTile.icon}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedTile.title}</h2>
                  <p className="text-sm text-gray-500">{selectedTile.asOf} • {getDateRangeLabel()}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowDrilldown(false)
                  setSelectedTile(null)
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Current Value + Status */}
              <div className={`p-4 rounded-xl ${getStatusStyles(selectedTile.status).bg} ${getStatusStyles(selectedTile.status).border} border`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Current Value</p>
                    <p className={`text-4xl font-bold ${getStatusStyles(selectedTile.status).text}`}>
                      {selectedTile.value}{selectedTile.unit}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{selectedTile.delta}</p>
                  </div>
                  <div className="text-right">
                    {selectedTile.status === 'alert' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                        <AlertCircle className="w-4 h-4" />
                        Needs attention
                      </span>
                    )}
                    {selectedTile.status === 'warn' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 text-sm font-medium rounded-full">
                        <AlertTriangle className="w-4 h-4" />
                        Monitor
                      </span>
                    )}
                    {selectedTile.status === 'ok' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full">
                        <CheckCircle className="w-4 h-4" />
                        On track
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 1. Trend Chart */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gray-400" />
                  Trend Over Time
                </h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-end justify-between h-32 gap-2">
                    {selectedTile.drilldown.trendData.map((point, idx) => {
                      const maxVal = Math.max(...selectedTile.drilldown.trendData.map(p => p.value))
                      const height = (point.value / maxVal) * 100
                      const isLast = idx === selectedTile.drilldown.trendData.length - 1
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-xs text-gray-500 mb-1">
                            {typeof point.value === 'number' && point.value > 100 
                              ? `£${(point.value / 1000).toFixed(1)}k` 
                              : point.value
                            }
                          </span>
                          <div 
                            className={`w-full rounded-t-lg transition-all ${
                              isLast 
                                ? selectedTile.status === 'ok' ? 'bg-emerald-400' : selectedTile.status === 'warn' ? 'bg-amber-400' : 'bg-red-400'
                                : 'bg-gray-300'
                            }`}
                            style={{ height: `${height}%` }}
                          />
                          <span className="text-xs text-gray-500">{point.date}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* 2. Breakdown */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <PieChart className="w-4 h-4 text-gray-400" />
                  {selectedTile.drilldown.breakdown.dimension}
                </h3>
                <div className="space-y-3">
                  {selectedTile.drilldown.breakdown.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{item.label}</span>
                          <span className="text-sm text-gray-600">
                            {typeof item.value === 'number' && item.value > 100 
                              ? `£${item.value.toLocaleString()}` 
                              : `${item.value}${selectedTile.unit || ''}`
                            }
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-blue-400' : idx === 2 ? 'bg-blue-300' : 'bg-blue-200'
                            }`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 w-10 text-right">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Underlying List */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Table className="w-4 h-4 text-gray-400" />
                  {selectedTile.drilldown.underlyingList.title}
                </h3>
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        {selectedTile.drilldown.underlyingList.columns.map((col, idx) => (
                          <th key={idx} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedTile.drilldown.underlyingList.rows.map((row, idx) => (
                        <tr key={idx} className={row.highlight ? 'bg-amber-50' : 'hover:bg-gray-50'}>
                          {row.cells.map((cell, cellIdx) => (
                            <td key={cellIdx} className="px-4 py-2.5 text-gray-700">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. Actions */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-gray-400" />
                  Available Actions
                </h3>
                <div className="space-y-2">
                  {selectedTile.drilldown.actions.map((action, idx) => (
                    <button 
                      key={idx} 
                      onClick={() => handleKpiAction(action.phrase)}
                      className="w-full flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                          <ArrowRight className="w-4 h-4 text-blue-600" />
                        </div>
                        <span className="text-sm font-medium text-blue-800">{action.label}</span>
                      </div>
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">{action.preview}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Metric Definition */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">How this is calculated</h4>
                    <p className="text-sm text-gray-600">{selectedTile.drilldown.definition}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowDrilldown(false)
                  setSelectedTile(null)
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Close
              </button>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <button 
                  onClick={() => handleKpiAction(selectedTile.drilldown.actions[0]?.phrase || '')}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  {selectedTile.drilldown.actions[0]?.label || 'Take action'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan Preview Drawer */}
      <PlanPreviewDrawer
        plan={currentPlan}
        isOpen={planPreviewOpen}
        onClose={() => {
          setPlanPreviewOpen(false)
          setCurrentPlan(null)
        }}
      />
    </div>
  )
}
