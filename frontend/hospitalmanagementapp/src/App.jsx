import React from "react";
import {BrowserRouter as Router , Routes , Route} from "react-router-dom";
import DashboardHeader from "./components/DashboardHeader";
import Home from "./pages/Home";
import Login from "./pages/Login";
const routes = (
   <Router>
     <Routes>
      <Route path="/Home" exact element={<Home />}></Route>
      <Route path="/login" exact element={<Login />}></Route>
     </Routes>
   </Router>
)

const App = () =>{
  return(
    <div>
    {routes}
    </div>
  )
}
export default App;