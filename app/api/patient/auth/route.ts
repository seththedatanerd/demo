import { NextRequest, NextResponse } from 'next/server'

// Mock patient database for demo
const mockPatients = [
  {
    id: 'p1',
    name: 'Sarah Wilson',
    dob: '1985-03-15',
    postcode: 'SW1A 1AA',
    email: 'sarah.wilson@email.com',
    nhsNumber: '123 456 7890'
  },
  {
    id: 'p2', 
    name: 'John Smith',
    dob: '1990-07-22',
    postcode: 'NW1 4RY',
    email: 'john.smith@email.com',
    nhsNumber: '098 765 4321'
  },
  {
    id: 'p3',
    name: 'Emma Johnson',
    dob: '1978-11-08', 
    postcode: 'E1 6AN',
    email: 'emma.johnson@email.com',
    nhsNumber: '456 789 0123'
  }
]

export async function POST(request: NextRequest) {
  try {
    const { dob, postcode } = await request.json()

    // Validate input
    if (!dob || !postcode) {
      return NextResponse.json(
        { error: 'Date of birth and postcode are required' },
        { status: 400 }
      )
    }

    // Add realistic delay for demo
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000))

    // Find matching patient
    const patient = mockPatients.find(p => 
      p.dob === dob && p.postcode.toLowerCase() === postcode.toLowerCase()
    )

    if (!patient) {
      // Random chance of "system busy" for demo realism
      if (Math.random() < 0.1) {
        return NextResponse.json(
          { error: 'System temporarily busy. Please try again.' },
          { status: 503 }
        )
      }

      return NextResponse.json(
        { error: 'We couldn\'t verify your identity. Please check your details.' },
        { status: 401 }
      )
    }

    // Generate mock JWT token (in real app would be proper signed JWT)
    const token = `demo-jwt-${patient.id}-${Date.now()}`

    // Success response
    return NextResponse.json({
      success: true,
      token,
      patient: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        nhsNumber: patient.nhsNumber
      }
    })

  } catch (error) {
    console.error('Patient auth error:', error)
    return NextResponse.json(
      { error: 'Authentication failed. Please try again.' },
      { status: 500 }
    )
  }
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { status: 200 })
}
