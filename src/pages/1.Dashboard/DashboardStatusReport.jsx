import React from 'react';
import { useGetStudentProfile } from '../../store/tanstackStore/services/queries';
import { Icon } from '@iconify/react';

const DashboardStatusReport = () => {
  const { data: profileData, isLoading: profileLoading, error: profileError } = useGetStudentProfile();

  if (profileLoading) {
    return (
      <div className="">
        <div className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 md:mb-4">Status Report</div>
        <div className="animate-pulse space-y-3">
          <div className="h-20 bg-gray-200 rounded-lg"></div>
          <div className="h-20 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (profileError || !profileData?.student) {
    return (
      <div className="">
        <div className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 md:mb-4">Status Report</div>
        <div className="text-center text-gray-500 py-4">
          Unable to load status information
        </div>
      </div>
    );
  }

  const student = profileData.student;
  
  // Get current and previous status from the statuses array
  const statuses = student?.statuses || [];
  const currentStatus = statuses[0]; // Most recent status
  const previousStatus = statuses[1]; // Second most recent status

  return (
    <div className="">
      <div className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 md:mb-4">Status Report</div>
      
      {/* Current and Previous Status Display */}
      <div className="space-y-3">
        {/* Current Status */}
        <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-1">
            <Icon icon="mdi:account-school" className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-blue-800">Current Status</span>
          </div>
          <div className="text-lg font-bold text-blue-900">
            {currentStatus?.definition?.name || 'No Status Set'}
          </div>
          {currentStatus?.startDate && (
            <div className="text-sm text-blue-600 mt-1">
              Since {new Date(currentStatus.startDate).toLocaleDateString()}
            </div>
          )}
        </div>

        {/* Previous Status */}
        {previousStatus && (
          <div className="p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-1">
              <Icon icon="mdi:history" className="w-5 h-5 text-gray-600" />
              <span className="font-semibold text-gray-700">Previous Status</span>
            </div>
            <div className="text-lg font-bold text-gray-800">
              {previousStatus.definition?.name}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {previousStatus.startDate && previousStatus.endDate 
                ? `${new Date(previousStatus.startDate).toLocaleDateString()} - ${new Date(previousStatus.endDate).toLocaleDateString()}`
                : previousStatus.startDate 
                  ? `Started ${new Date(previousStatus.startDate).toLocaleDateString()}`
                  : 'Dates unavailable'
              }
            </div>
          </div>
        )}

        {/* No Previous Status Message */}
        {!previousStatus && currentStatus && (
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
            <div className="text-sm text-gray-500">
              No previous status available
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardStatusReport;
