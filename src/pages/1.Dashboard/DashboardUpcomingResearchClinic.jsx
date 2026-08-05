import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetStudentResearchClinicBookings } from '../../store/tanstackStore/services/queries';
import { format, startOfToday } from 'date-fns';
import { BookOpen, Loader2, AlertCircle } from 'lucide-react';

const UPCOMING_STATUSES = ['PENDING', 'CONFIRMED'];

const statusBadge = (status) => {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-700';
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

const DashboardUpcomingResearchClinic = () => {
  const navigate = useNavigate();
  const { data: response, isLoading, error } = useGetStudentResearchClinicBookings();

  const upcoming = useMemo(() => {
    const bookings = response?.bookings || [];
    const today = startOfToday();
    return bookings
      .filter(
        (booking) =>
          UPCOMING_STATUSES.includes(booking.status) &&
          new Date(booking.clinicDay?.date) >= today
      )
      .sort((a, b) => {
        const dateCompare = new Date(a.clinicDay?.date) - new Date(b.clinicDay?.date);
        if (dateCompare !== 0) return dateCompare;
        return (a.clinicDay?.startTime || '').localeCompare(b.clinicDay?.startTime || '');
      })
      .slice(0, 4);
  }, [response]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Upcoming Research Clinic
        </h3>
        <button
          onClick={() => navigate('/research-clinic')}
          className="px-3 md:px-4 py-1.5 bg-[#25369B] text-white text-sm font-medium rounded-md hover:bg-[#1d285c] transition-colors"
        >
          View More
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-[#25369B]" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-32 text-red-500 gap-2">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">Failed to load clinic bookings</span>
        </div>
      ) : upcoming.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-gray-400">
          <BookOpen className="w-8 h-8 mb-1" />
          <p className="text-sm">No upcoming clinic sessions</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto flex-1 min-h-0">
          {upcoming.map((booking) => (
            <div
              key={booking.id}
              onClick={() => navigate('/research-clinic')}
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-purple-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {booking.clinicDay?.date
                    ? format(new Date(booking.clinicDay.date), 'EEE, MMM d, yyyy')
                    : 'Research Clinic'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {booking.clinicDay?.startTime} - {booking.clinicDay?.endTime}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${statusBadge(booking.status)}`}>
                {booking.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardUpcomingResearchClinic;
