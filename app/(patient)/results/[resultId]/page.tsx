'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface TestResult {
  id: string
  name: string
  value: string
  unit: string
  range: string
  status: 'normal' | 'high' | 'low' | 'critical'
}

interface LabResult {
  id: string
  title: string
  date: string
  practitioner: string
  summary: string
  doctorMessage: string
  results: TestResult[]
  nextActions: string[]
}

const mockResults: Record<string, LabResult> = {
  'lab-789': {
    id: 'lab-789',
    title: 'Blood Work Panel',
    date: '12 January 2025',
    practitioner: 'Dr. Smith',
    summary: 'Your blood work looks excellent! All key markers are within healthy ranges.',
    doctorMessage: 'Hi Sarah, I\'m pleased to report that your blood work shows excellent results. Your cholesterol levels have improved significantly since our last visit - down from 4.6 to 4.2 mmol/L. This is a great indication that the dietary changes we discussed and your regular exercise routine are working well. Keep up the excellent work! - Dr. Smith',
    results: [
      { id: 'cholesterol', name: 'Total Cholesterol', value: '4.2', unit: 'mmol/L', range: '< 5.0', status: 'normal' },
      { id: 'hdl', name: 'HDL (Good) Cholesterol', value: '1.8', unit: 'mmol/L', range: '> 1.0', status: 'normal' },
      { id: 'glucose', name: 'Blood Glucose', value: '5.1', unit: 'mmol/L', range: '3.9-5.6', status: 'normal' },
      { id: 'hba1c', name: 'HbA1c (3-month average)', value: '5.8', unit: '%', range: '< 6.0', status: 'normal' }
    ],
    nextActions: [
      'Continue your current healthy diet',
      'Keep up regular exercise routine', 
      'Next routine check in 6 months',
      'No immediate action needed'
    ]
  }
}

export default function PatientResults() {
  const router = useRouter()
  const params = useParams()
  const resultId = params.resultId as string
  
  const [showFullReport, setShowFullReport] = useState(false)

  const result = mockResults[resultId]
  
  if (!result) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h2 className="font-semibold text-slate-900 mb-2">Results not found</h2>
          <button 
            onClick={() => router.push('/patient')}
            className="w-full bg-slate-900 text-white py-3 px-4 rounded-xl font-medium hover:bg-slate-800 transition-colors mt-4"
          >
            Back to Portal
          </button>
        </div>
      </div>
    )
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'normal': return 'text-emerald-700 bg-emerald-50 border-emerald-200'
      case 'high': return 'text-amber-700 bg-amber-50 border-amber-200'
      case 'low': return 'text-amber-700 bg-amber-50 border-amber-200'
      case 'critical': return 'text-red-700 bg-red-50 border-red-200'
      default: return 'text-slate-700 bg-slate-50 border-slate-200'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
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
              <h1 className="text-xl font-semibold text-slate-900">{result.title}</h1>
              <p className="text-slate-500 text-sm">{result.date} • {result.practitioner}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-5 space-y-4">
        {/* Summary Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 border-b border-emerald-100">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-emerald-100 border border-emerald-200 rounded-xl flex items-center justify-center">
                <span className="text-2xl">✓</span>
              </div>
              <div>
                <h2 className="font-semibold text-slate-900">Good News</h2>
                <p className="text-sm text-emerald-700">All results within healthy range</p>
              </div>
            </div>
            <p className="text-slate-700">{result.summary}</p>
          </div>
          
          {/* Doctor's Message */}
          <div className="p-5">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-blue-100 border border-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-lg">👨‍⚕️</span>
              </div>
              <div>
                <p className="text-blue-900 font-medium text-sm mb-1">Message from {result.practitioner}</p>
                <p className="text-slate-600 text-sm leading-relaxed">{result.doctorMessage}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Your Results</h3>
          </div>
          
          <div className="p-3 space-y-2">
            {result.results.map((test) => (
              <div key={test.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 text-sm">{test.name}</p>
                  <p className="text-xs text-slate-500">Normal: {test.range}</p>
                </div>
                
                <div className="text-right mx-3">
                  <p className="font-semibold text-slate-900">{test.value}</p>
                  <p className="text-xs text-slate-500">{test.unit}</p>
                </div>
                
                <div className={`px-2.5 py-1 rounded-lg border text-xs font-medium capitalize ${getStatusStyle(test.status)}`}>
                  {test.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">What's Next</h3>
          </div>
          
          <div className="p-4 space-y-2">
            {result.nextActions.map((action, index) => (
              <div key={index} className="flex items-start space-x-3 p-2">
                <div className="w-6 h-6 bg-blue-50 border border-blue-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-semibold">{index + 1}</span>
                </div>
                <span className="text-sm text-slate-700">{action}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => setShowFullReport(!showFullReport)}
            className="w-full bg-white text-slate-900 py-3.5 px-4 rounded-2xl font-medium border border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            {showFullReport ? 'Hide' : 'View'} Full Report
          </button>
          
          <button
            onClick={() => router.push('/patient/book/follow-up-456')}
            className="w-full bg-blue-600 text-white py-3.5 px-4 rounded-2xl font-medium hover:bg-blue-700 transition-colors shadow-sm"
          >
            Book Follow-up Appointment
          </button>

          <button
            onClick={() => alert('PDF downloaded to your device!')}
            className="w-full bg-slate-100 text-slate-700 py-3.5 px-4 rounded-2xl font-medium hover:bg-slate-200 transition-colors"
          >
            Download PDF Report
          </button>
        </div>

        {/* Full Report */}
        {showFullReport && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h4 className="font-medium text-slate-900">Technical Details</h4>
            </div>
            <div className="p-4">
              <div className="bg-slate-50 rounded-xl p-4 font-mono text-xs text-slate-600 space-y-1 border border-slate-100">
                <p>Lab Reference: {result.id.toUpperCase()}</p>
                <p>Processed: {result.date} 14:32 GMT</p>
                <p>Quality Control: PASSED</p>
                <p>Methodology: Automated analyzer</p>
                <p>Reviewed by: {result.practitioner}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
