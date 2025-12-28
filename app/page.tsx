'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function PortalSelector() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    // For demo purposes, you could auto-redirect based on URL params
    const urlParams = new URLSearchParams(window.location.search)
    const portal = urlParams.get('portal')
    
    if (portal === 'practice') {
      window.location.href = '/practice'
    } else if (portal === 'patient') {
      window.location.href = '/patient'
    }
  }, [])

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">DR</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Ravens</h1>
          <p className="text-gray-600">AI-Powered Practice Management</p>
        </div>

        {/* Portal Selection */}
        <div className="space-y-4">
          <Link 
            href="/practice"
            className="block w-full bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-blue-300 hover:shadow-lg transition-all"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">👥</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-lg">Staff Portal</h3>
                <p className="text-gray-600 text-sm">Practice management & AI tools</p>
              </div>
              <div className="text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          <Link 
            href="/patient"
            className="block w-full bg-white rounded-xl border-2 border-gray-200 p-6 hover:border-green-300 hover:shadow-lg transition-all"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📱</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-lg">Patient Portal</h3>
                <p className="text-gray-600 text-sm">Mobile-first patient experience</p>
              </div>
              <div className="text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Demo Info */}
        <div className="mt-8 text-center">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-800 text-sm font-medium mb-1">
              🎭 Demo Environment
            </p>
            <p className="text-amber-700 text-xs">
              Both portals use mock data and AI-generated content for demonstration
            </p>
          </div>
        </div>

        {/* Quick Access */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Quick access:</p>
          <div className="mt-2 space-x-4">
            <a href="?portal=practice" className="text-blue-600 hover:text-blue-800">Staff</a>
            <span>•</span>
            <a href="?portal=patient" className="text-green-600 hover:text-green-800">Patient</a>
          </div>
        </div>
      </div>
    </div>
  )
}
