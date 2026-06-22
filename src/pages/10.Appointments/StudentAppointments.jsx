import React, { useState } from 'react';
import { useGetStudentAppointments } from '../../store/tanstackStore/services/queries';
import { Calendar, Clock, Plus, User, FileText, CheckCircle, XCircle } from 'lucide-react';
import BookAppointmentModal from './BookAppointmentModal';

const StudentAppointments = () => {
  const { data: appointments, isLoading } = useGetStudentAppointments();
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

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
                  {apt.startTime} - {apt.endTime}
                </div>
                
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
    </div>
  );
};

export default StudentAppointments;
