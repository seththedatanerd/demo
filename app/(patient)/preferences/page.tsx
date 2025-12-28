'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CommunicationPreferences {
  smsEnabled: boolean
  emailEnabled: boolean
  targetedOffers: boolean
  practiceAnnouncements: boolean
  appointmentReminders: boolean
  healthScreenings: boolean
}

export default function PreferencesPage() {
  const router = useRouter()
  const [preferences, setPreferences] = useState<CommunicationPreferences>({
    smsEnabled: true,
    emailEnabled: true,
    targetedOffers: true,
    practiceAnnouncements: true,
    appointmentReminders: true,
    healthScreenings: true
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleToggle = (key: keyof CommunicationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleRevokeAccess = () => {
    if (confirm('Are you sure you want to revoke access to this patient portal? You will need a new link to access it again.')) {
      alert('Access revoked. You will be redirected to the main portal.')
      router.push('/')
    }
  }

  const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`w-12 h-7 rounded-full transition-colors flex-shrink-0 ${
        enabled ? 'bg-blue-600' : 'bg-slate-200'
      }`}
    >
      <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ml-1 ${
        enabled ? 'translate-x-5' : 'translate-x-0'
      }`} />
    </button>
  )

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
              <h1 className="text-xl font-semibold text-slate-900">Preferences</h1>
              <p className="text-slate-500 text-sm">Manage your communication settings</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-5 space-y-4">
        {/* Communication Channels */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Communication Channels</h2>
            <p className="text-slate-500 text-sm">How would you like us to contact you?</p>
          </div>
          
          <div className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-slate-900">SMS Messages</h3>
                <p className="text-slate-500 text-sm">Appointment reminders and urgent updates</p>
              </div>
              <Toggle enabled={preferences.smsEnabled} onToggle={() => handleToggle('smsEnabled')} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-slate-900">Email</h3>
                <p className="text-slate-500 text-sm">Test results, invoices, and detailed information</p>
              </div>
              <Toggle enabled={preferences.emailEnabled} onToggle={() => handleToggle('emailEnabled')} />
            </div>
          </div>
        </div>

        {/* Content Preferences */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Message Types</h2>
            <p className="text-slate-500 text-sm">What would you like to receive?</p>
          </div>
          
          <div className="p-5 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-slate-900">Appointment Reminders</h3>
                <p className="text-slate-500 text-sm">24-hour and 2-hour reminders</p>
              </div>
              <Toggle enabled={preferences.appointmentReminders} onToggle={() => handleToggle('appointmentReminders')} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-slate-900">Practice Announcements</h3>
                <p className="text-slate-500 text-sm">Closures, updates, and notices</p>
              </div>
              <Toggle enabled={preferences.practiceAnnouncements} onToggle={() => handleToggle('practiceAnnouncements')} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-slate-900">Health Screenings & Offers</h3>
                <p className="text-slate-500 text-sm">Personalized recommendations</p>
              </div>
              <Toggle enabled={preferences.targetedOffers} onToggle={() => handleToggle('targetedOffers')} />
            </div>

            {preferences.targetedOffers && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 border border-blue-200 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-sm">ℹ️</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-blue-900 text-sm">How we personalize offers</h4>
                    <p className="text-blue-700 text-xs mt-1 leading-relaxed">
                      We use your age, gender, and visit patterns to recommend relevant health screenings. 
                      All recommendations follow clinical guidelines.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Privacy & Security */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Privacy & Security</h2>
          </div>
          
          <div className="p-5 space-y-4">
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-amber-100 border border-amber-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">👤</span>
                </div>
                <div>
                  <h4 className="font-medium text-amber-900 text-sm mb-1">Not you?</h4>
                  <p className="text-amber-700 text-xs mb-3 leading-relaxed">
                    If you're not Sarah Jones or accessed this link by mistake, please revoke access.
                  </p>
                  <button
                    onClick={handleRevokeAccess}
                    className="bg-amber-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-amber-700 transition-colors"
                  >
                    Revoke Access
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">🔒</span>
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 text-sm mb-1">Your data is secure</h4>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    All communications are encrypted and comply with NHS data protection standards.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-4 px-6 rounded-2xl font-semibold transition-all shadow-sm ${
            saved 
              ? 'bg-emerald-600 text-white' 
              : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
          }`}
        >
          {saving ? (
            <span className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Saving...
            </span>
          ) : saved ? (
            '✓ Preferences Saved'
          ) : (
            'Save Preferences'
          )}
        </button>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 py-4">
          <p>Questions? Contact us at hello@dataravens.health</p>
        </div>
      </div>
      
      <div className="h-safe-bottom"></div>
    </div>
  )
}
