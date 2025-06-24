'use client';

import React, { useState, useEffect } from 'react';

// API Service for Milvus Backend
const createApiService = (baseURL) => {
  const api = {
    async request(endpoint, options = {}) {
      const url = `${baseURL}${endpoint}`;
      const config = {
        headers: {
          'Content-Type': 'application/json',
        },
        ...options,
      };

      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
      }
      
      return response.json();
    },

    async checkHealth() {
      return this.request('/health');
    },

    async getCollectionInfo() {
      return this.request('/collection/info');
    },

    async addDocument(document) {
      return this.request('/documents', {
        method: 'POST',
        body: JSON.stringify(document),
      });
    },

    async searchDocuments(query, limit = 10, offset = 0) {
      return this.request('/documents/search', {
        method: 'POST',
        body: JSON.stringify({ query, limit, offset }),
      });
    },

    async recreateCollection() {
      return this.request('/collection/recreate', {
        method: 'POST',
      });
    },

    async uploadJsonFile(file) {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${baseURL}/documents/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      return response.json();
    }
  };

  return api;
};

// Icon components (simplified Lucide React alternatives)
const IconSearch = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const IconUpload = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const IconActivity = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const IconDatabase = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
  </svg>
);

const IconCheck = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const IconAlert = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);

const IconSpinner = () => (
  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const IconRefresh = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const IconTrash = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const IconFile = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const IconSend = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const IconCloud = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
  </svg>
);

