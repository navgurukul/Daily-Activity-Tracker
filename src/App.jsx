import React, { useContext, useEffect, useState } from "react";
import Form from "./components/Form/Form";
import "./App.css";
import { Route, Routes, Link, Navigate } from "react-router-dom";
import Leaves from "./components/Leaves/Leaves";
import Navbar from "./components/Navbar/Navbar";
import Login from "./components/Login/Login";
import NoTabNavBar from "./components/Navbar/NoTabNavbar";
import { LoginContext } from "./components/context/LoginContext";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import brainImg from "../public/brain.png";
import CompOff from "./components/CompOff/CompOff";
import TraansitionModal from "./components/Modal/TraansitionModal";
import MonthlyDashboard from "./components/MonthlyDashboard/MonthlyDashboard";
import AdminDashboard from "./components/Admin/AdminDashboard";
import LeaveHistory from "./components/LeaveHistory/LeaveHistory";
import {handleBeforeUnload} from "./utils/beforeUnloadHandler";

import RoleUpdateForm from "./components/Navbar/RoleUpdateForm";
import ProjectManagement from "./components/Admin/ProjectManagement";

function App() {
  const dataContext = useContext(LoginContext);
  const { email, isAdmin } = dataContext;
  const [feedbackData, setFeedbackData] = useState(null);

  useEffect(() => {
    // const handleBeforeUnload = (event) => {
    //   event.preventDefault();
    //   event.returnValue = true;
    // };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return (
    <div className="App">
      {email && email !== "" ? <Navbar /> : <NoTabNavBar />}
      {/* {<Navbar />} */}
      <br />
      <br />
      <main>
        <Routes>
          <Route path="/" element={<Login />} />
          {/* <Route path="/" element={<Form />} /> */}
          <Route
            path="/activity-tracker"
            // element={<ProtectedRoute element={<Form />} />}
            element={<Form />}
          />
          <Route
            path="/comp-off-application"
            // element={<ProtectedRoute element={<CompOff />} />}
            element={<CompOff />}
          />
          <Route
            path="/leave-application"
            // element={<ProtectedRoute element={<Leaves />} />}
            element={<Leaves />}
          />
          <Route
            path="/leaves"
            // element={<ProtectedRoute element={<Leaves />} />}
            element={<Leaves />}
          />
          <Route
            path="/monthly-activity-dashboard"
            // element={<ProtectedRoute element={<MonthlyDashboard />} />}
            element={<MonthlyDashboard />}
          />
          {/* <Route path="/admin" 
          // element={<ProtectedRoute element={<AdminDashboard />} />} 
          element={<AdminDashboard />}
          /> */}
          <Route
            path="/admin"
            element={
              isAdmin ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/unauthorized" replace />
              )
            }
          />
          <Route
            path="/leave-history"
            // element={<ProtectedRoute element={<LeaveHistory />} />}
            element={<LeaveHistory />}
          />
          <Route
            path="/role-update"
            element={<RoleUpdateForm />}
          />
          <Route
            path="/project-management"
            element={
              isAdmin ? (
                <ProjectManagement />
              ) : (
                <Navigate to="/unauthorized" replace />
              )
            }
          />
        </Routes>
      </main>
      {feedbackData && feedbackData.length > 0 && (
        <TraansitionModal feedbackData={feedbackData} />
      )}
    </div>
  );
}

export default App;
