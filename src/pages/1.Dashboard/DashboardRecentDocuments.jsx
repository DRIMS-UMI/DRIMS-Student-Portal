import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetStudentDocuments } from '../../store/tanstackStore/services/queries';
import { format, isValid } from 'date-fns';
import { FileText, Loader2, AlertCircle } from 'lucide-react';

const typeLabels = {
  PROPOSAL: 'Proposal',
  DISSERTATION: 'Dissertation',
  CHAPTER: 'Chapter',
  OTHER: 'Other',
  REVIEWED: 'Reviewed',
};

const DashboardRecentDocuments = () => {
  const navigate = useNavigate();
  const { data: response, isLoading, error } = useGetStudentDocuments();
  const documents = response?.documents || [];

  const recentDocs = documents
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
          Recent Documents
        </h3>
        <button
          onClick={() => navigate('/documents')}
          className="text-xs text-blue-600 hover:underline"
        >
          View All
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-32 text-red-500 gap-2">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">Failed to load documents</span>
        </div>
      ) : recentDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-32 text-gray-400">
          <FileText className="w-8 h-8 mb-1" />
          <p className="text-sm">No documents uploaded yet</p>
        </div>
      ) : (
        <div className="space-y-3 overflow-y-auto flex-1 min-h-0">
          {recentDocs.map((doc) => (
            <div
              key={doc.id}
              onClick={() => navigate('/documents')}
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {doc.title}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {typeLabels[doc.type] || doc.type}
                  {doc.supervisor && ` · ${doc.supervisor.name || doc.supervisor.fullName}`}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isValid(new Date(doc.createdAt)) ? format(new Date(doc.createdAt), 'MMM d, yyyy') : '—'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DashboardRecentDocuments;
