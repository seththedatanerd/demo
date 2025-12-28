'use client'

import { X, Clock, CheckCircle, AlertTriangle, Bot, User } from 'lucide-react'
import { ReminderActivity } from '@/services/reminder-engine'

interface ActivityDetailModalProps {
  activity: ReminderActivity | null
  isOpen: boolean
  onClose: () => void
}

export default function ActivityDetailModal({ activity, isOpen, onClose }: ActivityDetailModalProps) {
  if (!isOpen || !activity) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-700 bg-green-100 border-green-200'
      case 'warning':
        return 'text-amber-700 bg-amber-100 border-amber-200'
      case 'error':
        return 'text-red-700 bg-red-100 border-red-200'
      default:
        return 'text-blue-700 bg-blue-100 border-blue-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-blue-600" />
    }
  }

  // Simplified action details that works with all activity types
  const getActionDetails = () => {
    return {
      category: 'Practice Operations',
      impact: 'Automated workflow execution',
      nextSteps: ['Review activity details', 'Take appropriate action if needed'],
      relatedData: {
        'Activity Type': activity.type,
        'Patient': activity.patientName,
        'Timestamp': activity.timestamp.toLocaleString(),
        'Agent': activity.agentName,
        'Status': activity.status
      }
    }
  }

  const actionDetails = getActionDetails()

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            {activity.automated ? <Bot className="w-6 h-6 text-blue-600" /> : <User className="w-6 h-6 text-gray-600" />}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Activity Details</h2>
              <p className="text-sm text-gray-600">
                {activity.automated ? 'AI Agent' : 'Manual'} • {activity.agentName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status and Basic Info */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Overview</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Status</span>
                  <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(activity.status)}`}>
                    {getStatusIcon(activity.status)}
                    <span className="text-sm font-medium capitalize">{activity.status}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Patient</span>
                  <span className="text-sm text-gray-900 font-medium">{activity.patientName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">Category</span>
                  <span className="text-sm text-gray-900">{actionDetails.category}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Impact</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm font-medium mb-2">{actionDetails.impact}</p>
                <p className="text-blue-700 text-xs">{activity.details}</p>
              </div>
            </div>
          </div>

          {/* Activity Details */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Details</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(actionDetails.relatedData).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-200 last:border-0">
                    <span className="text-sm font-medium text-gray-600">{key}</span>
                    <span className="text-sm text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Suggested Actions</h3>
            <div className="space-y-2">
              {actionDetails.nextSteps.map((step, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-medium">{index + 1}</span>
                  </div>
                  <span className="text-sm text-gray-700">{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl">
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Activity logged at {activity.timestamp.toLocaleString()}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}