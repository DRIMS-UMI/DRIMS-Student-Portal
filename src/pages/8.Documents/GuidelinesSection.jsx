import React, { useState } from 'react';
import { useGetStudentGuidelines, useMarkGuidelineViewed, useDownloadStudentGuideline } from '../../store/tanstackStore/services/queries';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { BookOpen, Download, Eye, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

const GuidelinesSection = () => {
  const [expandedId, setExpandedId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const { data: response, isLoading } = useGetStudentGuidelines();
  const markViewedMutation = useMarkGuidelineViewed();
  const downloadMutation = useDownloadStudentGuideline();

  const guidelines = response?.guidelines || [];

  const handleDownload = (item) => {
    const guideline = item.guideline;
    setDownloadingId(item.id);
    downloadMutation.mutate(guideline.id, {
      onSuccess: (response) => {
        const data = response.data;
        const blob = new Blob([data], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = guideline.fileName || guideline.title || 'document';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setDownloadingId(null);
        toast.success('Guideline downloaded successfully!');

        // Mark as viewed after download
        if (!item.viewedAt) {
          markViewedMutation.mutate(guideline.id);
        }
      },
      onError: (error) => {
        setDownloadingId(null);
        toast.error(error.message || 'Failed to download guideline');
      }
    });
  };

  const toggleExpand = (itemId) => {
    setExpandedId(expandedId === itemId ? null : itemId);

    // Mark as viewed when expanding
    const item = guidelines.find(g => g.id === itemId);
    if (item && !item.viewedAt) {
      markViewedMutation.mutate(item.guideline.id);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-4 md:p-5 mb-6">
        <div className="flex items-center justify-center h-16">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#25369B]"></div>
        </div>
      </div>
    );
  }

  if (guidelines.length === 0) {
    return null;
  }

  const unviewedCount = guidelines.filter(g => !g.viewedAt).length;

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 md:p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-[#25369B]" />
        <h2 className="text-lg font-semibold text-gray-900">Guidelines from Supervisor</h2>
        {unviewedCount > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
            {unviewedCount} new
          </span>
        )}
      </div>

      <div className="space-y-2">
        {guidelines.map((item) => {
          const guideline = item.guideline;
          const isNew = !item.viewedAt;
          const isExpanded = expandedId === item.id;

          return (
            <div
              key={item.id}
              className={`border rounded-lg transition-colors ${
                isNew ? 'border-blue-200 bg-blue-50/30' : 'border-gray-200'
              }`}
            >
              <div
                onClick={() => toggleExpand(item.id)}
                className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
                    isNew ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <BookOpen className={`w-4 h-4 ${isNew ? 'text-blue-700' : 'text-gray-500'}`} />
                  </div>
                  <div className="min-w-0">
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
                    <p className="text-xs text-gray-500">
                      {guideline.supervisor?.name || 'Supervisor'} · {format(new Date(item.sharedAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(item);
                    }}
                    disabled={downloadingId === item.id}
                    className="px-3 py-1.5 text-xs font-medium text-[#25369B] bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {downloadingId === item.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Download className="w-3 h-3" />
                    )}
                    {downloadingId === item.id ? 'Downloading...' : 'Download'}
                  </button>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="px-3 pb-3 border-t border-gray-100 pt-3">
                  {guideline.description && (
                    <p className="text-sm text-gray-600 mb-2">{guideline.description}</p>
                  )}
                  {guideline.comments && (
                    <div className="bg-gray-50 rounded-lg p-3 mt-2">
                      <p className="text-xs font-medium text-gray-700 mb-1">Supervisor's Notes:</p>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">{guideline.comments}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span>File: {guideline.fileName}</span>
                    <span>{(guideline.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                    {item.viewedAt && (
                      <span className="flex items-center gap-1 text-green-600">
                        <Eye className="w-3 h-3" />
                        Viewed {format(new Date(item.viewedAt), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GuidelinesSection;