const IconDocument = () => (
  <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

// Main Milvus Document Manager Component
const MilvusDocumentManager = ({ 
  apiBaseUrl = process.env.NEXT_PUBLIC_MILVUS_API_URL || 'http://localhost:5502/api',
  className = '',
  showStatus = true,
  showUpload = true,
  showSearch = true,
  maxSearchResults = 10,
  title = 'Milvus Document Manager'
}) => {
  const [apiService] = useState(() => createApiService(apiBaseUrl));
  
  // Status State
  const [apiHealth, setApiHealth] = useState({ status: 'loading', data: null });
  const [collectionInfo, setCollectionInfo] = useState({ status: 'loading', data: null });
  
  // Upload State
  const [document, setDocument] = useState({ title: '', content: '', url: '' });
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // JSON Upload State
  const [uploadingJson, setUploadingJson] = useState(false);
  const [jsonUploadResult, setJsonUploadResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (showStatus) {
      checkStatus();
      const interval = setInterval(checkStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [showStatus]);

  const checkStatus = async () => {
    try {
      const healthData = await apiService.checkHealth();
      setApiHealth({ status: 'healthy', data: healthData });
    } catch (error) {
      setApiHealth({ status: 'error', data: { error: error.message } });
    }

    try {
      const collectionData = await apiService.getCollectionInfo();
      setCollectionInfo({ status: 'healthy', data: collectionData });
    } catch (error) {
      setCollectionInfo({ status: 'error', data: null });
    }
  };

  const handleDocumentSubmit = async (e) => {
    e.preventDefault();
    
    if (!document.title.trim() || !document.content.trim()) {
      setUploadResult({ success: false, message: 'Title and content are required' });
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const result = await apiService.addDocument(document);
      setUploadResult({ success: true, ...result });
      setDocument({ title: '', content: '', url: '' });
      
      if (showStatus) {
        setTimeout(checkStatus, 1000);
      }
    } catch (error) {
      setUploadResult({ success: false, message: error.message });
    } finally {
      setUploading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setSearchError('Please enter a search query');
      return;
    }

    setSearching(true);
    setSearchError(null);

    try {
      const results = await apiService.searchDocuments(searchQuery, maxSearchResults);
      setSearchResults(results.documents || []);
      
      if (results.documents?.length === 0) {
        setSearchError('No documents found matching your query');
      }
    } catch (error) {
      setSearchError(error.message);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleRecreateCollection = async () => {
    if (!confirm('⚠️ This will delete ALL documents in the collection. Are you sure?')) {
      return;
    }

    try {
      await apiService.recreateCollection();
      setUploadResult({ success: true, message: 'Collection recreated successfully' });
      setSearchResults([]);
      if (showStatus) {
        setTimeout(checkStatus, 1000);
      }
    } catch (error) {
      setUploadResult({ success: false, message: `Failed to recreate collection: ${error.message}` });
    }
  };

  const handleJsonUpload = async (file) => {
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.json')) {
      setJsonUploadResult({ success: false, message: 'Please select a JSON file' });
      return;
    }

    setUploadingJson(true);
    setJsonUploadResult(null);

    try {
      const result = await apiService.uploadJsonFile(file);
      setJsonUploadResult({ 
        success: true, 
        message: `Successfully uploaded ${result.documents_processed || result.count || 'multiple'} documents`,
        ...result 
      });
      
      if (showStatus) {
        setTimeout(checkStatus, 1000);
      }
    } catch (error) {
      setJsonUploadResult({ success: false, message: error.message });
    } finally {
      setUploadingJson(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleJsonUpload(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleJsonUpload(files[0]);
    }
    // Reset input
    e.target.value = '';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <div className="text-green-500"><IconCheck /></div>;
      case 'error':
        return <div className="text-red-500"><IconAlert /></div>;
      default:
        return <div className="text-blue-500"><IconSpinner /></div>;
    }
  };

  const getCollectionStatus = () => {
    if (collectionInfo.status !== 'healthy' || !collectionInfo.data) {
      return collectionInfo.status === 'error' ? 'Error' : 'Checking...';
    }

    const data = collectionInfo.data;
    if (data.vector_store_ready && data.status) {
      return data.status.includes('Ready') ? 'Ready for Rasa' : 'Ready';
    }
    
    return 'Not Ready';
  };

  return (
    <div className={`max-w-6xl mx-auto p-6 space-y-6 font-sans ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-gray-600">
          Manage documents in Milvus vector database with Rasa Enterprise Search compatibility
        </p>
      </div>

      {/* Status Section */}
      {showStatus && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <IconActivity />
              System Status
            </h2>
            <button
              onClick={checkStatus}
              className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border rounded-md hover:bg-gray-50 transition-colors"
            >
              <IconRefresh />
              Refresh
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <IconActivity />
                <span className="font-medium">API Health</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {apiHealth.status === 'healthy' ? 'Online' : 
                   apiHealth.status === 'error' ? 'Offline' : 'Checking...'}
                </span>
                {getStatusIcon(apiHealth.status)}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <IconDatabase />
                <span className="font-medium">Collection</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">{getCollectionStatus()}</span>
                {getStatusIcon(collectionInfo.status)}
              </div>
            </div>

            {collectionInfo.status === 'healthy' && collectionInfo.data && (
              <>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <IconFile />
                    <span className="font-medium">Documents</span>
                  </div>
                  <span className="text-sm font-mono">
                    {collectionInfo.data.document_count || 0}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <IconCheck />
                    <span className="font-medium">Schema</span>
                  </div>
                  <span className="text-sm text-green-600">Rasa Compatible</span>
                </div>
              </>
            )}
          </div>

          {collectionInfo.status === 'healthy' && collectionInfo.data && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Collection:</strong> {collectionInfo.data.collection_name} | 
                <strong> Model:</strong> {collectionInfo.data.embedding_model} | 
                <strong> Optimized for:</strong> {collectionInfo.data.optimized_for}
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleRecreateCollection}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 border border-red-200 rounded-md hover:bg-red-50 transition-colors"
            >
              <IconTrash />
              Recreate Collection
            </button>
          </div>
        </div>
      )}

      {/* JSON Upload Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <IconCloud />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Upload JSON File</h2>
              <p className="text-sm text-gray-600">Bulk Import</p>
            </div>
          </div>
        </div>

        <div 
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive 
              ? 'border-blue-400 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploadingJson}
          />
          
          <div className="flex flex-col items-center space-y-4">
            <div className="text-gray-400">
              <IconDocument />
            </div>
            
            {uploadingJson ? (
              <div className="flex items-center space-x-2">
                <IconSpinner />
                <span className="text-gray-600">Uploading...</span>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Drag & drop a JSON file here
                  </h3>
                  <p className="text-gray-500 mb-4">or click to select a file</p>
                  <p className="text-sm text-gray-400">
                    Expected format: {`[{"title": "...", "content": "...", "url": "..."}]`}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {jsonUploadResult && (
          <div className={`mt-4 p-4 rounded-lg ${
            jsonUploadResult.success 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {jsonUploadResult.success ? <IconCheck /> : <IconAlert />}
              <span className="text-sm font-medium">
                {jsonUploadResult.success ? 'Success!' : 'Error'}
              </span>
            </div>
            <div className="text-sm mt-1">
              {jsonUploadResult.message}
            </div>
          </div>
        )}

        <div className="mt-4 flex items-start space-x-2">
          <IconCheck className="text-green-500 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">Optimized for Rasa Enterprise Search</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Automatic text chunking for better search</li>
              <li>• Vector indexing with COSINE similarity</li>
              <li>• Fresh collection created each time</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Upload Section */}
        {showUpload && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <IconUpload />
              Add Document
            </h2>

            <form onSubmit={handleDocumentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={document.title}
                  onChange={(e) => setDocument(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Document title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content *
                </label>
                <textarea
                  value={document.content}
                  onChange={(e) => setDocument(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical"
                  rows={4}
                  placeholder="Document content to be embedded and searched"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL (optional)
                </label>
                <input
                  type="url"
                  value={document.url}
                  onChange={(e) => setDocument(prev => ({ ...prev, url: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="https://source-url.com"
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? <IconSpinner /> : <IconSend />}
                {uploading ? 'Uploading...' : 'Add Document'}
              </button>
            </form>

            {uploadResult && (
              <div className={`mt-4 p-3 rounded-lg ${
                uploadResult.success 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                <div className="flex items-center gap-2">
                  {uploadResult.success ? <IconCheck /> : <IconAlert />}
                  <span className="text-sm font-medium">
                    {uploadResult.success ? 'Success!' : 'Error'}
                  </span>
                </div>
                <div className="text-sm mt-1">
                  {uploadResult.message || 
                   (uploadResult.success ? 
                    `Document "${uploadResult.title}" added successfully (${uploadResult.chunks_created} chunks)` : 
                    'Failed to add document')}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Document Search Section */}
        {showSearch && (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <IconSearch />
              Search Documents
            </h2>

            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search Query
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter your search query..."
                  />
                  <button
                    type="submit"
                    disabled={searching}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                  >
                    {searching ? <IconSpinner /> : <IconSearch />}
                  </button>
                </div>
              </div>
            </form>

            {searchError && (
              <div className="mt-4 p-3 bg-red-50 text-red-800 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <IconAlert />
                  <span className="text-sm">{searchError}</span>
                </div>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                <h3 className="text-sm font-medium text-gray-700">
                  Search Results ({searchResults.length})
                </h3>
                {searchResults.map((result, index) => (
                  <div key={result.id || index} className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 mb-1">
                          Document #{result.id?.substring(0, 8)}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {(result.content || result.pageContent || '').substring(0, 200)}
                          {(result.content || result.pageContent || '').length > 200 && '...'}
                        </div>
                      </div>
                      <div className="ml-4 text-right flex-shrink-0">
                        <div className="text-xs text-green-600 font-medium">
                          {result.similarity}% match
                        </div>
                        <div className="text-xs text-gray-500">
                          Score: {result.score?.toFixed(3)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MilvusDocumentManager;