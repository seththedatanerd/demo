'use client'
import { useState } from 'react'
import SembleCalendar from '@/components/SembleCalendar'
import AppointmentBooking from '@/components/AppointmentBooking'
import { useData } from '@/store'
import { EnhancedAppointment } from '@/types/appointments'

export default function Calendar() {
  const [bookingOpen, setBookingOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>()
  const [selectedTime, setSelectedTime] = useState<string>()
  const [selectedPractitioner, setSelectedPractitioner] = useState<string>()
  const { addAppointment } = useData()

  const handleNewAppointment = (date?: string, time?: string, practitionerId?: string) => {
    setSelectedDate(date)
    setSelectedTime(time)
    setSelectedPractitioner(practitionerId)
    setBookingOpen(true)
  }

  const handleAppointmentBooked = (appointment: EnhancedAppointment) => {
    // Convert enhanced appointment back to basic format for storage
    addAppointment({
      id: appointment.id,
      patientId: appointment.patientId,
      start: appointment.start,
      end: appointment.end,
      clinician: appointment.practitionerName,
      room: appointment.roomName,
      practitionerId: appointment.practitionerId,
      practitionerName: appointment.practitionerName,
      roomId: appointment.roomId,
      roomName: appointment.roomName,
      siteId: appointment.siteId,
      siteName: appointment.siteName,
      appointmentType: appointment.appointmentType,
      status: appointment.status,
      notes: appointment.notes
    })
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-hidden">
        <SembleCalendar onNewAppointment={handleNewAppointment} />
      </div>

      {/* Advanced Appointment Booking Modal */}
      <AppointmentBooking
        isOpen={bookingOpen}
        onClose={() => {
          setBookingOpen(false)
          setSelectedDate(undefined)
          setSelectedTime(undefined)
          setSelectedPractitioner(undefined)
        }}
        preselectedDate={selectedDate}
        preselectedTime={selectedTime}
        preselectedPractitionerId={selectedPractitioner}
        onAppointmentBooked={handleAppointmentBooked}
      />
    </div>
  )
}
