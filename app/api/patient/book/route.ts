import { NextRequest, NextResponse } from 'next/server'
import { practiceAI } from '@/services/ai'

// Mock appointment data
const mockAppointments = [
  {
    id: 'appt-123',
    patientId: 'p1',
    practitioner: 'Dr. Smith',
    type: 'General Consultation',
    currentSlot: {
      date: '2025-01-16',
      time: '15:15',
      datetime: '2025-01-16T15:15:00Z'
    },
    status: 'confirmed'
  },
  {
    id: 'bc-screening',
    patientId: 'p1',
    practitioner: 'Dr. Williams',
    type: 'Breast Cancer Screening',
    currentSlot: {
      date: 'Available appointments',
      time: 'Choose your time',
      datetime: '2025-10-01T10:00:00Z'
    },
    status: 'booking'
  }
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const appointmentId = searchParams.get('appointmentId')
  const action = searchParams.get('action') // 'reschedule' or 'confirm'

  if (!appointmentId) {
    return NextResponse.json({ error: 'Appointment ID required' }, { status: 400 })
  }

  // Find the appointment
  const appointment = mockAppointments.find(a => a.id === appointmentId)
  if (!appointment) {
    return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
  }

  try {
    if (action === 'reschedule') {
      // Use Gemini to generate smart booking options
      const bookingPrompt = `Generate 3 realistic appointment slots for booking a ${appointment.type}.
      ${appointment.status === 'booking' ? 'New booking request' : `Current appointment: ${appointment.currentSlot.date} at ${appointment.currentSlot.time}`}
      Practitioner: ${appointment.practitioner}
      
      Consider:
      - Practice hours: Monday-Friday 9:00-17:00
      - 15-minute appointment slots
      - Avoid lunch hours 12:00-13:00
      - Prefer slots within next 7 days
      - Include estimated travel time from SW1A 1AA
      
      Return as JSON array:
      [
        {
          "datetime": "2025-01-17T10:30:00Z",
          "displayDate": "Tomorrow",
          "displayTime": "10:30 AM",
          "practitioner": "Dr. Smith",
          "travelTime": "15 min drive",
          "confidence": "high",
          "reason": "Best match for your preferences"
        }
      ]`

      // Add realistic delay
      await new Promise(resolve => setTimeout(resolve, 800))

      const aiResult = await practiceAI.answerQuestion(bookingPrompt) as any
      
      let slots = []
      if (aiResult?.data && Array.isArray(aiResult.data)) {
        slots = aiResult.data
      } else {
        // Fallback to static slots if AI fails
        if (appointmentId === 'bc-screening') {
          slots = [
            {
              datetime: '2025-10-08T10:00:00Z',
              displayDate: 'Next Tuesday',
              displayTime: '10:00 AM',
              practitioner: 'Dr. Williams',
              travelTime: '15 min drive',
              confidence: 'high',
              reason: 'Recommended morning slot for screening'
            },
            {
              datetime: '2025-10-10T14:30:00Z',
              displayDate: 'Next Thursday',
              displayTime: '2:30 PM',
              practitioner: 'Dr. Williams',
              travelTime: '15 min drive',
              confidence: 'high',
              reason: 'Afternoon appointment available'
            },
            {
              datetime: '2025-10-15T09:30:00Z',
              displayDate: 'Next Tuesday',
              displayTime: '9:30 AM',
              practitioner: 'Dr. Williams',
              travelTime: '15 min drive',
              confidence: 'medium',
              reason: 'Early morning slot following week'
            }
          ]
        } else {
          slots = [
            {
              datetime: '2025-01-17T10:30:00Z',
              displayDate: 'Tomorrow',
              displayTime: '10:30 AM',
              practitioner: 'Dr. Smith',
              travelTime: '15 min drive',
              confidence: 'high',
              reason: 'Best match for your preferences'
            },
            {
              datetime: '2025-01-17T14:15:00Z',
              displayDate: 'Tomorrow',
              displayTime: '2:15 PM',
              practitioner: 'Dr. Smith',
              travelTime: '15 min drive',
              confidence: 'medium',
              reason: 'Alternative afternoon slot'
            },
            {
              datetime: '2025-01-18T09:00:00Z',
              displayDate: 'Friday',
              displayTime: '9:00 AM',
              practitioner: 'Dr. Smith',
              travelTime: '15 min drive',
              confidence: 'medium',
              reason: 'Early morning slot'
            }
          ]
        }
      }

      return NextResponse.json({
        appointment,
        suggestedSlots: slots,
        aiGenerated: !!aiResult?.data
      })
    }

    // Default: just return appointment details
    return NextResponse.json({ appointment })

  } catch (error) {
    console.error('Booking API error:', error)
    
    // Return fallback slots even if AI fails
    const fallbackSlots = appointmentId === 'bc-screening' ? [
      {
        datetime: '2025-10-08T10:00:00Z',
        displayDate: 'Next Tuesday',
        displayTime: '10:00 AM',
        practitioner: 'Dr. Williams',
        travelTime: '15 min drive',
        confidence: 'high',
        reason: 'Available screening slot'
      }
    ] : [
      {
        datetime: '2025-01-17T10:30:00Z',
        displayDate: 'Tomorrow',
        displayTime: '10:30 AM',
        practitioner: 'Dr. Smith',
        travelTime: '15 min drive',
        confidence: 'high',
        reason: 'Available slot'
      }
    ]

    return NextResponse.json({
      appointment,
      suggestedSlots: fallbackSlots,
      aiGenerated: false
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { appointmentId, action, newSlot } = await request.json()

    if (!appointmentId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Find appointment
    const appointment = mockAppointments.find(a => a.id === appointmentId)
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
    }

    // Add realistic delay
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))

    if (action === 'confirm') {
      // Confirm existing appointment or book new screening
      appointment.status = 'confirmed'
      
      if (appointmentId === 'bc-screening') {
        return NextResponse.json({
          success: true,
          message: `Breast cancer screening request received. We'll contact you within 24 hours to confirm your appointment.`,
          appointment
        })
      }
      
      return NextResponse.json({
        success: true,
        message: `Appointment confirmed for ${appointment.currentSlot.time} on ${appointment.currentSlot.date}`,
        appointment
      })
    }

    if (action === 'reschedule' && newSlot) {
      // Update appointment slot
      appointment.currentSlot = {
        date: newSlot.datetime.split('T')[0],
        time: newSlot.displayTime,
        datetime: newSlot.datetime
      }
      appointment.status = 'rescheduled'

      return NextResponse.json({
        success: true,
        message: `Appointment rescheduled to ${newSlot.displayTime} on ${newSlot.displayDate}`,
        appointment
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Booking POST error:', error)
    return NextResponse.json(
      { error: 'Failed to update appointment' },
      { status: 500 }
    )
  }
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { status: 200 })
}
