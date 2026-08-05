import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck2, Stethoscope, FilePlus2, UploadCloud } from 'lucide-react';

const actions = [
  { label: 'Book Appointment', icon: CalendarCheck2, path: '/appointments' },
  { label: 'Book Clinic Session', icon: Stethoscope, path: '/research-clinic' },
  { label: 'Make a Request', icon: FilePlus2, path: '/requests/submit' },
  { label: 'Upload Document', icon: UploadCloud, path: '/documents' },
];

const DashboardQuickActions = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 md:p-5">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Quick Actions</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-[#25369B] text-white text-sm font-medium rounded-lg hover:bg-[#1d285c] transition-colors"
            >
              <Icon className="w-4 h-4" />
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DashboardQuickActions;
