import React from 'react';
import { Info } from 'lucide-react';
import { useGetStudentDashboardStats } from '../../store/tanstackStore/services/queries';

const statCards = [
  { label: 'Pending Proposals', valueKey: 'pendingProposals', info: 'Proposals without a passed defense verdict' },
  { label: 'Completed Proposals', valueKey: 'completedProposals', info: 'Proposals with a passed defense verdict' },
  { label: 'Pending Books', valueKey: 'pendingBooks', info: 'Books without a completed viva' },
  { label: 'Assigned Supervisors', valueKey: 'supervisors', info: 'Number of assigned supervisors' },
];

const InfoTooltip = ({ text }) => (
  <span className="relative group cursor-pointer">
    <Info className="w-4 h-4 text-gray-400" />
    <span className="absolute left-1/2 -translate-x-1/2 mt-2 z-10 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg">
      {text}
    </span>
  </span>
);

const DashboardStats = () => {
  const { data, isLoading } = useGetStudentDashboardStats();
  const stats = data?.stats || {};

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((card) => (
        <div key={card.label} className="bg-white p-6 rounded-lg shadow-md text-left hover:shadow-lg transition-shadow duration-300">
          <h2 className="text-3xl font-semibold text-gray-900">
            {isLoading ? <span className="text-gray-300">-</span> : parseInt(stats[card.valueKey]) || 0}
          </h2>
          <div className="text-sm font-medium text-gray-500 flex items-center gap-1 mt-1">
            {card.label}
            {card.info && <InfoTooltip text={card.info} />}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;
