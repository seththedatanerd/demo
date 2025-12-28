'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface PatientAction {
  id: string
  title: string
  description: string
  href: string
  urgent?: boolean
  badge?: string
  icon: string
  iconBg: string
}

interface TargetedOffer {
  id: string
  title: string
  description: string
  ctaText: string
  ctaLink: string
  whyThisText: string
  priority: 'low' | 'medium' | 'high'
  validUntil: string
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
    icon: '📅',
    iconBg: 'bg-blue-50 border-blue-200'
  },
  {
    id: 'pay-invoice',
    title: 'Pay £85 now',
    description: 'Consultation - Jan 15',
    href: '/patient/pay/inv-456',
    badge: '3 days overdue',
    icon: '💳',
    iconBg: 'bg-emerald-50 border-emerald-200'
  },
  {
    id: 'fill-form',
    title: 'Pre-visit form',
    description: '2 quick questions',
    href: '/patient/forms/pre-visit-123',
    icon: '📋',
    iconBg: 'bg-amber-50 border-amber-200'
  },
  {
    id: 'view-results',
    title: 'Your test results are ready',
    description: 'Blood work from Jan 12',
    href: '/patient/results/lab-789',
    badge: 'New',
    icon: '🩺',
    iconBg: 'bg-rose-50 border-rose-200'
  },
  {
    id: 'messages',
    title: 'Message from Dr. Smith',
    description: '"Your blood pressure looks great..."',
    href: '/patient/messages/msg-101',
    badge: '2',
    icon: '💬',
    iconBg: 'bg-violet-50 border-violet-200'
  }
]

export default function PatientPortalHome() {
  const [loading, setLoading] = useState<string | null>(null)
  const [showWhyThis, setShowWhyThis] = useState<string | null>(null)
  const [targetedOffers, setTargetedOffers] = useState<TargetedOffer[]>([])

  // Fetch active offers on component mount
  useEffect(() => {
    fetchActiveOffers()
  }, [])

  const fetchActiveOffers = async () => {
    try {
      const response = await fetch('/api/offers?active=true', {
        cache: 'no-store'
      })
      const data = await response.json()
      if (response.ok) {
        setTargetedOffers(data.offers || [])
      }
    } catch (error) {
      console.error('Failed to fetch offers:', error)
    }
  }

  // Auto-refresh offers every 10 seconds for demo purposes
  useEffect(() => {
    const interval = setInterval(fetchActiveOffers, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleActionClick = (actionId: string) => {
    setLoading(actionId)
    setTimeout(() => setLoading(null), 500)
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-safe">
      {/* Status Bar Background */}
      <div className="h-safe-top bg-white"></div>
      
      {/* Welcome Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-lg mx-auto px-6 py-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm">
              <span className="text-3xl">👋</span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Hello, Sarah
              </h1>
              <p className="text-slate-500">
                Here's what needs your attention
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Targeted Offers */}
      {targetedOffers.length > 0 && (
        <div className="max-w-lg mx-auto px-6 py-5">
          {targetedOffers.map((offer) => (
            <div key={offer.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl flex items-center justify-center border border-teal-200">
                      <span className="text-xl">{offer.icon}</span>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-teal-600 uppercase tracking-wide">Recommended</span>
                      <h3 className="font-semibold text-slate-900">{offer.title}</h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowWhyThis(showWhyThis === offer.id ? null : offer.id)}
                    className="text-slate-400 hover:text-slate-600 text-sm transition-colors"
                  >
                    Why this?
                  </button>
                </div>

                <p className="text-slate-600 text-sm mb-4 leading-relaxed">{offer.description}</p>

                {showWhyThis === offer.id && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4">
                    <p className="text-slate-600 text-sm">{offer.whyThisText}</p>
                  </div>
                )}

                <Link
                  href={offer.ctaLink}
                  className="inline-flex items-center bg-teal-600 text-white px-5 py-2.5 rounded-xl font-medium text-sm hover:bg-teal-700 transition-colors shadow-sm"
                >
                  {offer.ctaText}
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>Valid until {new Date(offer.validUntil).toLocaleDateString()}</span>
                  <button className="hover:text-slate-600 transition-colors">Not interested</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Cards */}
      <div className="max-w-lg mx-auto px-6 py-2 space-y-3">
        {mockActions.map((action) => (
          <Link
            key={action.id}
            href={action.href}
            onClick={() => handleActionClick(action.id)}
            className="block bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all active:scale-[0.99] overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-start space-x-4">
                {/* Icon Container */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${action.iconBg}`}>
                  <span className="text-xl">{action.icon}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-1">
                    <h3 className="font-medium text-slate-900">
                      {action.title}
                    </h3>
                    
                    {/* Badge */}
                    {action.badge && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ml-2 ${
                        action.urgent 
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : action.badge === 'New'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {action.badge}
                      </span>
                    )}
                  </div>

                  <p className="text-slate-500 text-sm mb-2">
                    {action.description}
                  </p>

                  {/* Action hint */}
                  <div className="flex items-center text-blue-600 text-sm font-medium">
                    {loading === action.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <span>Tap to {action.id.includes('pay') ? 'pay' : action.id.includes('confirm') ? 'confirm' : 'view'}</span>
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
      <div className="max-w-lg mx-auto px-6 py-5">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="w-11 h-11 bg-red-100 border border-red-200 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🚨</span>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-red-900">
                Medical Emergency?
              </h3>
              <p className="text-red-700 text-sm">
                Call 999 immediately or go to A&E
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-lg mx-auto px-6">
        <div className="border-t border-slate-200"></div>
      </div>

      {/* Practice Info & Settings */}
      <div className="max-w-lg mx-auto px-6 py-5 space-y-3">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-center">
          <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-50 rounded-xl flex items-center justify-center mx-auto mb-3 border border-slate-200">
            <span className="text-xl">🏥</span>
          </div>
          <p className="text-slate-900 font-medium mb-1">Data Ravens Practice</p>
          <p className="text-slate-500 text-sm">NHS & Private • hello@dataravens.health</p>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-slate-400 text-xs">Open Mon-Fri 8am-6pm</p>
          </div>
        </div>
        
        <Link
          href="/patient/preferences"
          className="flex items-center bg-white rounded-2xl border border-slate-200 shadow-sm p-4 hover:shadow-md hover:border-slate-300 transition-all"
        >
          <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center mr-3">
            <span className="text-lg">⚙️</span>
          </div>
          <div className="flex-1 text-left">
            <p className="text-slate-900 font-medium text-sm">Communication Preferences</p>
            <p className="text-slate-500 text-xs">SMS, email & notification settings</p>
          </div>
          <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
      
      {/* Safe area bottom padding for home indicator */}
      <div className="h-safe-bottom"></div>
    </div>
  )
}
