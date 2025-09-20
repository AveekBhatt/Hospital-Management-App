import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Hospital, Eye, EyeOff } from "lucide-react"; // Added Eye and EyeOff icons
import axiosInstance from "../utils/axiosInstance";

const Login = () => {
  const [error, seterror] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Added state for password visibility
  const navigate = useNavigate();

  const handleSubmit = async(e) => {
    e.preventDefault();
    try{
        if(!email){
            seterror("Please Enter An Email")
            return
        }
        if(!password){
            seterror("Please Enter A Password")
            return
        }
        const response = await axiosInstance.post("/users/login" , {
          email : email ,
          password : password
       })
       console.log(response)
        if(response.data && response.data.accesstoken){
          localStorage.setItem("token" , response.data.accesstoken);
          navigate('/Home')
        }
        else if(response.data){
         seterror(response.data.message)
        }
    }catch(error){
        console.log(error)
        seterror(error.response.data.message)
    }
  };
  useEffect(()=>{
                 const token = localStorage.getItem("token");
                  if (token) {
                   navigate("/Home");  
                  return;
                }
                  return () => {};
   } ,[]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-blue-100 p-4 rounded-full">
              <Hospital className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">MediCare Hospital</h1>
            <p className="text-gray-600">Management System</p>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white shadow-lg rounded-lg border border-gray-200 p-6">
          <div className="text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold">Admin Login</h2>
            </div>
            <p className="text-gray-500 text-sm">
              Enter your credentials to access the management dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="admin@hospital.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
              />
            </div>

            <div className="relative">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type={showPassword ? "text" : "password"} // Toggle between text and password
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-200 transition pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-9 text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {error && <p className="text-red-500 text-xs pb-1">{error}</p>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>© 2024 MediCare Hospital Management System</p>
        </div>
      </div>
    </div>
  );
};

export default Login;