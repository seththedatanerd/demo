'use client'

import { useState, useMemo } from 'react'
import { useData } from '@/store'
import { MessageSquare, Send, Users, Clock, Plus, Edit, Trash2, Search } from 'lucide-react'

interface MessageTemplate {
  id: string
  name: string
  type: 'sms' | 'email'
  subject?: string
  body: string
  variables: string[]
  category: 'appointment' | 'reminder' | 'marketing' | 'follow-up'
}

const DEFAULT_TEMPLATES: MessageTemplate[] = [
  {
    id: 'appt-reminder-sms',
    name: 'Appointment Reminder SMS',
    type: 'sms',
    body: 'Hi {{patient_name}}, this is a reminder of your appointment with {{practitioner}} on {{date}} at {{time}}. Reply CONFIRM to confirm or call us to reschedule.',
    variables: ['patient_name', 'practitioner', 'date', 'time'],
    category: 'reminder'
  },
  {
    id: 'appt-confirmation-email',
    name: 'Appointment Confirmation Email',
    type: 'email',
    subject: 'Appointment Confirmed - {{date}}',
    body: 'Dear {{patient_name}},\n\nYour appointment has been confirmed for:\n\nDate: {{date}}\nTime: {{time}}\nPractitioner: {{practitioner}}\nLocation: {{clinic_address}}\n\nPlease arrive 10 minutes early. If you need to cancel or reschedule, please contact us at least 24 hours in advance.\n\nBest regards,\nThe Practice Team',
    variables: ['patient_name', 'date', 'time', 'practitioner', 'clinic_address'],
    category: 'appointment'
  },
  {
    id: 'follow-up-email',
    name: 'Post-Appointment Follow-up',
    type: 'email',
    subject: 'How was your appointment?',
    body: 'Dear {{patient_name}},\n\nI hope your recent appointment with {{practitioner}} went well. We would love to hear about your experience.\n\nIf you have any questions or concerns about your treatment, please don\'t hesitate to contact us.\n\nBest wishes,\n{{practitioner}}',
    variables: ['patient_name', 'practitioner'],
    category: 'follow-up'
  },
  {
    id: 'payment-reminder',
    name: 'Payment Reminder',
    type: 'email',
    subject: 'Payment Reminder - Invoice {{invoice_id}}',
    body: 'Dear {{patient_name}},\n\nThis is a friendly reminder that your payment for invoice {{invoice_id}} (£{{amount}}) is now due.\n\nYou can pay securely online using this link: {{payment_link}}\n\nIf you have any questions, please contact our billing team.\n\nThank you,\nThe Practice Team',
    variables: ['patient_name', 'invoice_id', 'amount', 'payment_link'],
    category: 'reminder'
  }
]

