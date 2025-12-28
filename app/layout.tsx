'use client'

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import './globals.css'
import ConversationalCommandBar from '@/components/ConversationalCommandBar'
import ChatGPTCommandBar from '@/components/ChatGPTCommandBar'
import ConversationPanel from '@/components/ConversationPanel'
import PlanPreviewDrawer from '@/components/PlanPreviewDrawer'
import EventTimeline from '@/components/EventTimeline'
import FollowUpSuggestions from '@/components/FollowUpSuggestions'
import AICallHeader from '@/components/AICallHeader'
import CallSummaryModal from '@/components/CallSummaryModal'
import RoleSelector from '@/components/RoleSelector'
import ModeSelector from '@/components/ModeSelector'
import AICommandOmni from '@/components/AICommandOmni'
import { reminderEngine } from '@/services/reminder-engine'
import { ambientScribe } from '@/services/ambient-scribe'
import { careAutopilot } from '@/services/care-autopilot'
import { Plan } from '@/types/core'
import { useDemo, useAutopilot, useData, useTimeline, useCalls, useRole } from '@/store'
import GlobalSearch from '@/components/GlobalSearch'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [commandBarOpen, setCommandBarOpen] = useState(false)
  const [conversationPanelOpen, setConversationPanelOpen] = useState(false)
  const [planPreviewOpen, setPlanPreviewOpen] = useState(false)
  const [timelineOpen, setTimelineOpen] = useState(false)
  const [followUpsOpen, setFollowUpsOpen] = useState(false)
  const [currentPlan, setCurrentPlan] = useState(null)
  const [completedPlan, setCompletedPlan] = useState<Plan | null>(null)
  const [callSummaryOpen, setCallSummaryOpen] = useState(false)
  const [completedCall, setCompletedCall] = useState<any>(null)
  const [lastShownCallId, setLastShownCallId] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  
  const pathname = usePathname()
  const { demoMode, resetDemo } = useDemo()
  const { autopilotMode, setAutopilotMode, role, setRole } = useAutopilot()
  const { loadFromJson, setMutationLocked, loadDemoData } = useData()
  const { addEvent } = useTimeline()
  const { activeCall, recentCalls } = useCalls()
  const { currentRole, permissions, setRole: setSystemRole, hasPermission } = useRole()

  // Client-side mounting check to prevent hydration issues
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandBarOpen(true)
      }
      if (e.key === 'Escape') {
        setCommandBarOpen(false)
        setPlanPreviewOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Load demo data on client mount to avoid hydration issues with dates
  useEffect(() => {
    // Always load demo data on client to ensure appointments are populated
    if (loadDemoData) {
      loadDemoData()
    }
  }, [loadDemoData])

  // Connect services to global timeline
  useEffect(() => {
    reminderEngine.setTimelineCallback(addEvent)
    ambientScribe.setTimelineCallback(addEvent)
    careAutopilot.setTimelineCallback(addEvent)
    
    // Start autopilot simulation
    careAutopilot.simulateAutopilotActions()
  }, [addEvent])
  
  // Restore last dismissed call to avoid auto-open on refresh
  useEffect(() => {
    if (typeof window === 'undefined') return
    const dismissed = sessionStorage.getItem('lastDismissedCallId')
    if (dismissed) setLastShownCallId(dismissed)
  }, [])
  
  // Watch for newly completed calls and show summary once
  useEffect(() => {
    if (!recentCalls || recentCalls.length === 0) return
    const lastCall = recentCalls[0]
    if (!lastCall || callSummaryOpen) return
    // Only auto-open if the call just ended recently (demo seeds won't trigger)
    const endedAt = lastCall.endTime ? new Date(lastCall.endTime).getTime() : 0
    const endedRecently = endedAt > 0 && (Date.now() - endedAt) < 60_000 // 60s window
    if (
      lastCall.status === 'completed' &&
      endedRecently &&
      lastCall.id !== lastShownCallId
    ) {
      setCompletedCall(lastCall)
      setCallSummaryOpen(true)
      setLastShownCallId(lastCall.id)
    }
  }, [recentCalls, callSummaryOpen, lastShownCallId])

  // Demo mode mutation lock: prevent unscripted mutations
  useEffect(() => {
    if (setMutationLocked) {
      setMutationLocked(demoMode)
    }
  }, [demoMode, setMutationLocked])

  const handlePlanCreated = (plan: any) => {
    setCurrentPlan(plan)
    setPlanPreviewOpen(true)
  }

  const handlePlanExecuted = () => {
    // Auto-open timeline to show execution progress
    setTimeout(() => setTimelineOpen(true), 500)
  }

  const handleShowFollowUps = (plan: Plan) => {
    setCompletedPlan(plan)
    setFollowUpsOpen(true)
  }

  const getPageTitle = () => {
    if (pathname === '/' || pathname === '/practice') return 'Control Room'
    if (pathname === '/calendar') return 'Calendar'
    if (pathname === '/patients') return 'Patients'
    if (pathname.startsWith('/patients/')) return 'Patient Record'
    if (pathname === '/billing') return 'Billing'
    if (pathname === '/communications') return 'Communications'
    if (pathname === '/insights') return 'Insights'
    if (pathname === '/messages') return 'Messages'
    if (pathname === '/tasks') return 'Tasks'
    if (pathname === '/calls') return 'Calls'
    if (pathname === '/scribe') return 'Ambient Scribe'
    if (pathname === '/intake') return 'AI Intake'
    if (pathname === '/care') return 'Care Autopilot'
    if (pathname.startsWith('/patient')) return 'Patient Portal'
    return 'Data Ravens'
  }

  // Navigation items with role-based visibility
  const allNavigationItems = [
    { href: '/practice', label: 'Control Room', show: true }, // Always visible
    { href: '/calendar', label: 'Calendar', show: isClient ? hasPermission('canViewCalendar') : true },
    { href: '/patients', label: 'Patients', show: isClient ? hasPermission('canViewPatients') : true },
    { href: '/products', label: 'Products', show: isClient ? hasPermission('canViewBilling') : true },
    { href: '/billing', label: 'Billing', show: isClient ? hasPermission('canViewBilling') : true },
    { href: '/communications', label: 'Communications', show: isClient ? hasPermission('canViewMessages') : true },
    { href: '/messages', label: 'Messages', show: isClient ? hasPermission('canViewMessages') : true },
    { href: '/tasks', label: 'Tasks', show: isClient ? hasPermission('canViewTasks') : true },
    { href: '/calls', label: 'Calls', show: isClient ? hasPermission('canViewCalls') : true },
    { href: '/scribe', label: 'Ambient Scribe', show: isClient ? hasPermission('canUseScribe') : true },
    { href: '/intake', label: 'AI Intake', show: isClient ? hasPermission('canAccessAI') : true },
    { href: '/care', label: 'Care Autopilot', show: isClient ? hasPermission('canAccessAI') : true },
    { href: '/insights', label: 'Insights', show: isClient ? hasPermission('canViewInsights') : true },
  ]
  
  const navigationItems = allNavigationItems.filter(item => item.show)

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          {/* AI Call Header - client-only to avoid SSR mismatch - only for practice routes */}
          {isClient && !pathname.startsWith('/patient') && <AICallHeader />}
          
          {/* Demo Mode Ribbon - client-only to avoid SSR mismatch from persisted state */}
          {isClient && demoMode && (
            <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 text-sm text-amber-800">
              <div className="flex items-center justify-between max-w-7xl mx-auto">
                <span>🎭 Demo Mode - Deterministic data for presentation</span>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={resetDemo}
                    className="text-amber-600 hover:text-amber-800 font-medium"
                  >
                    Reset demo
                  </button>
                  {/* Simulate Call Button - inside demo ribbon */}
                  {!pathname.startsWith('/patient') && (
                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('simulateCall'))
                      }}
                      className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 flex items-center gap-2 font-medium transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span>Simulate Call</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Main App Layout */}
          <div className="flex min-h-screen">
            {/* Sidebar Navigation */}
            <nav className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out`} suppressHydrationWarning>
              {/* Header with Toggle & Logo */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  {/* Hamburger Menu Toggle */}
                  <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors flex-shrink-0"
                    title={sidebarCollapsed ? 'Expand menu' : 'Collapse menu'}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  
                  {/* Logo */}
                  {!sidebarCollapsed && (
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-base">DR</span>
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-semibold text-gray-900 text-base">Data Ravens</div>
                        <div className="text-sm text-gray-500">AI Practice Management</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Navigation Links */}
              <div className="flex-1 p-3 overflow-y-auto">
                <div className="space-y-1">
                  {navigationItems.map((item) => {
                    const isActive = pathname === item.href || 
                      (item.href === '/patients' && pathname.startsWith('/patients')) ||
                      (item.href === '/practice' && pathname === '/')
                    
                    return (
                      <a 
                        key={item.href}
                        href={item.href} 
                        title={sidebarCollapsed ? item.label : undefined}
                        className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-3 rounded-xl text-base font-medium transition-colors ${
                          isActive
                            ? 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border-l-4 border-blue-600' 
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          isActive ? 'bg-blue-600' : 'bg-gray-300'
                        }`} />
                        {!sidebarCollapsed && (
                          <>
                            <span className="flex-1">{item.label}</span>
                            {item.label === 'Messages' && (
                              <div className="w-6 h-6 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                                3
                              </div>
                            )}
                            {item.label === 'Tasks' && (
                              <div className="w-6 h-6 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                                7
                              </div>
                            )}
                            {isClient && item.label === 'Ambient Scribe' && ambientScribe.isRecording() && (
                              <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                            )}
                            {isClient && item.label === 'Care Autopilot' && (
                              <div className="w-6 h-6 bg-green-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                                {careAutopilot.getCareSignals().filter(s => s.status === 'new').length}
                              </div>
                            )}
                          </>
                        )}
                      </a>
                    )
                  })}
                </div>
                
                {/* AI Features Separator */}
                {!sidebarCollapsed && (
                  <div className="mt-8 pt-4 border-t border-gray-100">
                    <div className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-3 px-3">
                      AI Features
                    </div>
                    <div className="space-y-1">
                      <button className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-base text-gray-600 hover:bg-gray-50 w-full text-left">
                        <div className="w-2.5 h-2.5 bg-cyan-500 rounded-full animate-pulse" />
                        <span>Smart Insights</span>
                      </button>
                      <button className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-base text-gray-600 hover:bg-gray-50 w-full text-left">
                        <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                        <span>Auto Reminders</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Bottom Status */}
              <div className="p-4 border-t border-gray-100">
                {sidebarCollapsed ? (
                  <div className="flex justify-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full" title="Online" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Practice Status</span>
                    <div className="flex items-center space-x-1.5">
                      <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
                      <span>Online</span>
                    </div>
                  </div>
                )}
              </div>
            </nav>
            
            {/* Main Content */}
            <main className="flex-1 flex flex-col bg-gray-50">
              {/* Top Header */}
              <header className="bg-white border-b border-gray-200 shadow-sm" suppressHydrationWarning>
                <div className="px-6 py-3">
                  <div className="flex items-center justify-between gap-6">
                    {/* Left: Practice Name & Page Title */}
                    <div className="flex items-center space-x-4 min-w-0">
                      <h1 className="text-xl font-semibold text-gray-900 truncate">
                        Ceda GP Practice
                      </h1>
                      <div className="flex items-center text-sm text-gray-500">
                        <span className="text-gray-300">/</span>
                        <span className="ml-2 font-medium">{getPageTitle()}</span>
                      </div>
                    </div>
                    
                    {/* Center: Global Search */}
                    {isClient && !pathname.startsWith('/patient') && (
                      <div className="flex-1 flex justify-center max-w-md mx-4">
                        <GlobalSearch />
                      </div>
                    )}
                    
                    {/* Right: Controls */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {/* Role Switcher */}
                      {isClient && <RoleSelector />}
                      
                      {/* Divider */}
                      <div className="w-px h-8 bg-gray-200" />
                      
                      {/* Agent Governance Mode Selector */}
                      {isClient && <ModeSelector />}
                      
                      {/* Divider */}
                      <div className="w-px h-8 bg-gray-200" />
                      
                      {/* AI Action Trail */}
                      {isClient && (
                        <button 
                          onClick={() => setTimelineOpen(true)}
                          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                          <span>AI Trail</span>
                        </button>
                      )}
                      
                      {/* Chat History Button */}
                      {isClient && (
                        <button 
                          onClick={() => setConversationPanelOpen(true)}
                          className="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg hover:from-blue-700 hover:to-cyan-700 shadow-sm transition-all"
                          title="View conversation history"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </header>

              {/* Page Content - allow document scrolling; avoid inner scroll */}
                  <div className="flex-1 pb-28">
                    {children}
                  </div>
            </main>
          </div>

          {/* ChatGPT-style Interface Components - only for practice routes */}
          {isClient && (pathname === '/' || pathname.startsWith('/practice') || (!pathname.startsWith('/patient'))) && (
            <>
              {/* Bottom ChatGPT-style Command Bar */}
              <ChatGPTCommandBar
                onPlanCreated={handlePlanCreated}
                onOpenConversation={() => setConversationPanelOpen(true)}
              />

              {/* Conversation Panel */}
              <ConversationPanel
                isOpen={conversationPanelOpen}
                onClose={() => setConversationPanelOpen(false)}
                onPlanCreated={handlePlanCreated}
              />

              {/* Legacy Command Bar (kept for compatibility) */}
              <ConversationalCommandBar
                isOpen={commandBarOpen}
                onClose={() => setCommandBarOpen(false)}
                onPlanCreated={handlePlanCreated}
              />
            </>
          )}

          {isClient && !pathname.startsWith('/patient') && (
            <PlanPreviewDrawer
              plan={currentPlan}
              isOpen={planPreviewOpen}
              onClose={() => {
                setPlanPreviewOpen(false)
                setCurrentPlan(null)
              }}
              onExecuted={handlePlanExecuted}
              onShowFollowUps={handleShowFollowUps}
            />
          )}

          {isClient && !pathname.startsWith('/patient') && (
            <EventTimeline
              isOpen={timelineOpen}
              onClose={() => setTimelineOpen(false)}
            />
          )}

          {isClient && !pathname.startsWith('/patient') && (
            <FollowUpSuggestions
              completedPlan={completedPlan}
              isOpen={followUpsOpen}
              onClose={() => {
                setFollowUpsOpen(false)
                setCompletedPlan(null)
              }}
              onPlanCreated={handlePlanCreated}
            />
          )}
          
          {/* Call Summary Modal */}
          {isClient && callSummaryOpen && completedCall && (
            <CallSummaryModal
              call={completedCall}
              onClose={() => {
                setCallSummaryOpen(false)
                setCompletedCall(null)
                try {
                  if (completedCall?.id) {
                    sessionStorage.setItem('lastDismissedCallId', completedCall.id)
                  }
                } catch {}
              }}
            />
          )}
        </div>
      </body>
    </html>
  )
}