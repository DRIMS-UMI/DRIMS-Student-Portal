import React from 'react';
import { Icon } from '@iconify/react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useGetStudentResearchRequests } from '../../store/tanstackStore/services/queries';

const statusColors = {
  PENDING: 'text-yellow-700 bg-yellow-100',
  BEING_PROCESSED: 'text-blue-700 bg-blue-100',
  IN_REVIEW: 'text-purple-700 bg-purple-100',
  CONCLUDED: 'text-green-700 bg-green-100',
};

const DashboardRecentResearchRequests = () => {
  const navigate = useNavigate();
  const { data, isLoading, error } = useGetStudentResearchRequests();
  
  const requests = data?.requests || [];
  // Get the most recent 5 requests
  const recentRequests = requests.slice(0, 5);

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Recent Research Requests</span>
        </div>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-[#25369B]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Recent Research Requests</span>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="text-red-500">Failed to load requests</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2 md:mb-3">
        <span className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Recent Research Requests</span>
        <button
          className="px-3 md:px-4 py-1.5 bg-[#25369B] text-white text-sm font-medium rounded-md hover:bg-[#1d285c] transition-colors"
          onClick={() => navigate('/requests')}
        >
          View All
        </button>
      </div>
      
      {recentRequests.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-center">
          <Icon icon="mdi:file-document-outline" className="w-12 h-12 text-gray-300 mb-2" />
          <div className="text-gray-500 mb-2">No research requests yet</div>
          <button 
            className="px-4 py-2 bg-[#25369B] text-white text-sm font-medium rounded-lg hover:bg-[#1d285c]"
            onClick={() => navigate('/requests/submit')}
          >
            Make a Request
          </button>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {recentRequests.map((request) => (
            <div key={request.id} className="flex items-start justify-between py-2 md:py-3">
              <div className="flex-1">
                <div className="font-semibold text-gray-900 text-base md:text-lg leading-tight">
                  {request.requestType}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusColors[request.status] || 'text-gray-700 bg-gray-100'}`}>
                    {request.status.replace('_', ' ')}
                  </span>
                  {request.decision && (
                    <span className="text-xs text-gray-500">
                      • {request.decision}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs md:text-sm text-gray-400 ml-2 whitespace-nowrap">
                {format(new Date(request.submittedAt), 'MMM d')}
              </span>
            </div>
          ))}
          
          {requests.length > 5 && (
            <div className="pt-3">
              <button 
                className="w-full py-2 bg-[#25369B] text-white text-sm font-medium rounded-md hover:bg-[#1d285c] transition-colors"
                onClick={() => navigate('/requests')}
              >
                View {requests.length - 5} more requests
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardRecentResearchRequests; 