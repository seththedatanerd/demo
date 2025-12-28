import { NextRequest, NextResponse } from 'next/server'

// Mock invoice data
const mockInvoices = [
  {
    id: 'inv-456',
    patientId: 'p1',
    amount: 85.00,
    currency: 'GBP',
    description: 'General Consultation',
    date: '2025-01-15',
    dueDate: '2025-01-29',
    status: 'pending',
    practitioner: 'Dr. Smith',
    canInstallments: true,
    installmentPlan: {
      available: true,
      numberOfPayments: 3,
      amountPerPayment: 28.33,
      totalWithFees: 86.99
    }
  }
]

// Simulate Stripe-style payment processing
async function processPayment(paymentData: any) {
  // Add realistic processing delay
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1500))

  // Demo success rate: 92% (like real world)
  const success = Math.random() > 0.08

  if (!success) {
    const errors = [
      'Card declined - insufficient funds',
      'Card expired',
      'Incorrect security code',
      'Card blocked by bank',
      'Payment processor error'
    ]
    
    throw new Error(errors[Math.floor(Math.random() * errors.length)])
  }

  return {
    transactionId: `demo_txn_${Date.now()}`,
    status: 'succeeded',
    amount: paymentData.amount,
    currency: paymentData.currency,
    timestamp: new Date().toISOString()
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const invoiceId = searchParams.get('invoiceId')

  if (!invoiceId) {
    return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 })
  }

  const invoice = mockInvoices.find(i => i.id === invoiceId)
  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  return NextResponse.json({ invoice })
}

export async function POST(request: NextRequest) {
  try {
    const { invoiceId, paymentMethod, amount, installments } = await request.json()

    if (!invoiceId || !paymentMethod || !amount) {
      return NextResponse.json(
        { error: 'Missing required payment details' },
        { status: 400 }
      )
    }

    // Find invoice
    const invoice = mockInvoices.find(i => i.id === invoiceId)
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Validate amount
    const expectedAmount = installments ? invoice.installmentPlan.amountPerPayment : invoice.amount
    if (Math.abs(amount - expectedAmount) > 0.01) {
      return NextResponse.json(
        { error: 'Invalid payment amount' },
        { status: 400 }
      )
    }

    try {
      // Process payment
      const result = await processPayment({
        amount,
        currency: invoice.currency,
        method: paymentMethod,
        invoiceId
      })

      // Update invoice status
      if (installments) {
        invoice.status = 'partial_payment'
      } else {
        invoice.status = 'paid'
      }

      // Emit event for practice system (like real integration)
      const paymentEvent = {
        type: 'payment.completed',
        timestamp: new Date().toISOString(),
        source: 'patient-portal-mobile',
        data: {
          invoiceId,
          transactionId: result.transactionId,
          amount,
          paymentMethod,
          installments: !!installments
        },
        patient: {
          id: invoice.patientId
        }
      }

      console.log('Payment event emitted:', paymentEvent)

      return NextResponse.json({
        success: true,
        transaction: result,
        invoice: {
          ...invoice,
          lastPayment: {
            amount,
            date: new Date().toISOString(),
            transactionId: result.transactionId,
            method: paymentMethod
          }
        },
        message: installments 
          ? `First instalment of £${amount} paid successfully`
          : `Payment of £${amount} completed successfully`,
        nextAction: installments 
          ? {
              type: 'schedule_next_payment',
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
              amount: invoice.installmentPlan.amountPerPayment
            }
          : null
      })

    } catch (paymentError: any) {
      // Payment failed
      return NextResponse.json({
        success: false,
        error: paymentError.message,
        code: 'PAYMENT_FAILED',
        canRetry: true,
        suggestedActions: [
          'Check your card details',
          'Try a different payment method',
          'Contact your bank',
          'Call the practice for assistance'
        ]
      }, { status: 402 })
    }

  } catch (error) {
    console.error('Payment API error:', error)
    return NextResponse.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { status: 200 })
}
