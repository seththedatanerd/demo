'use client'

import { useRole } from '@/store'
import AmbientScribe from '@/components/AmbientScribe'
import { FileText, Mic, Brain, Shield, Clock } from 'lucide-react'

export default function ScribePage() {
  const { currentRole } = useRole()

  // Only allow clinicians and managers
  if (currentRole === 'reception') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600">Ambient Scribe is only available to clinicians and managers.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mic className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ambient Clinical Scribe</h1>
              <p className="text-gray-600">AI-powered clinical documentation and note generation</p>
            </div>
          </div>
          
          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Brain className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">AI-Powered</h3>
              </div>
              <p className="text-sm text-gray-600">
                Advanced speech recognition and natural language processing to capture and structure clinical conversations automatically.
              </p>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center space-x-3 mb-3">
                <Clock className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-900">Time-Saving</h3>
              </div>
              <p className="text-sm text-gray-600">
                Reduce documentation time by up to 70%. Focus on patient care while AI handles note-taking and structuring.
              </p>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center space-x-3 mb-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Structured Notes</h3>
              </div>
              <p className="text-sm text-gray-600">
                Generate comprehensive clinical notes with proper sections: HPI, physical exam, assessment, and plan.
              </p>
            </div>
          </div>
        </div>

        {/* Main Scribe Interface */}
        <AmbientScribe />
        
        {/* Usage Tips */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">💡 Usage Tips</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• Ensure your microphone is working and positioned clearly</li>
            <li>• Speak clearly and avoid background noise when possible</li>
            <li>• The AI works best with natural conversation flow</li>
            <li>• Review and approve all generated notes before finalizing</li>
            <li>• Use voice commands like "Generate note for chest pain patient"</li>
          </ul>
        </div>
      </div>
    </div>
  )
}