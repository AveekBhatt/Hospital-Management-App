import React, { useEffect, useState } from "react";
import DashboardHeader from "../components/DashboardHeader";
import FileUpload from "../components/FileUpload";
import RecentUploads from "../components/RecentUploads";
import axiosInstance from "../utils/axiosInstance";
import { Link, useNavigate } from "react-router-dom";

const Home = () => {
    const navigate = useNavigate();
    const [updates, setAllUpdates] = useState([]);
    const [name, setName] = useState("");
    const [staffCount, setStaffCount] = useState(0);
    const [totalUploads, setTotalUploads] = useState(0);
    const [email, setEmail] = useState("");
    
    const getAllinfo = async () => {
        try {
            const response1 = await axiosInstance.get("/users/Me");
            const response2 = await axiosInstance.get("/users/cntagents");
            const response3 = await axiosInstance.get("/users/cntasks");
            setEmail(response1.data.userInfo.email);
            setStaffCount(response2.data.totalAgents);
            setTotalUploads(response3.data.totalTasks);
        } catch (error) {
            console.log("error", error);
        }
    };
    
    const getAll = async () => {
        try {
            const response = await axiosInstance.get("/agent/getAlltasks");
            console.log(response.data.data.files);
            setAllUpdates(response.data.data.files);
        } catch (error) {
            console.log(error);
        }
    };
    
   
    const handleFileUploadSuccess = () => {
        getAll(); 
        getAllinfo(); 
    };
    
    useEffect(() => {
        getAllinfo();
        getAll();
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");  
            return;
        }
        return () => {};
    }, []);
    
    return (
        <>
            <DashboardHeader
                staffCount={staffCount}
                totalUploads={totalUploads}
                email={email}
            />
            <FileUpload onUploadSuccess={handleFileUploadSuccess} />
            <RecentUploads uploads={updates} />
        </>
    );
};

export default Home;