import React, { useEffect, useState } from "react";
import { Users, FileText, Settings, LogOut, User } from "lucide-react"; // Added User icon
import { Link, useNavigate } from "react-router-dom";

const DashboardHeader = ({
  staffCount,
  totalUploads,
  email
}) => {
  const navigate = useNavigate();
  const onLogout = () => {
    localStorage.clear();
    navigate("/login")
  }
  
  return (
    <div className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-2xl font-bold">Hospital Management</h1>
            <p className="text-sm text-gray-500">
              Manage medical staff and distribute patient records
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">{staffCount} Staff Members</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">{totalUploads} Uploads</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-md hover:bg-gray-100"
          >
            <Users className="w-4 h-4" />
            Manage Staff
          </button>

          <button className="p-2 rounded-md hover:bg-gray-100">
            <Settings className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 pl-3 border-l">
            <div className="text-right">
              <p className="text-sm font-medium">Hospital Admin</p>
              <p className="text-xs text-gray-500">{email}</p>
            </div>
            <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200">
              <User className="w-4 h-4 text-gray-600" /> {/* Replaced AB with User icon */}
            </div>
            <button
              className="p-2 rounded-md hover:bg-gray-100"
              onClick={() => onLogout()} 
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;