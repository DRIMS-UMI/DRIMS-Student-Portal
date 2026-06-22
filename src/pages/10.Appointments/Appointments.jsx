import React from 'react';
import StudentAppointments from './StudentAppointments';

const Appointments = () => {
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

      <div className="flex-1 p-4 md:p-8">
        <StudentAppointments />
      </div>
    </div>
  );
};

export default Appointments;
