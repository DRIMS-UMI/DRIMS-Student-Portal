import React, { useState, useEffect } from 'react';
import { useGetAvailableAppointments, useRescheduleAppointment } from '../../store/tanstackStore/services/queries';
import { X, Calendar, Clock, Users, ArrowRight, MapPin, Video, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { format12HourTime } from '../../utils/formatTime';

const RescheduleAppointmentModal = ({ isOpen, onClose, appointment }) => {
  const { data: availabilities, isLoading } = useGetAvailableAppointments();
  const rescheduleAppointment = useRescheduleAppointment();
  
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [notes, setNotes] = useState('');

  // Pre-fill notes and clear selection when modal opens
  useEffect(() => {
    if (isOpen && appointment) {
      setNotes(appointment.notes || '');
      setSelectedSlot(null);
    }
  }, [isOpen, appointment]);

  if (!isOpen || !appointment) return null;

  // Filter out the current appointment slot and only show slots for the same supervisor
  const validAvailabilities = availabilities?.filter(slot => 
    slot.supervisor?.id === appointment.supervisor?.id && 
    slot.id !== appointment.availability?.id
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedSlot) return;

    rescheduleAppointment.mutate({
      appointmentId: appointment.id,
      newAvailabilityId: selectedSlot,
      notes
    }, {
      onSuccess: () => {
        setSelectedSlot(null);
        toast.success("Appointment rescheduled successfully!");
        onClose();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to reschedule appointment");
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Reschedule Appointment</h2>
            <p className="text-sm text-gray-500 mt-1">Select a new time slot with {appointment.supervisor?.name || 'your supervisor'}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div></div>
          ) : validAvailabilities && validAvailabilities.length > 0 ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Available Slots</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {validAvailabilities.map((slot) => {
                    const isSelected = selectedSlot === slot.id;
                    const isFull = slot.currentBookings >= slot.maxStudents;
                    
                    return (
                      <div 
                        key={slot.id}
                        onClick={() => !isFull && setSelectedSlot(slot.id)}
                        className={`
                          border rounded-lg p-4 cursor-pointer transition-all duration-200
                          ${isFull ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed' : 
                            isSelected ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'}
                        `}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex flex-col gap-2">
                            <span className="font-medium text-gray-900 flex items-center gap-2 text-sm">
                              <Calendar size={16} className={isSelected ? "text-blue-600" : "text-gray-500"} />
                              {new Date(slot.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                            <span className="text-gray-600 flex items-center gap-2 text-sm">
                              <Clock size={16} className={isSelected ? "text-blue-600" : "text-gray-500"} />
                              {format12HourTime(slot.startTime)} - {format12HourTime(slot.endTime)}
                            </span>
                            
                            {slot.supervisor && (
                              <span className="text-gray-700 flex items-center gap-2 text-sm font-medium mt-1">
                                <Users size={16} className={isSelected ? "text-blue-600" : "text-gray-500"} />
                                {slot.supervisor.title ? `${slot.supervisor.title} ` : ''}{slot.supervisor.name}
                              </span>
                            )}
                            
                            <span className="text-gray-600 flex items-center gap-2 text-sm mt-1">
                              {slot.meetingType === 'PHYSICAL' ? (
                                <><MapPin size={16} className={isSelected ? "text-blue-600" : "text-gray-500"} /> <span>{slot.location || 'Physical'}</span></>
                              ) : (
                                <><Video size={16} className={isSelected ? "text-blue-600" : "text-gray-500"} /> <span>Virtual Meeting</span></>
                              )}
                            </span>

                            {slot.purpose && (
                              <span className="text-gray-500 flex items-start gap-2 text-xs italic mt-1 bg-white/50 p-1.5 rounded border border-gray-100">
                                <FileText size={14} className="mt-0.5 flex-shrink-0" />
                                <span>{slot.purpose}</span>
                              </span>
                            )}

                            <span className={`text-xs flex items-center gap-1 mt-1 font-medium ${isFull ? 'text-red-600' : 'text-green-600'}`}>
                              <Users size={14} />
                              {slot.currentBookings} / {slot.maxStudents} Booked
                              {isFull && " (Full)"}
                            </span>
                          </div>
                          
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center
                            ${isFull ? 'border-gray-300' : isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}
                          `}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedSlot && (
                <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <label className="block text-sm font-medium text-gray-700">Notes for Supervisor (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="E.g., I'd like to discuss the methodology chapter..."
                    className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] text-sm"
                  ></textarea>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedSlot || rescheduleAppointment.isPending}
                  className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  {rescheduleAppointment.isPending ? 'Rescheduling...' : (
                    <>Confirm Reschedule <ArrowRight size={16} /></>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
              <p>No availability slots found.</p>
              <p className="text-sm mt-1">Your supervisor hasn't set up any other open appointment times yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RescheduleAppointmentModal;
