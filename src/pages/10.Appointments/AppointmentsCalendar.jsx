import React, { useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { useGetStudentAppointments } from '../../store/tanstackStore/services/queries';
import { format12HourTime } from '../../utils/formatTime';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const dotColor = (status) => {
  switch (status) {
    case 'CONFIRMED':
      return 'bg-blue-600';
    case 'COMPLETED':
      return 'bg-green-500';
    case 'NO_SHOW':
      return 'bg-gray-400';
    case 'CANCELLED':
      return 'bg-red-500';
    default:
      return 'bg-gray-300';
  }
};

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

const AppointmentsCalendar = () => {
  const { data: appointments, isLoading } = useGetStudentAppointments();
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const appointmentsByDay = useMemo(() => {
    const map = {};
    (appointments || []).forEach((apt) => {
      const key = format(new Date(apt.date), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(apt);
    });
    Object.keys(map).forEach((key) => {
      map[key].sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
    });
    return map;
  }, [appointments]);

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    return eachDayOfInterval({
      start: startOfWeek(monthStart, { weekStartsOn: 1 }),
      end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
    });
  }, [currentMonth]);

  const selectedDayAppointments = appointmentsByDay[format(selectedDate, 'yyyy-MM-dd')] || [];

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-[#25369B]" />
          <h2 className="text-lg font-medium text-gray-900">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, -1))}
            className="p-2 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            title="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setCurrentMonth(new Date());
              setSelectedDate(new Date());
            }}
            className="text-sm px-3 py-1.5 bg-[#25369B] text-white hover:bg-[#1d285c] rounded-md font-medium transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="p-2 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            title="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-px bg-gray-100">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="bg-gray-50 py-2 text-center text-xs font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-100">
        {days.map((day) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const dayAppointments = appointmentsByDay[dayKey] || [];
          const inMonth = isSameMonth(day, currentMonth);
          const isSelected = isSameDay(day, selectedDate);
          const isDayToday = isToday(day);

          return (
            <button
              key={dayKey}
              onClick={() => setSelectedDate(day)}
              className={`min-h-[84px] p-1.5 text-left transition-colors ${
                inMonth ? 'bg-white hover:bg-blue-50' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <span
                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                  isSelected
                    ? 'bg-[#25369B] text-white'
                    : isDayToday
                      ? 'text-blue-600'
                      : inMonth
                        ? 'text-gray-700'
                        : 'text-gray-400'
                }`}
              >
                {format(day, 'd')}
              </span>
              {dayAppointments.length > 0 && (
                <div className="flex items-center gap-0.5 mt-1.5 flex-wrap">
                  {dayAppointments.slice(0, 3).map((apt) => (
                    <span
                      key={apt.id}
                      className={`w-1.5 h-1.5 rounded-full ${dotColor(apt.status)}`}
                      title={`${apt.supervisor?.name || 'Supervisor'} - ${apt.status}`}
                    ></span>
                  ))}
                  {dayAppointments.length > 3 && (
                    <span className="text-[10px] text-gray-500 ml-0.5">
                      +{dayAppointments.length - 3}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day details */}
      <div className="p-4 border-t border-gray-100">
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          Appointments — {format(selectedDate, 'EEEE, MMM d, yyyy')}
        </h3>
        {selectedDayAppointments.length > 0 ? (
          <ul className="space-y-2">
            {selectedDayAppointments.map((apt) => (
              <li
                key={apt.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-[#25369B]/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-[#25369B]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {apt.supervisor?.name || 'Supervisor'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {format12HourTime(apt.startTime)} - {format12HourTime(apt.endTime)}
                      {apt.availability?.purpose ? ` · ${apt.availability.purpose}` : ''}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${statusBadge(apt.status)}`}
                >
                  {apt.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center text-sm text-gray-500 py-6">
            No appointments booked for this day.
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentsCalendar;
