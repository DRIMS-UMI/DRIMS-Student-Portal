import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { AlertCircle, Loader2 } from 'lucide-react';
import { uploadDocumentService, getStudentSupervisorsService, checkDocumentPageCountService } from '../../store/tanstackStore/services/api';
import { queryClient } from '../../utils/tanstack';

const MAX_PROPOSAL_PAGES = 17;

const DocumentUpload = () => {
  const [file, setFile] = useState(null);
  const [documentType, setDocumentType] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSupervisor, setSelectedSupervisor] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [pageCount, setPageCount] = useState(null);
  const [pageBlockError, setPageBlockError] = useState('');
  const [isCheckingPages, setIsCheckingPages] = useState(false);

  // Get student supervisors
  const { data: supervisorsData, isLoading: isLoadingSupervisors } = useQuery({
    queryKey: ['studentSupervisors'],
    queryFn: getStudentSupervisorsService,
  });

  const supervisors = supervisorsData?.supervisors || [];

  const uploadMutation = useMutation({
    mutationFn: uploadDocumentService,
    retry: false,
    onSuccess: (data) => {
      // console.log('Upload mutation success:', data);
      // Reset form immediately
      setFile(null);
      setDocumentType('');
      setTitle('');
      setDescription('');
      setSelectedSupervisor('');
      
      // Refresh the document list (invalidate + refetch; no cache wipe so the list doesn't blank out)
      queryClient.invalidateQueries({ queryKey: ['studentDocuments'] });
      queryClient.refetchQueries({ queryKey: ['studentDocuments'] });

      // Show success toast
      toast.success('Document uploaded successfully!');
    },
    onError: (error) => {
      // console.error('Upload mutation error:', error);
      // console.log('Showing error toast...');
      toast.error(error.message || 'Failed to upload document');
      // console.log('Error toast called');
    }
  });

  // Socket-driven refresh is owned by DocumentList (it's always mounted on the Documents page)

  const countPdfPages = async (selectedFile) => {
    const arrayBuffer = await selectedFile.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    return pdf.getPageCount();
  };

  const countDocxPages = async (selectedFile) => {
    try {
      const zip = await JSZip.loadAsync(await selectedFile.arrayBuffer());
      const appXmlFile = zip.file('docProps/app.xml');
      if (!appXmlFile) return null;
      const appXml = await appXmlFile.async('string');
      const match = appXml.match(/<Pages[^>]*>(\d+)<\/Pages>/);
      return match ? parseInt(match[1], 10) : null;
    } catch {
      return null;
    }
  };

  const countDocPages = async (selectedFile) => {
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const result = await checkDocumentPageCountService(formData);
      return result?.pageCount ?? null;
    } catch {
      return null;
    }
  };

  const countPages = async (selectedFile) => {
    if (selectedFile.type === 'application/pdf') {
      return countPdfPages(selectedFile);
    }
    if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      return countDocxPages(selectedFile);
    }
    if (selectedFile.type === 'application/msword') {
      return countDocPages(selectedFile);
    }
    return null;
  };

  // Check the page count whenever a file and the PROPOSAL type are set
  useEffect(() => {
    let cancelled = false;

    const runCheck = async () => {
      setPageCount(null);
      setPageBlockError('');
      setIsCheckingPages(false);
      if (documentType !== 'PROPOSAL' || !file) return;

      setIsCheckingPages(true);
      try {
        const count = await countPages(file);
        if (cancelled) return;
        setPageCount(count);

        if (count === null) {
          const msg = "This file's page count couldn't be verified. Please save it as PDF or DOCX to upload a proposal.";
          setPageBlockError(msg);
          toast.error(msg);
        } else if (count > MAX_PROPOSAL_PAGES) {
          const msg = `This proposal is ${count} pages. Proposals must not exceed ${MAX_PROPOSAL_PAGES} pages.`;
          setPageBlockError(msg);
          toast.error(msg);
        }
      } catch {
        if (!cancelled) {
          const msg = "Couldn't check the page count. Please try again.";
          setPageBlockError(msg);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) setIsCheckingPages(false);
      }
    };

    runCheck();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, documentType]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error('Please select a valid file type (PDF, DOC, or DOCX)');
        return;
      }

      // Validate file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file || !documentType || !title || !selectedSupervisor) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (documentType === 'PROPOSAL' && isCheckingPages) {
      toast.error('Please wait while the page count is checked.');
      return;
    }

    if (documentType === 'PROPOSAL' && pageBlockError) {
      toast.error(pageBlockError);
      return;
    }

    setIsUploading(true);
    // console.log('Starting document upload...');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('supervisorId', selectedSupervisor);

      // console.log('FormData created:', {
      //   file: file.name,
      //   documentType,
      //   title,
      //   description,
      //   supervisorId: selectedSupervisor
      // });

      const result = await uploadMutation.mutateAsync(formData);
      // console.log('Upload completed successfully:', result);
      
      // Form reset is handled in the mutation success handler
      // Clear file input
      const fileInput = document.getElementById('file');
      if (fileInput) {
        fileInput.value = '';
      }
      
    } catch (error) {
      // console.error('Upload error:', error);
      // Error toast is handled in the mutation error handler
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Document</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Document Type */}
        <div>
          <label htmlFor="documentType" className="block text-sm font-medium text-gray-700 mb-1">
            Document Type *
          </label>
          <select
            id="documentType"
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="">Select document type</option>
            <option value="PROPOSAL">Research Proposal</option>
            <option value="DISSERTATION">Dissertation</option>
            <option value="CHAPTER">Chapter</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* Supervisor Selection */}
        <div>
          <label htmlFor="supervisor" className="block text-sm font-medium text-gray-700 mb-1">
            Send to Supervisor *
          </label>
          <select
            id="supervisor"
            value={selectedSupervisor}
            onChange={(e) => setSelectedSupervisor(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
            disabled={isLoadingSupervisors}
          >
            <option value="">Select supervisor</option>
            {supervisors.map((supervisor) => (
              <option key={supervisor.id} value={supervisor.id}>
                {supervisor.title} {supervisor.name}
              </option>
            ))}
          </select>
          {isLoadingSupervisors && (
            <p className="text-sm text-gray-500 mt-1">Loading supervisors...</p>
          )}
          {!isLoadingSupervisors && supervisors.length === 0 && (
            <p className="text-sm text-gray-500 mt-1">No supervisors assigned</p>
          )}
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Document Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter document title"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Brief description of the document (optional)"
          />
        </div>

        {/* File Upload */}
        <div>
          <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
            Select File *
          </label>
          {file ? (
            <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3 mt-1">
              <div className="flex items-center gap-3 min-w-0">
                <svg className="w-8 h-8 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  document.getElementById('file').value = '';
                }}
                className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 cursor-pointer shrink-0"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400 transition-colors">
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label
                    htmlFor="file"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <span>Upload a file</span>
                    <input
                      id="file"
                      name="file"
                      type="file"
                      className="sr-only"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx"
                      required
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PDF, DOC, DOCX up to 10MB</p>
              </div>
            </div>
          )}
        </div>

        {/* Page count status */}
        {documentType === 'PROPOSAL' && file && (
          <div>
            {isCheckingPages && (
              <p className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                Checking page count...
              </p>
            )}
            {!isCheckingPages && pageBlockError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>{pageBlockError}</p>
              </div>
            )}
            {!isCheckingPages && !pageBlockError && pageCount !== null && (
              <p className={`text-sm ${pageCount > MAX_PROPOSAL_PAGES ? 'text-red-600' : 'text-green-600'}`}>
                {pageCount} page{pageCount === 1 ? '' : 's'} — within the {MAX_PROPOSAL_PAGES}-page proposal limit.
              </p>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isUploading || !file || !documentType || !title || !selectedSupervisor || isCheckingPages || (documentType === 'PROPOSAL' && !!pageBlockError)}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </button>
      </form>
    </div>
  );
};

export default DocumentUpload; 