import { NextRequest, NextResponse } from 'next/server'
import { getAllOffers, addOffer, updateOffer, deleteOffer, getActiveOffers, type TargetedOffer } from '@/lib/offers-store'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const activeOnly = searchParams.get('active') === 'true'
  
  try {
    const offers = activeOnly ? getActiveOffers() : getAllOffers()
    return NextResponse.json({ offers })
  } catch (error) {
    console.error('Error fetching offers:', error)
    return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const offer: TargetedOffer = await request.json()
    
    // Generate ID if not provided
    if (!offer.id) {
      offer.id = `offer-${Date.now()}`
    }
    
    // Set creation date
    offer.createdAt = new Date().toISOString().split('T')[0]
    
    addOffer(offer)
    
    return NextResponse.json({ success: true, offer })
  } catch (error) {
    console.error('Error creating offer:', error)
    return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...updates } = await request.json()
    
    if (!id) {
      return NextResponse.json({ error: 'Offer ID required' }, { status: 400 })
    }
    
    updateOffer(id, updates)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating offer:', error)
    return NextResponse.json({ error: 'Failed to update offer' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Offer ID required' }, { status: 400 })
    }
    
    deleteOffer(id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting offer:', error)
    return NextResponse.json({ error: 'Failed to delete offer' }, { status: 500 })
  }
}
