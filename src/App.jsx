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

import Unauthorized from "./components/Unauthorized/Unauthorized";

function App() {
  const dataContext = useContext(LoginContext);
  const { email, isAdmin, loading } = dataContext;
  const [feedbackData, setFeedbackData] = useState(null);

  useEffect(() => {
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const ProtectedRoute = ({ children }) => {
  const email = sessionStorage.getItem("email");
  return email ? children : <Navigate to="/" replace />;
};

  return (
    <div className="App">
      {email && email !== "" ? <Navbar /> : <NoTabNavBar />}
      <br />
      <br />
      <main>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/activity-tracker"
            element={
              <ProtectedRoute>
                <Form />
              </ProtectedRoute>
            }
          />
          <Route
            path="/comp-off-application"
            element={
              <ProtectedRoute>
                <CompOff />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leave-application"
            element={
              <ProtectedRoute>
                <Leaves />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaves"
            element={
              <ProtectedRoute>
                <Leaves />
              </ProtectedRoute>
            }
          />
          <Route
            path="/monthly-activity-dashboard"
            element={
              <ProtectedRoute>
                <MonthlyDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              loading ? (
                <div>Loading...</div>
              ) : (
                <ProtectedRoute>
                  {isAdmin ? <AdminDashboard /> : <Navigate to="/unauthorized" replace />}
                </ProtectedRoute>
              )
            }
          />
          <Route
            path="/leave-history"
            element={
              <ProtectedRoute>
                <LeaveHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/role-update"
            element={
              loading ? (
                <div>Loading...</div>
              ) : (
                <ProtectedRoute>
                  {isAdmin ? <RoleUpdateForm /> : <Navigate to="/unauthorized" replace />}
                </ProtectedRoute>
              )
            }
          />
          <Route
            path="/project-management"
            element={
              loading ? (
                <div>Loading...</div>
              ) : (
                <ProtectedRoute>
                  {isAdmin ? <ProjectManagement /> : <Navigate to="/unauthorized" replace />}
                </ProtectedRoute>
              )
            }
          />
          <Route path="/unauthorized" element={<Unauthorized />} />
        </Routes>
      </main>
      {feedbackData && feedbackData.length > 0 && (
        <TraansitionModal feedbackData={feedbackData} />
      )}
    </div>
  );
}

export default App;
