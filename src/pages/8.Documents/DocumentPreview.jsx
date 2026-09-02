import React, { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { downloadDocumentService } from '../../store/tanstackStore/services/api';
import { useMutation } from '@tanstack/react-query';

const DocumentPreview = ({ document: documentRecord, allDocuments = [], onClose }) => {
  const [downloadingId, setDownloadingId] = useState(null);

  const downloadMutation = useMutation({
    mutationFn: downloadDocumentService,
    onSuccess: (response, variables) => {
      const filename = variables.filename || documentRecord.fileName || documentRecord.title || 'document';
      const data = response.data;
      const blob = new Blob([data], { type: 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Document downloaded successfully!');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to download document');
    }
  });

  const handleDownload = (docId, filename) => {
    const id = docId || documentRecord.id;
    const name = filename || documentRecord.fileName || documentRecord.title || 'document';
    setDownloadingId(id);
    downloadMutation.mutate({
      documentId: id,
      filename: name
    }, {
      onSettled: () => setDownloadingId(null)
    });
  };

  const relatedReviews = allDocuments?.filter(d =>
    d.type === 'REVIEWED' && d.title === `Reviewed: ${documentRecord?.title}`
  ) || [];

  const getDocumentTypeColor = (type) => {
    switch (type) {
      case 'PROPOSAL':
        return 'bg-blue-100 text-blue-800';
      case 'DISSERTATION':
        return 'bg-green-100 text-green-800';
      case 'CHAPTER':
        return 'bg-purple-100 text-purple-800';
      case 'REVIEWED':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDocumentTypeLabel = (type) => {
    switch (type) {
      case 'PROPOSAL':
        return 'Proposal';
      case 'DISSERTATION':
        return 'Dissertation';
      case 'CHAPTER':
        return 'Chapter';
      case 'REVIEWED':
        return 'Reviewed';
      default:
        return type;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 lg:p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Document Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md cursor-pointer"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 lg:p-6 space-y-6">
          {/* Document Info Panel */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Document Information</h3>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Type:</span>{' '}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDocumentTypeColor(documentRecord.type)}`}>
                  {getDocumentTypeLabel(documentRecord.type)}
                </span>
                {documentRecord.isReviewed && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 ml-1">
                    Reviewed
                  </span>
                )}
              </div>
              {documentRecord.description && (
                <div>
                  <span className="font-medium">Description:</span> {documentRecord.description}
                </div>
              )}
              <div>
                <span className="font-medium">Upload Date:</span>{' '}
                {format(new Date(documentRecord.uploadedAt), 'MMM dd, yyyy h:mm a')}
              </div>
              {documentRecord.uploadedBy && (
                <div>
                  <span className="font-medium">Uploaded By:</span> {documentRecord.uploadedBy.name}
                </div>
              )}
              {documentRecord.fileSize && (
                <div>
                  <span className="font-medium">File Size:</span> {(documentRecord.fileSize / 1024 / 1024).toFixed(2)} MB
                </div>
              )}
              {documentRecord.fileType && (
                <div>
                  <span className="font-medium">File Type:</span> {documentRecord.fileType}
                </div>
              )}
            </div>
          </div>

          {/* Review Status */}
          {documentRecord.reviewedAt && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="font-medium text-green-900">Review Status</h3>
              </div>
              <p className="text-sm text-green-800 mb-2">
                This document was reviewed on {format(new Date(documentRecord.reviewedAt), 'MMM dd, yyyy')}
              </p>

              {/* Original Submitted File */}
              <div className="mt-4 pt-4 border-t border-green-200">
                <h4 className="text-sm font-medium text-green-900 mb-2">
                    {documentRecord.type === 'REVIEWED' ? 'Reviewed File:' : 'Original Submitted File:'}
                </h4>
                <div className="flex flex-col gap-3 bg-white p-3 rounded border border-green-100">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <svg className="w-8 h-8 text-gray-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                      </svg>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-[200px] lg:max-w-xs" title={documentRecord.fileName || documentRecord.title}>
                          {documentRecord.fileName || documentRecord.title}
                        </p>
                        {documentRecord.fileSize && (
                          <p className="text-xs text-gray-500">{(documentRecord.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                        )}
                      </div>
                    </div>
                    {documentRecord.fileName ? (
                      <button
                        onClick={() => handleDownload()}
                        disabled={downloadingId === documentRecord.id}
                        className="px-3 py-1.5 lg:px-4 lg:py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2 cursor-pointer self-start lg:self-auto"
                      >
                        {downloadingId === documentRecord.id ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="hidden lg:inline">Downloading...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="hidden lg:inline">Download</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 self-start lg:self-auto text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        Comments Only
                      </span>
                    )}
                  </div>
                  {documentRecord.description && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border border-gray-100">
                      <span className="font-medium text-gray-700 block mb-1">
                        {documentRecord.type === 'REVIEWED' ? "Supervisor's Feedback:" : "Student's Comment:"}
                      </span>
                      <div className="whitespace-pre-wrap">{documentRecord.description}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Reviewed Files from Supervisor */}
              {relatedReviews.length > 0 && (
                <div className="mt-4 pt-4 border-t border-green-200">
                  <h4 className="text-sm font-medium text-green-900 mb-3">Reviewed Files from Supervisor:</h4>
                  <div className="space-y-3">
                    {relatedReviews.map((reviewDoc) => (
                      <div key={reviewDoc.id} className="flex flex-col gap-3 bg-white p-3 rounded border border-green-100">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <svg className="w-8 h-8 text-green-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate max-w-[200px] lg:max-w-xs" title={reviewDoc.fileName || reviewDoc.title}>
                                {reviewDoc.fileName || reviewDoc.title}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                {reviewDoc.fileSize && (
                                  <span>{(reviewDoc.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                                )}
                                {reviewDoc.uploadedAt && (
                                  <>
                                    <span>&bull;</span>
                                    <span>Uploaded: {format(new Date(reviewDoc.uploadedAt), 'MMM dd, yyyy h:mm a')}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          {reviewDoc.fileName ? (
                          <button
                            onClick={() => handleDownload(reviewDoc.id, reviewDoc.fileName || reviewDoc.title)}
                            disabled={downloadingId === reviewDoc.id}
                            className="px-3 py-1.5 lg:px-4 lg:py-2 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 flex items-center gap-2 cursor-pointer self-start lg:self-auto"
                          >
                            {downloadingId === reviewDoc.id ? (
                              <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            )}
                            <span className="hidden lg:inline">Download</span>
                          </button>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 self-start lg:self-auto text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-md">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                              </svg>
                              Comments Only
                            </span>
                          )}
                        </div>
                        {(reviewDoc.reviewComments || reviewDoc.description) && (
                          <div className="text-sm text-gray-600 bg-green-50/50 p-3 rounded border border-green-50">
                            <span className="font-medium text-green-800 block mb-1">Supervisor's Feedback:</span>
                            <div className="whitespace-pre-wrap">{reviewDoc.reviewComments || reviewDoc.description}</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPreview;
