'use client'

import { useState, useEffect } from 'react'
import { useRole } from '@/store'
import { careAutopilot } from '@/services/care-autopilot'
import { createPlan } from '@/services/planner'
import type { CohortSummary, CohortPatient, CohortType, PopulationKPI, CareSignal } from '@/types/care-autopilot'
import { 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Activity, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Play,
  Calendar,
  Eye,
  Filter,
  MoreVertical
} from 'lucide-react'

export default function CarePage() {
  const { currentRole } = useRole()
  const [selectedCohort, setSelectedCohort] = useState<CohortType | null>(null)
  const [cohortSummaries, setCohortSummaries] = useState<CohortSummary[]>([])
  const [cohortPatients, setCohortPatients] = useState<CohortPatient[]>([])
  const [selectedPatients, setSelectedPatients] = useState<string[]>([])
  const [populationKPIs, setPopulationKPIs] = useState<PopulationKPI[]>([])
  const [careSignals, setCareSignals] = useState<CareSignal[]>([])
  const [showSignalInbox, setShowSignalInbox] = useState(false)

  useEffect(() => {
    setCohortSummaries(careAutopilot.getCohortSummaries())
    setPopulationKPIs(careAutopilot.getPopulationKPIs())
    setCareSignals(careAutopilot.getCareSignals())
  }, [])

  useEffect(() => {
    if (selectedCohort) {
      setCohortPatients(careAutopilot.getCohortPatients(selectedCohort))
    }
  }, [selectedCohort])

  const handleCohortSelect = (cohortType: CohortType) => {
    setSelectedCohort(cohortType)
    setSelectedPatients([])
    setShowSignalInbox(false)
  }

  const handlePatientSelect = (patientId: string) => {
    setSelectedPatients(prev => 
      prev.includes(patientId) 
        ? prev.filter(id => id !== patientId)
        : [...prev, patientId]
    )
  }

  const handleBulkAction = async (action: string) => {
    if (selectedPatients.length === 0) return

    const actionMap: Record<string, string> = {
      'order_hba1c': 'Order HbA1c tests for selected diabetes patients',
      'send_bp_reminders': 'Send BP monitoring reminders to selected patients',
      'schedule_followups': 'Schedule follow-up appointments for selected patients',
      'medication_review': 'Flag selected patients for medication review'
    }

    const planTitle = actionMap[action] || `Execute ${action} for ${selectedPatients.length} patients`
    
    // Create a plan for the bulk action
    const plan = await createPlan(planTitle, {
      actor: 'user',
      source: 'cmdk',
      role: currentRole,
      autopilotMode: 'manual'
    })

    if (plan) {
      // This would trigger the plan preview modal in the parent layout
      console.log('Bulk action plan created:', plan)
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'text-red-600 bg-red-100'
      case 'high': return 'text-orange-600 bg-orange-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      case 'low': return 'text-blue-600 bg-blue-100 border-blue-200'
      default: return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  if (showSignalInbox) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <button
                onClick={() => setShowSignalInbox(false)}
                className="text-blue-600 hover:text-blue-800 mb-2 flex items-center text-sm"
              >
                ← Back to Population Health
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Signal Inbox</h1>
              <p className="text-gray-600">Machine-detected events requiring attention</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </button>
            </div>
          </div>

          {/* Signal Cards */}
          <div className="space-y-4">
            {careSignals.map((signal) => (
              <div key={signal.id} className={`bg-white rounded-lg border-l-4 shadow-sm p-6 ${getSeverityColor(signal.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(signal.severity)}`}>
                        {signal.severity.toUpperCase()}
                      </span>
                      <span className="text-sm text-gray-500">{signal.patientName}</span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">{signal.detectedAt.toLocaleTimeString()}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{signal.title}</h3>
                    <p className="text-gray-600 mb-4">{signal.description}</p>
                    
                    <div className="bg-gray-50 rounded-md p-3 mb-4">
                      <p className="text-sm text-gray-700 mb-2">
                        <strong>Why flagged:</strong> {signal.triggerRule}
                      </p>
                      <p className="text-sm text-gray-700">
                        <strong>Proposed plan:</strong> {signal.proposedPlan.rationale}
                      </p>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        ETA: {signal.proposedPlan.eta}
                      </span>
                      <span>Tools: {signal.proposedPlan.tools.join(', ')}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-6">
                    <button
                      onClick={() => careAutopilot.dismissSignal(signal.id, 'current-user')}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      Dismiss
                    </button>
                    {signal.requiresApproval ? (
                      <button className="px-4 py-1.5 text-sm text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md font-medium">
                        Ask to Run
                      </button>
                    ) : (
                      <button className="px-4 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md font-medium flex items-center">
                        <Play className="w-3 h-3 mr-1" />
                        Run Plan
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Population Health</h1>
            <p className="text-gray-600">Care coordination and pathway management</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowSignalInbox(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Signal Inbox</span>
              <span className="bg-orange-200 text-orange-800 px-2 py-0.5 rounded-full text-xs font-medium">
                {careSignals.filter(s => s.status === 'new').length}
              </span>
            </button>
          </div>
        </div>

        {/* Population KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {populationKPIs.map((kpi) => (
            <div key={kpi.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-600">{kpi.title}</h3>
                <div className={`flex items-center text-xs px-2 py-1 rounded-full ${
                  kpi.trend === 'up' ? 'text-red-600 bg-red-100' : 
                  kpi.trend === 'down' ? 'text-green-600 bg-green-100' : 
                  'text-gray-600 bg-gray-100'
                }`}>
                  <TrendingUp className={`w-3 h-3 mr-1 ${kpi.trend === 'down' ? 'rotate-180' : ''}`} />
                  {kpi.trendValue > 0 ? '+' : ''}{kpi.trendValue}
                </div>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-bold text-gray-900">{kpi.value}</span>
                  <span className="text-sm text-gray-500 ml-1">{kpi.unit}</span>
                </div>
                {kpi.actionable && (
                  <button 
                    onClick={() => handleBulkAction(kpi.id)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {kpi.actionText}
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-600 mt-2">{kpi.description}</p>
            </div>
          ))}
        </div>

        {/* Cohort Selection */}
        {!selectedCohort ? (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient Cohorts</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {cohortSummaries.map((cohort) => (
                <button
                  key={cohort.type}
                  onClick={() => handleCohortSelect(cohort.type)}
                  className={`${cohort.color} hover:opacity-90 text-white rounded-lg p-4 text-left transition-all hover:scale-105`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{cohort.icon}</span>
                    {cohort.activeSignals > 0 && (
                      <span className="bg-white bg-opacity-20 text-white px-2 py-1 rounded-full text-xs font-medium">
                        {cohort.activeSignals}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold mb-1">{cohort.name}</h3>
                  <div className="text-sm opacity-90">
                    <div>{cohort.totalPatients} patients</div>
                    <div>{cohort.highRisk} high risk</div>
                    <div>{cohort.careGaps} care gaps</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Cohort Detail View */
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setSelectedCohort(null)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ← Back to Cohorts
                </button>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {cohortSummaries.find(c => c.type === selectedCohort)?.name} Cohort
                  </h2>
                  <p className="text-sm text-gray-600">
                    {cohortPatients.length} patients • {selectedPatients.length} selected
                  </p>
                </div>
              </div>
              
              {selectedPatients.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Act on selected:</span>
                  {selectedCohort === 'diabetes' && (
                    <button
                      onClick={() => handleBulkAction('order_hba1c')}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Order HbA1c
                    </button>
                  )}
                  {selectedCohort === 'hypertension' && (
                    <button
                      onClick={() => handleBulkAction('send_bp_reminders')}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Send BP Reminders
                    </button>
                  )}
                  <button
                    onClick={() => handleBulkAction('schedule_followups')}
                    className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Schedule Follow-ups
                  </button>
                </div>
              )}
            </div>

            {/* Patient Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedPatients.length === cohortPatients.length && cohortPatients.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPatients(cohortPatients.map(p => p.id))
                      } else {
                        setSelectedPatients([])
                      }
                    }}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">Select All</span>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {cohortPatients.map((patient) => (
                  <div key={patient.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedPatients.includes(patient.id)}
                          onChange={() => handlePatientSelect(patient.id)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className="text-sm font-medium text-gray-900">{patient.name}</h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(patient.riskLevel)}`}>
                              {patient.riskLevel}
                            </span>
                            {patient.careGaps.length > 0 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-orange-600 bg-orange-100">
                                {patient.careGaps.length} gap{patient.careGaps.length > 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                            <span>Stage: {patient.pathwayStage}</span>
                            <span>Owner: {patient.owner}</span>
                            <span>Next review: {patient.nextReview.toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="text-right text-xs text-gray-600">
                          <div className="font-medium">{patient.nextStep}</div>
                          {patient.careGaps.length > 0 && (
                            <div className="text-orange-600 mt-1">
                              {patient.careGaps[0].description}
                            </div>
                          )}
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
