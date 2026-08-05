import React from 'react';
import { useSearchParams } from 'react-router-dom';
import StudentAppointments from './StudentAppointments';
import AppointmentsCalendar from './AppointmentsCalendar';

const TABS = [
  { id: 'upcoming', label: 'Upcoming Appointments' },
  { id: 'calendar', label: 'Calendar' },
];

const Appointments = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = TABS.some((t) => t.id === searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'upcoming';

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20 md:pb-0">
      {/* Top Banner section */}
      <div className="relative h-48 md:h-[220px] w-full overflow-hidden shrink-0">
        <div className="absolute inset-0 bg-[#23388F]"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#23388F] to-[#1a2b6d] opacity-90"></div>
        <div className="relative h-full flex flex-col justify-end px-4 md:px-8 pb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Supervisor Appointments</h1>
          <p className="text-blue-100 text-sm md:text-base max-w-2xl">
            Book an appointment with your supervisor and manage your upcoming meetings.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-4 md:px-8">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`py-3 px-4 font-medium text-sm border-b-2 ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => handleTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 p-4 md:p-8">
        {activeTab === 'calendar' ? <AppointmentsCalendar /> : <StudentAppointments />}
      </div>
    </div>
  );
};

export default Appointments;
