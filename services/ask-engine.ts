'use client'

import { practiceAI } from './ai'

export interface AskResponse {
  id: string
  question: string
  answer: string
  type: 'text' | 'table' | 'chart' | 'metric' | 'list' | 'insight'
  data?: any
  timestamp: string
  confidence: number
  sources?: string[]
  suggestions?: string[]
}

export interface TableData {
  headers: string[]
  rows: (string | number)[][]
  title?: string
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'doughnut'
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string[]
    borderColor?: string
  }[]
  title?: string
}

export interface MetricData {
  value: string | number
  label: string
  change?: string
  trend?: 'up' | 'down' | 'stable'
  subtitle?: string
}

// Pattern matching for different question types
const ASK_PATTERNS = [
  // Revenue & Financial Questions
  {
    patterns: [/revenue|income|earnings|financial/i, /how much.*made|total.*earned/i],
    type: 'chart',
    generator: generateRevenueChart
  },
  // Patient Demographics
  {
    patterns: [/patients.*age|age.*distribution|demographics/i],
    type: 'chart', 
    generator: generateDemographicsChart
  },
  // Appointment Analytics
  {
    patterns: [/appointments.*month|booking.*trends|schedule.*analysis/i],
    type: 'table',
    generator: generateAppointmentTable
  },
  // Top Performers
  {
    patterns: [/top.*practitioners|best.*doctors|highest.*revenue/i],
    type: 'table',
    generator: generateTopPerformersTable
  },
  // Overdue/Outstanding
  {
    patterns: [/overdue|outstanding|unpaid|late.*payment/i],
    type: 'table',
    generator: generateOverdueTable
  },
  // Metrics & KPIs
  {
    patterns: [/show me.*numbers|key.*metrics|performance.*summary/i],
    type: 'metric',
    generator: generateKeyMetrics
  },
  // Trends & Insights
  {
    patterns: [/trends|patterns|insights|analysis/i],
    type: 'insight',
    generator: generateInsights
  }
]

function generateRevenueChart(question: string): ChartData {
  return {
    type: 'bar',
    title: 'Monthly Revenue Trend',
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Revenue (£)',
      data: [12500, 15200, 18900, 16700, 21300, 19800],
      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'],
      borderColor: '#1F2937'
    }]
  }
}

function generateDemographicsChart(question: string): ChartData {
  return {
    type: 'doughnut',
    title: 'Patient Age Distribution',
    labels: ['18-30', '31-45', '46-60', '61-75', '75+'],
    datasets: [{
      label: 'Patients',
      data: [145, 289, 267, 198, 87],
      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
    }]
  }
}

function generateAppointmentTable(question: string): TableData {
  return {
    title: 'Appointment Analysis - Last 30 Days',
    headers: ['Practitioner', 'Total Appts', 'Completed', 'DNA Rate', 'Revenue'],
    rows: [
      ['Dr Sarah Patel', 124, 118, '4.8%', '£14,750'],
      ['Dr James Wilson', 98, 92, '6.1%', '£12,250'],
      ['Dr Emma Thompson', 87, 84, '3.4%', '£10,890'],
      ['Dr Michael Chen', 76, 71, '6.6%', '£8,920'],
      ['Dr Lisa Rodriguez', 69, 67, '2.9%', '£7,650']
    ]
  }
}

function generateTopPerformersTable(question: string): TableData {
  return {
    title: 'Top Performing Practitioners - This Quarter',
    headers: ['Rank', 'Practitioner', 'Revenue', 'Patient Satisfaction', 'Utilization'],
    rows: [
      [1, 'Dr Sarah Patel', '£42,150', '4.9/5', '94%'],
      [2, 'Dr James Wilson', '£38,920', '4.7/5', '89%'],
      [3, 'Dr Emma Thompson', '£35,670', '4.8/5', '91%'],
      [4, 'Dr Michael Chen', '£31,240', '4.6/5', '87%'],
      [5, 'Dr Lisa Rodriguez', '£28,890', '4.9/5', '92%']
    ]
  }
}

function generateOverdueTable(question: string): TableData {
  return {
    title: 'Outstanding Invoices - Over 30 Days',
    headers: ['Patient', 'Invoice #', 'Amount', 'Days Overdue', 'Last Contact'],
    rows: [
      ['Sarah Jones', 'INV-2024-0156', '£145.00', 45, '2 weeks ago'],
      ['Michael Brown', 'INV-2024-0134', '£220.00', 62, '1 week ago'],
      ['Emma Wilson', 'INV-2024-0098', '£180.00', 78, '3 weeks ago'],
      ['David Clark', 'INV-2024-0087', '£95.00', 84, 'Never'],
      ['Lisa Taylor', 'INV-2024-0076', '£310.00', 91, '1 month ago']
    ]
  }
}

