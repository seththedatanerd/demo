'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useData } from '@/store'
import { 
  ArrowLeft, Phone, Mail, Calendar, FileText, CreditCard, MessageCircle, CheckSquare,
  Pill, Plus, X, AlertTriangle, Search, Check, RefreshCw
} from 'lucide-react'
import { MEDICATIONS_DATABASE, Prescription, MedicationInfo } from '@/store/slices/data'

export default function PatientDetail({ params }: { params: { id: string } }) {
  const { patients, appointments, invoices, notes, documents, tasks, messages, prescriptions, addPrescription, updatePrescription } = useData() as any
  const [activeTab, setActiveTab] = useState('summary')
  
  // Find patient and related data
  const patient = patients.find((p: any) => p.id === params.id) || {
    id: params.id,
    name: 'Amelia Ali',
    dob: '1987-03-14',
    phone: '+44 20 7946 0123',
    insurer: 'Bupa',
    email: 'amelia.ali@email.com',
    address: '123 Harley Street, London, W1G 7JU',
    preferences: {
      communication: 'email',
      appointmentTime: 'morning',
      reminders: true
    },
    riskFactors: ['diabetes', 'family_history_heart']
  }
  
  const patientAppointments = appointments.filter((a: any) => a.patientId === params.id)
  const patientInvoices = invoices.filter((i: any) => i.patientId === params.id)
  const patientNotes = notes.filter((n: any) => n.patientId === params.id)
  const patientDocs = documents.filter((d: any) => d.patientId === params.id)
  const patientTasks = tasks.filter((t: any) => t.patientId === params.id)
  const patientMessages = messages.filter((m: any) => m.to === patient.phone || m.to === patient.email)
  const patientPrescriptions = (prescriptions || []).filter((rx: any) => rx.patientId === params.id)
  
  const tabs = [
    { id: 'summary', label: 'Summary', icon: FileText },
    { id: 'appointments', label: 'Appointments', icon: Calendar },
    { id: 'invoices', label: 'Invoices', icon: CreditCard },
    { id: 'prescriptions', label: 'Prescriptions', icon: Pill },
    { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'communications', label: 'Communications', icon: MessageCircle },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare }
  ]
  
  return (
    <div className="p-6">
      {/* Back Navigation */}
      <div className="mb-4">
        <Link href="/patients" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Patients
        </Link>
      </div>

      {/* Patient Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{patient.name}</h1>
            <div className="flex items-center text-sm text-gray-600 space-x-4">
              <span>DOB: {new Date(patient.dob).toLocaleDateString('en-GB')}</span>
              <span>•</span>
              <span>{patient.insurer}</span>
              <span>•</span>
              <span>ID: {patient.id}</span>
            </div>
            <div className="flex items-center mt-2 space-x-4">
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-1" />
                {patient.phone}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-1" />
                {patient.email}
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
              New Appointment
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700">
              Send Message
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-md text-sm hover:bg-gray-50">
              Edit Patient
            </button>
          </div>
        </div>
      </div>

      {/* Patient Record Tabs */}
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
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'summary' && <SummaryTab patient={patient} />}
        {activeTab === 'appointments' && <AppointmentsTab appointments={patientAppointments} />}
        {activeTab === 'invoices' && <InvoicesTab invoices={patientInvoices} />}
        {activeTab === 'prescriptions' && (
          <PrescriptionsTab 
            prescriptions={patientPrescriptions} 
            patientId={params.id}
            onAddPrescription={addPrescription}
            onUpdatePrescription={updatePrescription}
          />
        )}
        {activeTab === 'notes' && <NotesTab notes={patientNotes} />}
        {activeTab === 'documents' && <DocumentsTab documents={patientDocs} />}
        {activeTab === 'communications' && <CommunicationsTab messages={patientMessages} />}
        {activeTab === 'tasks' && <TasksTab tasks={patientTasks} />}
      </div>
    </div>
  )
}

