'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useData } from '@/store'
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Search,
  Grid3X3,
  Printer,
  X,
  Video,
  Phone,
  Home,
  User,
  FileText
} from 'lucide-react'
import { AppointmentDeliveryType } from '@/store/slices/data'

interface CalendarProps {
  onNewAppointment?: (date?: string, time?: string, practitionerId?: string) => void
}

export default function SembleCalendar({ onNewAppointment }: CalendarProps) {
  const router = useRouter()
  const { appointments, patients, practitioners, updateAppointment, addAppointment } = useData() as any
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [viewMode, setViewMode] = useState<'week' | 'day'>('week')
  const [selectedPractitioner, setSelectedPractitioner] = useState<string>('all')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  // Get the start of current week (Monday)
  const weekStart = useMemo(() => {
    const date = new Date(currentDate)
    const day = date.getDay() || 7
    if (day !== 1) date.setDate(date.getDate() - (day - 1))
    date.setHours(0, 0, 0, 0)
    return date
  }, [currentDate])

  // Generate dates for the view
  const viewDates = useMemo(() => {
    if (viewMode === 'day') {
      return [new Date(currentDate)]
    }
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      dates.push(date)
    }
    return dates
  }, [weekStart, currentDate, viewMode])

  // Get filtered practitioners - for day view only
  const displayPractitioners = useMemo(() => {
    if (selectedPractitioner === 'all') {
      return practitioners.slice(0, 5) // Limit to 5 for day view
    }
    return practitioners.filter((p: any) => p.id === selectedPractitioner)
  }, [practitioners, selectedPractitioner])

  // Filter appointments for current view
  const viewAppointments = useMemo(() => {
    const start = new Date(viewDates[0])
    start.setHours(0, 0, 0, 0)
    const end = new Date(viewDates[viewDates.length - 1])
    end.setHours(23, 59, 59, 999)
    
    let filtered = appointments.filter((apt: any) => {
      const aptDate = new Date(apt.start)
      return aptDate >= start && aptDate <= end
    })
    
    // Filter by practitioner if selected
    if (selectedPractitioner !== 'all') {
      filtered = filtered.filter((apt: any) => apt.practitionerId === selectedPractitioner)
    }
    
    return filtered
  }, [appointments, viewDates, selectedPractitioner])

  // Hours for display (8 AM to 6 PM)
  const displayHours = useMemo(() => {
    const hours = []
    for (let hour = 8; hour <= 18; hour++) {
      hours.push(hour)
    }
    return hours
  }, [])

  // Get appointments for a specific date (week view)
  const getAppointmentsForDate = (date: Date) => {
    return viewAppointments.filter((apt: any) => {
      const aptDate = new Date(apt.start)
      return aptDate.toDateString() === date.toDateString()
    })
  }

  // Get appointments for a specific practitioner and date (day view)
  const getAppointmentsForCell = (practitionerId: string, date: Date) => {
    return viewAppointments.filter((apt: any) => {
      const aptDate = new Date(apt.start)
      return apt.practitionerId === practitionerId && 
             aptDate.toDateString() === date.toDateString()
    })
  }

  // Navigation functions
  const navigate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    const days = viewMode === 'day' ? 1 : 7
    newDate.setDate(newDate.getDate() + (direction === 'next' ? days : -days))
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const jumpWeeks = (weeks: number) => {
    const newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + (weeks * 7))
    setCurrentDate(newDate)
  }

  const jumpMonths = (months: number) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + months)
    setCurrentDate(newDate)
  }

  // Format date for header
  const formatDateHeader = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: '2-digit'
    })
  }

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  // Get patient name
  const getPatientName = (patientId: string) => {
    const patient = patients.find((p: any) => p.id === patientId)
    return patient?.name || 'Unknown'
  }

  // Handle slot click for quick booking
  const handleSlotClick = (date: Date, hour: number, minute: number, practitionerId?: string) => {
    const clickedDate = new Date(date)
    clickedDate.setHours(hour, minute, 0, 0)
    
    if (onNewAppointment) {
      onNewAppointment(
        clickedDate.toISOString().slice(0, 10),
        `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`,
        practitionerId || (selectedPractitioner !== 'all' ? selectedPractitioner : undefined)
      )
    }
  }

  // Get practitioner color
  const getPractitionerColor = (practitionerId: string) => {
    const practitioner = practitioners.find((p: any) => p.id === practitionerId)
    return practitioner?.color || '#6B7280'
  }

  // Get practitioner name (short)
  const getPractitionerShortName = (practitionerId: string) => {
    const practitioner = practitioners.find((p: any) => p.id === practitionerId)
    if (!practitioner) return ''
    const names = practitioner.name.split(' ')
    return names[0]?.charAt(0) + (names[1]?.charAt(0) || '')
  }

  // Get delivery type icon
  const getDeliveryTypeIcon = (deliveryType?: AppointmentDeliveryType) => {
    switch (deliveryType) {
      case 'video':
        return <Video className="w-3 h-3" />
      case 'phone':
        return <Phone className="w-3 h-3" />
      case 'home-visit':
        return <Home className="w-3 h-3" />
      case 'f2f':
      default:
        return <User className="w-3 h-3" />
    }
  }

  // Get delivery type label
  const getDeliveryTypeLabel = (deliveryType?: AppointmentDeliveryType) => {
    switch (deliveryType) {
      case 'video': return 'Video'
      case 'phone': return 'Phone'
      case 'home-visit': return 'Home'
      case 'f2f':
      default: return 'F2F'
    }
  }

  // Open editor
  const openEditor = (appointment?: any) => {
    setEditing(appointment || null)
    setEditorOpen(true)
  }

  const closeEditor = () => {
    setEditorOpen(false)
    setEditing(null)
  }

  const saveAppointment = () => {
    const patientId = (document.getElementById('ed-patient') as HTMLSelectElement).value
    const practitionerId = (document.getElementById('ed-practitioner') as HTMLSelectElement).value
    const date = (document.getElementById('ed-date') as HTMLInputElement).value
    const startTime = (document.getElementById('ed-start') as HTMLInputElement).value
    const duration = parseInt((document.getElementById('ed-duration') as HTMLInputElement).value || '30', 10)
    const status = (document.getElementById('ed-status') as HTMLSelectElement).value as any
    const notes = (document.getElementById('ed-notes') as HTMLTextAreaElement).value
    
    const practitioner = practitioners.find((p: any) => p.id === practitionerId)
    const startDate = new Date(`${date}T${startTime}:00`)
    const endDate = new Date(startDate.getTime() + duration * 60000)
    
    const data = {
      patientId,
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      practitionerId,
      practitionerName: practitioner?.name,
      status,
      notes
    }
    
    if (editing) {
      updateAppointment(editing.id, data)
    } else {
      addAppointment({ id: `apt-${Date.now()}`, ...data })
    }
    closeEditor()
  }

  const today = new Date()

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Clean Header - Dentally Style */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 bg-white flex-shrink-0">
        {/* Left: Navigation */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => navigate('prev')}
              className="p-2 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            
            <span className="px-3 py-1.5 text-sm font-medium text-gray-900 min-w-[120px] text-center border-x border-gray-200">
              {viewMode === 'week' 
                ? `${viewDates[0].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${viewDates[6].toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
                : viewDates[0].toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
              }
            </span>
            
            <button
              onClick={() => navigate('next')}
              className="p-2 hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Quick Jump Buttons */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => jumpWeeks(-1)}
              className="px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              -1W
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => jumpWeeks(1)}
              className="px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              +1W
            </button>
            <button
              onClick={() => jumpMonths(3)}
              className="px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              +3M
            </button>
            <button
              onClick={() => jumpMonths(6)}
              className="px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              +6M
            </button>
          </div>
        </div>

        {/* Right: View Controls & Actions */}
        <div className="flex items-center space-x-3">
          {/* Practitioner Filter */}
          <select
            value={selectedPractitioner}
            onChange={(e) => setSelectedPractitioner(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Practitioners</option>
            {practitioners.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === 'day' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                viewMode === 'week' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Week
            </button>
          </div>

          {/* Icon Buttons */}
          <div className="flex items-center space-x-0.5">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Search">
              <Search className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Grid View">
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Print">
              <Printer className="w-4 h-4" />
            </button>
          </div>

          {/* New Appointment Button */}
          <button
            onClick={() => onNewAppointment?.()}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New</span>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {viewMode === 'week' ? (
          /* WEEK VIEW - Days as columns, no practitioner sub-columns */
          <div className="h-full">
            {/* Date Headers */}
            <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
              <div className="flex">
                {/* Time column spacer */}
                <div className="w-14 flex-shrink-0 border-r border-gray-200" />
                
                {/* Date columns */}
                {viewDates.map((date) => {
                  const isToday = date.toDateString() === today.toDateString()
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6
                  
                  return (
                    <div 
                      key={date.toISOString()} 
                      className={`flex-1 border-r border-gray-200 last:border-r-0 ${isWeekend ? 'bg-gray-50' : ''}`}
                    >
                      <div className={`px-2 py-3 text-center ${
                        isToday ? 'bg-blue-50' : isWeekend ? 'bg-gray-100' : 'bg-gray-50'
                      }`}>
                        <div className={`text-xs font-medium ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                          {date.toLocaleDateString('en-GB', { weekday: 'short' })}
                        </div>
                        <div className={`text-lg font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                          {date.getDate()}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Time Grid */}
            <div className="flex">
              {/* Time Labels */}
              <div className="w-14 flex-shrink-0 border-r border-gray-200 bg-white">
                {displayHours.map((hour) => (
                  <div key={hour} className="h-[90px] flex items-start justify-end pr-2">
                    <span className="text-sm text-gray-400 -mt-2">{hour}:00</span>
                  </div>
                ))}
              </div>

              {/* Day Columns */}
              {viewDates.map((date) => {
                const isToday = date.toDateString() === today.toDateString()
                const isWeekend = date.getDay() === 0 || date.getDay() === 6
                const dayAppointments = getAppointmentsForDate(date)
                
                return (
                  <div 
                    key={date.toISOString()} 
                    className={`flex-1 relative border-r border-gray-200 last:border-r-0 ${
                      isWeekend ? 'bg-gray-50/30' : 'bg-white'
                    }`}
                    style={{ height: `${displayHours.length * 90}px` }}
                  >
                    {/* Hour Lines */}
                    {displayHours.map((hour, idx) => (
                      <div 
                        key={`line-${hour}`}
                        className="absolute w-full border-t border-gray-100 cursor-pointer hover:bg-blue-50/30 transition-colors"
                        style={{ top: `${idx * 90}px`, height: '90px' }}
                        onClick={() => handleSlotClick(date, hour, 0)}
                      >
                        <div className="absolute w-full border-t border-dashed border-gray-50" style={{ top: '45px' }} />
                      </div>
                    ))}

                    {/* Now Indicator */}
                    {isToday && (() => {
                      const now = new Date()
                      const hour = now.getHours()
                      const minute = now.getMinutes()
                      if (hour >= 8 && hour <= 18) {
                        const top = ((hour - 8) * 60 + minute) * (90 / 60)
                        return (
                          <div 
                            className="absolute left-0 right-0 border-t-2 border-red-500 z-30 pointer-events-none"
                            style={{ top: `${top}px` }}
                          >
                            <div className="absolute -left-1 -top-1.5 w-3 h-3 bg-red-500 rounded-full" />
                          </div>
                        )
                      }
                      return null
                    })()}

                    {/* Appointments */}
                    {dayAppointments.map((appointment: any) => {
                      const start = new Date(appointment.start)
                      const end = new Date(appointment.end)
                      const startHour = start.getHours()
                      const startMinute = start.getMinutes()
                      const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60)
                      
                      // 90px per hour, minimum 40px height for readability
                      const top = ((startHour - 8) * 60 + startMinute) * (90 / 60)
                      const height = Math.max(40, durationMinutes * (90 / 60))
                      const color = getPractitionerColor(appointment.practitionerId)
                      
                      return (
                        <div
                          key={appointment.id}
                          className="absolute left-1 right-1 rounded-sm border text-xs overflow-hidden cursor-pointer hover:shadow-md transition-all z-10"
                          style={{ 
                            top: `${top}px`, 
                            height: `${height}px`, 
                            borderColor: color,
                            borderLeftWidth: '3px',
                            backgroundColor: `${color}15`
                          }}
                          onClick={() => openEditor(appointment)}
                        >
                          <div className="px-2 py-1.5 h-full flex flex-col justify-center">
                            <div className="flex items-center gap-1.5 font-medium truncate text-xs leading-tight text-gray-900">
                              <span className="truncate">{getPatientName(appointment.patientId)}</span>
                              {appointment.deliveryType && (
                                <span 
                                  className="flex-shrink-0 text-gray-500" 
                                  title={getDeliveryTypeLabel(appointment.deliveryType)}
                                >
                                  {getDeliveryTypeIcon(appointment.deliveryType)}
                                </span>
                              )}
                            </div>
                            {height >= 50 && (
                              <div className="text-[11px] text-gray-500 truncate mt-0.5">
                                {start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}-{end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* DAY VIEW - Practitioners as columns */
          <div className="h-full">
            {/* Practitioner Headers */}
            <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
              <div className="flex">
                {/* Time column spacer */}
                <div className="w-14 flex-shrink-0 border-r border-gray-200">
                  <div className="px-2 py-3 text-center bg-gray-50">
                    <div className="text-xs font-medium text-gray-500">
                      {viewDates[0].toLocaleDateString('en-GB', { weekday: 'short' })}
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {viewDates[0].getDate()}
                    </div>
                  </div>
                </div>
                
                {/* Practitioner columns */}
                {displayPractitioners.map((practitioner: any) => (
                  <div 
                    key={practitioner.id} 
                    className="flex-1 border-r border-gray-200 last:border-r-0"
                  >
                    <div className="px-2 py-2 text-center bg-gray-50">
                      <div 
                        className="w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center text-white text-xs font-medium"
                        style={{ backgroundColor: practitioner.color || '#6B7280' }}
                      >
                        {practitioner.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="text-xs font-medium text-gray-900 truncate">
                        {practitioner.name.split(' ')[0]}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate">
                        {practitioner.specialty || 'GP'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Grid */}
            <div className="flex">
              {/* Time Labels */}
              <div className="w-14 flex-shrink-0 border-r border-gray-200 bg-white">
                {displayHours.map((hour) => (
                  <div key={hour} className="h-[90px] flex items-start justify-end pr-2">
                    <span className="text-sm text-gray-400 -mt-2">{hour}:00</span>
                  </div>
                ))}
              </div>

              {/* Practitioner Columns */}
              {displayPractitioners.map((practitioner: any) => {
                const cellAppointments = getAppointmentsForCell(practitioner.id, viewDates[0])
                const isToday = viewDates[0].toDateString() === today.toDateString()
                
                return (
                  <div 
                    key={practitioner.id}
                    className="flex-1 relative border-r border-gray-200 last:border-r-0 bg-white"
                    style={{ height: `${displayHours.length * 90}px` }}
                  >
                    {/* Hour Lines */}
                    {displayHours.map((hour, idx) => (
                      <div 
                        key={`line-${hour}`}
                        className="absolute w-full border-t border-gray-100 cursor-pointer hover:bg-blue-50/30 transition-colors"
                        style={{ top: `${idx * 90}px`, height: '90px' }}
                        onClick={() => handleSlotClick(viewDates[0], hour, 0, practitioner.id)}
                      >
                        <div className="absolute w-full border-t border-dashed border-gray-50" style={{ top: '45px' }} />
                      </div>
                    ))}

                    {/* Now Indicator */}
                    {isToday && (() => {
                      const now = new Date()
                      const hour = now.getHours()
                      const minute = now.getMinutes()
                      if (hour >= 8 && hour <= 18) {
                        const top = ((hour - 8) * 60 + minute) * (90 / 60)
                        return (
                          <div 
                            className="absolute left-0 right-0 border-t-2 border-red-500 z-30 pointer-events-none"
                            style={{ top: `${top}px` }}
                          />
                        )
                      }
                      return null
                    })()}

                    {/* Appointments */}
                    {cellAppointments.map((appointment: any) => {
                      const start = new Date(appointment.start)
                      const end = new Date(appointment.end)
                      const startHour = start.getHours()
                      const startMinute = start.getMinutes()
                      const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60)
                      
                      // 90px per hour, minimum 40px height for readability
                      const top = ((startHour - 8) * 60 + startMinute) * (90 / 60)
                      const height = Math.max(40, durationMinutes * (90 / 60))
                      const color = practitioner.color || '#3B82F6'
                      
                      return (
                        <div
                          key={appointment.id}
                          className="absolute left-1 right-1 rounded-sm border text-xs overflow-hidden cursor-pointer hover:shadow-md transition-all z-10"
                          style={{ 
                            top: `${top}px`, 
                            height: `${height}px`, 
                            borderColor: color,
                            borderLeftWidth: '3px',
                            backgroundColor: `${color}15`
                          }}
                          onClick={() => openEditor(appointment)}
                        >
                          <div className="px-2 py-1.5 h-full flex flex-col justify-center">
                            <div className="flex items-center gap-1.5 font-medium truncate text-xs text-gray-900">
                              <span className="truncate">{getPatientName(appointment.patientId)}</span>
                              {appointment.deliveryType && (
                                <span 
                                  className="flex-shrink-0 text-gray-500" 
                                  title={getDeliveryTypeLabel(appointment.deliveryType)}
                                >
                                  {getDeliveryTypeIcon(appointment.deliveryType)}
                                </span>
                              )}
                            </div>
                            {height >= 50 && (
                              <div className="text-[11px] text-gray-500 mt-0.5">
                                {start.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}-{end.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })}
                              </div>
                            )}
                            {height > 65 && appointment.appointmentType && (
                              <div className="text-[11px] text-gray-400 truncate mt-auto">
                                {appointment.appointmentType}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editorOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={closeEditor}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editing ? 'Edit Appointment' : 'New Appointment'}
              </h3>
              <button onClick={closeEditor} className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
                <select 
                  id="ed-patient" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue={editing?.patientId}
                >
                  {patients.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Practitioner</label>
                <select 
                  id="ed-practitioner" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue={editing?.practitionerId}
                >
                  {practitioners.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input 
                    id="ed-date" 
                    type="date" 
                    defaultValue={(editing ? new Date(editing.start) : viewDates[0]).toISOString().slice(0, 10)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <input 
                    id="ed-start" 
                    type="time" 
                    defaultValue={editing ? new Date(editing.start).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : '09:00'}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (mins)</label>
                  <input 
                    id="ed-duration" 
                    type="number" 
                    defaultValue={editing ? Math.round((new Date(editing.end).getTime() - new Date(editing.start).getTime()) / 60000) : 30}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select 
                    id="ed-status" 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    defaultValue={editing?.status || 'scheduled'}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="arrived">Arrived</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea 
                  id="ed-notes" 
                  rows={2}
                  defaultValue={editing?.notes || ''}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Optional notes..."
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              {/* Left side - Invoice button for existing appointments */}
              <div>
                {editing && (
                  <button 
                    onClick={() => {
                      const patientId = (document.getElementById('ed-patient') as HTMLSelectElement)?.value || editing.patientId
                      router.push(`/billing?appointmentId=${editing.id}&patientId=${patientId}`)
                      closeEditor()
                    }}
                    className="flex items-center px-3 py-2 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors"
                  >
                    <FileText className="w-4 h-4 mr-1.5" />
                    Invoice
                  </button>
                )}
              </div>
              
              {/* Right side - Cancel and Save */}
              <div className="flex items-center space-x-3">
                <button 
                  onClick={closeEditor}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveAppointment}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editing ? 'Save Changes' : 'Create Appointment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