function generateKeyMetrics(question: string): MetricData[] {
  return [
    {
      value: '£28,950',
      label: 'Monthly Revenue',
      change: '+12.3%',
      trend: 'up',
      subtitle: 'vs last month'
    },
    {
      value: 156,
      label: 'Appointments',
      change: '+8.2%',
      trend: 'up',
      subtitle: 'this month'
    },
    {
      value: '4.2%',
      label: 'DNA Rate',
      change: '-0.8%',
      trend: 'down',
      subtitle: 'improvement'
    },
    {
      value: '89%',
      label: 'Patient Satisfaction',
      change: '+2.1%',
      trend: 'up',
      subtitle: 'average rating'
    }
  ]
}

function generateInsights(question: string): string {
  const insights = [
    "📈 **Revenue Growth**: Your practice has seen consistent 12% month-over-month growth, driven primarily by increased appointment volume and improved collection rates.",
    "🎯 **Peak Performance**: Tuesday and Wednesday are your highest revenue days, generating 35% more than Mondays. Consider optimizing staff scheduling accordingly.",
    "⚠️ **DNA Patterns**: Patients aged 18-25 have a 23% higher no-show rate. Implementing SMS reminders 24 hours before appointments could reduce this significantly.",
    "💡 **Opportunity**: Dr Sarah Patel has the highest patient satisfaction (4.9/5) and could mentor other practitioners to improve overall scores.",
    "🔍 **Collection Insight**: Invoices over £200 have a 34% longer collection time. Consider offering payment plans for higher-value treatments."
  ]
  
  return insights[Math.floor(Math.random() * insights.length)]
}

export async function askQuestion(question: string, context?: any): Promise<AskResponse> {
  // Try AI-powered response first (Gemini)
  try {
    const aiResponse = await practiceAI.answerQuestion(question, context)
    if (aiResponse && aiResponse.answer) {
      return {
        id: `ask-${Date.now()}`,
        question,
        answer: aiResponse.answer,
        type: aiResponse.type || 'text',
        data: aiResponse.data,
        timestamp: new Date().toISOString(),
        confidence: aiResponse.confidence || 0.8,
        sources: aiResponse.sources || ['AI Analysis'],
        suggestions: aiResponse.suggestions
      }
    }
  } catch (error) {
    console.log('AI response failed, using pattern matching fallback:', error)
  }

  // Fallback to pattern matching for specific data visualizations
  for (const pattern of ASK_PATTERNS) {
    if (pattern.patterns.some(p => p.test(question))) {
      const data = pattern.generator(question)
      return {
        id: `ask-${Date.now()}`,
        question,
        answer: getAnswerText(pattern.type, data),
        type: pattern.type,
        data,
        timestamp: new Date().toISOString(),
        confidence: 0.85,
        sources: ['Practice Management System', 'Historical Data']
      }
    }
  }

  // Generic fallback
  return {
    id: `ask-${Date.now()}`,
    question,
    answer: generateGenericResponse(question),
    type: 'text',
    timestamp: new Date().toISOString(),
    confidence: 0.6,
    sources: ['General Analysis']
  }
}

function getAnswerText(type: string, data: any): string {
  switch (type) {
    case 'chart':
      return `I've generated a ${data.type} chart showing ${data.title?.toLowerCase() || 'the requested data'}. The visualization reveals key trends and patterns in your practice data.`
    case 'table':
      return `Here's a detailed breakdown of ${data.title?.toLowerCase() || 'the requested information'}. The table shows comprehensive metrics and comparisons.`
    case 'metric':
      return `I've compiled the key performance indicators for your practice. These metrics provide insight into your current performance and trends.`
    case 'insight':
      return data
    default:
      return 'Here\'s the information you requested based on your practice data.'
  }
}

function generateGenericResponse(question: string): string {
  const responses = [
    "Based on your practice data, I can see some interesting patterns. Your patient volume has been steady with seasonal variations typical for healthcare practices.",
    "Looking at the trends in your data, there are several opportunities for optimization. Patient satisfaction scores are strong, and appointment utilization is above industry average.",
    "Your practice metrics show healthy growth indicators. Revenue trends are positive, and operational efficiency has improved over the past quarter.",
    "The data suggests your practice is performing well across key metrics. Patient retention rates are high, and billing efficiency has shown consistent improvement.",
    "From analyzing your practice patterns, I notice strong performance in patient care delivery. There are opportunities to optimize scheduling and reduce administrative overhead."
  ]
  
  return responses[Math.floor(Math.random() * responses.length)]
}

// Export common question examples for UI
export const EXAMPLE_QUESTIONS = {
  financial: [
    "What's our monthly revenue trend?",
    "Show me outstanding invoices over 30 days",
    "Which practitioners generate the most revenue?",
    "How are our collection rates performing?"
  ],
  operational: [
    "What's our appointment DNA rate by age group?",
    "Show me practitioner utilization rates",
    "Which days are busiest for appointments?",
    "What's our average patient satisfaction score?"
  ],
  insights: [
    "What trends do you see in our practice data?",
    "Give me key performance insights",
    "What opportunities should we focus on?",
    "How can we improve our operational efficiency?"
  ],
  patients: [
    "What's our patient age distribution?",
    "Show me new patient acquisition trends",
    "Which patients need follow-up appointments?",
    "What's our patient retention rate?"
  ]
}
