'use client'

import { useState } from 'react'
import Link from 'next/link'

interface PatientAction {
  id: string
  title: string
  description: string
  href: string
  urgent?: boolean
  badge?: string
  icon: string
}

// Mock patient actions - would come from API/context in real app
const mockActions: PatientAction[] = [
  {
    id: 'confirm-appointment',
    title: 'Confirm 3:15 PM Tuesday',
    description: 'Dr. Smith • General Consultation',
    href: '/patient/book/appt-123',
    urgent: true,
    badge: 'Tomorrow',
    icon: '📅'
  },
  {
    id: 'pay-invoice',
    title: 'Pay £85 now',
    description: 'Consultation - Jan 15',
    href: '/patient/pay/inv-456',
    badge: '3 days overdue',
    icon: '💳'
  },
  {
    id: 'fill-form',
    title: 'Pre-visit form',
    description: '2 quick questions',
    href: '/patient/forms/pre-visit-123',
    icon: '📋'
  },
  {
    id: 'view-results',
    title: 'Your test results are ready',
    description: 'Blood work from Jan 12',
    href: '/patient/results/lab-789',
    badge: 'New',
    icon: '🩺'
  },
  {
    id: 'messages',
    title: 'Message from Dr. Smith',
    description: '"Your blood pressure looks great..."',
    href: '/patient/messages/msg-101',
    badge: '2',
    icon: '💬'
  }
]

export default function PatientPortalHome() {
  const [loading, setLoading] = useState<string | null>(null)

  const handleActionClick = (actionId: string) => {
    setLoading(actionId)
    // Simulate loading state - in real app this would be handled by Next.js routing
    setTimeout(() => setLoading(null), 500)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Welcome Header */}
      <div className="bg-white border-b border-gray-100 p-4">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-900 mb-1">
            Hi Sarah 👋
          </h1>
          <p className="text-sm text-gray-600">
            Here's what needs your attention
          </p>
        </div>
      </div>

      {/* Action Cards */}
      <div className="p-4 space-y-3">
        {mockActions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            onClick={() => handleActionClick(action.id)}
            className="block bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all active:scale-98"
          >
            <div className="flex items-start space-x-3">
              {/* Icon */}
              <div className="text-2xl mt-1">
                {action.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-gray-900 text-base truncate">
                    {action.title}
                  </h3>
                  
                  {/* Badge */}
                  {action.badge && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      action.urgent 
                        ? 'bg-red-100 text-red-800'
                        : action.badge === 'New'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {action.badge}
                    </span>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-2">
                  {action.description}
                </p>

                {/* Action Button */}
                <div className="flex items-center justify-between">
                  <div className={`inline-flex items-center text-sm font-medium ${
                    action.urgent ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {loading === action.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Tap to {action.id.includes('pay') ? 'pay' : action.id.includes('confirm') ? 'confirm' : 'open'}
                        <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Emergency Contact */}
      <div className="p-4 mt-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-3">
            <div className="text-xl">🚨</div>
            <div>
              <h3 className="font-semibold text-red-900 text-sm">
                Medical Emergency?
              </h3>
              <p className="text-red-700 text-xs mt-1">
                Call 999 immediately or go to A&E
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Practice Info */}
      <div className="p-4 text-center text-xs text-gray-500">
        <p>Data Ravens Practice • NHS & Private</p>
        <p>For non-urgent queries: hello@dataravens.health</p>
      </div>
    </div>
  )
}
