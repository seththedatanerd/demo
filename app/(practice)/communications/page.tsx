'use client'

import { useState, useEffect } from 'react'
import { 
  Mail, MessageSquare, Phone, Calendar, Users, Clock, Send, Eye, 
  TestTube, Play, Pause, Pencil, Trash2, Plus, Filter, ChevronDown,
  CheckCircle, AlertCircle, XCircle, RefreshCw, Settings, BarChart3,
  TrendingUp, Target, UserCheck, UserX, CalendarCheck, Megaphone,
  FileText, Search, MoreVertical
} from 'lucide-react'

interface AudienceRule {
  id: string
  type: 'demographic' | 'clinical' | 'behavioral'
  field: string
  operator: 'equals' | 'between' | 'greater_than' | 'less_than' | 'contains' | 'not_contains'
  value: string | number | [number, number]
  label: string
}

interface ExclusionRule {
  id: string
  type: 'opt_out' | 'already_booked' | 'contacted_recently' | 'custom'
  label: string
  value?: string | number
  enabled: boolean
}

interface CampaignSchedule {
  type: 'immediate' | 'scheduled' | 'recurring'
  scheduledDate?: string
  scheduledTime?: string
  recurringFrequency?: 'daily' | 'weekly' | 'monthly'
  recurringDay?: number
}

interface CampaignCard {
  id: string
  title: string
  description: string
  ctaText: string
  ctaLink: string
  audienceRules: AudienceRule[]
  exclusions: ExclusionRule[]
  whyThisText: string
  priority: 'low' | 'medium' | 'high'
  validUntil: string
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed'
  createdAt: string
  estimatedReach: number
  owner: string
  lastSent?: string
  nextSend?: string
  frequencyCap: {
    enabled: boolean
    maxPerPatient: number
    periodDays: number
  }
  channels: {
    sms: { enabled: boolean; template: string }
    email: { enabled: boolean; template: string; subject: string }
    letter: { enabled: boolean }
  }
  analytics?: {
    sent: number
    delivered: number
    opened: number
    clicked: number
    booked: number
    optedOut: number
  }
  schedule: CampaignSchedule
}


const RULE_TEMPLATES: AudienceRule[] = [
  { id: '1', type: 'demographic', field: 'gender', operator: 'equals', value: 'male', label: 'Male patients' },
  { id: '2', type: 'demographic', field: 'age', operator: 'between', value: [50, 70], label: 'Age 50-70' },
  { id: '3', type: 'behavioral', field: 'lastVisit', operator: 'greater_than', value: 12, label: 'No visit in 12+ months' },
  { id: '4', type: 'clinical', field: 'labResult', operator: 'contains', value: 'cholesterol_high', label: 'High cholesterol' },
  { id: '5', type: 'demographic', field: 'gender', operator: 'equals', value: 'female', label: 'Female patients' },
  { id: '6', type: 'demographic', field: 'age', operator: 'between', value: [25, 45], label: 'Age 25-45' },
]

const DEFAULT_EXCLUSIONS: ExclusionRule[] = [
  { id: 'exc1', type: 'opt_out', label: 'Opted out of communications', enabled: true },
  { id: 'exc2', type: 'already_booked', label: 'Already has appointment booked', enabled: true },
  { id: 'exc3', type: 'contacted_recently', label: 'Contacted in last 30 days', value: 30, enabled: false },
]

// Demo campaigns with GP-appropriate language
const DEMO_CAMPAIGNS: CampaignCard[] = [
  {
    id: 'camp1',
    title: 'Cervical Screening Recall',
    description: 'NHS cervical screening invitation for eligible patients aged 25-64 who are overdue for their smear test.',
    ctaText: 'Book Screening',
    ctaLink: '/book/screening',
    audienceRules: [
      { id: '5', type: 'demographic', field: 'gender', operator: 'equals', value: 'female', label: 'Female patients' },
      { id: 'age25-64', type: 'demographic', field: 'age', operator: 'between', value: [25, 64], label: 'Age 25-64' },
    ],
    exclusions: [
      { id: 'exc1', type: 'opt_out', label: 'Opted out of communications', enabled: true },
      { id: 'exc2', type: 'already_booked', label: 'Already has screening booked', enabled: true },
    ],
    whyThisText: 'You are due for your NHS cervical screening. Regular screening helps detect changes early.',
    priority: 'high',
    validUntil: '2025-03-31',
    status: 'running',
    createdAt: '2024-12-01',
    estimatedReach: 234,
    owner: 'Dr. Sarah Mitchell',
    lastSent: '2024-12-18',
    nextSend: '2024-12-23',
    frequencyCap: { enabled: true, maxPerPatient: 2, periodDays: 90 },
    channels: {
      sms: { enabled: true, template: 'Hi {firstName}, you are due for your cervical screening. Book now: {link}' },
      email: { enabled: true, template: 'Dear {firstName},\n\nYou are due for your NHS cervical screening...', subject: 'Your cervical screening is due' },
      letter: { enabled: false }
    },
    analytics: { sent: 198, delivered: 195, opened: 142, clicked: 89, booked: 67, optedOut: 3 },
    schedule: { type: 'recurring', recurringFrequency: 'weekly', recurringDay: 1 }
  },
  {
    id: 'camp2',
    title: 'Flu Vaccination Campaign',
    description: 'Annual flu vaccination reminder for at-risk patients including over 65s, pregnant women, and those with chronic conditions.',
    ctaText: 'Book Flu Jab',
    ctaLink: '/book/flu',
    audienceRules: [
      { id: 'age65plus', type: 'demographic', field: 'age', operator: 'between', value: [65, 100], label: 'Age 65+' },
    ],
    exclusions: [
      { id: 'exc1', type: 'opt_out', label: 'Opted out of communications', enabled: true },
      { id: 'exc-flu', type: 'already_booked', label: 'Already had flu jab this season', enabled: true },
    ],
    whyThisText: 'As you are in an at-risk group, you are eligible for a free NHS flu vaccination.',
    priority: 'high',
    validUntil: '2025-02-28',
    status: 'running',
    createdAt: '2024-10-01',
    estimatedReach: 412,
    owner: 'Practice Nurse Team',
    lastSent: '2024-12-15',
    nextSend: '2024-12-22',
    frequencyCap: { enabled: true, maxPerPatient: 3, periodDays: 60 },
    channels: {
      sms: { enabled: true, template: 'Hi {firstName}, your free NHS flu jab is available. Book: {link}' },
      email: { enabled: true, template: 'Dear {firstName},\n\nProtect yourself this winter...', subject: 'Your free flu vaccination is ready' },
      letter: { enabled: true }
    },
    analytics: { sent: 389, delivered: 385, opened: 298, clicked: 187, booked: 156, optedOut: 4 },
    schedule: { type: 'recurring', recurringFrequency: 'weekly', recurringDay: 3 }
  },
  {
    id: 'camp3',
    title: 'Diabetes Annual Review',
    description: 'Annual review reminder for patients with Type 2 diabetes who are overdue for their comprehensive check.',
    ctaText: 'Book Review',
    ctaLink: '/book/diabetes-review',
    audienceRules: [
      { id: 'diabetes', type: 'clinical', field: 'condition', operator: 'contains', value: 'diabetes_type2', label: 'Type 2 Diabetes' },
      { id: 'overdue', type: 'behavioral', field: 'lastReview', operator: 'greater_than', value: 12, label: 'Review overdue (12+ months)' },
    ],
    exclusions: [
      { id: 'exc1', type: 'opt_out', label: 'Opted out of communications', enabled: true },
      { id: 'exc2', type: 'already_booked', label: 'Already has review booked', enabled: true },
    ],
    whyThisText: 'Your annual diabetes review is due. This helps us ensure your treatment is working well.',
    priority: 'medium',
    validUntil: '2025-06-30',
    status: 'scheduled',
    createdAt: '2024-12-10',
    estimatedReach: 87,
    owner: 'Dr. James Wilson',
    nextSend: '2025-01-06',
    frequencyCap: { enabled: true, maxPerPatient: 2, periodDays: 30 },
    channels: {
      sms: { enabled: true, template: 'Hi {firstName}, your diabetes review is due. Book now: {link}' },
      email: { enabled: true, template: 'Dear {firstName},\n\nIt\'s time for your annual diabetes review...', subject: 'Your diabetes review is due' },
      letter: { enabled: false }
    },
    schedule: { type: 'scheduled', scheduledDate: '2025-01-06', scheduledTime: '09:00' }
  },
  {
    id: 'camp4',
    title: 'Practice Newsletter - Winter Update',
    description: 'Quarterly practice newsletter with important updates about services, opening hours over the festive period, and health tips.',
    ctaText: 'Read Newsletter',
    ctaLink: '/newsletter/winter-2024',
    audienceRules: [],
    exclusions: [
      { id: 'exc1', type: 'opt_out', label: 'Opted out of newsletters', enabled: true },
    ],
    whyThisText: 'Stay informed about your GP practice and local health services.',
    priority: 'low',
    validUntil: '2025-01-31',
    status: 'draft',
    createdAt: '2024-12-18',
    estimatedReach: 2450,
    owner: 'Practice Manager',
    frequencyCap: { enabled: false, maxPerPatient: 1, periodDays: 90 },
    channels: {
      sms: { enabled: false, template: '' },
      email: { enabled: true, template: 'Dear {firstName},\n\nWelcome to our winter newsletter...', subject: 'Ceda GP Practice - Winter Newsletter' },
      letter: { enabled: false }
    },
    schedule: { type: 'scheduled', scheduledDate: '2024-12-23', scheduledTime: '10:00' }
  },
]

