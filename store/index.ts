import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { TimelineSlice, createTimelineSlice } from './slices/timeline'
import { DemoSlice, createDemoSlice } from './slices/demo'
import { AutopilotSlice, createAutopilotSlice } from './slices/autopilot'
import { DataSlice, createDataSlice, Patient, Appointment } from './slices/data'
import { CallSlice, createCallSlice } from './slices/calls'
import { RoleSlice, createRoleSlice } from './slices/role'
import { AIActionSlice, createAIActionSlice } from './slices/aiActions'
import { ProductsSlice, createProductsSlice } from './slices/products'

// Re-export types
export type { Patient, Appointment }

// Combined store type
export type AppState = TimelineSlice & DemoSlice & AutopilotSlice & DataSlice & CallSlice & RoleSlice & AIActionSlice & ProductsSlice

// Create the combined store
export const useStore = create<AppState>()(
  devtools(
    (...a) => ({
      ...createTimelineSlice(...a),
      ...createDemoSlice(...a),
      ...createAutopilotSlice(...a),
      ...createDataSlice(...a),
      ...createCallSlice(...a),
      ...createRoleSlice(...a),
      ...createAIActionSlice(...a),
      ...createProductsSlice(...a),
    }),
    {
      name: 'data-ravens-store',
    }
  )
)

// Convenience hooks for specific slices
export const useTimeline = () => useStore((state) => ({
  events: state.events,
  activePlan: state.activePlan,
  addEvent: state.addEvent,
  undoEvent: state.undoEvent,
  undoAllPlan: state.undoAllPlan,
  executePlan: state.executePlan,
}))

export const useDemo = () => useStore((state) => ({
  demoMode: state.demoMode,
  resetDemo: state.resetDemo,
  toggleDemoMode: state.toggleDemoMode,
}))

export const useAutopilot = () => useStore((state) => ({
  autopilotMode: state.autopilotMode,
  setAutopilotMode: state.setAutopilotMode,
  role: state.role,
  setRole: state.setRole,
}))

export const useData = () => useStore((state) => ({
  patients: state.patients,
  appointments: state.appointments,
  invoices: state.invoices,
  clinicians: (state as any).clinicians,
  services: (state as any).services,
  notes: (state as any).notes,
  practitioners: (state as any).practitioners,
  sites: (state as any).sites,
  rooms: (state as any).rooms,
  documents: (state as any).documents,
  tasks: (state as any).tasks,
  messages: (state as any).messages,
  addPatient: (state as any).addPatient,
  updatePatient: state.updatePatient,
  addAppointment: (state as any).addAppointment,
  updateAppointment: state.updateAppointment,
  removeAppointment: (state as any).removeAppointment,
  addInvoice: (state as any).addInvoice,
  updateInvoice: state.updateInvoice,
  markInvoicePaid: (state as any).markInvoicePaid,
  addNote: (state as any).addNote,
  updateNote: (state as any).updateNote,
  removeNote: (state as any).removeNote,
  addClinician: (state as any).addClinician,
  addService: (state as any).addService,
  addDocument: (state as any).addDocument,
  removeDocument: (state as any).removeDocument,
  addTask: (state as any).addTask,
  completeTask: (state as any).completeTask,
  removeTask: (state as any).removeTask,
  addMessage: (state as any).addMessage,
  removeMessage: (state as any).removeMessage,
  loadFromJson: (state as any).loadFromJson,
  loadDemoData: state.loadDemoData,
  setMutationLocked: (state as any).setMutationLocked,
}))

export const useCalls = () => useStore((state) => ({
  activeCall: state.activeCall,
  recentCalls: state.recentCalls,
  startCall: state.startCall,
  endCall: state.endCall,
  updateCall: state.updateCall,
  getCallById: state.getCallById,
}))

export const useRole = () => useStore((state) => ({
  currentRole: state.currentRole,
  permissions: state.permissions,
  setRole: state.setRole,
  hasPermission: state.hasPermission,
}))

export const useAIActions = () => useStore((state) => ({
  aiActions: state.aiActions,
  todaysActions: state.todaysActions,
  logAIAction: state.logAIAction,
  clearTodaysActions: state.clearTodaysActions,
  getActionsByDate: state.getActionsByDate,
  getActionsBySource: state.getActionsBySource,
}))

export const useProducts = () => useStore((state) => ({
  products: state.products,
  addProduct: state.addProduct,
  updateProduct: state.updateProduct,
  deleteProduct: state.deleteProduct,
  toggleProductActive: state.toggleProductActive,
  loadProductTemplate: state.loadProductTemplate,
}))
