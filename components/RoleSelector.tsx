'use client'

import { useRole } from '@/store'
import { SystemRole, ROLE_DISPLAY_NAMES, ROLE_DESCRIPTIONS } from '@/types/roles'
import { ChevronDown, User } from 'lucide-react'
import { useState } from 'react'

export default function RoleSelector() {
  const { currentRole, setRole } = useRole()
  const [isOpen, setIsOpen] = useState(false)

  const roles: SystemRole[] = ['reception', 'clinician', 'manager']

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200 text-base transition-colors"
      >
        <User className="w-5 h-5 text-gray-500" />
        <span className="text-gray-700">{ROLE_DISPLAY_NAMES[currentRole]}</span>
        <ChevronDown className="w-5 h-5 text-gray-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide px-3 py-2 mb-1">
              Switch Role
            </div>
            {roles.map((role) => (
              <button
                key={role}
                onClick={() => {
                  setRole(role)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-3 py-3 rounded-md hover:bg-gray-50 transition-colors ${
                  currentRole === role ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {ROLE_DISPLAY_NAMES[role]}
                      {currentRole === role && (
                        <span className="ml-2 text-xs text-blue-600 font-medium">Current</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {ROLE_DESCRIPTIONS[role]}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <div className="border-t border-gray-100 px-3 py-2 bg-gray-50 rounded-b-lg">
            <p className="text-xs text-gray-500">
              Role determines which pages, features, and widgets you can access
            </p>
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
