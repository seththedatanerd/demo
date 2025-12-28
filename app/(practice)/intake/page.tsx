'use client'

import { useState, useEffect } from 'react'
import { useRole } from '@/store'
import { aiIntake } from '@/services/ai-intake'
import type { IntakeSession, IntakeStats, IntakeInsight } from '@/types/ai-intake'
import { 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Eye,
  TrendingUp,
  Users,
  Target,
  Zap,
  Calendar,
  Brain,
  MessageCircle,
  Star
} from 'lucide-react'

export default function IntakePage() {
  const { currentRole } = useRole()
  const [sessions, setSessions] = useState<IntakeSession[]>([])
  const [stats, setStats] = useState<IntakeStats | null>(null)
  const [insights, setInsights] = useState<IntakeInsight[]>([])
  const [selectedSession, setSelectedSession] = useState<IntakeSession | null>(null)
  const [showConversation, setShowConversation] = useState(false)

  useEffect(() => {
    setSessions(aiIntake.getUpcomingAppointmentsWithIntake())
    setStats(aiIntake.getStats())
    setInsights(aiIntake.getInsights())
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'in_progress': return 'text-blue-600 bg-blue-100'
      case 'sent': return 'text-yellow-600 bg-yellow-100'
      case 'requested': return 'text-gray-600 bg-gray-100'
      case 'expired': return 'text-red-600 bg-red-100'
      case 'declined': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const formatDuration = (startedAt?: Date, completedAt?: Date) => {
    if (!startedAt || !completedAt) return 'N/A'
    const minutes = Math.round((completedAt.getTime() - startedAt.getTime()) / (1000 * 60))
    return `${minutes} min`
  }

  const getQualityBadge = (quality: string) => {
    const colors = {
      'excellent': 'text-green-700 bg-green-100',
      'good': 'text-blue-700 bg-blue-100',
      'fair': 'text-yellow-700 bg-yellow-100',
      'poor': 'text-red-700 bg-red-100'
    }
    return colors[quality as keyof typeof colors] || colors.good
  }

  if (showConversation && selectedSession) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <button
                onClick={() => setShowConversation(false)}
                className="text-blue-600 hover:text-blue-800 mb-2 flex items-center text-sm"
              >
                ← Back to Intake Dashboard
              </button>
              <h1 className="text-2xl font-bold text-gray-900">
                AI Intake Conversation: {selectedSession.patientName}
              </h1>
              <p className="text-gray-600">
                Appointment with {selectedSession.requestedBy} • {selectedSession.appointmentDate.toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedSession.status)}`}>
                {selectedSession.status.replace('_', ' ').toUpperCase()}
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Duration: {formatDuration(selectedSession.startedAt, selectedSession.completedAt)}
              </p>
            </div>
          </div>

          {/* AI Summary */}
          {selectedSession.aiSummary && (
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-blue-600" />
                  AI Summary & Insights
                </h3>
                <div className="flex items-center space-x-3">
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getQualityBadge(selectedSession.aiSummary.conversationQuality)}`}>
                    {selectedSession.aiSummary.conversationQuality}
                  </div>
                  <div className="text-sm text-gray-600">
                    Confidence: {Math.round(selectedSession.aiSummary.confidence * 100)}%
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Chief Concern</h4>
                  <p className="text-gray-700 text-sm mb-4">{selectedSession.aiSummary.chiefConcern}</p>
                  
                  <h4 className="font-medium text-gray-900 mb-2">Key Symptoms</h4>
                  <ul className="text-sm text-gray-700 space-y-1 mb-4">
                    {selectedSession.aiSummary.symptoms.map((symptom, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {symptom}
                      </li>
                    ))}
                  </ul>

                  <h4 className="font-medium text-gray-900 mb-2">Current Medications</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    {selectedSession.aiSummary.currentMedications.map((med, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {med}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Recommended Focus Areas</h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedSession.aiSummary.recommendedFocus.map((focus, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {focus}
                      </span>
                    ))}
                  </div>

                  <h4 className="font-medium text-gray-900 mb-2">Patient Expectations</h4>
                  <ul className="text-sm text-gray-700 space-y-1 mb-4">
                    {selectedSession.aiSummary.expectations.map((expectation, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-purple-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {expectation}
                      </li>
                    ))}
                  </ul>

                  {selectedSession.aiSummary.redFlags.length > 0 && (
                    <>
                      <h4 className="font-medium text-red-900 mb-2">Red Flags</h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        {selectedSession.aiSummary.redFlags.map((flag, idx) => (
                          <li key={idx} className="flex items-start">
                            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                            {flag}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>

              {selectedSession.doctorNotes && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Doctor's Notes</h4>
                  <p className="text-sm text-gray-700 italic">{selectedSession.doctorNotes}</p>
                </div>
              )}
            </div>
          )}

          {/* Conversation */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <MessageCircle className="w-5 h-5 mr-2 text-green-600" />
                Conversation Transcript
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedSession.conversation.length} messages • Started {selectedSession.startedAt?.toLocaleString()}
              </p>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {selectedSession.conversation.map((message) => (
                  <div key={message.id} className={`flex ${message.role === 'ai' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'ai' 
                        ? 'bg-gray-100 text-gray-900' 
                        : 'bg-blue-600 text-white'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.role === 'ai' ? 'text-gray-500' : 'text-blue-100'
                      }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">AI Pre-Appointment Intake</h1>
          <p className="text-gray-600">
            Help patients prepare for their appointments with AI-powered intake conversations
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(stats.completionRate)}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Duration</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(stats.averageDuration)} min</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Time Saved</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.appointmentTimeReduction} min</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Patient Rating</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.patientSatisfaction}/5</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {insights.map((insight) => (
            <div key={insight.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${
                  insight.category === 'efficiency' ? 'bg-blue-100' :
                  insight.category === 'quality' ? 'bg-green-100' : 'bg-purple-100'
                }`}>
                  {insight.category === 'efficiency' && <Zap className="w-5 h-5 text-blue-600" />}
                  {insight.category === 'quality' && <Target className="w-5 h-5 text-green-600" />}
                  {insight.category === 'satisfaction' && <Star className="w-5 h-5 text-purple-600" />}
                </div>
                <div className={`flex items-center text-sm ${
                  insight.trend === 'up' ? 'text-green-600' : 
                  insight.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  <TrendingUp className={`w-4 h-4 mr-1 ${insight.trend === 'down' ? 'rotate-180' : ''}`} />
                  {insight.trend}
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{insight.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{insight.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900">{insight.value}</span>
                <span className="text-xs text-gray-500">{insight.metric}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming Appointments with Intake */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Upcoming Appointments with AI Intake</h2>
            <p className="text-sm text-gray-600">Patients who have completed or are completing pre-appointment intake</p>
          </div>
          
          <div className="divide-y divide-gray-200">
            {sessions.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-sm font-medium text-gray-900 mb-2">No intake sessions yet</h3>
                <p className="text-sm text-gray-500">Request AI intake for upcoming appointments to see them here.</p>
              </div>
            ) : (
              sessions.map((session) => (
                <div key={session.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-sm font-medium text-gray-900">{session.patientName}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                          {session.status === 'in_progress' && <div className="w-2 h-2 bg-current rounded-full animate-pulse mr-1" />}
                          {session.status.replace('_', ' ')}
                        </span>
                        {session.aiSummary && (
                          <div className={`px-2 py-0.5 rounded text-xs font-medium ${getQualityBadge(session.aiSummary.conversationQuality)}`}>
                            {session.aiSummary.conversationQuality}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-6 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          {session.appointmentDate.toLocaleDateString()} at {session.appointmentDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        <span>with {session.requestedBy}</span>
                        {session.conversation.length > 0 && (
                          <span className="flex items-center">
                            <MessageCircle className="w-3 h-3 mr-1" />
                            {session.conversation.length} messages
                          </span>
                        )}
                        {session.startedAt && session.completedAt && (
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatDuration(session.startedAt, session.completedAt)}
                          </span>
                        )}
                      </div>

                      {session.aiSummary && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-700 line-clamp-2">
                            <strong>Chief concern:</strong> {session.aiSummary.chiefConcern}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {session.aiSummary.recommendedFocus.slice(0, 3).map((focus, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                                {focus}
                              </span>
                            ))}
                            {session.aiSummary.recommendedFocus.length > 3 && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                +{session.aiSummary.recommendedFocus.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {session.status === 'completed' && (
                        <button
                          onClick={() => {
                            setSelectedSession(session)
                            setShowConversation(true)
                          }}
                          className="flex items-center space-x-1 px-3 py-1.5 text-sm text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Details</span>
                        </button>
                      )}
                      
                      {!session.doctorReviewed && session.status === 'completed' && (
                        <button
                          onClick={() => aiIntake.markReviewed(session.id)}
                          className="flex items-center space-x-1 px-3 py-1.5 text-sm text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Mark Reviewed</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
