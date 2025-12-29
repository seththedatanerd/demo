'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function PatientAuthContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Form data
  const [dob, setDob] = useState('')
  const [postcode, setPostcode] = useState('')
  
  // Get redirect destination from URL params (where they were trying to go)
  const redirectTo = searchParams.get('redirect') || '/'

  const handleDobSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!dob) {
      setError('Please enter your date of birth')
      return
    }
    setError('')
    setStep(2)
  }

  const handlePostcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!postcode) {
      setError('Please enter your postcode')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Call our mock authentication API
      const response = await fetch('/api/patient/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dob, postcode })
      })

      const data = await response.json()

      if (response.ok) {
        // Store JWT token (in real app would use secure httpOnly cookies)
        sessionStorage.setItem('patient_token', data.token)
        sessionStorage.setItem('patient_data', JSON.stringify(data.patient))
        
        // Redirect to intended destination
        router.push(redirectTo)
      } else {
        setError(data.error || 'Authentication failed')
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Progress Indicator */}
      <div className="bg-white border-b border-gray-100 p-4">
        <div className="flex items-center space-x-2 mb-2">
          <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`} />
          <div className={`flex-1 h-1 rounded ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
          <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
        </div>
        <p className="text-sm text-gray-600 text-center">
          {step === 1 ? 'Step 1 of 2' : 'Step 2 of 2'}
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          
          {/* Step 1: Date of Birth */}
          {step === 1 && (
            <form onSubmit={handleDobSubmit} className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔐</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Verify your identity
                </h2>
                <p className="text-gray-600">
                  Enter your date of birth to get started
                </p>
              </div>

              <div>
                <label htmlFor="dob" className="block text-sm font-medium text-gray-700 mb-2">
                  Date of birth
                </label>
                <input
                  type="date"
                  id="dob"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="DD/MM/YYYY"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            </form>
          )}

          {/* Step 2: Postcode */}
          {step === 2 && (
            <form onSubmit={handlePostcodeSubmit} className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📍</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Almost there
                </h2>
                <p className="text-gray-600">
                  Enter your postcode to complete verification
                </p>
              </div>

              <div>
                <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-2">
                  Postcode
                </label>
                <input
                  type="text"
                  id="postcode"
                  value={postcode}
                  onChange={(e) => setPostcode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg uppercase focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="SW1A 1AA"
                  maxLength={8}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2" />
                      Verifying...
                    </>
                  ) : (
                    'Access Patient Portal'
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Back
                </button>
              </div>
            </form>
          )}

        </div>
      </div>

      {/* Security Notice */}
      <div className="p-4 bg-gray-100 border-t border-gray-200">
        <div className="text-center text-xs text-gray-600">
          <p>🔒 Your data is encrypted and secure</p>
          <p className="mt-1">We use NHS-approved security standards</p>
        </div>
      </div>
    </div>
  )
}

export default function PatientAuth() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>}>
      <PatientAuthContent />
    </Suspense>
  )
}
