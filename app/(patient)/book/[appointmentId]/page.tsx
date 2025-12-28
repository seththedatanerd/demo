'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface AppointmentSlot {
  datetime: string
  displayDate: string
  displayTime: string
  practitioner: string
  travelTime: string
  confidence: 'high' | 'medium' | 'low'
  reason: string
}

interface Appointment {
  id: string
  patientId: string
  practitioner: string
  type: string
  currentSlot: {
    date: string
    time: string
    datetime: string
  }
  status: string
}

export default function BookingPage() {
  const params = useParams()
  const router = useRouter()
  const appointmentId = params.appointmentId as string

  const [appointment, setAppointment] = useState<Appointment | null>(null)
  const [suggestedSlots, setSuggestedSlots] = useState<AppointmentSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [aiGenerated, setAiGenerated] = useState(false)
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchAppointmentData()
  }, [appointmentId])

  const fetchAppointmentData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/patient/book?appointmentId=${appointmentId}&action=reschedule`)
      const data = await response.json()

      if (response.ok) {
        setAppointment(data.appointment)
        setSuggestedSlots(data.suggestedSlots || [])
        setAiGenerated(data.aiGenerated || false)
      } else {
        setError(data.error || 'Failed to load appointment')
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmCurrent = async () => {
    setActionLoading('confirm')
    
    try {
      const response = await fetch('/api/patient/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          action: 'confirm'
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        setTimeout(() => router.push('/'), 2000)
      } else {
        setError(data.error || 'Failed to confirm appointment')
      }
    } catch (err) {
      setError('Failed to confirm appointment')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReschedule = async (newSlot: AppointmentSlot) => {
    setActionLoading(newSlot.datetime)
    
    try {
      const response = await fetch('/api/patient/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointmentId,
          action: 'reschedule',
          newSlot
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        setTimeout(() => router.push('/'), 2000)
      } else {
        setError(data.error || 'Failed to reschedule appointment')
      }
    } catch (err) {
      setError('Failed to reschedule appointment')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading your appointment...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h2 className="font-semibold text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="w-full bg-slate-900 text-white py-3 px-4 rounded-xl font-medium hover:bg-slate-800 transition-colors"
          >
            Back to Portal
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h2 className="font-semibold text-slate-900 mb-2">All Done</h2>
          <p className="text-emerald-700 text-sm mb-4">{success}</p>
          <p className="text-xs text-slate-400">Returning to portal...</p>
        </div>
      </div>
    )
  }

  if (!appointment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-600">Appointment not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-safe">
      {/* Status Bar Background */}
      <div className="h-safe-top bg-white"></div>
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-lg mx-auto px-6 py-6">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.push('/patient')}
              className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">
                {appointment?.status === 'booking' ? 'Book Screening' : 'Your Appointment'}
              </h1>
              <p className="text-slate-500 text-sm">Confirm or reschedule</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-5 space-y-4">
        {/* Current Appointment Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-5">
            <div className="flex items-center justify-between text-white">
              <div>
                <p className="text-3xl font-bold mb-1">{appointment.currentSlot.time}</p>
                <p className="text-blue-100">{appointment.currentSlot.date}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{appointment.practitioner}</p>
                <p className="text-blue-100 text-sm">{appointment.type}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Confirm Button */}
        <div>
          <p className="text-slate-900 font-medium mb-3">
            {appointment.status === 'booking' ? 'Request this appointment?' : 'Keep your current time?'}
          </p>
          <button
            onClick={handleConfirmCurrent}
            disabled={actionLoading === 'confirm'}
            className="w-full bg-emerald-600 text-white py-4 px-6 rounded-2xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 shadow-sm"
          >
            {actionLoading === 'confirm' ? (
              <span className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                {appointment.status === 'booking' ? 'Requesting...' : 'Confirming...'}
              </span>
            ) : (
              appointment.status === 'booking' 
                ? `Request Screening Appointment`
                : `✓ Yes, confirm ${appointment.currentSlot.time}`
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center space-x-4 py-2">
          <div className="flex-1 border-t border-slate-200"></div>
          <span className="text-slate-400 text-sm">or</span>
          <div className="flex-1 border-t border-slate-200"></div>
        </div>

        {/* Alternative Slots */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-slate-900 font-medium">
              Pick a different time
            </p>
            {aiGenerated && (
              <div className="flex items-center px-2.5 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2" />
                <span className="text-xs font-medium text-blue-700">AI suggested</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {suggestedSlots.map((slot) => (
              <button
                key={slot.datetime}
                onClick={() => handleReschedule(slot)}
                disabled={actionLoading === slot.datetime}
                className="w-full bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all disabled:opacity-50 text-left"
              >
                {actionLoading === slot.datetime ? (
                  <div className="flex items-center justify-center py-2">
                    <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                    <span className="font-medium text-slate-700">Booking...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <p className="font-semibold text-slate-900">{slot.displayTime}</p>
                        <p className="text-slate-600">{slot.displayDate}</p>
                        {slot.confidence === 'high' && (
                          <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium border border-emerald-200">
                            Best match
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">{slot.practitioner} • {slot.travelTime}</p>
                    </div>
                    
                    <div className="text-slate-400 ml-4">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Help */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 text-center">
          <p className="text-slate-600 text-sm mb-3">Need a different time?</p>
          <button className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-slate-800 transition-colors">
            Call us on 020 7123 4567
          </button>
        </div>
      </div>
      
      {/* Safe area bottom padding */}
      <div className="h-safe-bottom"></div>
    </div>
  )
}