export default function CommunicationsPage() {
  const patients = Array.from({length: 2450}, (_, i) => ({ id: i }))
  const [activeTab, setActiveTab] = useState<'campaigns' | 'announcements' | 'analytics'>('campaigns')
  const [showCreateCampaign, setShowCreateCampaign] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<CampaignCard | null>(null)
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('')
  const [processingQuery, setProcessingQuery] = useState(false)
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [previewChannel, setPreviewChannel] = useState<'sms' | 'email'>('email')
  const [showAudienceModal, setShowAudienceModal] = useState(false)
  const [selectedCampaignForAudience, setSelectedCampaignForAudience] = useState<CampaignCard | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  const [newCampaign, setNewCampaign] = useState<Partial<CampaignCard>>({
    title: '',
    description: '',
    ctaText: '',
    ctaLink: '',
    audienceRules: [],
    exclusions: [...DEFAULT_EXCLUSIONS],
    whyThisText: '',
    priority: 'medium',
    validUntil: '',
    status: 'draft',
    owner: 'Practice Manager',
    frequencyCap: { enabled: true, maxPerPatient: 2, periodDays: 30 },
    channels: {
      sms: { enabled: false, template: '' },
      email: { enabled: false, template: '', subject: '' },
      letter: { enabled: false }
    },
    schedule: { type: 'immediate' }
  })
  const [generatingTemplates, setGeneratingTemplates] = useState(false)
  const [showEligiblePatients, setShowEligiblePatients] = useState(false)
  const [eligiblePatients, setEligiblePatients] = useState<any[]>([])
  const [showManualFilters, setShowManualFilters] = useState(false)

  // Campaigns from demo data
  const [campaigns, setCampaigns] = useState<CampaignCard[]>(DEMO_CAMPAIGNS)

  const calculateEstimatedReach = (rules: AudienceRule[]) => {
    // Mock calculation - in real app this would query the patient database
    let eligible = patients?.length || 0
    
    rules.forEach(rule => {
      if (rule.field === 'gender' && rule.operator === 'equals') {
        eligible = Math.floor(eligible * 0.5) // Roughly 50/50 gender split
      }
      if (rule.field === 'age' && rule.operator === 'between') {
        const [min, max] = rule.value as [number, number]
        const ageRange = (max - min) / 80 // Assume 80 year age range
        eligible = Math.floor(eligible * ageRange)
      }
    })
    
    return Math.max(1, eligible)
  }

  // Generate mock eligible patients based on audience rules
  const generateEligiblePatients = (rules: AudienceRule[]) => {
    const count = calculateEstimatedReach(rules)
    const mockPatients = []
    
    for (let i = 0; i < count; i++) {
      mockPatients.push({
        id: `p${i + 1}`,
        firstName: ['Sarah', 'John', 'Emma', 'Michael', 'Lisa', 'David', 'Anna', 'James', 'Sophie', 'Robert'][i % 10],
        lastName: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'][i % 10],
        age: Math.floor(Math.random() * 40) + 30,
        gender: Math.random() > 0.5 ? 'Female' : 'Male',
        lastVisit: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        phone: `+44 7${Math.floor(Math.random() * 900000000) + 100000000}`,
        email: `patient${i + 1}@email.com`,
        matchingRules: rules.slice(0, Math.floor(Math.random() * rules.length) + 1)
      })
    }
    
    return mockPatients
  }

  // View eligible patients for current campaign
  const viewEligiblePatientsForNewCampaign = () => {
    const patients = generateEligiblePatients(newCampaign.audienceRules || [])
    setEligiblePatients(patients)
    setShowEligiblePatients(true)
  }

  const addAudienceRule = (rule: AudienceRule) => {
    const updatedRules = [...(newCampaign.audienceRules || []), rule]
    setNewCampaign({
      ...newCampaign,
      audienceRules: updatedRules
    })
  }

  const removeAudienceRule = (ruleId: string) => {
    const updatedRules = (newCampaign.audienceRules || []).filter(r => r.id !== ruleId)
    setNewCampaign({
      ...newCampaign,
      audienceRules: updatedRules
    })
  }

  const saveCampaign = async () => {
    if (!newCampaign.title || !newCampaign.description) {
      alert('Please fill in all required fields')
      return
    }

    const campaignData: CampaignCard = {
      ...newCampaign as CampaignCard,
      id: editingCampaign?.id || `campaign-${Date.now()}`,
      estimatedReach: calculateEstimatedReach(newCampaign.audienceRules || []),
      createdAt: editingCampaign?.createdAt || new Date().toISOString().split('T')[0],
      status: newCampaign.status || 'draft'
    }

    if (editingCampaign) {
      setCampaigns(prev => prev.map(c => c.id === editingCampaign.id ? campaignData : c))
    } else {
      setCampaigns(prev => [...prev, campaignData])
    }

    // Reset form
    setNewCampaign({
      title: '',
      description: '',
      ctaText: '',
      ctaLink: '',
      audienceRules: [],
      exclusions: [...DEFAULT_EXCLUSIONS],
      whyThisText: '',
      priority: 'medium',
      validUntil: '',
      status: 'draft',
      owner: 'Practice Manager',
      frequencyCap: { enabled: true, maxPerPatient: 2, periodDays: 30 },
      channels: {
        sms: { enabled: false, template: '' },
        email: { enabled: false, template: '', subject: '' },
        letter: { enabled: false }
      },
      schedule: { type: 'immediate' }
    })
    setShowCreateCampaign(false)
    setEditingCampaign(null)
  }

  const processNaturalLanguageQuery = async () => {
    if (!naturalLanguageQuery.trim()) return

    setProcessingQuery(true)
    
    try {
      // Mock AI processing - in real app this would use Gemini/OpenAI
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Parse common patterns and convert to rules
      const query = naturalLanguageQuery.toLowerCase()
      const rules: AudienceRule[] = []
      
      // Gender detection
      if (query.includes('women') || query.includes('female')) {
        rules.push({ id: '5', type: 'demographic', field: 'gender', operator: 'equals', value: 'female', label: 'Female patients' })
      }
      if (query.includes('men') || query.includes('male')) {
        rules.push({ id: '1', type: 'demographic', field: 'gender', operator: 'equals', value: 'male', label: 'Male patients' })
      }
      
      // Age detection
      const ageMatch = query.match(/(\d+)[\s-]+(\d+)/) || query.match(/over (\d+)/) || query.match(/under (\d+)/)
      if (ageMatch) {
        if (query.includes('over')) {
          const age = parseInt(ageMatch[1])
          rules.push({ id: '7', type: 'demographic', field: 'age', operator: 'between', value: [age, 80], label: `Age ${age}+` })
        } else if (query.includes('under')) {
          const age = parseInt(ageMatch[1])
          rules.push({ id: '8', type: 'demographic', field: 'age', operator: 'between', value: [18, age], label: `Age under ${age}` })
        } else if (ageMatch[2]) {
          const min = parseInt(ageMatch[1])
          const max = parseInt(ageMatch[2])
          rules.push({ id: '2', type: 'demographic', field: 'age', operator: 'between', value: [min, max], label: `Age ${min}-${max}` })
        }
      }
      
      // Clinical conditions
      if (query.includes('diabetes')) {
        rules.push({ id: '9', type: 'clinical', field: 'condition', operator: 'contains', value: 'diabetes', label: 'Diabetes patients' })
      }
      if (query.includes('hypertension') || query.includes('high blood pressure')) {
        rules.push({ id: '10', type: 'clinical', field: 'condition', operator: 'contains', value: 'hypertension', label: 'Hypertension patients' })
      }
      if (query.includes('cholesterol')) {
        rules.push({ id: '4', type: 'clinical', field: 'labResult', operator: 'contains', value: 'cholesterol_high', label: 'High cholesterol' })
      }
      
      // Visit patterns
      if (query.includes('not seen') || query.includes('no visit') || query.includes('overdue')) {
        rules.push({ id: '3', type: 'behavioral', field: 'lastVisit', operator: 'greater_than', value: 12, label: 'No visit in 12+ months' })
      }
      
      // Apply the rules
      setNewCampaign({
        ...newCampaign,
        audienceRules: [...(newCampaign.audienceRules || []), ...rules]
      })
      
      setNaturalLanguageQuery('')
      
      // Show success message
      if (rules.length > 0) {
        // Scroll to the rules section to show the results
        setTimeout(() => {
          const rulesSection = document.querySelector('[data-rules-section]')
          if (rulesSection) {
            rulesSection.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }, 100)
      } else {
        alert('No matching criteria found in your query. Please try a different description.')
      }
      
    } catch (error) {
      console.error('Error processing natural language query:', error)
      alert('Failed to process query. Please try again.')
    } finally {
      setProcessingQuery(false)
    }
  }

  // Generate AI templates for SMS/Email circulation
  const generateCirculationTemplates = async () => {
    if (!newCampaign.title || !newCampaign.description) {
      alert('Please fill in the campaign title and description first')
      return
    }
    
    setGeneratingTemplates(true)
    
    // Mock AI processing delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Mock AI-generated templates based on campaign content
    const smsTemplate = `Hi {firstName}, ${newCampaign.title}. ${newCampaign.description?.slice(0, 60)}... Book: {link} Reply STOP to opt out.`
    
    const emailSubject = `${newCampaign.title} - ${newCampaign.ctaText || 'Book Now'}`
    const emailTemplate = `Dear {firstName},

${newCampaign.description}

${newCampaign.whyThisText || ''}

To book your appointment, please click the link below or call us on 020 1234 5678.

${newCampaign.ctaText || 'Book Now'}: {link}

Kind regards,
Ceda GP Practice

---
To update your communication preferences: {unsubscribe_link}`
    
    setNewCampaign(prev => ({
      ...prev,
      channels: {
        ...prev.channels!,
        sms: {
          ...prev.channels?.sms!,
          enabled: true,
          template: smsTemplate
        },
        email: {
          ...prev.channels?.email!,
          enabled: true,
          template: emailTemplate,
          subject: emailSubject
        }
      }
    }))
    
    setGeneratingTemplates(false)
  }

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(c => {
    if (statusFilter === 'all') return true
    return c.status === statusFilter
  })

  // Campaign stats
  const campaignStats = {
    running: campaigns.filter(c => c.status === 'running').length,
    scheduled: campaigns.filter(c => c.status === 'scheduled').length,
    draft: campaigns.filter(c => c.status === 'draft').length,
    totalSent: campaigns.reduce((sum, c) => sum + (c.analytics?.sent || 0), 0),
    totalBooked: campaigns.reduce((sum, c) => sum + (c.analytics?.booked || 0), 0),
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'running': return { label: 'Running', color: 'bg-green-100 text-green-800', icon: Play }
      case 'scheduled': return { label: 'Scheduled', color: 'bg-blue-100 text-blue-800', icon: Calendar }
      case 'draft': return { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: FileText }
      case 'paused': return { label: 'Paused', color: 'bg-yellow-100 text-yellow-800', icon: Pause }
      case 'completed': return { label: 'Completed', color: 'bg-purple-100 text-purple-800', icon: CheckCircle }
      default: return { label: status, color: 'bg-gray-100 text-gray-800', icon: FileText }
    }
  }

  const viewAudience = (campaign: CampaignCard) => {
    setSelectedCampaignForAudience(campaign)
    const patients = generateEligiblePatients(campaign.audienceRules)
    setEligiblePatients(patients)
    setShowAudienceModal(true)
  }

  const sendTestMessage = (campaign: CampaignCard, channel: 'sms' | 'email') => {
    alert(`Test ${channel.toUpperCase()} sent to your registered ${channel === 'sms' ? 'phone' : 'email address'}!`)
  }

  const toggleCampaignStatus = (campaignId: string) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id === campaignId) {
        const newStatus = c.status === 'running' ? 'paused' : 'running'
        return { ...c, status: newStatus }
      }
      return c
    }))
  }

  const deleteCampaign = (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return
    setCampaigns(prev => prev.filter(c => c.id !== campaignId))
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Communications</h1>
          <p className="text-gray-600 mt-1">Clinical recalls, patient outreach & practice announcements</p>
        </div>
        
        <button
          onClick={() => setShowCreateCampaign(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Play className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{campaignStats.running}</p>
              <p className="text-sm text-gray-500">Running</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{campaignStats.scheduled}</p>
              <p className="text-sm text-gray-500">Scheduled</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Send className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{campaignStats.totalSent.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Messages Sent</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <CalendarCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{campaignStats.totalBooked}</p>
              <p className="text-sm text-gray-500">Bookings Generated</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'campaigns', label: 'Outreach Campaigns', count: campaigns.filter(c => c.status === 'running' || c.status === 'scheduled').length },
            { id: 'announcements', label: 'Practice Updates', count: campaigns.filter(c => c.priority === 'low').length },
            { id: 'analytics', label: 'Analytics', count: null }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== null && tab.count > 0 && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-900'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Campaigns Tab */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Filter:</span>
              <div className="flex space-x-1">
                {['all', 'running', 'scheduled', 'draft', 'paused'].map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      statusFilter === status
                        ? 'bg-blue-100 text-blue-800 font-medium'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
                className="text-sm border-none focus:ring-0 focus:outline-none w-48"
              />
            </div>
          </div>

          {/* Campaign Cards */}
          {filteredCampaigns.filter(c => c.priority !== 'low').map((campaign) => {
            const statusConfig = getStatusConfig(campaign.status)
            const StatusIcon = statusConfig.icon
            
            return (
              <div key={campaign.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Campaign Header */}
                <div className="p-5 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-gray-900 text-lg">{campaign.title}</h3>
                        <span className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          <span>{statusConfig.label}</span>
                        </span>
                        {campaign.priority === 'high' && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            High Priority
                          </span>
                        )}
                      </div>
                      
                      <p className="text-gray-600 text-sm mb-3">{campaign.description}</p>
                      
                      {/* Meta Info Row */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>~{campaign.estimatedReach.toLocaleString()} patients</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>Owner: {campaign.owner}</span>
                        </span>
                        {campaign.lastSent && (
                          <span className="flex items-center space-x-1">
                            <Send className="w-4 h-4" />
                            <span>Last sent: {new Date(campaign.lastSent).toLocaleDateString()}</span>
                          </span>
                        )}
                        {campaign.nextSend && (
                          <span className="flex items-center space-x-1 text-blue-600">
                            <Calendar className="w-4 h-4" />
                            <span>Next: {new Date(campaign.nextSend).toLocaleDateString()}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => toggleCampaignStatus(campaign.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          campaign.status === 'running' 
                            ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                        }`}
                        title={campaign.status === 'running' ? 'Pause' : 'Start'}
                      >
                        {campaign.status === 'running' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => {
                          setEditingCampaign(campaign)
                          setNewCampaign(campaign)
                          setShowCreateCampaign(true)
                        }}
                        className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteCampaign(campaign.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Campaign Details */}
                <div className="p-5 bg-gray-50 grid grid-cols-4 gap-4">
                  {/* Channels */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Channels</p>
                    <div className="flex space-x-2">
                      {campaign.channels.sms.enabled && (
                        <span className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          <MessageSquare className="w-3 h-3" />
                          <span>SMS</span>
                        </span>
                      )}
                      {campaign.channels.email.enabled && (
                        <span className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          <Mail className="w-3 h-3" />
                          <span>Email</span>
                        </span>
                      )}
                      {campaign.channels.letter.enabled && (
                        <span className="flex items-center space-x-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                          <FileText className="w-3 h-3" />
                          <span>Letter</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Schedule */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Schedule</p>
                    <p className="text-sm text-gray-900">
                      {campaign.schedule.type === 'recurring' && (
                        <span className="flex items-center space-x-1">
                          <RefreshCw className="w-3 h-3 text-blue-600" />
                          <span>{campaign.schedule.recurringFrequency}</span>
                        </span>
                      )}
                      {campaign.schedule.type === 'scheduled' && (
                        <span>{campaign.schedule.scheduledDate} at {campaign.schedule.scheduledTime}</span>
                      )}
                      {campaign.schedule.type === 'immediate' && 'Manual send'}
                    </p>
                  </div>

                  {/* Frequency Cap */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Frequency Cap</p>
                    <p className="text-sm text-gray-900">
                      {campaign.frequencyCap.enabled 
                        ? `Max ${campaign.frequencyCap.maxPerPatient}x per ${campaign.frequencyCap.periodDays} days`
                        : 'No limit'}
                    </p>
                  </div>

                  {/* Exclusions */}
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Exclusions</p>
                    <div className="flex flex-wrap gap-1">
                      {campaign.exclusions.filter(e => e.enabled).map(exc => (
                        <span key={exc.id} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                          {exc.type === 'opt_out' ? 'Opt-outs' : exc.type === 'already_booked' ? 'Booked' : 'Recent'}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Campaign Actions & Analytics */}
                <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => viewAudience(campaign)}
                      className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <Users className="w-4 h-4" />
                      <span>View Audience</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCampaignForAudience(campaign)
                        setPreviewChannel('email')
                        setShowPreviewModal(true)
                      }}
                      className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Preview</span>
                    </button>
                    <button
                      onClick={() => sendTestMessage(campaign, campaign.channels.email.enabled ? 'email' : 'sms')}
                      className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      <TestTube className="w-4 h-4" />
                      <span>Send Test</span>
                    </button>
                  </div>

                  {/* Analytics Summary */}
                  {campaign.analytics && (
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <p className="font-semibold text-gray-900">{campaign.analytics.sent}</p>
                        <p className="text-xs text-gray-500">Sent</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-gray-900">{campaign.analytics.delivered}</p>
                        <p className="text-xs text-gray-500">Delivered</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-gray-900">{campaign.analytics.opened}</p>
                        <p className="text-xs text-gray-500">Opened</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-blue-600">{campaign.analytics.clicked}</p>
                        <p className="text-xs text-gray-500">Clicked</p>
                      </div>
                      <div className="text-center">
                        <p className="font-semibold text-green-600">{campaign.analytics.booked}</p>
                        <p className="text-xs text-gray-500">Booked</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-emerald-600">
                          {((campaign.analytics.booked / campaign.analytics.sent) * 100).toFixed(1)}%
                        </p>
                        <p className="text-xs text-gray-500">Conversion</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {filteredCampaigns.filter(c => c.priority !== 'low').length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No outreach campaigns yet</h3>
              <p className="text-gray-500 mb-4">Create your first clinical outreach or recall campaign</p>
              <button
                onClick={() => setShowCreateCampaign(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Create First Campaign
              </button>
            </div>
          )}
        </div>
      )}

      {/* Announcements Tab (Practice Updates) */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          {campaigns.filter(c => c.priority === 'low').map((campaign) => {
            const statusConfig = getStatusConfig(campaign.status)
            const StatusIcon = statusConfig.icon
            
            return (
              <div key={campaign.id} className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{campaign.title}</h3>
                      <span className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        <span>{statusConfig.label}</span>
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{campaign.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>~{campaign.estimatedReach.toLocaleString()} recipients</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{campaign.owner}</span>
                      </span>
                      {campaign.schedule.scheduledDate && (
                        <span className="flex items-center space-x-1 text-blue-600">
                          <Calendar className="w-4 h-4" />
                          <span>Scheduled: {campaign.schedule.scheduledDate}</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingCampaign(campaign)
                        setNewCampaign(campaign)
                        setShowCreateCampaign(true)
                      }}
                      className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteCampaign(campaign.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {campaigns.filter(c => c.priority === 'low').length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No practice updates</h3>
              <p className="text-gray-500 mb-4">Create newsletters and general practice announcements</p>
              <button
                onClick={() => {
                  setNewCampaign(prev => ({ ...prev, priority: 'low' }))
                  setShowCreateCampaign(true)
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Create Announcement
              </button>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Key Metrics - Focus on Bookings/Conversions */}
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Send className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm text-gray-600">Messages Sent</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{campaignStats.totalSent.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">Across all campaigns</p>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CalendarCheck className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm text-gray-600">Appointments Booked</span>
              </div>
              <p className="text-3xl font-bold text-green-600">{campaignStats.totalBooked}</p>
              <p className="text-xs text-gray-500 mt-1">Direct from outreach</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <span className="text-sm text-gray-600">Conversion Rate</span>
              </div>
              <p className="text-3xl font-bold text-emerald-600">
                {campaignStats.totalSent > 0 
                  ? ((campaignStats.totalBooked / campaignStats.totalSent) * 100).toFixed(1)
                  : 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Sent → Booked</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <UserCheck className="w-5 h-5 text-amber-600" />
                </div>
                <span className="text-sm text-gray-600">Click-to-Book Rate</span>
              </div>
              <p className="text-3xl font-bold text-amber-600">
                {campaigns.reduce((sum, c) => sum + (c.analytics?.clicked || 0), 0) > 0 
                  ? ((campaignStats.totalBooked / campaigns.reduce((sum, c) => sum + (c.analytics?.clicked || 0), 0)) * 100).toFixed(1)
                  : 0}%
              </p>
              <p className="text-xs text-gray-500 mt-1">Of those who clicked</p>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <UserX className="w-5 h-5 text-red-500" />
                </div>
                <span className="text-sm text-gray-600">Opt-outs</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {campaigns.reduce((sum, c) => sum + (c.analytics?.optedOut || 0), 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ({((campaigns.reduce((sum, c) => sum + (c.analytics?.optedOut || 0), 0) / campaignStats.totalSent) * 100).toFixed(2)}%)
              </p>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-6">
            {/* Top Converting Campaigns */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Top Converting Campaigns</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">By booking rate</span>
              </div>
              <div className="space-y-3">
                {campaigns
                  .filter(c => c.analytics && c.analytics.sent > 0)
                  .sort((a, b) => {
                    const aRate = (a.analytics?.booked || 0) / (a.analytics?.sent || 1)
                    const bRate = (b.analytics?.booked || 0) / (b.analytics?.sent || 1)
                    return bRate - aRate
                  })
                  .slice(0, 4)
                  .map((campaign, i) => {
                    const rate = ((campaign.analytics!.booked / campaign.analytics!.sent) * 100)
                    return (
                      <div key={campaign.id} className="flex items-center space-x-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          i === 0 ? 'bg-yellow-100 text-yellow-700' : 
                          i === 1 ? 'bg-gray-100 text-gray-600' : 
                          i === 2 ? 'bg-amber-100 text-amber-700' : 'bg-gray-50 text-gray-500'
                        }`}>
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{campaign.title}</p>
                          <p className="text-xs text-gray-500">{campaign.analytics!.booked} bookings from {campaign.analytics!.sent} sent</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">{rate.toFixed(1)}%</p>
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Most Bookings */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">Most Bookings Generated</h3>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">By volume</span>
              </div>
              <div className="space-y-3">
                {campaigns
                  .filter(c => c.analytics)
                  .sort((a, b) => (b.analytics?.booked || 0) - (a.analytics?.booked || 0))
                  .slice(0, 4)
                  .map((campaign) => {
                    const maxBooked = Math.max(...campaigns.map(c => c.analytics?.booked || 0))
                    const percentage = (campaign.analytics!.booked / maxBooked) * 100
                    return (
                      <div key={campaign.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900 truncate">{campaign.title}</span>
                          <span className="text-sm font-bold text-gray-900">{campaign.analytics!.booked}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>
          </div>

          {/* Detailed Campaign Performance Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Campaign Performance Details</h3>
              <span className="text-xs text-gray-500">All campaigns with analytics</span>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Sent</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Delivered</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Clicked</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50 text-green-700">Booked</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-green-50 text-green-700">Conversion</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Opt-outs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {campaigns.filter(c => c.analytics).map(campaign => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{campaign.title}</p>
                        <p className="text-xs text-gray-500">{campaign.owner} • {getStatusConfig(campaign.status).label}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-900">{campaign.analytics!.sent}</td>
                    <td className="px-6 py-4 text-right text-sm text-gray-600">
                      {campaign.analytics!.delivered}
                      <span className="text-gray-400 ml-1 text-xs">
                        ({((campaign.analytics!.delivered / campaign.analytics!.sent) * 100).toFixed(0)}%)
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-blue-600">{campaign.analytics!.clicked}</td>
                    <td className="px-6 py-4 text-right text-sm font-semibold text-green-600 bg-green-50/50">{campaign.analytics!.booked}</td>
                    <td className="px-6 py-4 text-right bg-green-50/50">
                      <span className="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800">
                        {((campaign.analytics!.booked / campaign.analytics!.sent) * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-500">{campaign.analytics!.optedOut}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-medium">
                <tr>
                  <td className="px-6 py-3 text-sm text-gray-900">Total</td>
                  <td className="px-6 py-3 text-right text-sm">{campaignStats.totalSent}</td>
                  <td className="px-6 py-3 text-right text-sm">{campaigns.reduce((sum, c) => sum + (c.analytics?.delivered || 0), 0)}</td>
                  <td className="px-6 py-3 text-right text-sm text-blue-600">{campaigns.reduce((sum, c) => sum + (c.analytics?.clicked || 0), 0)}</td>
                  <td className="px-6 py-3 text-right text-sm font-bold text-green-600 bg-green-50/50">{campaignStats.totalBooked}</td>
                  <td className="px-6 py-3 text-right bg-green-50/50">
                    <span className="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800">
                      {((campaignStats.totalBooked / campaignStats.totalSent) * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right text-sm">{campaigns.reduce((sum, c) => sum + (c.analytics?.optedOut || 0), 0)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Create Campaign Modal */}
      {showCreateCampaign && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingCampaign ? 'Edit Campaign' : 'Create Outreach Campaign'}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {editingCampaign ? 'Update your clinical outreach or recall campaign' : 'Design a targeted patient communication'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowCreateCampaign(false)
                    setEditingCampaign(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Title *</label>
                    <input
                      type="text"
                      value={newCampaign.title || ''}
                      onChange={(e) => setNewCampaign({...newCampaign, title: e.target.value})}
                      placeholder="e.g., Cervical Screening Recall"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                    <textarea
                      value={newCampaign.description || ''}
                      onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})}
                      placeholder="Brief description of the outreach purpose"
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                    <select
                      value={newCampaign.owner || 'Practice Manager'}
                      onChange={(e) => setNewCampaign({...newCampaign, owner: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option>Practice Manager</option>
                      <option>Dr. Sarah Mitchell</option>
                      <option>Dr. James Wilson</option>
                      <option>Practice Nurse Team</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={newCampaign.priority || 'medium'}
                      onChange={(e) => setNewCampaign({...newCampaign, priority: e.target.value as any})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="high">High - Clinical recalls</option>
                      <option value="medium">Medium - Standard outreach</option>
                      <option value="low">Low - Practice updates/newsletters</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Call-to-Action</label>
                    <input
                      type="text"
                      value={newCampaign.ctaText || ''}
                      onChange={(e) => setNewCampaign({...newCampaign, ctaText: e.target.value})}
                      placeholder="e.g., Book Appointment"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                    <input
                      type="date"
                      value={newCampaign.validUntil || ''}
                      onChange={(e) => setNewCampaign({...newCampaign, validUntil: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Schedule Section */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span>Schedule</span>
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Send Type</label>
                    <select
                      value={newCampaign.schedule?.type || 'immediate'}
                      onChange={(e) => setNewCampaign({
                        ...newCampaign,
                        schedule: { ...newCampaign.schedule, type: e.target.value as any }
                      })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="immediate">Manual / Immediate</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="recurring">Recurring</option>
                    </select>
                  </div>
                  
                  {newCampaign.schedule?.type === 'scheduled' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                        <input
                          type="date"
                          value={newCampaign.schedule?.scheduledDate || ''}
                          onChange={(e) => setNewCampaign({
                            ...newCampaign,
                            schedule: { ...newCampaign.schedule, scheduledDate: e.target.value }
                          })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Time</label>
                        <input
                          type="time"
                          value={newCampaign.schedule?.scheduledTime || '09:00'}
                          onChange={(e) => setNewCampaign({
                            ...newCampaign,
                            schedule: { ...newCampaign.schedule, scheduledTime: e.target.value }
                          })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </>
                  )}
                  
                  {newCampaign.schedule?.type === 'recurring' && (
                    <>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Frequency</label>
                        <select
                          value={newCampaign.schedule?.recurringFrequency || 'weekly'}
                          onChange={(e) => setNewCampaign({
                            ...newCampaign,
                            schedule: { ...newCampaign.schedule, recurringFrequency: e.target.value as any }
                          })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Day</label>
                        <select
                          value={newCampaign.schedule?.recurringDay || 1}
                          onChange={(e) => setNewCampaign({
                            ...newCampaign,
                            schedule: { ...newCampaign.schedule, recurringDay: parseInt(e.target.value) }
                          })}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={0}>Sunday</option>
                          <option value={1}>Monday</option>
                          <option value={2}>Tuesday</option>
                          <option value={3}>Wednesday</option>
                          <option value={4}>Thursday</option>
                          <option value={5}>Friday</option>
                          <option value={6}>Saturday</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Frequency Cap */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-900 flex items-center space-x-2">
                    <RefreshCw className="w-4 h-4 text-gray-500" />
                    <span>Frequency Cap</span>
                  </h3>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={newCampaign.frequencyCap?.enabled || false}
                      onChange={(e) => setNewCampaign({
                        ...newCampaign,
                        frequencyCap: { ...newCampaign.frequencyCap!, enabled: e.target.checked }
                      })}
                      className="w-4 h-4 text-blue-600 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-600">Enable limit</span>
                  </label>
                </div>
                {newCampaign.frequencyCap?.enabled && (
                  <div className="flex items-center space-x-3 text-sm">
                    <span className="text-gray-600">Max</span>
                    <input
                      type="number"
                      value={newCampaign.frequencyCap?.maxPerPatient || 2}
                      onChange={(e) => setNewCampaign({
                        ...newCampaign,
                        frequencyCap: { ...newCampaign.frequencyCap!, maxPerPatient: parseInt(e.target.value) }
                      })}
                      className="w-16 border border-gray-300 rounded px-2 py-1 text-center"
                      min={1}
                    />
                    <span className="text-gray-600">messages per patient every</span>
                    <input
                      type="number"
                      value={newCampaign.frequencyCap?.periodDays || 30}
                      onChange={(e) => setNewCampaign({
                        ...newCampaign,
                        frequencyCap: { ...newCampaign.frequencyCap!, periodDays: parseInt(e.target.value) }
                      })}
                      className="w-16 border border-gray-300 rounded px-2 py-1 text-center"
                      min={1}
                    />
                    <span className="text-gray-600">days</span>
                  </div>
                )}
              </div>

              {/* Exclusions */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center space-x-2">
                  <UserX className="w-4 h-4 text-gray-500" />
                  <span>Exclusions</span>
                </h3>
                <p className="text-xs text-gray-500 mb-3">Automatically exclude patients matching these criteria</p>
                <div className="space-y-2">
                  {(newCampaign.exclusions || DEFAULT_EXCLUSIONS).map((exclusion, idx) => (
                    <label key={exclusion.id} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={exclusion.enabled}
                        onChange={(e) => {
                          const updated = [...(newCampaign.exclusions || DEFAULT_EXCLUSIONS)]
                          updated[idx] = { ...exclusion, enabled: e.target.checked }
                          setNewCampaign({ ...newCampaign, exclusions: updated })
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{exclusion.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Audience Rules */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Target Audience</label>
                  <button
                    onClick={() => setShowManualFilters(!showManualFilters)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {showManualFilters ? '🤖 Switch to AI Search' : '⚙️ Manual Filters'}
                  </button>
                </div>
                
                {/* Manual Filter Options */}
                {showManualFilters && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">Manual Filter Selection</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Demographics */}
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Demographics</h5>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <select 
                              onChange={(e) => {
                                if (e.target.value) {
                                  addAudienceRule({
                                    id: `gender-${Date.now()}`,
                                    type: 'demographic',
                                    field: 'gender',
                                    operator: 'equals',
                                    value: e.target.value,
                                    label: `${e.target.value === 'male' ? 'Male' : 'Female'} patients`
                                  })
                                  e.target.value = ''
                                }
                              }}
                              className="text-sm border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="">Select Gender</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                            </select>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              placeholder="Min age"
                              className="text-sm border border-gray-300 rounded px-2 py-1 w-20"
                              onChange={(e) => {
                                const minAge = parseInt(e.target.value)
                                if (minAge) {
                                  const maxInput = e.target.nextElementSibling as HTMLInputElement
                                  const maxAge = maxInput ? parseInt(maxInput.value) || 80 : 80
                                  addAudienceRule({
                                    id: `age-${Date.now()}`,
                                    type: 'demographic',
                                    field: 'age',
                                    operator: 'between',
                                    value: [minAge, maxAge],
                                    label: `Age ${minAge}-${maxAge}`
                                  })
                                }
                              }}
                            />
                            <span className="text-gray-500">to</span>
                            <input
                              type="number"
                              placeholder="Max age"
                              className="text-sm border border-gray-300 rounded px-2 py-1 w-20"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Clinical */}
                      <div>
                        <h5 className="text-sm font-medium text-gray-700 mb-2">Clinical Conditions</h5>
                        <div className="space-y-2">
                          {['Diabetes', 'Hypertension', 'High Cholesterol', 'Asthma'].map(condition => (
                            <label key={condition} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    addAudienceRule({
                                      id: `condition-${condition.toLowerCase()}-${Date.now()}`,
                                      type: 'clinical',
                                      field: 'condition',
                                      operator: 'contains',
                                      value: condition.toLowerCase(),
                                      label: `${condition} patients`
                                    })
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300"
                              />
                              <span className="text-sm text-gray-700">{condition}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Behavioral Filters */}
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Visit History</h5>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { label: 'No visit in 6+ months', months: 6 },
                          { label: 'No visit in 12+ months', months: 12 },
                          { label: 'No visit in 18+ months', months: 18 }
                        ].map(option => (
                          <button
                            key={option.months}
                            onClick={() => addAudienceRule({
                              id: `visit-${option.months}-${Date.now()}`,
                              type: 'behavioral',
                              field: 'lastVisit',
                              operator: 'greater_than',
                              value: option.months,
                              label: option.label
                            })}
                            className="text-xs bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-full hover:bg-gray-50"
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* AI Patient Search */}
                {!showManualFilters && (
                <div className="mb-6 p-6 bg-white rounded-xl border border-gray-200">
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                      <h4 className="font-semibold text-cyan-600 text-sm tracking-wide">AI PATIENT SEARCH</h4>
                    </div>
                    <p className="text-gray-600 text-xs leading-relaxed">
                      Describe your target audience in natural language
                    </p>
                  </div>
                  
                  <div className="relative">
                    <div className="flex items-center bg-white border-2 border-gray-200 rounded-lg focus-within:border-cyan-400 focus-within:shadow-[0_0_0_3px_rgba(34,211,238,0.1)] transition-all duration-300">
                      <div className="flex items-center pl-4 pr-2 text-cyan-500">
                        <span className="font-mono text-sm font-medium">></span>
                      </div>
                      <input
                        type="text"
                        value={naturalLanguageQuery}
                        onChange={(e) => setNaturalLanguageQuery(e.target.value)}
                        placeholder="women over 50 with diabetes who haven't visited in 6 months"
                        className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 text-sm py-3 pr-3 focus:outline-none"
                        onKeyPress={(e) => e.key === 'Enter' && processNaturalLanguageQuery()}
                      />
                      <button
                        onClick={processNaturalLanguageQuery}
                        disabled={processingQuery || !naturalLanguageQuery.trim()}
                        className="mr-2 p-2 text-gray-400 hover:text-cyan-500 hover:bg-cyan-50 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingQuery ? (
                          <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Example queries */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="text-xs text-gray-500 font-medium">Examples:</span>
                    {[
                      'women 50-70 for breast screening',
                      'men over 40 with high cholesterol',
                      'patients not seen in 12 months',
                      'diabetic patients under 65'
                    ].map((example) => (
                      <button
                        key={example}
                        onClick={() => setNaturalLanguageQuery(example)}
                        className="text-xs bg-gray-50 text-gray-600 px-3 py-1 rounded-full border border-gray-200 hover:border-cyan-300 hover:text-cyan-700 hover:bg-cyan-50 transition-all duration-200"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                </div>
                )}
                
                {/* Selected Rules */}
                {newCampaign.audienceRules && newCampaign.audienceRules.length > 0 && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg" data-rules-section>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-900">
                        Selected targeting rules ({newCampaign.audienceRules.length})
                      </span>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={viewEligiblePatientsForNewCampaign}
                          className="text-sm text-blue-700 hover:text-blue-900 font-medium underline"
                        >
                          ~{calculateEstimatedReach(newCampaign.audienceRules)} patients eligible
                        </button>
                        <button
                          onClick={() => setNewCampaign({...newCampaign, audienceRules: []})}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Clear all
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {newCampaign.audienceRules.map((rule) => (
                        <span key={rule.id} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                          {rule.label}
                          <button
                            onClick={() => removeAudienceRule(rule.id)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Rules */}
                <div className="grid grid-cols-2 gap-2">
                  {RULE_TEMPLATES.filter(template => 
                    !newCampaign.audienceRules?.some(selected => selected.id === template.id)
                  ).map((template) => (
                    <button
                      key={template.id}
                      onClick={() => addAudienceRule(template)}
                      className="text-left p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900 text-sm">{template.label}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {template.type} • {template.operator.replace('_', ' ')}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Why This Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transparency Text ("Why am I receiving this?")
                </label>
                <input
                  type="text"
                  value={newCampaign.whyThisText || ''}
                  onChange={(e) => setNewCampaign({...newCampaign, whyThisText: e.target.value})}
                  placeholder="e.g., You are due for your cervical screening as per NHS guidelines."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Explains to the patient why they were selected for this outreach</p>
              </div>

              {/* SMS/Email Templates */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Message Templates</h3>
                    <p className="text-xs text-gray-500 mt-1">Configure SMS and email content for this campaign</p>
                  </div>
                  <button
                    onClick={generateCirculationTemplates}
                    disabled={generatingTemplates || !newCampaign.title || !newCampaign.description}
                    className="flex items-center space-x-2 text-sm bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-3 py-2 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generatingTemplates ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <span>✨</span>
                        <span>Generate AI Templates</span>
                      </>
                    )}
                  </button>
                </div>
                
                <div className="space-y-4">
                  {/* SMS Section */}
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="sms-enabled"
                      checked={newCampaign.channels?.sms?.enabled || false}
                      onChange={(e) => setNewCampaign(prev => ({
                        ...prev,
                        channels: {
                          ...prev.channels!,
                          sms: {
                            ...prev.channels?.sms!,
                            enabled: e.target.checked
                          }
                        }
                      }))}
                      className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <label htmlFor="sms-enabled" className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                        <MessageSquare className="w-4 h-4 text-green-600" />
                        <span>SMS Template</span>
                      </label>
                      <textarea
                        value={newCampaign.channels?.sms?.template || ''}
                        onChange={(e) => setNewCampaign(prev => ({
                          ...prev,
                          channels: {
                            ...prev.channels!,
                            sms: {
                              ...prev.channels?.sms!,
                              template: e.target.value
                            }
                          }
                        }))}
                        placeholder="SMS template (160 chars max recommended)"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={3}
                        maxLength={160}
                        disabled={!newCampaign.channels?.sms?.enabled}
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Use {`{firstName}`}, {`{link}`} for personalization</span>
                        <span>{newCampaign.channels?.sms?.template?.length || 0}/160</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Email Section */}
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="email-enabled"
                      checked={newCampaign.channels?.email?.enabled || false}
                      onChange={(e) => setNewCampaign(prev => ({
                        ...prev,
                        channels: {
                          ...prev.channels!,
                          email: {
                            ...prev.channels?.email!,
                            enabled: e.target.checked
                          }
                        }
                      }))}
                      className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <label htmlFor="email-enabled" className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-blue-600" />
                        <span>Email Template</span>
                      </label>
                      
                      <input
                        type="text"
                        value={newCampaign.channels?.email?.subject || ''}
                        onChange={(e) => setNewCampaign(prev => ({
                          ...prev,
                          channels: {
                            ...prev.channels!,
                            email: {
                              ...prev.channels?.email!,
                              subject: e.target.value
                            }
                          }
                        }))}
                        placeholder="Email subject line"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                        disabled={!newCampaign.channels?.email?.enabled}
                      />
                      
                      <textarea
                        value={newCampaign.channels?.email?.template || ''}
                        onChange={(e) => setNewCampaign(prev => ({
                          ...prev,
                          channels: {
                            ...prev.channels!,
                            email: {
                              ...prev.channels?.email!,
                              template: e.target.value
                            }
                          }
                        }))}
                        placeholder="Email template content"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={6}
                        disabled={!newCampaign.channels?.email?.enabled}
                      />
                      <div className="text-xs text-gray-500 mt-1">
                        Use {`{firstName}`}, {`{link}`}, {`{unsubscribe_link}`} for personalization
                      </div>
                    </div>
                  </div>

                  {/* Letter Section */}
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="letter-enabled"
                      checked={newCampaign.channels?.letter?.enabled || false}
                      onChange={(e) => setNewCampaign(prev => ({
                        ...prev,
                        channels: {
                          ...prev.channels!,
                          letter: {
                            enabled: e.target.checked
                          }
                        }
                      }))}
                      className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <label htmlFor="letter-enabled" className="block text-sm font-medium text-gray-700 flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-purple-600" />
                        <span>Posted Letter</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1">Generate printed letters for patients without digital contact preferences</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateCampaign(false)
                  setEditingCampaign(null)
                  setNewCampaign({
                    title: '',
                    description: '',
                    ctaText: '',
                    ctaLink: '',
                    audienceRules: [],
                    exclusions: [...DEFAULT_EXCLUSIONS],
                    whyThisText: '',
                    priority: 'medium',
                    validUntil: '',
                    status: 'draft',
                    owner: 'Practice Manager',
                    frequencyCap: { enabled: true, maxPerPatient: 2, periodDays: 30 },
                    channels: {
                      sms: { enabled: false, template: '' },
                      email: { enabled: false, template: '', subject: '' },
                      letter: { enabled: false }
                    },
                    schedule: { type: 'immediate' }
                  })
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveCampaign}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingCampaign ? 'Update Campaign' : 'Create Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Eligible Patients Modal (for new campaign) */}
      {showEligiblePatients && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Eligible Patients</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    {eligiblePatients.length} patients match your targeting criteria
                  </p>
                </div>
                <button
                  onClick={() => setShowEligiblePatients(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid gap-4">
                {eligiblePatients.map((patient) => (
                  <div key={patient.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {patient.firstName[0]}{patient.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {patient.firstName} {patient.lastName}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {patient.age} years old • {patient.gender} • Last visit: {patient.lastVisit}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{patient.phone}</p>
                        <p className="text-sm text-gray-600">{patient.email}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex flex-wrap gap-1">
                      {patient.matchingRules.map((rule: AudienceRule) => (
                        <span 
                          key={rule.id}
                          className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
                        >
                          {rule.label}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Ready to send to {eligiblePatients.length} patients
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowEligiblePatients(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowEligiblePatients(false)
                      alert('In a real app, this would send the communications to these patients!')
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Send Communications
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audience Modal for viewing campaign audience */}
      {showAudienceModal && selectedCampaignForAudience && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-5xl w-full max-h-[85vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Campaign Audience</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    <span className="font-medium">{selectedCampaignForAudience.title}</span> — {eligiblePatients.length} patients
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowAudienceModal(false)
                    setSelectedCampaignForAudience(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Audience Summary */}
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Target Rules</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedCampaignForAudience.audienceRules.map(rule => (
                      <span key={rule.id} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                        {rule.label}
                      </span>
                    ))}
                    {selectedCampaignForAudience.audienceRules.length === 0 && (
                      <span className="text-sm text-gray-500">All patients</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Exclusions Active</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedCampaignForAudience.exclusions.filter(e => e.enabled).map(exc => (
                      <span key={exc.id} className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                        {exc.type === 'opt_out' ? 'Opt-outs' : exc.type === 'already_booked' ? 'Already booked' : 'Recently contacted'}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Frequency Cap</p>
                  <p className="text-sm text-gray-900">
                    {selectedCampaignForAudience.frequencyCap.enabled 
                      ? `Max ${selectedCampaignForAudience.frequencyCap.maxPerPatient}x / ${selectedCampaignForAudience.frequencyCap.periodDays} days`
                      : 'No limit'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Est. Reach</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedCampaignForAudience.estimatedReach.toLocaleString()} patients</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {/* Patient List Table */}
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age/Gender</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Visit</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matching Criteria</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {eligiblePatients.slice(0, 50).map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium text-xs">
                              {patient.firstName[0]}{patient.lastName[0]}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{patient.firstName} {patient.lastName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{patient.age} • {patient.gender}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900">{patient.phone}</p>
                        <p className="text-xs text-gray-500">{patient.email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{patient.lastVisit}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {patient.matchingRules.slice(0, 2).map((rule: AudienceRule) => (
                            <span key={rule.id} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                              {rule.label}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {eligiblePatients.length > 50 && (
                <p className="text-center text-sm text-gray-500 mt-4">
                  Showing 50 of {eligiblePatients.length} patients
                </p>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => {
                  setShowAudienceModal(false)
                  setSelectedCampaignForAudience(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Preview Modal */}
      {showPreviewModal && selectedCampaignForAudience && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Message Preview</h3>
                  <p className="text-gray-600 text-sm mt-1">{selectedCampaignForAudience.title}</p>
                </div>
                <button
                  onClick={() => {
                    setShowPreviewModal(false)
                    setSelectedCampaignForAudience(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Channel Toggle */}
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex space-x-2">
                {selectedCampaignForAudience.channels.sms.enabled && (
                  <button
                    onClick={() => setPreviewChannel('sms')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      previewChannel === 'sms' 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>SMS</span>
                  </button>
                )}
                {selectedCampaignForAudience.channels.email.enabled && (
                  <button
                    onClick={() => setPreviewChannel('email')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      previewChannel === 'email' 
                        ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    <span>Email</span>
                  </button>
                )}
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {previewChannel === 'sms' ? (
                <div className="max-w-sm mx-auto">
                  {/* SMS Phone Preview */}
                  <div className="bg-gray-900 rounded-3xl p-3">
                    <div className="bg-gray-100 rounded-2xl p-4">
                      <div className="text-center text-xs text-gray-500 mb-3">
                        Ceda GP Practice
                      </div>
                      <div className="bg-green-500 text-white p-3 rounded-2xl rounded-br-md text-sm leading-relaxed">
                        {selectedCampaignForAudience.channels.sms.template
                          .replace('{firstName}', 'Sarah')
                          .replace('{link}', 'cedagp.nhs.uk/book/abc123')}
                      </div>
                      <div className="text-xs text-gray-400 text-right mt-1">
                        {selectedCampaignForAudience.channels.sms.template.length} characters
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Email Preview */}
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center space-x-3 text-sm">
                      <span className="text-gray-500">From:</span>
                      <span className="text-gray-900">Ceda GP Practice &lt;noreply@cedagp.nhs.uk&gt;</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm mt-1">
                      <span className="text-gray-500">To:</span>
                      <span className="text-gray-900">sarah.smith@email.com</span>
                    </div>
                    <div className="flex items-center space-x-3 text-sm mt-1">
                      <span className="text-gray-500">Subject:</span>
                      <span className="font-medium text-gray-900">{selectedCampaignForAudience.channels.email.subject}</span>
                    </div>
                  </div>
                  <div className="p-6 bg-white">
                    <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
                      {selectedCampaignForAudience.channels.email.template
                        .replace('{firstName}', 'Sarah')
                        .replace('{link}', 'https://cedagp.nhs.uk/book/abc123')
                        .replace('{unsubscribe_link}', 'https://cedagp.nhs.uk/preferences')}
                    </pre>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Variables shown with sample data (Sarah Smith)
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => sendTestMessage(selectedCampaignForAudience, previewChannel)}
                  className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <TestTube className="w-4 h-4" />
                  <span>Send Test</span>
                </button>
                <button
                  onClick={() => {
                    setShowPreviewModal(false)
                    setSelectedCampaignForAudience(null)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
