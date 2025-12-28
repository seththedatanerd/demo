'use client'

import { useState, useMemo } from 'react'
import { useCalls, useData } from '@/store'
import { Phone, Clock, User, MessageSquare, Calendar, Search, Filter, CheckCircle } from 'lucide-react'
import CallSummaryModal from '@/components/CallSummaryModal'

export default function CallsPage() {
  const { recentCalls } = useCalls()
  const { patients } = useData() as any
  const [selectedCall, setSelectedCall] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [intentFilter, setIntentFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  const filteredCalls = useMemo(() => {
    let filtered = recentCalls

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(call => 
        call.phone.toLowerCase().includes(query) ||
        call.patientName?.toLowerCase().includes(query) ||
        call.summary?.toLowerCase().includes(query)
      )
    }

    // Intent filter
    if (intentFilter !== 'all') {
      filtered = filtered.filter(call => call.intent === intentFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(call => call.status === statusFilter)
    }

    return filtered.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
  }, [recentCalls, searchQuery, intentFilter, statusFilter])

  const getIntentIcon = (intent?: string) => {
    switch (intent) {
      case 'reschedule': return <Calendar className="w-4 h-4 text-blue-600" />
      case 'new_booking': return <User className="w-4 h-4 text-green-600" />
      case 'prescription': return <MessageSquare className="w-4 h-4 text-purple-600" />
      case 'billing': return <MessageSquare className="w-4 h-4 text-orange-600" />
      case 'inquiry': return <MessageSquare className="w-4 h-4 text-gray-600" />
      default: return <Phone className="w-4 h-4 text-gray-600" />
    }
  }

  const getIntentColor = (intent?: string) => {
    switch (intent) {
      case 'reschedule': return 'bg-blue-100 text-blue-800'
      case 'new_booking': return 'bg-green-100 text-green-800'
      case 'prescription': return 'bg-purple-100 text-purple-800'
      case 'billing': return 'bg-orange-100 text-orange-800'
      case 'inquiry': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCallDuration = (call: any) => {
    if (!call.startTime || !call.endTime) return 'Unknown'
    const start = new Date(call.startTime)
    const end = new Date(call.endTime)
    const duration = Math.round((end.getTime() - start.getTime()) / 60000)
    return `${duration}m`
  }

  const getPatientName = (call: any) => {
    if (call.patientName) return call.patientName
    if (call.patientId) {
      const patient = patients.find((p: any) => p.id === call.patientId)
      return patient?.name || 'Unknown Patient'
    }
    return 'Unknown Caller'
  }

  // Get unique intents for filter
  const availableIntents = useMemo(() => {
    const intents = Array.from(new Set(recentCalls.map(c => c.intent).filter(Boolean)))
    return intents
  }, [recentCalls])

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Call History</h1>
          <p className="text-gray-600 mt-1">AI-assisted call summaries and follow-ups</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search calls..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm w-64"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-3 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50 flex items-center ${showFilters ? 'bg-gray-100' : ''}`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Intent</label>
              <select
                value={intentFilter}
                onChange={(e) => setIntentFilter(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Intents</option>
                {availableIntents.map(intent => (
                  <option key={intent} value={intent}>
                    {intent?.replace('_', ' ') || 'Unknown'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h3 className="text-sm text-gray-500 mb-1">Total Calls</h3>
          <p className="text-2xl font-bold text-gray-900">{recentCalls.length}</p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h3 className="text-sm text-gray-500 mb-1">Completed Today</h3>
          <p className="text-2xl font-bold text-blue-600">
            {recentCalls.filter(c => 
              c.status === 'completed' && 
              new Date(c.startTime).toDateString() === new Date().toDateString()
            ).length}
          </p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h3 className="text-sm text-gray-500 mb-1">AI Notes Active</h3>
          <p className="text-2xl font-bold text-green-600">
            {recentCalls.filter(c => c.mode === 'capture').length}
          </p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-lg">
          <h3 className="text-sm text-gray-500 mb-1">Avg Duration</h3>
          <p className="text-2xl font-bold text-purple-600">
            {recentCalls.length > 0 
              ? Math.round(recentCalls.reduce((sum, call) => {
                  if (!call.startTime || !call.endTime) return sum
                  const duration = (new Date(call.endTime).getTime() - new Date(call.startTime).getTime()) / 60000
                  return sum + duration
                }, 0) / recentCalls.length)
              : 0}m
          </p>
        </div>
      </div>

      {/* Calls List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-6 gap-4 text-sm font-medium text-gray-500">
            <div>Caller</div>
            <div>Intent</div>
            <div>Summary</div>
            <div>Duration</div>
            <div>Time</div>
            <div>Actions</div>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredCalls.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              {recentCalls.length === 0 
                ? 'No calls recorded yet. Start by simulating a call to see the AI assistant in action.'
                : 'No calls match your current filters.'
              }
            </div>
          ) : (
            filteredCalls.map((call) => (
              <div key={call.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="grid grid-cols-6 gap-4 text-sm">
                  <div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-2">
                        {call.status === 'completed' && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                        <Phone className="w-4 h-4 text-gray-400" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {getPatientName(call)}
                        </div>
                        <div className="text-gray-600">{call.phone}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center space-x-2">
                      {getIntentIcon(call.intent)}
                      <span className={`px-2 py-1 text-xs rounded-full ${getIntentColor(call.intent)}`}>
                        {call.intent?.replace('_', ' ') || 'General'}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-gray-900 line-clamp-2">
                      {call.summary || 'No summary available'}
                    </div>
                    {call.mode === 'capture' && (
                      <div className="text-xs text-blue-600 mt-1">
                        AI notes captured
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">{formatCallDuration(call)}</span>
                  </div>
                  
                  <div className="text-gray-600">
                    <div>{new Date(call.startTime).toLocaleDateString('en-GB')}</div>
                    <div className="text-xs">
                      {new Date(call.startTime).toLocaleTimeString('en-GB', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <button
                      onClick={() => setSelectedCall(call)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Summary
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Call Summary Modal */}
      {selectedCall && (
        <CallSummaryModal
          call={selectedCall}
          onClose={() => setSelectedCall(null)}
        />
      )}
    </div>
  )
}
