"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { Plan } from '@/types/core'
import { useTimeline } from '@/store'
import { Check, Clock, AlertTriangle, Loader2, Sparkles } from 'lucide-react'

interface PlanPreviewDrawerProps {
  plan: Plan | null
  isOpen: boolean
  onClose: () => void
  onExecuted?: () => void
  onShowFollowUps?: (plan: Plan) => void
}

export default function PlanPreviewDrawer({ plan, isOpen, onClose, onExecuted, onShowFollowUps }: PlanPreviewDrawerProps) {
  const { executePlan } = useTimeline()
  const [isRunning, setIsRunning] = useState(false)
  const [stepStatuses, setStepStatuses] = useState<Array<'pending' | 'running' | 'success' | 'failed'>>([])
  const [progress, setProgress] = useState(0)
  const startedAtRef = useRef<number | null>(null)

  const handleExecute = async () => {
    if (!plan) return
    
    try {
      // Initialize run simulation for visuals
      setIsRunning(true)
      startedAtRef.current = Date.now()
      setStepStatuses(Array.from({ length: plan.steps.length }, () => 'pending'))
      setProgress(0)

      // Simulate step-by-step progression with animated statuses
      for (let i = 0; i < plan.steps.length; i++) {
        setStepStatuses((prev) => prev.map((s, idx) => (idx === i ? 'running' : idx < i ? 'success' : s)))
        // Variable delay for a more organic feel
        const delay = 450 + Math.round(Math.random() * 500)
        await new Promise((r) => setTimeout(r, delay))
        setStepStatuses((prev) => prev.map((s, idx) => (idx === i ? 'success' : s)))
        setProgress(Math.round(((i + 1) / plan.steps.length) * 100))
      }

      // Execute the real plan (single call) after animation completes
      await executePlan(plan)

      // Success visuals and callbacks
      setIsRunning(false)
      onClose()
      onExecuted?.()

      // Lightweight success toast
      const successToast = document.createElement('div')
      successToast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-md shadow-lg z-50'
      successToast.textContent = `Completed: ${plan.title}`
      document.body.appendChild(successToast)
      setTimeout(() => document.body.removeChild(successToast), 2600)

      setTimeout(() => onShowFollowUps?.(plan), 1200)
    } catch (error) {
      console.error('Failed to execute plan:', error)
      
      // Error toast
      const errorToast = document.createElement('div')
      errorToast.className = 'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg z-50'
      errorToast.textContent = `Failed: ${plan.title}`
      document.body.appendChild(errorToast)
      setTimeout(() => document.body.removeChild(errorToast), 5000)
      setIsRunning(false)
    }
  }

  const estimatedTime = plan?.steps?.length ? plan.steps.length * 1.5 : 0 // Average 1.5s per step
  const hasRisks = plan?.title?.includes('coverage') || plan?.title?.includes('chase')
  const effectiveProgress = isRunning ? progress : 0

  // Always show something in "Affected Records" for demo polish
  const affectedRecords = useMemo(() => {
    const items: string[] = []
    const title = (plan?.title || '').toLowerCase()

    // Heuristics based on plan title
    if (title.includes('invoice') || title.includes('chase') || title.includes('payment')) {
      items.push('Invoice: inv-101 (Overdue, £220.00)')
      items.push('Invoice: inv-102 (Draft, £145.00)')
    }
    if (title.includes('schedule') || title.includes('reschedule') || title.includes('appointment')) {
      items.push('Patient: Sarah Jones — 10:30 AM with Dr Patel')
      items.push('Patient: Amelia Ali — 2:15 PM reminder queued')
    }
    if (title.includes('insurance') || title.includes('coverage') || title.includes('verify')) {
      items.push('Insurance: Bupa — Policy check queued (Sarah Jones)')
      items.push('Insurance: AXA — Eligibility re-validated (Mrs Smith)')
    }

    // Light inference from steps, if any
    (plan?.steps || []).forEach((s) => {
      const l = s.label.toLowerCase()
      if (l.includes('email') && !items.some(i => i.startsWith('Email'))) {
        items.push('Email: 9 recipients — templates prepared')
      }
      if (l.includes('sms') && !items.some(i => i.startsWith('SMS'))) {
        items.push('SMS: 3 messages ready to send')
      }
    })

    // Demo-safe defaults to avoid emptiness
    const defaults = [
      'Patient: Mrs Smith (ID: p3)',
      'Patient: Amelia Ali (ID: p1)',
      'Patient: Sarah Jones (ID: p2)'
    ]
    for (const d of defaults) {
      if (items.length >= 3) break
      if (!items.includes(d)) items.push(d)
    }
    return items.slice(0, 6) // keep list tidy
  }, [plan])

  useEffect(() => {
    // Reset step states when plan changes or drawer opens
    if (plan && plan.steps && isOpen) {
      setIsRunning(false)
      setStepStatuses(Array.from({ length: plan.steps.length }, () => 'pending'))
      setProgress(0)
      startedAtRef.current = null
    }
  }, [plan, isOpen])

  if (!isOpen || !plan) return null

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl z-40 transform transition-transform duration-300">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-cyan-50 via-blue-50 to-cyan-50">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-medium text-gray-900">Plan Preview</h2>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow">
                <Sparkles className="w-3 h-3" /> AI
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{plan?.title || ''}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        
        {/* Plan Metadata */}
        <div className="flex items-center space-x-4 mt-3 text-sm">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-gray-600">~{estimatedTime}s ETA</span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-gray-600">
              Actor: <span className="font-medium capitalize">{plan?.actor || 'unknown'}</span>
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <span className="text-gray-600">
              Source: <span className="font-medium uppercase">{plan?.source || 'unknown'}</span>
            </span>
          </div>
        </div>

        {/* Neon progress bar */}
        <div className="mt-4 h-1.5 w-full bg-gradient-to-r from-gray-100 to-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-blue-600 to-cyan-500 transition-all duration-300"
            style={{ width: `${effectiveProgress}%` }}
          />
        </div>
      </div>

      {/* Steps Checklist */}
      <div className="flex-1 overflow-auto p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">
          Execution Steps ({plan?.steps?.length || 0})
        </h3>
        
        <div className="space-y-3">
          {(plan?.steps || []).map((step, index) => {
            const status = stepStatuses[index] || 'pending'
            const isPending = status === 'pending'
            const isActive = status === 'running'
            const isDone = status === 'success'
            return (
              <div 
                key={step.id} 
                className={`flex items-start space-x-3 p-3 rounded-lg border transition-all ${
                  isActive
                    ? 'bg-cyan-50/60 border-cyan-200 shadow-[0_0_0_1px_rgba(6,182,212,0.25)]'
                    : isDone
                    ? 'bg-green-50/60 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  isActive
                    ? 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white animate-pulse'
                    : isDone
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{step.label}</p>
                  {isActive && (
                    <div className="mt-2 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full w-1/2 bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 animate-pulse" />
                    </div>
                  )}
                </div>
                <div className="w-5 h-5">
                  {isActive && <Loader2 className="w-5 h-5 text-cyan-600 animate-spin" />}
                  {isDone && <Check className="w-5 h-5 text-green-600" />}
                </div>
              </div>
            )
          })}
        </div>

        {/* Affected Records */}
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Affected Records</h3>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <ul className="text-sm text-amber-800 list-disc list-inside space-y-1">
              {affectedRecords.map((rec, idx) => (
                <li key={idx}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Risks (if any) */}
        {hasRisks && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2" />
              Potential Risks
            </h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="text-sm text-yellow-800">
                {plan?.title?.includes('coverage') && (
                  <div>• External portal dependency - may experience timeouts</div>
                )}
                {plan?.title?.includes('chase') && (
                  <>
                    <div>• Email delivery depends on recipient servers</div>
                    <div>• Patient relationships may be affected</div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
        <div className="flex space-x-3">
          <button
            onClick={handleExecute}
            disabled={isRunning}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors text-white ${
              isRunning
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800'
            }`}
          >
            {isRunning ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Running…
              </span>
            ) : (
              'Execute Plan'
            )}
          </button>
          <button
            onClick={onClose}
            disabled={isRunning}
            className={`px-4 py-2 border rounded-md transition-colors ${
              isRunning
                ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Cancel
          </button>
        </div>
        
        <div className="text-xs text-gray-500 mt-2 text-center">
          All steps will be logged and can be undone individually
        </div>
      </div>
    </div>
  )
}
