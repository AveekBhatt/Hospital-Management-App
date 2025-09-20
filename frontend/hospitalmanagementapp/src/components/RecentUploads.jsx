import React, { useState } from "react";
import { FileText, Download, Eye, Calendar, Users, X, Table } from "lucide-react";
import axiosInstance from "../utils/axiosInstance";
import * as XLSX from 'xlsx';

const RecentUploads = ({ uploads = [] }) => {
  const [viewingFile, setViewingFile] = useState(null);
  const [fileData, setFileData] = useState([]);
  const [fileType, setFileType] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDownload = async (filename, originalName) => {
    try {
      const response = await axiosInstance.get(`/agent/download/${filename}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = originalName || filename;
      document.body.appendChild(link);
      link.click();
      
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const handleView = async (filename) => {
    try {
      setLoading(true);
      setViewingFile(filename);
      
      const response = await axiosInstance.get(`/agent/view/${filename}`, {
        responseType: 'blob'
      });
      
      // Determine file type
      const ext = filename.split('.').pop().toLowerCase();
      setFileType(ext);
      
      // Handle different file types
      if (ext === 'csv') {
        // For CSV files, read as text
        const text = await response.data.text();
        const rows = text.split('\n').map(row => row.split(','));
        setFileData(rows);
      } else if (['xlsx', 'xls'].includes(ext)) {
        // For Excel files, parse with XLSX
        const arrayBuffer = await response.data.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        setFileData(data);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('View failed:', error);
      alert('Failed to view file. Please try again.');
      setLoading(false);
      setViewingFile(null);
    }
  };

  const closeViewer = () => {
    setViewingFile(null);
    setFileData([]);
    setFileType("");
  };

  const renderFileContent = () => {
    if (loading) {
      return <div className="text-center py-8">Loading file...</div>;
    }
    
    if (fileData.length === 0) {
      return <div className="text-center py-8">No data to display</div>;
    }
    
    return (
      <div className="overflow-auto max-h-96">
        <table className="min-w-full border-collapse border border-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {fileData[0].map((header, index) => (
                <th key={index} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {fileData.slice(1).map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-4 py-2 text-sm text-gray-500 border border-gray-200">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <span className="px-2 py-1 text-xs rounded bg-green-100 text-green-800">
            Completed
          </span>
        );
      case "processing":
        return (
          <span className="px-2 py-1 text-xs rounded bg-yellow-100 text-yellow-800">
            Processing
          </span>
        );
      case "failed":
        return (
          <span className="px-2 py-1 text-xs rounded bg-red-100 text-red-800">
            Failed
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded bg-gray-100 text-gray-600">
            Unknown
          </span>
        );
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex justify-center">
      <div className="w-[76%] mt-10 bg-white shadow rounded-lg">
        {/* Header */}
        <div className="border-b px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <FileText className="w-5 h-5" />
            Recent Uploads
          </h2>
          <p className="text-sm text-gray-500">
            View and manage your uploaded files and their distribution status
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {uploads.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">No uploads yet</p>
              <p className="text-gray-500">
                Upload your first file to get started
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-left text-sm font-medium text-gray-600">
                    <th className="px-4 py-2">File Name</th>
                    <th className="px-4 py-2">Upload Date</th>
                    <th className="px-4 py-2">Records</th>
                    <th className="px-4 py-2">Staff</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-gray-200">
                  {uploads.slice(0, 3).map((upload) => (
                    <tr key={upload.filename} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{upload.filename}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {formatDate(upload.uploadedAt)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs rounded bg-gray-100">
                          {upload.tasksCount} / {upload.totalTasksInFile}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-500" />
                          <span>{upload.agentsCount}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge("completed")}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-1 justify-end">
                          <button 
                            className="p-2 rounded hover:bg-gray-100"
                            onClick={() => handleView(upload.filename)}
                            title="View File"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 rounded hover:bg-gray-100"
                            onClick={() => handleDownload(upload.filename, upload.filename)}
                            title="Download File"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* File Viewer Modal */}
        {viewingFile && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center border-b px-4 py-3">
                <div className="flex items-center gap-2">
                  <Table className="w-5 h-5" />
                  <h3 className="font-semibold">{viewingFile}</h3>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    {fileType.toUpperCase()}
                  </span>
                </div>
                <button 
                  onClick={closeViewer}
                  className="p-1 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
                {renderFileContent()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentUploads;