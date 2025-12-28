'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

interface FormQuestion {
  id: string
  question: string
  type: 'text' | 'select' | 'radio' | 'checkbox'
  required: boolean
  options?: string[]
  placeholder?: string
}

const mockForms: Record<string, { title: string; questions: FormQuestion[] }> = {
  'pre-visit-123': {
    title: 'Pre-visit Health Check',
    questions: [
      {
        id: 'symptoms',
        question: 'Any new symptoms since booking this appointment?',
        type: 'radio',
        required: true,
        options: ['No new symptoms', 'Minor symptoms', 'Significant symptoms']
      },
      {
        id: 'medications',
        question: 'Are you taking any new medications?',
        type: 'radio', 
        required: true,
        options: ['No changes', 'Started new medication', 'Stopped medication']
      },
      {
        id: 'details',
        question: 'Anything else Dr. Smith should know before your visit?',
        type: 'text',
        required: false,
        placeholder: 'Optional - any concerns or questions...'
      }
    ]
  }
}

export default function PatientForm() {
  const router = useRouter()
  const params = useParams()
  const formId = params.formId as string
  
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const form = mockForms[formId]
  
  if (!form) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h2 className="font-semibold text-slate-900 mb-2">Form not found</h2>
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

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const isFormValid = () => {
    const requiredQuestions = form.questions.filter(q => q.required)
    return requiredQuestions.every(q => answers[q.id] && answers[q.id].trim() !== '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isFormValid()) {
      alert('Please answer all required questions')
      return
    }

    setSubmitting(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setSubmitted(true)
    
    setTimeout(() => {
      router.push('/patient')
    }, 2000)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h2 className="font-semibold text-slate-900 mb-2">Form submitted</h2>
          <p className="text-emerald-700 text-sm mb-4">
            Thank you! Dr. Smith will review your responses before your appointment.
          </p>
          <p className="text-xs text-slate-400">Returning to portal...</p>
        </div>
      </div>
    )
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
              <h1 className="text-xl font-semibold text-slate-900">{form.title}</h1>
              <p className="text-slate-500 text-sm">Just a few quick questions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto px-6 py-5 space-y-4">
        {form.questions.map((question, index) => (
          <div key={question.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5">
              <div className="flex items-start space-x-3 mb-4">
                <div className="w-7 h-7 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-semibold">{index + 1}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">
                    {question.question}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </h3>
                </div>
              </div>

              {question.type === 'radio' && question.options && (
                <div className="ml-10 space-y-2">
                  {question.options.map((option) => (
                    <label 
                      key={option} 
                      className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-all border ${
                        answers[question.id] === option 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={answers[question.id] === option}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'text' && (
                <div className="ml-10">
                  <textarea
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder={question.placeholder}
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
                    rows={3}
                  />
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={!isFormValid() || submitting}
            className="w-full bg-blue-600 text-white py-4 px-4 rounded-2xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {submitting ? (
              <span className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Submitting...
              </span>
            ) : (
              'Submit Form'
            )}
          </button>
          
          <p className="text-center text-xs text-slate-400 mt-3">
            Your responses are secure and encrypted
          </p>
        </div>
      </form>
    </div>
  )
}