function SummaryTab({ patient }: { patient: any }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Demographics</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500">Date of Birth</label>
              <p className="font-medium">{new Date(patient.dob).toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Age</label>
              <p className="font-medium">{Math.floor((new Date().getTime() - new Date(patient.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Patient ID</label>
              <p className="font-medium font-mono">{patient.id}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Contact Information</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500">Phone</label>
              <p className="font-medium">{patient.phone}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Email</label>
              <p className="font-medium">{patient.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Address</label>
              <p className="font-medium">{patient.address}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Insurance</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500">Primary Insurer</label>
              <p className="font-medium">{patient.insurer}</p>
            </div>
            {patient.insuranceExpiry && (
              <div>
                <label className="text-sm text-gray-500">Policy Expiry</label>
                <p className="font-medium">{new Date(patient.insuranceExpiry).toLocaleDateString('en-GB')}</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Preferences</h2>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-500">Communication</label>
              <p className="font-medium capitalize">{patient.preferences?.communication}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Preferred Time</label>
              <p className="font-medium capitalize">{patient.preferences?.appointmentTime}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Reminders</label>
              <p className="font-medium">{patient.preferences?.reminders ? 'Enabled' : 'Disabled'}</p>
            </div>
          </div>
        </div>
        
        {patient.riskFactors && patient.riskFactors.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 text-orange-900">Risk Factors</h2>
            <div className="space-y-2">
              {patient.riskFactors.map((factor: string, index: number) => (
                <span key={index} className="inline-block bg-orange-100 text-orange-800 px-2 py-1 text-xs rounded-full mr-2 mb-2">
                  {factor.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function AppointmentsTab({ appointments }: { appointments: any[] }) {
  const now = new Date()
  const upcoming = appointments.filter(a => new Date(a.start) >= now).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
  const past = appointments.filter(a => new Date(a.start) < now).sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Appointments</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
          Book New Appointment
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">Upcoming ({upcoming.length})</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {upcoming.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No upcoming appointments
              </div>
            ) : (
              upcoming.map(apt => (
                <div key={apt.id} className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{new Date(apt.start).toLocaleDateString('en-GB')}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(apt.start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        {' - '}
                        {new Date(apt.end).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </p>
                      <p className="text-sm text-gray-600">{apt.practitionerName || apt.clinician}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      apt.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      apt.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {apt.status || 'Scheduled'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="font-medium text-gray-900">Past Appointments ({past.length})</h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {past.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                No past appointments
              </div>
            ) : (
              past.map(apt => (
                <div key={apt.id} className="px-6 py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{new Date(apt.start).toLocaleDateString('en-GB')}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(apt.start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        {' - '}
                        {new Date(apt.end).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </p>
                      <p className="text-sm text-gray-600">{apt.practitionerName || apt.clinician}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      apt.status === 'completed' ? 'bg-green-100 text-green-800' :
                      apt.status === 'dna' ? 'bg-red-100 text-red-800' :
                      apt.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {apt.status || 'Completed'}
                    </span>
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

function InvoicesTab({ invoices }: { invoices: any[] }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Invoices</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
          Create Invoice
        </button>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-5 gap-4 text-sm font-medium text-gray-500">
            <div>Invoice #</div>
            <div>Amount</div>
            <div>Status</div>
            <div>Due Date</div>
            <div>Payer</div>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {invoices.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No invoices found
            </div>
          ) : (
            invoices.map(invoice => (
              <div key={invoice.id} className="px-6 py-4 hover:bg-gray-50 cursor-pointer">
                <div className="grid grid-cols-5 gap-4 text-sm">
                  <div className="font-medium font-mono">{invoice.id}</div>
                  <div className="font-medium">£{invoice.amount.toFixed(2)}</div>
                  <div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      invoice.status === 'Paid' ? 'bg-green-100 text-green-800' :
                      invoice.status === 'Overdue' ? 'bg-red-100 text-red-800' :
                      invoice.status === 'Sent' ? 'bg-blue-100 text-blue-800' :
                      invoice.status === 'Partially Paid' ? 'bg-amber-100 text-amber-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {invoice.status}
                    </span>
                  </div>
                  <div className="text-gray-600">{new Date(invoice.dueDate).toLocaleDateString('en-GB')}</div>
                  <div className="text-gray-600">{invoice.payer}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// Prescriptions Tab with full functionality
function PrescriptionsTab({ prescriptions, patientId, onAddPrescription, onUpdatePrescription }: {
  prescriptions: Prescription[]
  patientId: string
  onAddPrescription: (rx: Prescription) => void
  onUpdatePrescription: (id: string, updates: Partial<Prescription>) => void
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null)
  
  const activePrescriptions = prescriptions.filter(rx => rx.status === 'active')
  const pastPrescriptions = prescriptions.filter(rx => rx.status !== 'active')
  
  function openNewPrescription() {
    setEditingPrescription(null)
    setModalOpen(true)
  }
  
  function openEditPrescription(rx: Prescription) {
    setEditingPrescription(rx)
    setModalOpen(true)
  }
  
  function handleSave(rx: Prescription) {
    if (editingPrescription) {
      onUpdatePrescription(rx.id, rx)
    } else {
      onAddPrescription(rx)
    }
    setModalOpen(false)
    setEditingPrescription(null)
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Prescriptions</h2>
        <button 
          onClick={openNewPrescription}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-1" />
          New Prescription
        </button>
      </div>
      
      {/* Active Prescriptions */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
          <h3 className="font-medium text-green-900 flex items-center">
            <Pill className="w-4 h-4 mr-2" />
            Active Medications ({activePrescriptions.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-200">
          {activePrescriptions.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No active prescriptions
            </div>
          ) : (
            activePrescriptions.map(rx => (
              <div 
                key={rx.id} 
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => openEditPrescription(rx)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900">{rx.medicationName}</h4>
                      {rx.isRepeatPrescription && (
                        <span className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Repeat
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{rx.dosage}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Qty: {rx.quantity} • Prescribed by {rx.prescribedBy} on {new Date(rx.prescribedDate).toLocaleDateString('en-GB')}
                    </p>
                    {rx.isDispensed && (
                      <p className="text-xs text-green-600 mt-1 flex items-center">
                        <Check className="w-3 h-3 mr-1" />
                        Dispensed {rx.batchNumber && `(Batch: ${rx.batchNumber})`}
                      </p>
                    )}
                  </div>
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Past Prescriptions */}
      {pastPrescriptions.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-medium text-gray-700">Past Prescriptions ({pastPrescriptions.length})</h3>
          </div>
          <div className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
            {pastPrescriptions.map(rx => (
              <div 
                key={rx.id} 
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer opacity-70"
                onClick={() => openEditPrescription(rx)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-700">{rx.medicationName}</h4>
                    <p className="text-sm text-gray-500">{rx.dosage}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(rx.prescribedDate).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    rx.status === 'completed' ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {rx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Prescription Modal */}
      {modalOpen && (
        <PrescriptionModal
          prescription={editingPrescription}
          patientId={patientId}
          onSave={handleSave}
          onClose={() => {
            setModalOpen(false)
            setEditingPrescription(null)
          }}
        />
      )}
    </div>
  )
}

// Prescription Modal with Drug Info Panel
function PrescriptionModal({ prescription, patientId, onSave, onClose }: {
  prescription: Prescription | null
  patientId: string
  onSave: (rx: Prescription) => void
  onClose: () => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMedication, setSelectedMedication] = useState<MedicationInfo | null>(
    prescription ? MEDICATIONS_DATABASE.find(m => m.id === prescription.medicationId) || null : null
  )
  const [showDropdown, setShowDropdown] = useState(false)
  
  const [formData, setFormData] = useState({
    dosage: prescription?.dosage || '',
    quantity: prescription?.quantity || '',
    isRepeatPrescription: prescription?.isRepeatPrescription || false,
    isDispensed: prescription?.isDispensed || false,
    batchNumber: prescription?.batchNumber || '',
    expiryDate: prescription?.expiryDate || '',
    comments: prescription?.comments || '',
    showInSummary: prescription?.showInSummary ?? true
  })
  
  // Filter medications based on search
  const filteredMedications = useMemo(() => {
    if (!searchQuery.trim()) return []
    const q = searchQuery.toLowerCase()
    return MEDICATIONS_DATABASE.filter(med => 
      med.name.toLowerCase().includes(q) || 
      med.genericName?.toLowerCase().includes(q) ||
      med.pharmaceuticalClass.toLowerCase().includes(q)
    ).slice(0, 8)
  }, [searchQuery])
  
  function selectMedication(med: MedicationInfo) {
    setSelectedMedication(med)
    setSearchQuery(med.name)
    setShowDropdown(false)
    // Auto-select first quantity option
    if (med.quantities.length > 0 && !formData.quantity) {
      setFormData(prev => ({ ...prev, quantity: med.quantities[0] }))
    }
  }
  
  function handleSubmit() {
    if (!selectedMedication) return
    
    const newPrescription: Prescription = {
      id: prescription?.id || `rx-${Date.now()}`,
      patientId,
      medicationId: selectedMedication.id,
      medicationName: selectedMedication.name,
      dosage: formData.dosage,
      quantity: formData.quantity,
      isRepeatPrescription: formData.isRepeatPrescription,
      isDispensed: formData.isDispensed,
      batchNumber: formData.isDispensed ? formData.batchNumber : undefined,
      expiryDate: formData.isDispensed ? formData.expiryDate : undefined,
      comments: formData.comments || undefined,
      showInSummary: formData.showInSummary,
      prescribedBy: prescription?.prescribedBy || 'Dr Sarah Patel',
      prescribedDate: prescription?.prescribedDate || new Date().toISOString().slice(0, 10),
      status: prescription?.status || 'active'
    }
    
    onSave(newPrescription)
  }
  
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl my-8" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {prescription ? 'Edit Prescription' : 'New Prescription'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content */}
        <div className="flex">
          {/* Form Section */}
          <div className="flex-1 p-6 border-r border-gray-200">
            <div className="space-y-5">
              {/* Medication Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medication</label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setShowDropdown(true)
                        if (!e.target.value.trim()) setSelectedMedication(null)
                      }}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="Search medications..."
                      className="w-full border border-gray-300 rounded-lg pl-10 pr-10 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {selectedMedication && (
                      <button
                        onClick={() => {
                          setSelectedMedication(null)
                          setSearchQuery('')
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  {/* Dropdown */}
                  {showDropdown && filteredMedications.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {filteredMedications.map(med => (
                        <button
                          key={med.id}
                          onClick={() => selectMedication(med)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                        >
                          <div className="font-medium text-gray-900">{med.name}</div>
                          <div className="text-xs text-gray-500">{med.pharmaceuticalClass}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Dosage */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dosage</label>
                <input
                  type="text"
                  value={formData.dosage}
                  onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                  placeholder="Enter dosage as indicated..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                />
                {selectedMedication?.dosageGuidelines.adults && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs font-medium text-blue-700 mb-1">Adults:</p>
                    <p className="text-xs text-blue-600">{selectedMedication.dosageGuidelines.adults}</p>
                    {selectedMedication.dosageGuidelines.children && (
                      <>
                        <p className="text-xs font-medium text-blue-700 mt-2 mb-1">Children:</p>
                        <p className="text-xs text-blue-600">{selectedMedication.dosageGuidelines.children}</p>
                      </>
                    )}
                  </div>
                )}
              </div>
              
              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <select
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select quantity...</option>
                  {selectedMedication?.quantities.map(qty => (
                    <option key={qty} value={qty}>{qty}</option>
                  ))}
                </select>
              </div>
              
              {/* Checkboxes */}
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isRepeatPrescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, isRepeatPrescription: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">This is a repeat prescription</span>
                </label>
                
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDispensed}
                    onChange={(e) => setFormData(prev => ({ ...prev, isDispensed: e.target.checked }))}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Medication has been dispensed</span>
                </label>
              </div>
              
              {/* Dispensing Details */}
              {formData.isDispensed && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
                    <input
                      type="text"
                      value={formData.batchNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                      placeholder="e.g., ABC-123456"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={formData.expiryDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
              
              {/* Comments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comments (optional)</label>
                <textarea
                  value={formData.comments}
                  onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                  rows={3}
                  placeholder="Additional instructions for the patient..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              
              {/* Show in Summary */}
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showInSummary}
                  onChange={(e) => setFormData(prev => ({ ...prev, showInSummary: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Show in patient summary</span>
              </label>
            </div>
          </div>
          
          {/* Drug Info Panel */}
          <div className="w-80 p-5 bg-amber-50 overflow-y-auto max-h-[70vh]">
            {selectedMedication ? (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-900">{selectedMedication.name}</h3>
                
                {/* Contraindications */}
                <div>
                  <h4 className="text-sm font-semibold text-red-700 flex items-center mb-1">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Contraindications
                  </h4>
                  <ul className="text-xs text-gray-700 space-y-1">
                    {selectedMedication.contraindications.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
                
                {/* Warnings */}
                <div>
                  <h4 className="text-sm font-semibold text-amber-700 flex items-center mb-1">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Warnings
                  </h4>
                  <ul className="text-xs text-gray-700 space-y-1">
                    {selectedMedication.warnings.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
                
                {/* Interactions */}
                <div>
                  <h4 className="text-sm font-semibold text-amber-700 flex items-center mb-1">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Interactions
                  </h4>
                  <ul className="text-xs text-gray-700 space-y-1">
                    {selectedMedication.interactions.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
                
                {/* Side Effects */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-1">Side effects</h4>
                  <ul className="text-xs text-gray-700 space-y-1">
                    {selectedMedication.sideEffects.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
                
                <hr className="border-amber-200" />
                
                {/* Drug Classification */}
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-gray-700">Pharmaceutical class</span>
                    <p className="text-gray-600">{selectedMedication.pharmaceuticalClass}</p>
                  </div>
                  {selectedMedication.genericName && (
                    <div>
                      <span className="font-semibold text-gray-700">Generic name</span>
                      <p className="text-gray-600">{selectedMedication.genericName}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-gray-700">Indications</span>
                    <p className="text-gray-600">{selectedMedication.indications.join(', ')}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <Pill className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a medication to view drug information</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-red-600 hover:text-red-700"
          >
            Delete record
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedMedication || !formData.dosage || !formData.quantity}
              className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function NotesTab({ notes }: { notes: any[] }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Clinical Notes</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
          Add Note
        </button>
      </div>
      
      <div className="space-y-4">
        {notes.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
            No clinical notes recorded
          </div>
        ) : (
          notes.map(note => (
            <div key={note.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    note.type === 'consultation' ? 'bg-blue-100 text-blue-800' :
                    note.type === 'lab' ? 'bg-green-100 text-green-800' :
                    note.type === 'referral' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {note.type}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{note.author}</span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(note.createdAt).toLocaleDateString('en-GB')}
                </span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{note.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function DocumentsTab({ documents }: { documents: any[] }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
          Upload Document
        </button>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-500">
            <div>Document Name</div>
            <div>Type</div>
            <div>Actions</div>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {documents.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No documents uploaded
            </div>
          ) : (
            documents.map(doc => (
              <div key={doc.id} className="px-6 py-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="font-medium">{doc.title}</div>
                  <div className="text-gray-600">{doc.type}</div>
                  <div>
                    <button className="text-blue-600 hover:text-blue-800 text-sm mr-3">View</button>
                    <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function CommunicationsTab({ messages }: { messages: any[] }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Communications</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
          Send Message
        </button>
      </div>
      
      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
            No communications history
          </div>
        ) : (
          messages.map(message => (
            <div key={message.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    message.status === 'sent' ? 'bg-green-100 text-green-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {message.status}
                  </span>
                  <span className="text-sm text-gray-600">To: {message.to}</span>
                </div>
              </div>
              <p className="text-gray-700">{message.body}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

function TasksTab({ tasks }: { tasks: any[] }) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700">
          Create Task
        </button>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-500">
            <div>Task</div>
            <div>Status</div>
            <div>Actions</div>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {tasks.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              No tasks assigned
            </div>
          ) : (
            tasks.map(task => (
              <div key={task.id} className="px-6 py-4">
                <div className="grid grid-cols-3 gap-4 text-sm items-center">
                  <div className="font-medium">{task.title}</div>
                  <div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      task.status === 'done' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                  <div>
                    {task.status !== 'done' && (
                      <button className="text-green-600 hover:text-green-800 text-sm mr-3">Complete</button>
                    )}
                    <button className="text-red-600 hover:text-red-800 text-sm">Delete</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
