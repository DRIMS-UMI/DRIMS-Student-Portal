import React, { useState } from 'react';
import { useGetLoggedInUser, useGetStudentDocuments } from '../../store/tanstackStore/services/queries';
import DocumentUpload from './DocumentUpload';
import DocumentList from './DocumentList';
import DocumentPreview from './DocumentPreview';

const Documents = () => {
  const { data: userData } = useGetLoggedInUser();
  const { data: documentsResponse } = useGetStudentDocuments();
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const allDocuments = documentsResponse?.documents || [];

  return (
    <div className="p-2 sm:p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-2">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Documents</h1>
          {userData?.user?.name && (
            <p className="text-gray-600 mt-1">Manage your research documents</p>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Upload Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-md p-4 md:p-5">
            <DocumentUpload />
          </div>
        </div>
        
        {/* Right Column: Document List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-md p-4 md:p-5">
            <DocumentList 
              onDocumentSelect={(doc) => {
                setSelectedDocument(doc);
                setShowPreview(true);
              }}
            />
          </div>
        </div>
      </div>

      {/* Document Preview Modal */}
      {showPreview && selectedDocument && (
        <DocumentPreview
          document={selectedDocument}
          allDocuments={allDocuments}
          onClose={() => {
            setShowPreview(false);
            setSelectedDocument(null);
          }}
        />
      )}
    </div>
  );
};

export default Documents; 