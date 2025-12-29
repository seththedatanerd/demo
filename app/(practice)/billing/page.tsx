"use client"

import { useMemo, useState, useEffect, Suspense } from 'react'
import { useData } from '@/store'
import { useSearchParams, useRouter } from 'next/navigation'
import { 
  Edit, Send, Download, Plus, Trash2, X, Settings, 
  Ban, RotateCcw, CreditCard, Calendar, FileText,
  AlertTriangle, CheckCircle, Clock, DollarSign,
  ChevronDown, ChevronRight
} from 'lucide-react'
import { Invoice, InvoiceLineItem, InvoicePayment, InvoiceStatus } from '@/store/slices/data'

// Billing settings interface
interface BillingSettings {
  invoiceFutureBookings: boolean
  autoInvoiceOnComplete: boolean
  defaultPaymentTerms: number // days
  sendReminders: boolean
  reminderDays: number[]
}

function BillingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { invoices, patients, appointments, updateInvoice, addInvoice, services } = useData() as any
  
  const [statusFilter, setStatusFilter] = useState<string>('All')
  const [query, setQuery] = useState<string>('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [isNewInvoice, setIsNewInvoice] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [voidModalOpen, setVoidModalOpen] = useState(false)
  const [refundModalOpen, setRefundModalOpen] = useState(false)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  
  // Billing settings state
  const [settings, setSettings] = useState<BillingSettings>({
    invoiceFutureBookings: true,
    autoInvoiceOnComplete: false,
    defaultPaymentTerms: 30,
    sendReminders: true,
    reminderDays: [7, 3, 1]
  })

  // Handle URL params for creating invoice from appointment
  useEffect(() => {
    const appointmentId = searchParams.get('appointmentId')
    const patientId = searchParams.get('patientId')
    
    if (appointmentId && patientId) {
      const appointment = appointments.find((a: any) => a.id === appointmentId)
      if (appointment) {
        createInvoiceFromAppointment(appointment, patientId)
      }
    }
  }, [searchParams, appointments])

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'Overdue': return 'bg-red-100 text-red-800 border-red-200'
      case 'Draft': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'Sent': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Paid': return 'bg-green-100 text-green-800 border-green-200'
      case 'Partially Paid': return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'Voided': return 'bg-slate-100 text-slate-500 border-slate-200'
      case 'Refunded': return 'bg-purple-100 text-purple-800 border-purple-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: InvoiceStatus) => {
    switch (status) {
      case 'Overdue': return <AlertTriangle className="w-3 h-3" />
      case 'Paid': return <CheckCircle className="w-3 h-3" />
      case 'Partially Paid': return <Clock className="w-3 h-3" />
      case 'Voided': return <Ban className="w-3 h-3" />
      case 'Refunded': return <RotateCcw className="w-3 h-3" />
      default: return null
    }
  }

  const invoiceWithPatient = useMemo(() => {
    const list = invoices.map((inv: Invoice) => ({
      ...inv,
      patient: patients.find((p: any) => p.id === inv.patientId)?.name || inv.patientId
    }))
    const q = query.toLowerCase().trim()
    const filtered = list.filter((row: any) => (
      (statusFilter === 'All' || row.status === statusFilter) &&
      (!q || row.patient.toLowerCase().includes(q) || (row.payer || '').toLowerCase().includes(q) || row.id.toLowerCase().includes(q))
    ))
    return filtered.sort((a: any, b: any) => new Date(b.createdDate || b.dueDate).getTime() - new Date(a.createdDate || a.dueDate).getTime())
  }, [invoices, patients, statusFilter, query])

  const totals = useMemo(() => {
    const activeInvoices = invoices.filter((i: Invoice) => i.status !== 'Voided' && i.status !== 'Refunded')
    const outstanding = activeInvoices.filter((i: Invoice) => i.status !== 'Paid')
    const overdue = activeInvoices.filter((i: Invoice) => i.status === 'Overdue')
    const partiallyPaid = activeInvoices.filter((i: Invoice) => i.status === 'Partially Paid')
    const draft = activeInvoices.filter((i: Invoice) => i.status === 'Draft')
    
    const now = new Date()
    const thisMonth = activeInvoices.filter((i: Invoice) => {
      const date = new Date(i.createdDate || i.dueDate)
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    })
    const paidThisMonth = thisMonth.filter((i: Invoice) => i.status === 'Paid')
    
    return {
      outstanding: outstanding.reduce((acc: number, i: Invoice) => acc + (i.balance || 0), 0),
      overdue: overdue.reduce((acc: number, i: Invoice) => acc + (i.balance || 0), 0),
      partiallyPaid: partiallyPaid.reduce((acc: number, i: Invoice) => acc + (i.balance || 0), 0),
      draft: draft.reduce((acc: number, i: Invoice) => acc + (i.amount || 0), 0),
      paidThisMonth: paidThisMonth.reduce((acc: number, i: Invoice) => acc + (i.amountPaid || 0), 0),
      invoiceCount: activeInvoices.length,
      overdueCount: overdue.length
    }
  }, [invoices])

  function createInvoiceFromAppointment(appointment: any, patientId: string) {
    const patient = patients.find((p: any) => p.id === patientId)
    const appointmentDate = new Date(appointment.start).toISOString().slice(0, 10)
    
    // Determine price based on appointment type
    let rate = 75.00 // default GP consultation
    if (appointment.appointmentType?.includes('Video')) rate = 65.00
    if (appointment.appointmentType?.includes('Phone')) rate = 45.00
    if (appointment.appointmentType?.includes('Home')) rate = 150.00
    if (appointment.appointmentType?.includes('Extended')) rate = 120.00
    
    const newInvoice: Invoice = {
      id: `INV-${Date.now()}`,
      patientId,
      status: 'Draft',
      amount: rate,
      amountPaid: 0,
      balance: rate,
      dueDate: new Date(Date.now() + settings.defaultPaymentTerms * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      createdDate: new Date().toISOString().slice(0, 10),
      payer: patient?.insurer || 'Self-pay',
      lineItems: [{
        id: `li-${Date.now()}`,
        description: appointment.appointmentType || 'GP Consultation',
        quantity: 1,
        rate,
        amount: rate,
        appointmentId: appointment.id,
        appointmentDate,
        serviceCode: 'CONS-STD'
      }],
      payments: [],
      notes: `Created from appointment on ${appointmentDate}`
    }
    
    setEditingInvoice(newInvoice)
    setIsNewInvoice(true)
    setEditorOpen(true)
  }

  function openInvoiceEditor(invoice?: Invoice, isNew: boolean = false) {
    if (invoice) {
      setEditingInvoice({ ...invoice })
      setIsNewInvoice(isNew)
    } else {
      const newInvoice: Invoice = {
        id: `INV-${Date.now()}`,
        patientId: patients[0]?.id || '',
        status: 'Draft',
        amount: 0,
        amountPaid: 0,
        balance: 0,
        dueDate: new Date(Date.now() + settings.defaultPaymentTerms * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        createdDate: new Date().toISOString().slice(0, 10),
        payer: 'Self-pay',
        lineItems: [],
        payments: []
      }
      setEditingInvoice(newInvoice)
      setIsNewInvoice(true)
    }
    setEditorOpen(true)
  }

  function closeInvoiceEditor() {
    setEditorOpen(false)
    setEditingInvoice(null)
    setIsNewInvoice(false)
    // Clear URL params
    router.replace('/billing')
  }

  function handleSaveInvoice(invoice: Invoice) {
    // Recalculate totals
    const amount = invoice.lineItems.reduce((sum, item) => sum + item.amount, 0)
    const amountPaid = invoice.payments.filter(p => p.amount > 0).reduce((sum, p) => sum + p.amount, 0)
    const refunds = invoice.payments.filter(p => p.amount < 0).reduce((sum, p) => sum + Math.abs(p.amount), 0)
    const balance = amount - amountPaid
    
    // Auto-determine status
    let status = invoice.status
    if (invoice.status !== 'Voided' && invoice.status !== 'Refunded') {
      if (balance <= 0 && amountPaid > 0) {
        status = 'Paid'
      } else if (amountPaid > 0 && balance > 0) {
        status = 'Partially Paid'
      } else if (new Date(invoice.dueDate) < new Date() && invoice.status !== 'Draft') {
        status = 'Overdue'
      }
    }
    
    const updatedInvoice = { ...invoice, amount, amountPaid, balance, status }
    
    if (invoices.find((i: Invoice) => i.id === invoice.id)) {
      updateInvoice(invoice.id, updatedInvoice)
    } else {
      addInvoice(updatedInvoice)
    }
    closeInvoiceEditor()
  }

  function sendInvoice(invoiceId: string) {
    updateInvoice(invoiceId, { status: 'Sent' })
  }

  function openVoidModal(invoiceId: string) {
    setSelectedInvoiceId(invoiceId)
    setVoidModalOpen(true)
  }

  function openRefundModal(invoiceId: string) {
    setSelectedInvoiceId(invoiceId)
    setRefundModalOpen(true)
  }

  function handleVoidInvoice(reason: string) {
    if (!selectedInvoiceId) return
    updateInvoice(selectedInvoiceId, {
      status: 'Voided',
      voidedDate: new Date().toISOString().slice(0, 10),
      voidedReason: reason,
      balance: 0
    })
    setVoidModalOpen(false)
    setSelectedInvoiceId(null)
  }

  function handleRefundInvoice(amount: number, reason: string) {
    if (!selectedInvoiceId) return
    const invoice = invoices.find((i: Invoice) => i.id === selectedInvoiceId)
    if (!invoice) return
    
    const refundPayment: InvoicePayment = {
      id: `ref-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      amount: -amount,
      method: 'Refund',
      reference: `REF-${Date.now()}`
    }
    
    updateInvoice(selectedInvoiceId, {
      status: 'Refunded',
      refundedDate: new Date().toISOString().slice(0, 10),
      refundAmount: amount,
      refundReason: reason,
      payments: [...(invoice.payments || []), refundPayment],
      balance: 0
    })
    setRefundModalOpen(false)
    setSelectedInvoiceId(null)
  }

  function markAsPaid(invoiceId: string) {
    const invoice = invoices.find((i: Invoice) => i.id === invoiceId)
    if (!invoice) return
    
    const payment: InvoicePayment = {
      id: `pay-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      amount: invoice.balance,
      method: 'Card Payment',
      reference: `TXN-${Date.now()}`
    }
    
    updateInvoice(invoiceId, {
      status: 'Paid',
      amountPaid: invoice.amount,
      balance: 0,
      payments: [...(invoice.payments || []), payment]
    })
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Billing & Invoices</h1>
          <p className="text-sm text-gray-500 mt-1">{totals.invoiceCount} invoices • {totals.overdueCount} overdue</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            title="Billing Settings"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
          <button 
            onClick={() => openInvoiceEditor()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Invoice
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="p-4 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm text-gray-500">Outstanding</h3>
            <DollarSign className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-1">£{totals.outstanding.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="p-4 bg-white border border-red-200 rounded-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm text-red-600">Overdue</h3>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-600 mt-1">£{totals.overdue.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="p-4 bg-white border border-amber-200 rounded-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm text-amber-600">Partially Paid</h3>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-1">£{totals.partiallyPaid.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="p-4 bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm text-gray-500">Draft</h3>
            <FileText className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-600 mt-1">£{totals.draft.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="p-4 bg-white border border-green-200 rounded-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-sm text-green-600">Paid This Month</h3>
            <CheckCircle className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-600 mt-1">£{totals.paidThisMonth.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-3 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search invoices..."
          className="flex-1 max-w-xs px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All Statuses</option>
          <option value="Draft">Draft</option>
          <option value="Sent">Sent</option>
          <option value="Paid">Paid</option>
          <option value="Partially Paid">Partially Paid</option>
          <option value="Overdue">Overdue</option>
          <option value="Voided">Voided</option>
          <option value="Refunded">Refunded</option>
        </select>
        <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
          <Download className="w-4 h-4 inline mr-2" />
          Export
        </button>
      </div>

      {/* Invoices Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Invoice</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Patient</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Amount</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Paid</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Balance</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Due Date</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Payer</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoiceWithPatient.map((invoice: any) => (
              <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <button 
                    onClick={() => openInvoiceEditor(invoice)}
                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {invoice.id}
                  </button>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{invoice.patient}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                    {getStatusIcon(invoice.status)}
                    {invoice.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right font-medium">£{invoice.amount?.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-right text-green-600">£{(invoice.amountPaid || 0).toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-right font-medium">
                  <span className={invoice.balance > 0 ? 'text-red-600' : 'text-gray-600'}>
                    £{(invoice.balance || 0).toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{invoice.dueDate}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{invoice.payer}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end space-x-1">
                    {invoice.status === 'Draft' && (
                      <button
                        onClick={() => sendInvoice(invoice.id)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                        title="Send Invoice"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    )}
                    {(invoice.status === 'Sent' || invoice.status === 'Overdue' || invoice.status === 'Partially Paid') && (
                      <button
                        onClick={() => markAsPaid(invoice.id)}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                        title="Mark as Paid"
                      >
                        <CreditCard className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => openInvoiceEditor(invoice)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {invoice.status !== 'Voided' && invoice.status !== 'Refunded' && invoice.status !== 'Paid' && (
                      <button
                        onClick={() => openVoidModal(invoice.id)}
                        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                        title="Void Invoice"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    )}
                    {invoice.status === 'Paid' && (
                      <button
                        onClick={() => openRefundModal(invoice.id)}
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                        title="Refund"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
                      title="Download PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {invoiceWithPatient.length === 0 && (
          <div className="px-4 py-12 text-center text-gray-500">
            No invoices found
          </div>
        )}
      </div>

      {/* Invoice Editor Modal */}
      {editorOpen && editingInvoice && (
        <InvoiceEditorModal
          invoice={editingInvoice}
          patients={patients}
          appointments={appointments}
          services={services}
          settings={settings}
          onSave={handleSaveInvoice}
          onClose={closeInvoiceEditor}
          isNew={isNewInvoice}
        />
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <BillingSettingsModal
          settings={settings}
          onSave={(newSettings) => {
            setSettings(newSettings)
            setSettingsOpen(false)
          }}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {/* Void Modal */}
      {voidModalOpen && (
        <VoidInvoiceModal
          onVoid={handleVoidInvoice}
          onClose={() => {
            setVoidModalOpen(false)
            setSelectedInvoiceId(null)
          }}
        />
      )}

      {/* Refund Modal */}
      {refundModalOpen && selectedInvoiceId && (
        <RefundInvoiceModal
          invoice={invoices.find((i: Invoice) => i.id === selectedInvoiceId)}
          onRefund={handleRefundInvoice}
          onClose={() => {
            setRefundModalOpen(false)
            setSelectedInvoiceId(null)
          }}
        />
      )}
    </div>
  )
}

// Billing Settings Modal
function BillingSettingsModal({ settings, onSave, onClose }: {
  settings: BillingSettings
  onSave: (settings: BillingSettings) => void
  onClose: () => void
}) {
  const [editSettings, setEditSettings] = useState(settings)

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Invoice & Payment Settings</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Invoice Settings */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Invoice</h3>
            
            <div className="space-y-4">
              <label className="flex items-start space-x-3 p-3 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-100 transition-colors">
                <input
                  type="checkbox"
                  checked={editSettings.invoiceFutureBookings}
                  onChange={(e) => setEditSettings(prev => ({ ...prev, invoiceFutureBookings: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Invoice future bookings</span>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Turning on Invoice future bookings will automatically pull future bookings into invoices
                  </p>
                </div>
              </label>

              <label className="flex items-start space-x-3 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={editSettings.autoInvoiceOnComplete}
                  onChange={(e) => setEditSettings(prev => ({ ...prev, autoInvoiceOnComplete: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">Auto-invoice on completion</span>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Automatically create an invoice when an appointment is marked as completed
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Payment Terms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default Payment Terms</label>
            <select
              value={editSettings.defaultPaymentTerms}
              onChange={(e) => setEditSettings(prev => ({ ...prev, defaultPaymentTerms: Number(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>

          {/* Reminders */}
          <div>
            <label className="flex items-center space-x-2 mb-2">
              <input
                type="checkbox"
                checked={editSettings.sendReminders}
                onChange={(e) => setEditSettings(prev => ({ ...prev, sendReminders: e.target.checked }))}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Send payment reminders</span>
            </label>
            {editSettings.sendReminders && (
              <p className="text-xs text-gray-500 ml-6">
                Reminders sent at {editSettings.reminderDays.join(', ')} days before due date
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={() => onSave(editSettings)}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}

// Void Invoice Modal
function VoidInvoiceModal({ onVoid, onClose }: {
  onVoid: (reason: string) => void
  onClose: () => void
}) {
  const [reason, setReason] = useState('')

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <Ban className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Void Invoice</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm text-gray-600 mb-4">
            This will permanently void the invoice. This action cannot be undone.
          </p>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reason for voiding</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-red-500"
            placeholder="e.g., Duplicate invoice, billing error..."
          />
        </div>

        <div className="flex justify-end space-x-3 p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={() => onVoid(reason)}
            disabled={!reason.trim()}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Void Invoice
          </button>
        </div>
      </div>
    </div>
  )
}

// Refund Invoice Modal
function RefundInvoiceModal({ invoice, onRefund, onClose }: {
  invoice: Invoice
  onRefund: (amount: number, reason: string) => void
  onClose: () => void
}) {
  const [amount, setAmount] = useState(invoice.amountPaid || 0)
  const [reason, setReason] = useState('')

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <RotateCcw className="w-5 h-5 text-purple-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Process Refund</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Invoice Total:</span>
              <span className="font-medium">£{invoice.amount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">Amount Paid:</span>
              <span className="font-medium text-green-600">£{invoice.amountPaid?.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Refund Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">£</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                max={invoice.amountPaid}
                min={0}
                step="0.01"
                className="w-full border border-gray-300 rounded-lg pl-7 pr-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Maximum refundable: £{invoice.amountPaid?.toFixed(2)}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason for refund</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
              placeholder="e.g., Appointment cancelled, service not provided..."
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={() => onRefund(amount, reason)}
            disabled={!reason.trim() || amount <= 0 || amount > (invoice.amountPaid || 0)}
            className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Process Refund
          </button>
        </div>
      </div>
    </div>
  )
}

// Invoice Editor Modal
function InvoiceEditorModal({ invoice, patients, appointments, services, settings, onSave, onClose, isNew }: {
  invoice: Invoice
  patients: any[]
  appointments: any[]
  services: any[]
  settings: BillingSettings
  onSave: (invoice: Invoice) => void
  onClose: () => void
  isNew?: boolean
}) {
  const [editData, setEditData] = useState<Invoice>(invoice)
  const [activeTab, setActiveTab] = useState('details')
  const [showAppointmentPicker, setShowAppointmentPicker] = useState(false)

  const selectedPatient = patients.find(p => p.id === editData.patientId)
  
  // Get patient appointments for linking
  const patientAppointments = appointments.filter((a: any) => 
    a.patientId === editData.patientId
  ).sort((a: any, b: any) => new Date(b.start).getTime() - new Date(a.start).getTime())

  const subtotal = editData.lineItems.reduce((sum, item) => sum + item.amount, 0)
  const totalPaid = editData.payments.filter(p => p.amount > 0).reduce((sum, p) => sum + p.amount, 0)
  const totalRefunds = editData.payments.filter(p => p.amount < 0).reduce((sum, p) => sum + Math.abs(p.amount), 0)
  const balance = subtotal - totalPaid

  function addLineItem() {
    setEditData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, {
        id: `li-${Date.now()}`,
        description: '',
        quantity: 1,
        rate: 0,
        amount: 0
      }]
    }))
  }

  function addLineItemFromAppointment(appointment: any) {
    let rate = 75.00
    if (appointment.appointmentType?.includes('Video')) rate = 65.00
    if (appointment.appointmentType?.includes('Phone')) rate = 45.00
    if (appointment.appointmentType?.includes('Home')) rate = 150.00
    if (appointment.appointmentType?.includes('Extended')) rate = 120.00

    setEditData(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, {
        id: `li-${Date.now()}`,
        description: appointment.appointmentType || 'GP Consultation',
        quantity: 1,
        rate,
        amount: rate,
        appointmentId: appointment.id,
        appointmentDate: new Date(appointment.start).toISOString().slice(0, 10)
      }]
    }))
    setShowAppointmentPicker(false)
  }

  function updateLineItem(id: string, updates: Partial<InvoiceLineItem>) {
    setEditData(prev => ({
      ...prev,
      lineItems: prev.lineItems.map(item => {
        if (item.id === id) {
          const updated = { ...item, ...updates }
          if ('quantity' in updates || 'rate' in updates) {
            updated.amount = updated.quantity * updated.rate
          }
          return updated
        }
        return item
      })
    }))
  }

  function removeLineItem(id: string) {
    setEditData(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter(item => item.id !== id)
    }))
  }

  function addPayment() {
    setEditData(prev => ({
      ...prev,
      payments: [...prev.payments, {
        id: `pay-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        amount: balance > 0 ? balance : 0,
        method: 'Card Payment'
      }]
    }))
  }

  function updatePayment(id: string, updates: Partial<InvoicePayment>) {
    setEditData(prev => ({
      ...prev,
      payments: prev.payments.map(p => p.id === id ? { ...p, ...updates } : p)
    }))
  }

  function removePayment(id: string) {
    setEditData(prev => ({
      ...prev,
      payments: prev.payments.filter(p => p.id !== id)
    }))
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {isNew ? 'New Invoice' : 'Edit Invoice'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {editData.id} {selectedPatient && `• ${selectedPatient.name}`}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(editData.status)}`}>
              {editData.status}
            </span>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <nav className="flex px-5">
            {[
              { id: 'details', label: 'Invoice Details' },
              { id: 'payments', label: `Payments (${editData.payments.length})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto max-h-[55vh]">
          {activeTab === 'details' ? (
            <div className="space-y-6">
              {/* Basic Details */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                  <select
                    value={editData.patientId}
                    onChange={(e) => setEditData(prev => ({ ...prev, patientId: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={editData.status}
                    onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value as InvoiceStatus }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Sent">Sent</option>
                    <option value="Paid">Paid</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={editData.dueDate}
                    onChange={(e) => setEditData(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Billing To</label>
                  <select
                    value={editData.payer}
                    onChange={(e) => setEditData(prev => ({ ...prev, payer: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Self-pay">Self-pay</option>
                    <option value="Bupa">Bupa</option>
                    <option value="AXA">AXA</option>
                    <option value="Aviva">Aviva</option>
                    <option value="Vitality">Vitality</option>
                  </select>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Line Items</h3>
                  <div className="flex space-x-2">
                    {settings.invoiceFutureBookings && (
                      <button
                        onClick={() => setShowAppointmentPicker(!showAppointmentPicker)}
                        className="flex items-center text-sm text-amber-600 hover:text-amber-700"
                      >
                        <Calendar className="w-4 h-4 mr-1" />
                        Add from Appointment
                      </button>
                    )}
                    <button onClick={addLineItem} className="flex items-center text-sm text-blue-600 hover:text-blue-700">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Item
                    </button>
                  </div>
                </div>

                {/* Appointment Picker */}
                {showAppointmentPicker && patientAppointments.length > 0 && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-xs text-amber-700 mb-2 font-medium">Select an appointment to add:</p>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {patientAppointments.slice(0, 5).map((apt: any) => (
                        <button
                          key={apt.id}
                          onClick={() => addLineItemFromAppointment(apt)}
                          className="w-full text-left px-3 py-2 text-sm bg-white rounded border border-amber-200 hover:bg-amber-100 transition-colors"
                        >
                          <span className="font-medium">{apt.appointmentType || 'Consultation'}</span>
                          <span className="text-gray-500 ml-2">
                            {new Date(apt.start).toLocaleDateString('en-GB')}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2.5 grid grid-cols-12 gap-2 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    <div className="col-span-5">Item</div>
                    <div className="col-span-2">Date</div>
                    <div className="col-span-1 text-center">Qty</div>
                    <div className="col-span-2 text-right">Price</div>
                    <div className="col-span-1 text-right">Amount</div>
                    <div className="col-span-1"></div>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {editData.lineItems.map(item => (
                      <div key={item.id} className="px-4 py-2.5 grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-5">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateLineItem(item.id, { description: e.target.value })}
                            placeholder="Description"
                            className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="date"
                            value={item.appointmentDate || ''}
                            onChange={(e) => updateLineItem(item.id, { appointmentDate: e.target.value })}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-1">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(item.id, { quantity: Number(e.target.value) })}
                            min="1"
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-center focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            value={item.rate}
                            onChange={(e) => updateLineItem(item.id, { rate: Number(e.target.value) })}
                            min="0"
                            step="0.01"
                            className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm text-right focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-1 text-right font-medium text-sm">
                          £{item.amount.toFixed(2)}
                        </div>
                        <div className="col-span-1 text-right">
                          <button onClick={() => removeLineItem(item.id)} className="text-red-500 hover:text-red-700 p-1">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {editData.lineItems.length === 0 && (
                      <div className="px-4 py-8 text-center text-gray-400 text-sm">
                        No line items added yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Totals */}
                <div className="mt-4 flex justify-end">
                  <div className="w-64 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="font-medium">£{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Paid:</span>
                      <span className="font-medium">£{totalPaid.toFixed(2)}</span>
                    </div>
                    {totalRefunds > 0 && (
                      <div className="flex justify-between text-purple-600">
                        <span>Refunded:</span>
                        <span className="font-medium">-£{totalRefunds.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-gray-200 text-base font-semibold">
                      <span>Balance Due:</span>
                      <span className={balance > 0 ? 'text-red-600' : 'text-green-600'}>
                        £{balance.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={editData.notes || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                  placeholder="Internal notes..."
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Payment History</h3>
                <button onClick={addPayment} className="flex items-center text-sm text-blue-600 hover:text-blue-700">
                  <Plus className="w-4 h-4 mr-1" />
                  Record Payment
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2.5 grid grid-cols-5 gap-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <div>Date</div>
                  <div>Amount</div>
                  <div>Method</div>
                  <div>Reference</div>
                  <div></div>
                </div>
                <div className="divide-y divide-gray-100">
                  {editData.payments.map(payment => (
                    <div key={payment.id} className={`px-4 py-2.5 grid grid-cols-5 gap-3 items-center ${payment.amount < 0 ? 'bg-purple-50' : ''}`}>
                      <div>
                        <input
                          type="date"
                          value={payment.date}
                          onChange={(e) => updatePayment(payment.id, { date: e.target.value })}
                          className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm"
                          disabled={payment.method === 'Refund'}
                        />
                      </div>
                      <div>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm">£</span>
                          <input
                            type="number"
                            value={Math.abs(payment.amount)}
                            onChange={(e) => updatePayment(payment.id, { amount: payment.amount < 0 ? -Number(e.target.value) : Number(e.target.value) })}
                            min="0"
                            step="0.01"
                            className={`w-full border border-gray-300 rounded pl-6 pr-2.5 py-1.5 text-sm ${payment.amount < 0 ? 'text-purple-600' : ''}`}
                            disabled={payment.method === 'Refund'}
                          />
                        </div>
                        {payment.amount < 0 && <span className="text-xs text-purple-600">Refund</span>}
                      </div>
                      <div>
                        <select
                          value={payment.method}
                          onChange={(e) => updatePayment(payment.id, { method: e.target.value as any })}
                          className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm"
                          disabled={payment.method === 'Refund'}
                        >
                          <option value="Card Payment">Card Payment</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                          <option value="Cash">Cash</option>
                          <option value="Cheque">Cheque</option>
                          <option value="Insurance">Insurance</option>
                          {payment.method === 'Refund' && <option value="Refund">Refund</option>}
                        </select>
                      </div>
                      <div>
                        <input
                          type="text"
                          value={payment.reference || ''}
                          onChange={(e) => updatePayment(payment.id, { reference: e.target.value })}
                          placeholder="Reference"
                          className="w-full border border-gray-300 rounded px-2.5 py-1.5 text-sm"
                        />
                      </div>
                      <div className="text-right">
                        {payment.method !== 'Refund' && (
                          <button onClick={() => removePayment(payment.id)} className="text-red-500 hover:text-red-700 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {editData.payments.length === 0 && (
                    <div className="px-4 py-8 text-center text-gray-400 text-sm">
                      No payments recorded
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            Total: <span className="font-semibold">£{subtotal.toFixed(2)}</span>
            {' '} • Balance: <span className={`font-semibold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>£{balance.toFixed(2)}</span>
          </div>
          <div className="flex space-x-3">
            <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100">
              Cancel
            </button>
            <button
              onClick={() => onSave({ ...editData, amount: subtotal, amountPaid: totalPaid, balance })}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function getStatusColor(status: InvoiceStatus) {
  switch (status) {
    case 'Overdue': return 'bg-red-100 text-red-800 border-red-200'
    case 'Draft': return 'bg-gray-100 text-gray-800 border-gray-200'
    case 'Sent': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'Paid': return 'bg-green-100 text-green-800 border-green-200'
    case 'Partially Paid': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'Voided': return 'bg-slate-100 text-slate-500 border-slate-200'
    case 'Refunded': return 'bg-purple-100 text-purple-800 border-purple-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export default function Billing() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading billing...</div>}>
      <BillingContent />
    </Suspense>
  )
}
