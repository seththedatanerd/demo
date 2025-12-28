'use client'
import Link from 'next/link'
import { useData } from '@/store'
import { useMemo, useState } from 'react'
import { 
  Search, 
  Filter, 
  Download, 
  Mail, 
  UserPlus, 
  ChevronDown, 
  ChevronUp,
  X,
  Check,
  MoreHorizontal,
  Columns,
  Save,
  RefreshCw,
  Calendar,
  Phone,
  Building2,
  AlertTriangle,
  Users,
  FileText
} from 'lucide-react'

// Filter types
interface FilterConfig {
  status: 'all' | 'active' | 'inactive'
  insurers: string[]
  lastVisitFrom: string
  lastVisitTo: string
  ageFrom: string
  ageTo: string
  riskFactors: string[]
  hasUpcomingAppointment: 'all' | 'yes' | 'no'
  communicationPref: string[]
}

const defaultFilters: FilterConfig = {
  status: 'all',
  insurers: [],
  lastVisitFrom: '',
  lastVisitTo: '',
  ageFrom: '',
  ageTo: '',
  riskFactors: [],
  hasUpcomingAppointment: 'all',
  communicationPref: []
}

// Saved filter presets
const filterPresets = [
  { id: 'all', name: 'All Patients', filters: defaultFilters },
  { id: 'active', name: 'Active Patients', filters: { ...defaultFilters, status: 'active' as const } },
  { id: 'overdue', name: 'Overdue for Checkup', filters: { ...defaultFilters, status: 'active' as const } },
  { id: 'high-risk', name: 'High Risk', filters: { ...defaultFilters, riskFactors: ['diabetes', 'hypertension'] } },
  { id: 'bupa', name: 'Bupa Insurance', filters: { ...defaultFilters, insurers: ['Bupa'] } },
]

