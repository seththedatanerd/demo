'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface Invoice {
  id: string
  amount: number
  currency: string
  description: string
  date: string
  dueDate: string
  status: string
  practitioner: string
  canInstallments: boolean
  installmentPlan: {
    available: boolean
    numberOfPayments: number
    amountPerPayment: number
    totalWithFees: number
  }
}

interface PaymentMethod {
  id: string
  type: 'card' | 'apple_pay' | 'google_pay'
  name: string
  icon: string
  last4?: string
  brand?: string
}

// Mock payment methods for demo
const mockPaymentMethods: PaymentMethod[] = [
  {
    id: 'card_1',
    type: 'card',
    name: 'Visa ending in 4242',
    icon: '💳',
    last4: '4242',
    brand: 'visa'
  },
  {
    id: 'apple_pay',
    type: 'apple_pay',
    name: 'Apple Pay',
    icon: '🍎'
  },
  {
    id: 'google_pay',
    type: 'google_pay',
    name: 'Google Pay',
    icon: '📱'
  }
]

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params.invoiceId as string

  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [useInstallments, setUseInstallments] = useState(false)

  useEffect(() => {
    fetchInvoice()
  }, [invoiceId])

  useEffect(() => {
    if (mockPaymentMethods.length > 0 && !selectedMethod) {
      setSelectedMethod(mockPaymentMethods[0])
    }
  }, [selectedMethod])

  const fetchInvoice = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/patient/pay?invoiceId=${invoiceId}`)
      const data = await response.json()

      if (response.ok) {
        setInvoice(data.invoice)
      } else {
        setError(data.error || 'Failed to load invoice')
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handlePayment = async () => {
    if (!invoice || !selectedMethod) return

    setPaymentLoading(true)
    setError('')

    const amount = useInstallments ? invoice.installmentPlan.amountPerPayment : invoice.amount

    try {
      const response = await fetch('/api/patient/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          paymentMethod: selectedMethod.id,
          amount,
          installments: useInstallments
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess(data.message)
        setTimeout(() => router.push('/'), 3000)
      } else {
        setError(data.error || 'Payment failed')
      }
    } catch (err) {
      setError('Payment processing failed. Please try again.')
    } finally {
      setPaymentLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading invoice...</p>
        </div>
      </div>
    )
  }

  if (error && !invoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h2 className="font-semibold text-slate-900 mb-2">Something went wrong</h2>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="w-full bg-slate-900 text-white py-3 px-4 rounded-xl font-medium hover:bg-slate-800 transition-colors"
          >
            Back to Portal
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✓</span>
          </div>
          <h2 className="font-semibold text-slate-900 mb-2">Payment Successful</h2>
          <p className="text-emerald-700 text-sm mb-4">{success}</p>
          <p className="text-xs text-slate-400">Returning to portal...</p>
        </div>
      </div>
    )
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-slate-600">Invoice not found</p>
        </div>
      </div>
    )
  }

  const paymentAmount = useInstallments ? invoice.installmentPlan.amountPerPayment : invoice.amount

  return (
    <div className="min-h-screen bg-slate-50 pb-safe">
      {/* Status Bar Background */}
      <div className="h-safe-top bg-white"></div>
      
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-lg mx-auto px-6 py-6">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => router.push('/patient')}
              className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-200 transition-colors"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Invoice Payment</h1>
              <p className="text-slate-500 text-sm">Secure checkout</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-6 py-5 space-y-4">
        {/* Invoice Details Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-5">
            <div className="flex justify-between items-start text-white">
              <div>
                <p className="font-medium opacity-90 text-sm mb-1">{invoice.description}</p>
                <p className="text-emerald-100 text-sm">{invoice.practitioner}</p>
                <p className="text-emerald-200 text-xs mt-1">{new Date(invoice.date).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">£{invoice.amount}</p>
              </div>
            </div>
          </div>
          
          {new Date(invoice.dueDate) < new Date() && (
            <div className="bg-red-50 border-t border-red-100 px-5 py-3">
              <p className="text-red-700 font-medium text-sm">⚠️ Payment overdue</p>
            </div>
          )}
        </div>
        
        {/* Installment Toggle */}
        {invoice.canInstallments && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-slate-900 mb-1">
                  Pay in 3 instalments?
                </h3>
                <p className="text-slate-600 text-sm mb-1">
                  £{invoice.installmentPlan.amountPerPayment.toFixed(2)} now, then 2 more
                </p>
                <p className="text-xs text-slate-400">
                  Total: £{invoice.installmentPlan.totalWithFees.toFixed(2)} (includes £{(invoice.installmentPlan.totalWithFees - invoice.amount).toFixed(2)} fee)
                </p>
              </div>
              <button
                onClick={() => setUseInstallments(!useInstallments)}
                className={`w-12 h-7 rounded-full transition-colors flex-shrink-0 ${
                  useInstallments ? 'bg-emerald-600' : 'bg-slate-200'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ml-1 ${
                  useInstallments ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        )}

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="font-medium text-slate-900">Payment Method</h3>
          </div>
          <div className="p-2">
            {mockPaymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method)}
                className={`w-full p-3 rounded-xl transition-all flex items-center justify-between ${
                  selectedMethod?.id === method.id
                    ? 'bg-emerald-50 border-2 border-emerald-500'
                    : 'hover:bg-slate-50 border-2 border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                    <span className="text-lg">{method.icon}</span>
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-slate-900 text-sm">{method.name}</p>
                    {method.brand && (
                      <p className="text-xs text-slate-500 capitalize">{method.brand}</p>
                    )}
                  </div>
                </div>
                
                {selectedMethod?.id === method.id && (
                  <div className="w-6 h-6 bg-emerald-600 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Button */}
        <button
          onClick={handlePayment}
          disabled={paymentLoading || !selectedMethod}
          className="w-full bg-emerald-600 text-white py-4 px-4 rounded-2xl font-semibold text-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {paymentLoading ? (
            <span className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Processing...
            </span>
          ) : (
            <>
              Pay £{paymentAmount.toFixed(2)} now
              {useInstallments && (
                <span className="block text-sm font-normal opacity-90 mt-0.5">
                  First of 3 payments
                </span>
              )}
            </>
          )}
        </button>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Security Notice */}
        <div className="text-center py-4">
          <div className="inline-flex items-center space-x-2 text-slate-400 text-sm">
            <span>🔒</span>
            <span>Secure 256-bit SSL encryption</span>
          </div>
        </div>
      </div>
    </div>
  )
}