export default function Messages() {
  const { patients, appointments, invoices, messages, addMessage, removeMessage } = useData() as any
  const [activeTab, setActiveTab] = useState('outbox')
  const [templates, setTemplates] = useState<MessageTemplate[]>(DEFAULT_TEMPLATES)
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null)
  const [isComposing, setIsComposing] = useState(false)
  const [isTemplateEditor, setIsTemplateEditor] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Sample message history - in real app this would come from the store
  const messageHistory = useMemo(() => {
    const history = messages || []
    const enhanced = history.map((msg: any) => ({
      ...msg,
      patient: patients.find((p: any) => p.phone === msg.to || p.email === msg.to)
    }))
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return enhanced.filter((msg: any) => 
        msg.body.toLowerCase().includes(q) || 
        msg.patient?.name.toLowerCase().includes(q) ||
        msg.to.toLowerCase().includes(q)
      )
    }
    
    return enhanced
  }, [messages, patients, searchQuery])

  const tabs = [
    { id: 'outbox', label: 'Outbox', icon: Send, count: messageHistory.length },
    { id: 'templates', label: 'Templates', icon: MessageSquare, count: templates.length },
    { id: 'reminders', label: 'Reminders', icon: Clock, count: 0 }
  ]

  function openComposer(template?: MessageTemplate) {
    if (template) {
      setSelectedTemplate(template)
    }
    setIsComposing(true)
  }

  function closeComposer() {
    setIsComposing(false)
    setSelectedTemplate(null)
  }

  function openTemplateEditor(template?: MessageTemplate) {
    setSelectedTemplate(template || null)
    setIsTemplateEditor(true)
  }

  function closeTemplateEditor() {
    setIsTemplateEditor(false)
    setSelectedTemplate(null)
  }

  function saveTemplate(template: MessageTemplate) {
    if (templates.find(t => t.id === template.id)) {
      setTemplates(prev => prev.map(t => t.id === template.id ? template : t))
    } else {
      setTemplates(prev => [...prev, template])
    }
    closeTemplateEditor()
  }

  function deleteTemplate(templateId: string) {
    setTemplates(prev => prev.filter(t => t.id !== templateId))
  }

  function sendMessage(data: any) {
    const message = {
      id: `msg-${Date.now()}`,
      to: data.recipient,
      body: data.message,
      status: 'sent',
      type: data.type,
      subject: data.subject,
      sentAt: new Date().toISOString()
    }
    addMessage(message)
    closeComposer()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm w-64"
            />
          </div>
          <button
            onClick={() => openComposer()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Compose
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center pb-2 text-sm font-medium border-b-2 transition-colors ${
                  isActive 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'outbox' && (
          <div className="space-y-4">
            {messageHistory.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
                <p className="text-gray-600 mb-4">Start by composing your first message or using a template.</p>
                <button
                  onClick={() => openComposer()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                >
                  Compose Message
                </button>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-500">
                    <div>Recipient</div>
                    <div>Type</div>
                    <div>Message Preview</div>
                    <div>Status</div>
                    <div>Sent</div>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {messageHistory.map((message: any) => (
                    <div key={message.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="grid grid-cols-5 gap-4 text-sm">
                        <div className="font-medium text-gray-900">
                          {message.patient?.name || message.to}
                        </div>
                        <div className="text-gray-600 uppercase">{message.type || 'SMS'}</div>
                        <div className="text-gray-600 truncate">
                          {message.subject && <span className="font-medium">{message.subject}: </span>}
                          {message.body}
                        </div>
                        <div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            message.status === 'sent' ? 'bg-green-100 text-green-800' :
                            message.status === 'delivered' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {message.status}
                          </span>
                        </div>
                        <div className="text-gray-600">
                          {new Date(message.sentAt || Date.now()).toLocaleDateString('en-GB')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Message Templates</h2>
              <button
                onClick={() => openTemplateEditor()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Template
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map(template => (
                <div key={template.id} className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">{template.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          template.type === 'sms' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {template.type.toUpperCase()}
                        </span>
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">
                          {template.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openComposer(template)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openTemplateEditor(template)}
                        className="text-gray-600 hover:text-gray-800"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    {template.subject && <div className="font-medium mb-1">Subject: {template.subject}</div>}
                    <div className="bg-gray-50 p-3 rounded border text-xs font-mono line-clamp-3">
                      {template.body}
                    </div>
                  </div>
                  {template.variables.length > 0 && (
                    <div className="text-xs">
                      <span className="text-gray-500">Variables: </span>
                      {template.variables.map(variable => (
                        <span key={variable} className="inline-block bg-yellow-100 text-yellow-800 px-1 rounded mr-1">
                          {`{{${variable}}}`}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'reminders' && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Automated Reminders</h3>
              <p className="text-gray-600 mb-4">Set up automated appointment reminders and follow-ups.</p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
                Configure Reminders
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Message Composer Modal */}
      {isComposing && (
        <MessageComposer
          template={selectedTemplate}
          patients={patients}
          onSend={sendMessage}
          onClose={closeComposer}
        />
      )}

      {/* Template Editor Modal */}
      {isTemplateEditor && (
        <TemplateEditor
          template={selectedTemplate}
          onSave={saveTemplate}
          onClose={closeTemplateEditor}
        />
      )}
    </div>
  )
}

// Message Composer Component
function MessageComposer({ template, patients, onSend, onClose }: {
  template: MessageTemplate | null
  patients: any[]
  onSend: (data: any) => void
  onClose: () => void
}) {
  const [messageType, setMessageType] = useState<'sms' | 'email'>(template?.type || 'sms')
  const [recipient, setRecipient] = useState('')
  const [subject, setSubject] = useState(template?.subject || '')
  const [message, setMessage] = useState(template?.body || '')
  const [selectedPatient, setSelectedPatient] = useState('')

  const handlePatientSelect = (patientId: string) => {
    const patient = patients.find(p => p.id === patientId)
    if (patient) {
      setSelectedPatient(patientId)
      setRecipient(messageType === 'email' ? patient.email : patient.phone)
      
      // Replace template variables if template is selected
      if (template) {
        let processedMessage = template.body
        let processedSubject = template.subject || ''
        
        // Replace common variables
        processedMessage = processedMessage.replace(/{{patient_name}}/g, patient.name)
        processedSubject = processedSubject.replace(/{{patient_name}}/g, patient.name)
        
        // Add more variable replacements as needed
        
        setMessage(processedMessage)
        setSubject(processedSubject)
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Compose Message</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Type</label>
              <select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value as 'sms' | 'email')}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="sms">SMS</option>
                <option value="email">Email</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Patient</label>
              <select
                value={selectedPatient}
                onChange={(e) => handlePatientSelect(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">Select patient...</option>
                {patients.map(patient => (
                  <option key={patient.id} value={patient.id}>{patient.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700">Recipient</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={messageType === 'email' ? 'Email address' : 'Phone number'}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          
          {messageType === 'email' && (
            <div>
              <label className="text-sm font-medium text-gray-700">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          )}
          
          <div>
            <label className="text-sm font-medium text-gray-700">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={messageType === 'sms' ? 4 : 8}
              className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="Type your message..."
            />
            {messageType === 'sms' && (
              <div className="text-right text-xs text-gray-500 mt-1">
                {message.length}/160 characters
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSend({ type: messageType, recipient, subject, message })}
            disabled={!recipient || !message}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send Message
          </button>
        </div>
      </div>
    </div>
  )
}

// Template Editor Component  
function TemplateEditor({ template, onSave, onClose }: {
  template: MessageTemplate | null
  onSave: (template: MessageTemplate) => void
  onClose: () => void
}) {
  const [formData, setFormData] = useState<MessageTemplate>(template || {
    id: `template-${Date.now()}`,
    name: '',
    type: 'sms',
    body: '',
    variables: [],
    category: 'appointment'
  })

  const availableVariables = [
    'patient_name', 'practitioner', 'date', 'time', 'clinic_address',
    'invoice_id', 'amount', 'payment_link', 'phone_number'
  ]

  function addVariable(variable: string) {
    const newText = formData.body + `{{${variable}}}`
    setFormData(prev => ({ ...prev, body: newText }))
    
    // Extract variables from text
    const matches = newText.matchAll(/{{(\w+)}}/g)
    const variables = Array.from(new Set(
      Array.from(matches).map(match => match[1])
    ))
    setFormData(prev => ({ ...prev, variables }))
  }

  function handleBodyChange(body: string) {
    setFormData(prev => ({ ...prev, body }))
    
    // Extract variables from text
    const matches = body.matchAll(/{{(\w+)}}/g)
    const variables = Array.from(new Set(
      Array.from(matches).map(match => match[1])
    ))
    setFormData(prev => ({ ...prev, variables }))
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {template ? 'Edit Template' : 'New Template'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Template Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="appointment">Appointment</option>
                <option value="reminder">Reminder</option>
                <option value="follow-up">Follow-up</option>
                <option value="marketing">Marketing</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700">Type</label>
            <div className="mt-1 flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="sms"
                  checked={formData.type === 'sms'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="mr-2"
                />
                SMS
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="email"
                  checked={formData.type === 'email'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="mr-2"
                />
                Email
              </label>
            </div>
          </div>
          
          {formData.type === 'email' && (
            <div>
              <label className="text-sm font-medium text-gray-700">Subject</label>
              <input
                type="text"
                value={formData.subject || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
          )}
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Message Body</label>
              <div className="text-xs text-gray-500">
                Click variables to insert:
                {availableVariables.map(variable => (
                  <button
                    key={variable}
                    onClick={() => addVariable(variable)}
                    className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                  >
                    {`{{${variable}}}`}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              value={formData.body}
              onChange={(e) => handleBodyChange(e.target.value)}
              rows={8}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              placeholder="Type your template message..."
            />
          </div>
          
          {formData.variables.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700">Detected Variables</label>
              <div className="mt-1 flex flex-wrap gap-1">
                {formData.variables.map(variable => (
                  <span key={variable} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                    {`{{${variable}}}`}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(formData)}
            disabled={!formData.name || !formData.body}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Template
          </button>
        </div>
      </div>
    </div>
  )
}
