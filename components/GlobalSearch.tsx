'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useData } from '@/store'
import { 
  Search, X, User, Calendar, FileText, MessageSquare, CheckSquare,
  Clock, ArrowRight, Users, CreditCard
} from 'lucide-react'

interface SearchResult {
  id: string
  type: 'patient' | 'appointment' | 'invoice' | 'message' | 'task'
  title: string
  subtitle: string
  href: string
  icon: React.ReactNode
  meta?: string
}

interface RecentItem {
  id: string
  type: 'patient' | 'appointment' | 'invoice' | 'message' | 'task'
  title: string
  href: string
  timestamp: number
  icon: React.ReactNode
}

const STORAGE_KEY = 'global-search-recent'
const MAX_RECENT_ITEMS = 8

export default function GlobalSearch() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [recentItems, setRecentItems] = useState<RecentItem[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { patients, appointments, invoices, messages, tasks } = useData()

  // Load recent items from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Re-add icons since they can't be serialized
        const withIcons = parsed.map((item: any) => ({
          ...item,
          icon: getIconForType(item.type)
        }))
        setRecentItems(withIcons)
      }
    } catch (e) {
      console.warn('Failed to load recent items', e)
    }
  }, [])

  // Save recent items to localStorage
  const saveRecentItems = (items: RecentItem[]) => {
    try {
      // Strip icons before saving (can't serialize React elements)
      const toStore = items.map(({ icon, ...rest }) => rest)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore.slice(0, MAX_RECENT_ITEMS)))
    } catch (e) {
      console.warn('Failed to save recent items', e)
    }
  }

  const getIconForType = (type: string): React.ReactNode => {
    switch (type) {
      case 'patient': return <User className="w-4 h-4" />
      case 'appointment': return <Calendar className="w-4 h-4" />
      case 'invoice': return <CreditCard className="w-4 h-4" />
      case 'message': return <MessageSquare className="w-4 h-4" />
      case 'task': return <CheckSquare className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getColorForType = (type: string): string => {
    switch (type) {
      case 'patient': return 'text-blue-600 bg-blue-50'
      case 'appointment': return 'text-emerald-600 bg-emerald-50'
      case 'invoice': return 'text-amber-600 bg-amber-50'
      case 'message': return 'text-violet-600 bg-violet-50'
      case 'task': return 'text-rose-600 bg-rose-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open with Cmd/Ctrl + /
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        setIsOpen(true)
        setTimeout(() => inputRef.current?.focus(), 50)
      }
      // Close with Escape
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // Search results
  const searchResults = useMemo(() => {
    if (!query.trim()) return []
    
    const lowerQuery = query.toLowerCase()
    const results: SearchResult[] = []

    // Search patients
    patients?.forEach(patient => {
      if (patient.name.toLowerCase().includes(lowerQuery) || 
          patient.id.toLowerCase().includes(lowerQuery) ||
          patient.phone?.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: patient.id,
          type: 'patient',
          title: patient.name,
          subtitle: `DOB: ${patient.dob} • ${patient.insurer || 'No insurance'}`,
          href: `/patients/${patient.id}`,
          icon: <User className="w-4 h-4" />,
          meta: patient.phone
        })
      }
    })

    // Search appointments
    appointments?.forEach(apt => {
      const patient = patients?.find(p => p.id === apt.patientId)
      const patientName = patient?.name || 'Unknown Patient'
      const dateStr = new Date(apt.start).toLocaleDateString('en-GB', { 
        weekday: 'short', day: 'numeric', month: 'short' 
      })
      const timeStr = new Date(apt.start).toLocaleTimeString('en-GB', { 
        hour: '2-digit', minute: '2-digit' 
      })
      
      if (patientName.toLowerCase().includes(lowerQuery) ||
          apt.appointmentType?.toLowerCase().includes(lowerQuery) ||
          apt.practitionerName?.toLowerCase().includes(lowerQuery) ||
          apt.clinician?.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: apt.id,
          type: 'appointment',
          title: `${patientName} - ${apt.appointmentType || 'Appointment'}`,
          subtitle: `${dateStr} at ${timeStr}`,
          href: `/calendar?highlight=${apt.id}`,
          icon: <Calendar className="w-4 h-4" />,
          meta: apt.practitionerName || apt.clinician
        })
      }
    })

    // Search invoices
    invoices?.forEach(inv => {
      const patient = patients?.find(p => p.id === inv.patientId)
      const patientName = patient?.name || 'Unknown Patient'
      
      if (patientName.toLowerCase().includes(lowerQuery) ||
          inv.id.toLowerCase().includes(lowerQuery) ||
          inv.status.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: inv.id,
          type: 'invoice',
          title: `Invoice #${inv.id.toUpperCase()}`,
          subtitle: `${patientName} • £${inv.amount.toFixed(2)} • ${inv.status}`,
          href: `/billing?invoice=${inv.id}`,
          icon: <CreditCard className="w-4 h-4" />,
          meta: inv.status
        })
      }
    })

    // Search messages
    messages?.forEach(msg => {
      if (msg.to.toLowerCase().includes(lowerQuery) ||
          msg.body.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: msg.id,
          type: 'message',
          title: `To: ${msg.to}`,
          subtitle: msg.body.length > 50 ? msg.body.slice(0, 50) + '...' : msg.body,
          href: `/messages?id=${msg.id}`,
          icon: <MessageSquare className="w-4 h-4" />,
          meta: msg.status
        })
      }
    })

    // Search tasks
    tasks?.forEach(task => {
      const patient = task.patientId ? patients?.find(p => p.id === task.patientId) : null
      
      if (task.title.toLowerCase().includes(lowerQuery) ||
          (patient && patient.name.toLowerCase().includes(lowerQuery))) {
        results.push({
          id: task.id,
          type: 'task',
          title: task.title,
          subtitle: patient ? `Patient: ${patient.name}` : 'General task',
          href: `/tasks?task=${task.id}`,
          icon: <CheckSquare className="w-4 h-4" />,
          meta: task.status
        })
      }
    })

    return results.slice(0, 20) // Limit to 20 results
  }, [query, patients, appointments, invoices, messages, tasks])

  // Group results by type
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {}
    searchResults.forEach(result => {
      if (!groups[result.type]) {
        groups[result.type] = []
      }
      groups[result.type].push(result)
    })
    return groups
  }, [searchResults])

  const typeLabels: Record<string, string> = {
    patient: 'Patients',
    appointment: 'Appointments',
    invoice: 'Invoices',
    message: 'Messages',
    task: 'Tasks'
  }

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    // Add to recent items
    const newRecent: RecentItem = {
      id: result.id,
      type: result.type,
      title: result.title,
      href: result.href,
      timestamp: Date.now(),
      icon: result.icon
    }
    
    // Remove duplicates and add to front
    const updated = [newRecent, ...recentItems.filter(r => !(r.id === result.id && r.type === result.type))].slice(0, MAX_RECENT_ITEMS)
    setRecentItems(updated)
    saveRecentItems(updated)
    
    // Navigate and close
    router.push(result.href)
    setIsOpen(false)
    setQuery('')
  }

  const handleRecentClick = (item: RecentItem) => {
    router.push(item.href)
    setIsOpen(false)
    setQuery('')
  }

  const clearRecent = () => {
    setRecentItems([])
    localStorage.removeItem(STORAGE_KEY)
  }

  // Generate recent patients (those with recent appointments or interactions)
  const recentPatients = useMemo(() => {
    if (!patients) return []
    
    // Get patients from recent appointments
    const patientIds = new Set<string>()
    const sortedApts = [...(appointments || [])].sort((a, b) => 
      new Date(b.start).getTime() - new Date(a.start).getTime()
    )
    
    sortedApts.forEach(apt => patientIds.add(apt.patientId))
    
    return patients
      .filter(p => patientIds.has(p.id))
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        type: 'patient' as const,
        title: p.name,
        href: `/patients/${p.id}`,
        timestamp: Date.now(),
        icon: <User className="w-4 h-4" />
      }))
  }, [patients, appointments])

  return (
    <div ref={containerRef} className="relative">
      {/* Search Button / Collapsed State */}
      <button
        onClick={() => {
          setIsOpen(true)
          setTimeout(() => inputRef.current?.focus(), 50)
        }}
        className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-colors min-w-[200px] text-left"
      >
        <Search className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-500 flex-1">Search...</span>
        <kbd className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 text-xs text-gray-400 bg-white border border-gray-200 rounded">
          <span>⌘</span>
          <span>/</span>
        </kbd>
      </button>

      {/* Expanded Search Panel */}
      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[480px] max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patients, appointments, invoices..."
              className="flex-1 text-sm outline-none placeholder:text-gray-400"
              autoFocus
            />
            {query && (
              <button 
                onClick={() => setQuery('')}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Results Area */}
          <div className="max-h-[400px] overflow-y-auto">
            {query.trim() ? (
              // Search Results
              Object.keys(groupedResults).length > 0 ? (
                <div className="py-2">
                  {Object.entries(groupedResults).map(([type, results]) => (
                    <div key={type} className="mb-2">
                      {/* Group Header */}
                      <div className="px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                        {getIconForType(type)}
                        <span>{typeLabels[type]}</span>
                        <span className="text-gray-400">({results.length})</span>
                      </div>
                      
                      {/* Group Items */}
                      {results.map(result => (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => handleResultClick(result)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getColorForType(result.type)}`}>
                            {result.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {result.title}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {result.subtitle}
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-300" />
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                // No Results
                <div className="py-12 text-center">
                  <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">No results found for "{query}"</p>
                  <p className="text-xs text-gray-400 mt-1">Try different keywords or check the spelling</p>
                </div>
              )
            ) : (
              // Recent Items (when search is empty)
              <div className="py-2">
                {/* Recent Searches Section */}
                {recentItems.length > 0 && (
                  <div className="mb-4">
                    <div className="px-4 py-1.5 flex items-center justify-between">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Recent</span>
                      </div>
                      <button 
                        onClick={clearRecent}
                        className="text-xs text-gray-400 hover:text-gray-600"
                      >
                        Clear all
                      </button>
                    </div>
                    {recentItems.map((item, idx) => (
                      <button
                        key={`recent-${idx}`}
                        onClick={() => handleRecentClick(item)}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${getColorForType(item.type)}`}>
                          {item.icon}
                        </div>
                        <span className="text-sm text-gray-700 truncate flex-1">{item.title}</span>
                        <span className="text-xs text-gray-400 capitalize">{item.type}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Recent Patients Section */}
                {recentPatients.length > 0 && (
                  <div className="border-t border-gray-100 pt-2">
                    <div className="px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" />
                      <span>Recent Patients</span>
                    </div>
                    <div className="flex flex-wrap gap-2 px-4 py-2">
                      {recentPatients.map(patient => (
                        <button
                          key={patient.id}
                          onClick={() => handleRecentClick(patient)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm hover:bg-blue-100 transition-colors"
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>{patient.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="border-t border-gray-100 pt-2 mt-2">
                  <div className="px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Quick Actions
                  </div>
                  <div className="px-4 py-2 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => { router.push('/patients'); setIsOpen(false); }}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Users className="w-4 h-4 text-blue-500" />
                      <span>View All Patients</span>
                    </button>
                    <button
                      onClick={() => { router.push('/calendar'); setIsOpen(false); }}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <Calendar className="w-4 h-4 text-emerald-500" />
                      <span>Open Calendar</span>
                    </button>
                    <button
                      onClick={() => { router.push('/billing'); setIsOpen(false); }}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <CreditCard className="w-4 h-4 text-amber-500" />
                      <span>View Invoices</span>
                    </button>
                    <button
                      onClick={() => { router.push('/tasks'); setIsOpen(false); }}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <CheckSquare className="w-4 h-4 text-rose-500" />
                      <span>View Tasks</span>
                    </button>
                  </div>
                </div>

                {/* Empty State */}
                {recentItems.length === 0 && recentPatients.length === 0 && (
                  <div className="py-8 text-center border-t border-gray-100">
                    <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Start typing to search</p>
                    <p className="text-xs text-gray-400 mt-1">Search across patients, appointments, and more</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-gray-500">↵</kbd>
                <span>to select</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white border border-gray-200 rounded text-gray-500">esc</kbd>
                <span>to close</span>
              </span>
            </div>
            <span>⌘/ to open</span>
          </div>
        </div>
      )}
    </div>
  )
}

