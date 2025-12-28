'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Info, Zap, MessageSquare, Bot, Check, Shield } from 'lucide-react'
import { useAutopilot } from '@/store'

type Mode = 'manual' | 'ask' | 'scheduled'

interface ModeConfig {
  id: Mode
  label: string
  tagline: string
  description: string
  examples: string[]
  icon: React.ReactNode
  color: string
  dotColor: string
  bgColor: string
  borderColor: string
}

const MODE_CONFIGS: ModeConfig[] = [
  {
    id: 'manual',
    label: 'Manual',
    tagline: 'AI suggests only',
    description: 'AI drafts recommendations but nothing executes until you click "Execute plan".',
    examples: [
      'Recommends chasing 9 overdue claims, waits for you',
      'Suggests DNA follow-up messages, you decide when to send'
    ],
    icon: <MessageSquare className="w-4 h-4" />,
    color: 'text-gray-600',
    dotColor: 'bg-gray-400',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200'
  },
  {
    id: 'ask',
    label: 'Ask to Run',
    tagline: 'AI prepares a plan and asks',
    description: 'AI automatically drafts multi-step plans when triggers happen, then asks for your approval.',
    examples: [
      'Generates chase batch plan and prompts approval',
      'Creates DNA prevention workflow, awaits your OK'
    ],
    icon: <Zap className="w-4 h-4" />,
    color: 'text-amber-600',
    dotColor: 'bg-amber-500',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200'
  },
  {
    id: 'scheduled',
    label: 'Autopilot',
    tagline: 'AI executes approved playbooks',
    description: 'AI runs pre-approved actions within guardrails. Every action is logged in AI Trail and can be undone.',
    examples: [
      'Sends statements nightly for invoices >14d (within caps)',
      'Auto-confirms appointments 24h out via SMS'
    ],
    icon: <Bot className="w-4 h-4" />,
    color: 'text-green-600',
    dotColor: 'bg-green-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  }
]

export default function ModeSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { autopilotMode, setAutopilotMode } = useAutopilot()

  const currentMode = MODE_CONFIGS.find(m => m.id === autopilotMode) || MODE_CONFIGS[0]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleModeSelect = (mode: Mode) => {
    setAutopilotMode(mode)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Current Mode Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all ${
          isOpen 
            ? `${currentMode.bgColor} ${currentMode.borderColor}` 
            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
        }`}
      >
        <div className={`w-2 h-2 rounded-full ${currentMode.dotColor}`} />
        <span className="text-sm font-medium text-gray-700">{currentMode.label}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[420px] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-gray-800">Agent Governance Mode</span>
              </div>
              <div 
                className="relative"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <button className="p-1 rounded-full hover:bg-gray-200 transition-colors">
                  <Info className="w-4 h-4 text-gray-400" />
                </button>
                {showTooltip && (
                  <div className="absolute right-0 top-full mt-1 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl z-10">
                    <p className="font-medium mb-1">What changes in this mode?</p>
                    <p className="text-gray-300">
                      Controls how much autonomy the AI has. Manual = AI suggests. 
                      Ask to Run = AI drafts plans for approval. 
                      Autopilot = AI executes within guardrails.
                    </p>
                    <div className="absolute -top-1 right-3 w-2 h-2 bg-gray-900 rotate-45" />
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Choose how much autonomy to give the AI assistant
            </p>
          </div>

          {/* Mode Options */}
          <div className="p-2">
            {MODE_CONFIGS.map((mode) => {
              const isSelected = autopilotMode === mode.id
              return (
                <button
                  key={mode.id}
                  onClick={() => handleModeSelect(mode.id)}
                  className={`w-full text-left p-3 rounded-lg transition-all mb-1 last:mb-0 ${
                    isSelected 
                      ? `${mode.bgColor} ${mode.borderColor} border-2` 
                      : 'hover:bg-gray-50 border-2 border-transparent'
                  }`}
                >
                  {/* Mode Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${mode.dotColor}`} />
                      <span className="font-semibold text-gray-900">{mode.label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${mode.bgColor} ${mode.color} font-medium`}>
                        {mode.tagline}
                      </span>
                    </div>
                    {isSelected && (
                      <Check className={`w-4 h-4 ${mode.color}`} />
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                    {mode.description}
                  </p>

                  {/* Examples */}
                  <div className="space-y-1.5">
                    {mode.examples.map((example, idx) => (
                      <div 
                        key={idx}
                        className="flex items-start space-x-2 text-xs"
                      >
                        <span className={`${mode.color} mt-0.5`}>→</span>
                        <span className="text-gray-500 italic">"{example}"</span>
                      </div>
                    ))}
                  </div>

                  {/* Autopilot Guardrails Badge */}
                  {mode.id === 'scheduled' && (
                    <div className="mt-2 pt-2 border-t border-green-100">
                      <div className="flex items-center space-x-1.5 text-xs text-green-700">
                        <Shield className="w-3 h-3" />
                        <span className="font-medium">Guardrails:</span>
                        <span className="text-green-600">spending limits • message caps • quiet hours</span>
                      </div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-gradient-to-r from-blue-50 to-cyan-50 border-t border-gray-100">
            <p className="text-xs text-gray-600 flex items-center space-x-1">
              <span className="text-blue-600">💡</span>
              <span>All AI actions are logged in <strong>AI Trail</strong> and can be reviewed anytime</span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

