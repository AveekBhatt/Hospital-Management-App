import React, { useState, useRef } from "react";
import axiosInstance from "../utils/axiosInstance";

const FileUpload = ({ onUploadSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [selectedFile, setSelectedFile] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    setErrorMessage("");
    
    if (!file) {
      setErrorMessage("Please select a file");
      return false;
    }

    const fileExtension = file.name.split(".").pop().toLowerCase();
    const validExtensions = ["csv", "xlsx", "xls"];
    
    if (!validExtensions.includes(fileExtension)) {
      setErrorMessage("Please upload a CSV, XLSX, or XLS file");
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("File size must be less than 10MB");
      return false;
    }

    return true;
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

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      
      if (validateFile(file)) {
        uploadFile(file);
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      if (validateFile(file)) {
        uploadFile(file);
      }
    }
  };

  const uploadFile = async (file) => {
    setUploadStatus("uploading");
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axiosInstance.post("/agent/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percent);
          }
        },
      });

      console.log("Upload successful:", res.data);
      setUploadStatus("success");
      
      if (onUploadSuccess) {
        onUploadSuccess();
      }
      
    } catch (error) {
      console.error("Upload error:", error);
      
      let errorMsg = "Upload failed. Please try again.";
      
      if (error.response) {
        errorMsg = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMsg = "Network error. Please check your connection.";
      }
      
      setErrorMessage(errorMsg);
      setUploadStatus("error");
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setUploadStatus("idle");
    setUploadProgress(0);
    setErrorMessage("");
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragAreaClick = () => {
    fileInputRef.current?.click();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " bytes";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-10 bg-white shadow-lg rounded-xl p-6">
      <h2 className="text-xl font-bold mb-5 text-gray-800">Upload Patient Records</h2>

      <div
        className={`relative w-full border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
          dragActive 
            ? "border-blue-500 bg-blue-50" 
            : uploadStatus === "error" 
              ? "border-red-300 bg-red-50" 
              : uploadStatus === "success" 
                ? "border-green-300 bg-green-50" 
                : "border-gray-300 hover:border-blue-300 hover:bg-blue-50"
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={handleDragAreaClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label="File upload area. Click or drag files here to upload."
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept=".csv,.xlsx,.xls"
          aria-describedby="fileInputHelp"
        />
        
        {uploadStatus === "success" ? (
          <svg
            className="w-16 h-16 mx-auto text-green-500 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        ) : uploadStatus === "error" ? (
          <svg
            className="w-16 h-16 mx-auto text-red-500 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        ) : (
          <svg
            className="w-16 h-16 mx-auto text-gray-400 mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
        )}
        
        <p className="mt-2 text-sm text-gray-600">
          {uploadStatus === "success" 
            ? "File uploaded successfully!" 
            : uploadStatus === "error" 
              ? "Upload failed. Try again." 
              : "Drag & drop a file here, or click to browse"}
        </p>
        
        <p className="text-xs text-gray-500 mt-1">
          Supported formats: CSV, XLSX, XLS (max 10MB)
        </p>
        
        {uploadStatus === "uploading" && (
          <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-gray-700">Uploading... {uploadProgress}%</p>
            </div>
          </div>
        )}
      </div>

      {selectedFile && (
        <div className="mt-5 p-4 border rounded-lg flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {uploadStatus === "success" && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Uploaded
              </span>
            )}
            {uploadStatus === "error" && (
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                Error
              </span>
            )}
            <button
              onClick={resetUpload}
              className="p-1 text-gray-500 hover:text-red-500 transition-colors"
              aria-label="Remove file"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      )}

      {uploadStatus === "uploading" && (
        <div className="mt-5">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {uploadStatus === "error" && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p className="text-red-700 text-sm">{errorMessage}</p>
          </div>
          <button
            onClick={resetUpload}
            className="mt-2 text-sm text-red-700 hover:text-red-800 font-medium"
          >
            Try again
          </button>
        </div>
      )}

      {uploadStatus === "success" && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p className="text-green-700 text-sm">File uploaded successfully!</p>
          </div>
          <button
            onClick={resetUpload}
            className="mt-2 text-sm text-green-700 hover:text-green-800 font-medium"
          >
            Upload another file
          </button>
        </div>
      )}

      <p id="fileInputHelp" className="sr-only">
        Select a CSV, XLSX, or XLS file to upload. Maximum file size is 10MB.
      </p>
    </div>
  );
};

export default FileUpload;