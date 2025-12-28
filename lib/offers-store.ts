// Simple in-memory store for demo purposes
// In a real app, this would be a database

export interface TargetedOffer {
  id: string
  title: string
  description: string
  ctaText: string
  ctaLink: string
  whyThisText: string
  priority: 'low' | 'medium' | 'high'
  validUntil: string
  status: 'draft' | 'active' | 'paused' | 'expired'
  createdAt: string
  estimatedReach: number
  icon: string
  audienceRules: Array<{
    id: string
    type: 'demographic' | 'clinical' | 'behavioral'
    field: string
    operator: string
    value: string | number | [number, number]
    label: string
  }>
}

// Global store for demo
let offersStore: TargetedOffer[] = [
  {
    id: 'bc-screening',
    title: 'Breast Cancer Screening',
    description: 'Early detection screening for women over 50. Quick, confidential, and could save your life.',
    ctaText: 'Book Breast Cancer Screening',
    ctaLink: '/patient/book/bc-screening',
    whyThisText: "We're inviting women 50–70 for a breast cancer screening as recommended by NHS guidelines.",
    priority: 'high',
    validUntil: '2025-12-31',
    status: 'active',
    createdAt: '2025-09-20',
    estimatedReach: 23,
    icon: '🩺',
    audienceRules: [
      { id: '5', type: 'demographic', field: 'gender', operator: 'equals', value: 'female', label: 'Female patients' },
      { id: '2', type: 'demographic', field: 'age', operator: 'between', value: [50, 70], label: 'Age 50-70' }
    ]
  }
]

export const getActiveOffers = (): TargetedOffer[] => {
  return offersStore.filter(offer => offer.status === 'active')
}

export const getAllOffers = (): TargetedOffer[] => {
  return [...offersStore]
}

export const addOffer = (offer: TargetedOffer): void => {
  offersStore.push(offer)
}

export const updateOffer = (id: string, updates: Partial<TargetedOffer>): void => {
  const index = offersStore.findIndex(offer => offer.id === id)
  if (index !== -1) {
    offersStore[index] = { ...offersStore[index], ...updates }
  }
}

export const deleteOffer = (id: string): void => {
  offersStore = offersStore.filter(offer => offer.id !== id)
}

export const getOfferById = (id: string): TargetedOffer | undefined => {
  return offersStore.find(offer => offer.id === id)
}