export default function Patients() {
  const { patients, appointments } = useData()
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<FilterConfig>(defaultFilters)
  const [activePreset, setActivePreset] = useState('all')
  const [showFilters, setShowFilters] = useState(true)
  
  // Table state
  const [sortKey, setSortKey] = useState<string>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  
  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    dob: true,
    phone: true,
    email: true,
    insurer: true,
    lastSeen: true,
    status: true,
    address: false,
    riskFactors: true,
    preferences: false
  })
  const [showColumnPicker, setShowColumnPicker] = useState(false)

  // Get unique values for filter options
  const insurerOptions = useMemo(() => 
    Array.from(new Set(patients.map(p => p.insurer).filter(Boolean))).sort(),
    [patients]
  )
  
  const riskFactorOptions = useMemo(() => 
    Array.from(new Set(patients.flatMap(p => p.riskFactors || []))).sort(),
    [patients]
  )

  // Calculate age from DOB
  const calculateAge = (dob: string) => {
    if (!dob) return null
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  // Filter and sort patients
  const filteredPatients = useMemo(() => {
    let result = [...patients]
    
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p => 
          p.name.toLowerCase().includes(q) ||
        p.phone?.toLowerCase().includes(q) ||
        p.insurer?.toLowerCase().includes(q) ||
        p.dob?.includes(q)
      )
    }
    
    // Status filter
    if (filters.status !== 'all') {
      // For demo, consider patients with recent visits as active
      result = result.filter(p => {
        const hasRecentVisit = p.lastSeen && new Date(p.lastSeen) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        return filters.status === 'active' ? hasRecentVisit : !hasRecentVisit
      })
    }
    
    // Insurer filter
    if (filters.insurers.length > 0) {
      result = result.filter(p => filters.insurers.includes(p.insurer))
    }
    
    // Last visit date range
    if (filters.lastVisitFrom) {
      result = result.filter(p => p.lastSeen && p.lastSeen >= filters.lastVisitFrom)
    }
    if (filters.lastVisitTo) {
      result = result.filter(p => p.lastSeen && p.lastSeen <= filters.lastVisitTo)
    }
    
    // Age range
    if (filters.ageFrom) {
      const minAge = parseInt(filters.ageFrom)
      result = result.filter(p => {
        const age = calculateAge(p.dob)
        return age !== null && age >= minAge
      })
    }
    if (filters.ageTo) {
      const maxAge = parseInt(filters.ageTo)
      result = result.filter(p => {
        const age = calculateAge(p.dob)
        return age !== null && age <= maxAge
      })
    }
    
    // Risk factors
    if (filters.riskFactors.length > 0) {
      result = result.filter(p => 
        p.riskFactors?.some(rf => filters.riskFactors.includes(rf))
      )
    }
    
    // Communication preference
    if (filters.communicationPref.length > 0) {
      result = result.filter(p => 
        p.preferences?.communication && filters.communicationPref.includes(p.preferences.communication)
      )
    }
    
    // Sort
    result.sort((a, b) => {
      let av: any = ''
      let bv: any = ''
      
      switch (sortKey) {
        case 'name': av = a.name; bv = b.name; break
        case 'dob': av = a.dob || ''; bv = b.dob || ''; break
        case 'insurer': av = a.insurer || ''; bv = b.insurer || ''; break
        case 'lastSeen': av = a.lastSeen || ''; bv = b.lastSeen || ''; break
        case 'phone': av = a.phone || ''; bv = b.phone || ''; break
        default: av = a.name; bv = b.name
      }
      
      if (typeof av === 'string') {
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
      }
      return sortDir === 'asc' ? av - bv : bv - av
    })
    
    return result
  }, [patients, searchQuery, filters, sortKey, sortDir])

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / pageSize)
  const paginatedPatients = filteredPatients.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedPatients.size === paginatedPatients.length) {
      setSelectedPatients(new Set())
    } else {
      setSelectedPatients(new Set(paginatedPatients.map(p => p.id)))
    }
  }

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedPatients)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedPatients(newSelected)
  }

  // Sort handler
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  // Apply preset
  const applyPreset = (presetId: string) => {
    const preset = filterPresets.find(p => p.id === presetId)
    if (preset) {
      setFilters(preset.filters)
      setActivePreset(presetId)
      setCurrentPage(1)
    }
  }

  // Reset filters
  const resetFilters = () => {
    setFilters(defaultFilters)
    setActivePreset('all')
    setSearchQuery('')
    setCurrentPage(1)
  }

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.status !== 'all') count++
    if (filters.insurers.length > 0) count++
    if (filters.lastVisitFrom || filters.lastVisitTo) count++
    if (filters.ageFrom || filters.ageTo) count++
    if (filters.riskFactors.length > 0) count++
    if (filters.communicationPref.length > 0) count++
    if (filters.hasUpcomingAppointment !== 'all') count++
    return count
  }, [filters])

  const SortIcon = ({ column }: { column: string }) => {
    if (sortKey !== column) return <ChevronDown className="w-4 h-4 text-gray-300" />
    return sortDir === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-600" />
      : <ChevronDown className="w-4 h-4 text-blue-600" />
  }

  return (
    <div className="flex h-full bg-gray-50">
      {/* Left Sidebar - Filters */}
      {showFilters && (
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
          {/* Filter Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">Filters</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Preset Selector */}
            <select
              value={activePreset}
              onChange={(e) => applyPreset(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {filterPresets.map(preset => (
                <option key={preset.id} value={preset.id}>{preset.name}</option>
              ))}
            </select>
          </div>

          {/* Filter Options */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Status Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Patient Status
              </label>
              <div className="space-y-1">
                {['all', 'active', 'inactive'].map(status => (
                  <label key={status} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      checked={filters.status === status}
                      onChange={() => setFilters({ ...filters, status: status as any })}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">
                      {status === 'all' ? 'All Patients' : status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Insurance Filter */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Insurance Provider
              </label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {insurerOptions.map(insurer => (
                  <label key={insurer} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.insurers.includes(insurer)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters({ ...filters, insurers: [...filters.insurers, insurer] })
                        } else {
                          setFilters({ ...filters, insurers: filters.insurers.filter(i => i !== insurer) })
                        }
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{insurer}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Last Visit Date Range */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Last Visit
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">From</label>
                  <input
                    type="date"
                    value={filters.lastVisitFrom}
                    onChange={(e) => setFilters({ ...filters, lastVisitFrom: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">To</label>
                  <input
                    type="date"
                    value={filters.lastVisitTo}
                    onChange={(e) => setFilters({ ...filters, lastVisitTo: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Age Range */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Age Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Min</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.ageFrom}
                    onChange={(e) => setFilters({ ...filters, ageFrom: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Max</label>
                  <input
                    type="number"
                    placeholder="120"
                    value={filters.ageTo}
                    onChange={(e) => setFilters({ ...filters, ageTo: e.target.value })}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Risk Factors */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Risk Factors
              </label>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {riskFactorOptions.map(rf => (
                  <label key={rf} className="flex items-center space-x-2 cursor-pointer">
          <input
                      type="checkbox"
                      checked={filters.riskFactors.includes(rf)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters({ ...filters, riskFactors: [...filters.riskFactors, rf] })
                        } else {
                          setFilters({ ...filters, riskFactors: filters.riskFactors.filter(r => r !== rf) })
                        }
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">{rf.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Communication Preference */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Contact Preference
              </label>
              <div className="space-y-1">
                {['email', 'sms', 'phone'].map(pref => (
                  <label key={pref} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.communicationPref.includes(pref)}
            onChange={(e) => {
                        if (e.target.checked) {
                          setFilters({ ...filters, communicationPref: [...filters.communicationPref, pref] })
                        } else {
                          setFilters({ ...filters, communicationPref: filters.communicationPref.filter(c => c !== pref) })
                        }
                      }}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 capitalize">{pref}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Filter Footer */}
          <div className="p-4 border-t border-gray-200 space-y-2">
            <button
              onClick={resetFilters}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset Filters</span>
            </button>
            <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
              <Save className="w-4 h-4" />
              <span>Save Filter Preset</span>
          </button>
        </div>
      </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {!showFilters && (
                <button
                  onClick={() => setShowFilters(true)}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              )}
              
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Patients
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    {filteredPatients.length.toLocaleString()} {filteredPatients.length === 1 ? 'patient' : 'patients'}
                  </span>
                </h1>
                {activeFilterCount > 0 && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    Filtered from {patients.length.toLocaleString()} total
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setCurrentPage(1)
                  }}
                  placeholder="Search patients..."
                  className="pl-9 pr-4 py-2 w-64 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Bulk Actions */}
              {selectedPatients.size > 0 && (
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                  <span className="text-sm text-blue-700 font-medium">
                    {selectedPatients.size} selected
                  </span>
                  <button className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors" title="Send Message">
                    <Mail className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors" title="Export">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Column Picker */}
              <div className="relative">
                <button
                  onClick={() => setShowColumnPicker(!showColumnPicker)}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Column visibility"
                >
                  <Columns className="w-5 h-5" />
                </button>
                
                {showColumnPicker && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-2">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Show Columns
                    </div>
                    {Object.entries(visibleColumns).map(([key, visible]) => (
                      <label key={key} className="flex items-center space-x-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={visible}
                          onChange={(e) => setVisibleColumns({ ...visibleColumns, [key]: e.target.checked })}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Export */}
              <button className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>

              {/* Add Patient */}
              <Link
                href="/patients/new"
                className="flex items-center space-x-2 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Patient</span>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {/* Checkbox */}
                <th className="w-12 px-4 py-3 border-b border-gray-200">
                  <input
                    type="checkbox"
                    checked={selectedPatients.size === paginatedPatients.length && paginatedPatients.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                </th>

                {/* Name */}
                {visibleColumns.name && (
                  <th 
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Name</span>
                      <SortIcon column="name" />
                    </div>
                  </th>
                )}

                {/* DOB */}
                {visibleColumns.dob && (
                  <th 
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('dob')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>DOB / Age</span>
                      <SortIcon column="dob" />
                    </div>
                  </th>
                )}

                {/* Phone */}
                {visibleColumns.phone && (
                  <th 
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('phone')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Phone</span>
                      <SortIcon column="phone" />
                    </div>
                  </th>
                )}

                {/* Email */}
                {visibleColumns.email && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-200">
                    Email
                  </th>
                )}

                {/* Insurer */}
                {visibleColumns.insurer && (
                  <th 
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('insurer')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Insurance</span>
                      <SortIcon column="insurer" />
                    </div>
                  </th>
                )}

                {/* Last Seen */}
                {visibleColumns.lastSeen && (
                  <th 
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('lastSeen')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Last Visit</span>
                      <SortIcon column="lastSeen" />
                    </div>
                  </th>
                )}

                {/* Status */}
                {visibleColumns.status && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-200">
                    Status
                  </th>
                )}

                {/* Address */}
                {visibleColumns.address && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-200">
                    Address
                  </th>
                )}

                {/* Risk Factors */}
                {visibleColumns.riskFactors && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-200">
                    Risk Factors
                  </th>
                )}

                {/* Preferences */}
                {visibleColumns.preferences && (
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-200">
                    Preferences
                  </th>
                )}

                {/* Actions */}
                <th className="w-12 px-4 py-3 border-b border-gray-200"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {paginatedPatients.map(patient => {
                const age = calculateAge(patient.dob)
                const isActive = patient.lastSeen && new Date(patient.lastSeen) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
                
                return (
                  <tr 
                    key={patient.id} 
                    className={`hover:bg-gray-50 transition-colors ${selectedPatients.has(patient.id) ? 'bg-blue-50' : ''}`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedPatients.has(patient.id)}
                        onChange={() => toggleSelect(patient.id)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                    </td>

                    {/* Name */}
                    {visibleColumns.name && (
                      <td className="px-4 py-3">
            <Link 
              href={`/patients/${patient.id}`}
                          className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {patient.name}
            </Link>
                      </td>
                    )}

                    {/* DOB */}
                    {visibleColumns.dob && (
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div>{patient.dob}</div>
                        {age !== null && (
                          <div className="text-xs text-gray-400">{age} years</div>
                        )}
                      </td>
                    )}

                    {/* Phone */}
                    {visibleColumns.phone && (
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {patient.phone || '—'}
                      </td>
                    )}

                    {/* Email */}
                    {visibleColumns.email && (
                      <td className="px-4 py-3 text-sm text-gray-600">
                        —
                      </td>
                    )}

                    {/* Insurer */}
                    {visibleColumns.insurer && (
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                          {patient.insurer}
                        </span>
                      </td>
                    )}

                    {/* Last Seen */}
                    {visibleColumns.lastSeen && (
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {patient.lastSeen || '—'}
                      </td>
                    )}

                    {/* Status */}
                    {visibleColumns.status && (
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${
                          isActive 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    )}

                    {/* Address */}
                    {visibleColumns.address && (
                      <td className="px-4 py-3 text-sm text-gray-600">
                        —
                      </td>
                    )}

                    {/* Risk Factors */}
                    {visibleColumns.riskFactors && (
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(patient.riskFactors || []).slice(0, 2).map(rf => (
                            <span 
                              key={rf}
                              className="inline-flex items-center px-1.5 py-0.5 text-xs bg-amber-100 text-amber-700 rounded"
                            >
                              {rf.replace('_', ' ')}
                            </span>
                          ))}
                          {(patient.riskFactors || []).length > 2 && (
                            <span className="text-xs text-gray-400">
                              +{patient.riskFactors!.length - 2}
                            </span>
                          )}
                          {(!patient.riskFactors || patient.riskFactors.length === 0) && (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                    )}

                    {/* Preferences */}
                    {visibleColumns.preferences && (
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {patient.preferences?.communication || '—'}
                      </td>
                    )}

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <button className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Empty State */}
          {paginatedPatients.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No patients found</h3>
              <p className="text-sm text-gray-500">
                {searchQuery || activeFilterCount > 0 
                  ? 'Try adjusting your search or filters'
                  : 'Add your first patient to get started'
                }
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredPatients.length > 0 && (
          <div className="bg-white border-t border-gray-200 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredPatients.length)} of {filteredPatients.length}
              </span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setCurrentPage(1)
                }}
                className="text-sm border border-gray-200 rounded px-2 py-1"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-1 text-sm border rounded ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
