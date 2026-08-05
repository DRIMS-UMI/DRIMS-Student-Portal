import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetStudentAppointments } from '../../store/tanstackStore/services/queries';
import { format, startOfToday } from 'date-fns';
import { Calendar, Loader2, AlertCircle } from 'lucide-react';
import { format12HourTime } from '../../utils/formatTime';

const statusBadge = (status) => {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-100 text-green-700';
    case 'NO_SHOW':
      return 'bg-red-100 text-red-700';
    case 'CANCELLED':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-blue-100 text-blue-700';
  }
};

const DashboardUpcomingAppointments = () => {
  const navigate = useNavigate();
  const { data: appointments, isLoading, error } = useGetStudentAppointments();

  const upcoming = useMemo(() => {
    const today = startOfToday();
    return (appointments || [])
      .filter((apt) => apt.status === 'CONFIRMED' && new Date(apt.date) >= today)
      .sort((a, b) => {
        const dateCompare = new Date(a.date) - new Date(b.date);
        if (dateCompare !== 0) return dateCompare;
        return (a.startTime || '').localeCompare(b.startTime || '');
      })
      .slice(0, 4);
  }, [appointments]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Upcoming Appointments
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/appointments?tab=calendar')}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#25369B] text-white rounded-md font-medium hover:bg-[#1d285c] transition-colors"
          >
            <Calendar className="w-3.5 h-3.5" />
            Calendar
          </button>
          <button
            onClick={() => navigate('/appointments')}
            className="px-3 md:px-4 py-1.5 bg-[#25369B] text-white text-sm font-medium rounded-md hover:bg-[#1d285c] transition-colors"
          >
            View More
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-[#25369B]" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-32 text-red-500 gap-2">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">Failed to load appointments</span>
        </div>
      ) : upcoming.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-gray-400">
          <Calendar className="w-8 h-8 mb-1" />
          <p className="text-sm">No upcoming appointments</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto flex-1 min-h-0">
          {upcoming.map((apt) => (
            <div
              key={apt.id}
              onClick={() => navigate('/appointments')}
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-blue-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {apt.supervisor?.name || 'Supervisor'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {format(new Date(apt.date), 'EEE, MMM d')} · {format12HourTime(apt.startTime)} - {format12HourTime(apt.endTime)}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${statusBadge(apt.status)}`}>
                {apt.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardUpcomingAppointments;
