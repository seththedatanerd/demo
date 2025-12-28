'use client'

import { useState } from 'react'
import { useTimeline, useCalls } from '@/store'
import { EventItem } from '@/types/core'
import { Undo2, Play, AlertCircle, CheckCircle, Clock, Phone } from 'lucide-react'

interface EventTimelineProps {
  isOpen: boolean
  onClose: () => void
}

export default function EventTimeline({ isOpen, onClose }: EventTimelineProps) {
  const { events, undoEvent, undoAllPlan, activePlan } = useTimeline()
  const { getCallById } = useCalls()
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set())

  if (!isOpen) return null

  // Group events by plan
  const eventsByPlan = events.reduce((acc, event) => {
    const planId = event.planId || 'standalone'
    if (!acc[planId]) acc[planId] = []
    acc[planId].push(event)
    return acc
  }, {} as Record<string, EventItem[]>)

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getEventIcon = (type: string, actor: string) => {
    if (type === 'plan.start') return <Play className="w-4 h-4 text-blue-500" />
    if (type === 'plan.complete') return <CheckCircle className="w-4 h-4 text-green-500" />
    if (type === 'plan.failed') return <AlertCircle className="w-4 h-4 text-red-500" />
    if (type === 'step.complete') return <CheckCircle className="w-3 h-3 text-green-500" />
    if (type === 'system.undo') return <Undo2 className="w-3 h-3 text-orange-500" />
    if (actor === 'autopilot') return <span className="w-4 h-4 bg-purple-100 text-purple-600 rounded text-xs flex items-center justify-center font-bold">A</span>
    return <Clock className="w-3 h-3 text-gray-400" />
  }

  const getEventColor = (type: string) => {
    if (type === 'plan.failed') return 'border-red-200 bg-red-50'
    if (type === 'plan.complete') return 'border-green-200 bg-green-50'
    if (type === 'step.complete') return 'border-blue-200 bg-blue-50'
    if (type.includes('undo')) return 'border-orange-200 bg-orange-50'
    return 'border-gray-200 bg-white'
  }

  const togglePlanExpansion = (planId: string) => {
    const newExpanded = new Set(expandedPlans)
    if (newExpanded.has(planId)) {
      newExpanded.delete(planId)
    } else {
      newExpanded.add(planId)
    }
    setExpandedPlans(newExpanded)
  }

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl z-50 transform transition-transform duration-300">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">AI Action Trail</h2>
          <div className="flex items-center space-x-2">
            {activePlan && (
              <div className="flex items-center space-x-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Executing</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="text-sm text-gray-500 mt-1">
          {events.length} actions • Every AI and user action logged • Undo anytime
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-auto p-6">
        {Object.keys(eventsByPlan).length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No events yet</p>
            <p className="text-sm">Actions will appear here as they happen</p>
          </div>
        )}

        <div className="space-y-4">
          {Object.entries(eventsByPlan).reverse().map(([planId, planEvents]) => {
            const planStartEvent = planEvents.find(e => e.type === 'plan.start')
            const planTitle = planStartEvent?.summary.replace('Starting plan: ', '') || 'Standalone Actions'
            const isExpanded = expandedPlans.has(planId)
            const stepEvents = planEvents.filter(e => e.stepId && !e.type.startsWith('system.undo'))
            const canUndoPlan = stepEvents.length > 0 && !planEvents.some(e => e.type === 'plan.failed')
            const hasFailures = planEvents.some(e => e.type === 'step.failed')

            return (
              <div key={planId} className="border border-gray-200 rounded-lg overflow-hidden">
                {/* Plan Header */}
                {planId !== 'standalone' && (
                  <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => togglePlanExpansion(planId)}
                        className="flex-1 flex items-start space-x-3 text-left"
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {getEventIcon(planEvents[planEvents.length - 1]?.type || 'plan.start', planStartEvent?.actor || 'user')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {planTitle}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                            <span>{formatTime(planStartEvent?.ts || Date.now())}</span>
                            <span>•</span>
                            <span className="capitalize">{planStartEvent?.actor}</span>
                            <span>•</span>
                            <span className="uppercase">{planStartEvent?.source}</span>
                            {planStartEvent?.actor === 'autopilot' && (
                              <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded-full text-xs font-medium">
                                AUTOPILOT
                              </span>
                            )}
                            {planStartEvent?.source === 'call' && (
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full text-xs font-medium flex items-center">
                                <Phone className="w-3 h-3 mr-1" />
                                CALL
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                      
                      {/* Plan Actions */}
                      <div className="flex items-center space-x-2 ml-2">
                        {hasFailures && (
                          <button
                            onClick={() => console.log('Retry failed not implemented')}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-400 rounded cursor-not-allowed"
                            disabled
                          >
                            Retry failed
                          </button>
                        )}
                        {canUndoPlan && (
                          <button
                            onClick={() => undoAllPlan(planId)}
                            className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                          >
                            Undo All
                          </button>
                        )}
                        <span className="text-gray-400">
                          {isExpanded ? '−' : '+'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Plan Steps */}
                {(isExpanded || planId === 'standalone') && (
                  <div className="divide-y divide-gray-100">
                    {planEvents.map((event) => (
                      <div 
                        key={event.id} 
                        className={`p-3 ${getEventColor(event.type)}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-2 flex-1 min-w-0">
                            <div className="flex-shrink-0 mt-0.5">
                              {getEventIcon(event.type, event.actor)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-900">{event.summary}</p>
                              <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                                <span>{formatTime(event.ts)}</span>
                                <span>•</span>
                                <span className="capitalize">{event.actor}</span>
                                {event.stepId && (
                                  <>
                                    <span>•</span>
                                    <span>Step {event.stepId.split('-')[1]}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Step Undo */}
                          {event.undo && event.type === 'step.complete' && (
                            <button
                              onClick={() => undoEvent(event.id)}
                              className="flex-shrink-0 px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                            >
                              Undo
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Total Events:</span>
            <span className="font-medium">{events.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Plans Executed:</span>
            <span className="font-medium">
              {Object.keys(eventsByPlan).filter(id => id !== 'standalone').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
