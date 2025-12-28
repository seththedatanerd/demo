import { StateCreator } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export interface Product {
  id: string
  name: string
  type: 'service' | 'product'
  price: number
  active: boolean
  duration?: number // minutes, only for services
  description?: string
  category?: string
  createdAt: string
  updatedAt: string
}

export interface ProductsSlice {
  products: Product[]
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateProduct: (id: string, updates: Partial<Product>) => void
  deleteProduct: (id: string) => void
  toggleProductActive: (id: string) => void
  loadProductTemplate: () => void
}

// Template products for GP practice
const TEMPLATE_PRODUCTS: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Services - Consultations by delivery type
  { name: 'Standard GP Consultation (F2F)', type: 'service', price: 75.00, active: true, duration: 15, category: 'Consultation', description: 'Face-to-face consultation at the practice' },
  { name: 'Extended GP Consultation (F2F)', type: 'service', price: 120.00, active: true, duration: 30, category: 'Consultation', description: 'Extended face-to-face consultation for complex cases' },
  { name: 'Telephone Consultation', type: 'service', price: 45.00, active: true, duration: 10, category: 'Consultation', description: 'Phone-based consultation for quick queries and follow-ups' },
  { name: 'Video Consultation', type: 'service', price: 65.00, active: true, duration: 15, category: 'Consultation', description: 'Remote video consultation via secure link' },
  { name: 'Home Visit', type: 'service', price: 150.00, active: true, duration: 45, category: 'Consultation', description: 'GP visit to patient\'s home for those unable to attend the practice' },
  { name: 'Urgent Home Visit', type: 'service', price: 200.00, active: true, duration: 45, category: 'Consultation', description: 'Same-day urgent home visit for housebound patients' },
  { name: 'New Patient Registration', type: 'service', price: 0.00, active: true, duration: 20, category: 'Admin' },
  { name: 'Blood Test', type: 'service', price: 35.00, active: true, duration: 10, category: 'Diagnostic' },
  { name: 'ECG', type: 'service', price: 85.00, active: true, duration: 20, category: 'Diagnostic' },
  { name: 'Health Check (Basic)', type: 'service', price: 150.00, active: true, duration: 30, category: 'Screening' },
  { name: 'Health Check (Comprehensive)', type: 'service', price: 350.00, active: true, duration: 60, category: 'Screening' },
  { name: 'Travel Vaccination Consult', type: 'service', price: 40.00, active: true, duration: 15, category: 'Vaccination' },
  { name: 'Flu Vaccination', type: 'service', price: 25.00, active: true, duration: 10, category: 'Vaccination' },
  { name: 'COVID Booster', type: 'service', price: 30.00, active: true, duration: 10, category: 'Vaccination' },
  { name: 'Cervical Smear', type: 'service', price: 65.00, active: true, duration: 20, category: 'Screening' },
  { name: 'Minor Surgery', type: 'service', price: 180.00, active: true, duration: 30, category: 'Procedure' },
  { name: 'Wound Dressing', type: 'service', price: 25.00, active: true, duration: 15, category: 'Procedure' },
  { name: 'Ear Syringing', type: 'service', price: 55.00, active: true, duration: 20, category: 'Procedure' },
  { name: 'Spirometry', type: 'service', price: 75.00, active: true, duration: 20, category: 'Diagnostic' },
  { name: 'Diabetes Review', type: 'service', price: 60.00, active: true, duration: 20, category: 'Chronic Care' },
  { name: 'Asthma Review', type: 'service', price: 50.00, active: true, duration: 15, category: 'Chronic Care' },
  { name: 'Mental Health Review', type: 'service', price: 90.00, active: true, duration: 30, category: 'Mental Health' },
  
  // Products
  { name: 'Prescription Fee (Private)', type: 'product', price: 15.00, active: true, category: 'Admin' },
  { name: 'Medical Report', type: 'product', price: 85.00, active: true, category: 'Admin' },
  { name: 'Fit Note', type: 'product', price: 25.00, active: true, category: 'Admin' },
  { name: 'Insurance Form', type: 'product', price: 95.00, active: true, category: 'Admin' },
  { name: 'DVLA Form', type: 'product', price: 95.00, active: true, category: 'Admin' },
  { name: 'Referral Letter', type: 'product', price: 45.00, active: true, category: 'Admin' },
  { name: 'Copy of Medical Records', type: 'product', price: 50.00, active: true, category: 'Admin' },
  { name: 'Travel Health Kit', type: 'product', price: 35.00, active: true, category: 'Travel' },
  { name: 'First Aid Supplies', type: 'product', price: 12.00, active: true, category: 'Supplies' },
  { name: 'Sharps Disposal Container', type: 'product', price: 8.00, active: true, category: 'Supplies' },
]

export const createProductsSlice: StateCreator<ProductsSlice> = (set, get) => ({
  products: [],

  addProduct: (productData) => {
    const now = new Date().toISOString()
    const newProduct: Product = {
      id: uuidv4(),
      ...productData,
      createdAt: now,
      updatedAt: now,
    }
    set((state) => ({
      products: [...state.products, newProduct],
    }))
  },

  updateProduct: (id, updates) => {
    set((state) => ({
      products: state.products.map((product) =>
        product.id === id
          ? { ...product, ...updates, updatedAt: new Date().toISOString() }
          : product
      ),
    }))
  },

  deleteProduct: (id) => {
    set((state) => ({
      products: state.products.filter((product) => product.id !== id),
    }))
  },

  toggleProductActive: (id) => {
    set((state) => ({
      products: state.products.map((product) =>
        product.id === id
          ? { ...product, active: !product.active, updatedAt: new Date().toISOString() }
          : product
      ),
    }))
  },

  loadProductTemplate: () => {
    const now = new Date().toISOString()
    const templateProducts: Product[] = TEMPLATE_PRODUCTS.map((p) => ({
      id: uuidv4(),
      ...p,
      createdAt: now,
      updatedAt: now,
    }))
    set({ products: templateProducts })
  },
})

