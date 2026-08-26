import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetStudentGuidelines } from '../../store/tanstackStore/services/queries';
import { format, isValid } from 'date-fns';
import { BookOpen, Loader2, AlertCircle } from 'lucide-react';

const DashboardGuidelines = () => {
  const navigate = useNavigate();
  const { data: response, isLoading, error } = useGetStudentGuidelines();
  const guidelines = response?.guidelines || [];

  const recentGuidelines = guidelines
    .slice(0, 5);

  const unviewedCount = guidelines.filter(g => !g.viewedAt).length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            Guidelines from Supervisor
          </h3>
          {unviewedCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
              {unviewedCount} new
            </span>
          )}
        </div>
        <button
          onClick={() => navigate('/documents')}
          className="px-3 md:px-4 py-1.5 bg-[#25369B] text-white text-sm font-medium rounded-md hover:bg-[#1d285c] transition-colors"
        >
          View All
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-[#25369B]" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-32 text-red-500 gap-2">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">Failed to load guidelines</span>
        </div>
      ) : recentGuidelines.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-gray-400">
          <BookOpen className="w-8 h-8 mb-1" />
          <p className="text-sm">No guidelines shared yet</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto flex-1 min-h-0">
          {recentGuidelines.map((item) => {
            const guideline = item.guideline;
            const isNew = !item.viewedAt;
            return (
              <div
                key={item.id}
                onClick={() => navigate('/documents')}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                  isNew
                    ? 'border-blue-200 bg-blue-50/50 hover:bg-blue-50'
                    : 'border-gray-100 hover:bg-gray-50'
                }`}
              >
                <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                  isNew ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <BookOpen className={`w-4 h-4 ${isNew ? 'text-blue-700' : 'text-gray-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {guideline.title}
                    </p>
                    {isNew && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700">
                        New
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {guideline.supervisor?.name || 'Supervisor'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isValid(new Date(item.sharedAt)) ? format(new Date(item.sharedAt), 'MMM d, yyyy') : '—'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DashboardGuidelines;
