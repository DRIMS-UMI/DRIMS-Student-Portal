import React, { useState } from 'react';
import { useGetStudentAppointments, useCancelAppointment } from '../../store/tanstackStore/services/queries';
import { Calendar, Clock, Plus, User, FileText, CheckCircle, XCircle, MapPin, Video, RefreshCw } from 'lucide-react';
import BookAppointmentModal from './BookAppointmentModal';
import RescheduleAppointmentModal from './RescheduleAppointmentModal';
import { format12HourTime } from '../../utils/formatTime';

const StudentAppointments = () => {
  const { data: appointments, isLoading } = useGetStudentAppointments();
  const cancelAppointment = useCancelAppointment();
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [rescheduleAppointmentInfo, setRescheduleAppointmentInfo] = useState(null);

  if (isLoading) {
    return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div></div>;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Your Appointments</h2>
        <button
          onClick={() => setIsBookModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 transition-colors cursor-pointer text-sm font-medium"
        >
          <Plus size={18} /> Book Appointment
        </button>
      </div>

      {appointments && appointments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {appointments.map((apt) => (
            <div key={apt.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                    <User size={16} className="text-gray-500" />
                    {apt.supervisor?.name || 'Supervisor'}
                  </span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  apt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                  apt.status === 'NO_SHOW' ? 'bg-red-100 text-red-700' :
                  apt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {apt.status}
                </span>
              </div>
              
              <div className="p-4 flex-grow flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={16} className="text-blue-500" />
                  {new Date(apt.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock size={16} className="text-blue-500" />
                  {format12HourTime(apt.startTime)} - {format12HourTime(apt.endTime)}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {apt.availability?.meetingType === 'PHYSICAL' ? (
                    <><MapPin size={16} className="text-blue-500" /> <span>{apt.availability?.location || 'Physical'}</span></>
                  ) : (
                    <a href={apt.availability?.meetingLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-md text-xs font-medium transition-colors shadow-sm w-fit">
                      <Video size={14} /> 
                      Join Virtual Meeting
                    </a>
                  )}
                </div>

                {apt.availability?.purpose && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText size={16} className="text-gray-400" />
                    <span className="italic">{apt.availability.purpose}</span>
                  </div>
                )}
                
                {apt.notes && (
                  <div className="mt-2 text-sm bg-gray-50 p-3 rounded-md border border-gray-100">
                    <span className="font-medium text-gray-700 block mb-1">Your Note:</span>
                    <p className="text-gray-600">{apt.notes}</p>
                  </div>
                )}
                
                {apt.feedback && (
                  <div className="mt-2 text-sm bg-blue-50 p-3 rounded-md border border-blue-100">
                    <span className="font-medium text-blue-800 block mb-1">Supervisor Feedback:</span>
                    <p className="text-blue-700">{apt.feedback}</p>
                  </div>
                )}
              </div>

              {apt.status === 'CONFIRMED' && (
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2">
                  <button
                    onClick={() => setRescheduleAppointmentInfo(apt)}
                    className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 hover:text-blue-600 hover:border-blue-300 transition-colors shadow-sm cursor-pointer"
                  >
                    <RefreshCw size={14} /> Reschedule
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to cancel this appointment?')) {
                        cancelAppointment.mutate(apt.id);
                      }
                    }}
                    disabled={cancelAppointment.isPending}
                    className="flex items-center justify-center gap-1.5 px-4 py-1.5 bg-white border border-red-200 text-red-600 text-sm font-medium rounded-md hover:bg-red-50 hover:border-red-300 transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle size={14} /> Cancel
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-12 text-center rounded-lg border border-gray-200">
          <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments yet</h3>
          <p className="text-gray-500 mb-6">You haven't booked any appointments with your supervisor.</p>
          <button
            onClick={() => setIsBookModalOpen(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus size={18} /> Book Your First Appointment
          </button>
        </div>
      )}

      <BookAppointmentModal 
        isOpen={isBookModalOpen} 
        onClose={() => setIsBookModalOpen(false)} 
      />

      <RescheduleAppointmentModal
        isOpen={!!rescheduleAppointmentInfo}
        onClose={() => setRescheduleAppointmentInfo(null)}
        appointment={rescheduleAppointmentInfo}
      />
    </div>
  );
};

export default StudentAppointments;
