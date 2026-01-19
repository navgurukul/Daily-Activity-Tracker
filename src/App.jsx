import React, { useContext, useEffect, useState } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";

import "./App.css";
import Form from "./components/Form/Form";
import Leaves from "./components/Leaves/Leaves";
import Navbar from "./components/Navbar/Navbar";
import Login from "./components/Login/Login";
import NoTabNavBar from "./components/Navbar/NoTabNavbar";
import CompOff from "./components/CompOff/CompOff";
import TraansitionModal from "./components/Modal/TraansitionModal";
import MonthlyDashboard from "./components/MonthlyDashboard/MonthlyDashboard";
import AdminDashboard from "./components/Admin/AdminDashboard";
import LeaveHistory from "./components/LeaveHistory/LeaveHistory";
import RoleUpdateForm from "./components/Navbar/RoleUpdateForm";
import ProjectManagement from "./components/Admin/ProjectManagement";
import Unauthorized from "./components/Unauthorized/Unauthorized";

import { LoginContext } from "./components/Context/LoginContext";
import { handleBeforeUnload } from "./utils/beforeUnloadHandler";


function App() {
  // Context
  const dataContext = useContext(LoginContext);
  const { email, isAdmin, loading } = dataContext;

  // State management
  const [feedbackData, setFeedbackData] = useState(null);

  // Effect for beforeunload event
  useEffect(() => {
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  // Protected route component
  const ProtectedRoute = ({ children }) => {
    const email = localStorage.getItem("email");
    return email ? children : <Navigate to="/" replace />;
  };

  return (
    // <div style={{
    //   display: 'flex',
    //   flexDirection: 'column',
    //   justifyContent: 'center',
    //   alignItems: 'center',
    //   height: '100vh',
    //   textAlign: 'center',
    //   padding: '20px'
    // }}>
    //   <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>Site Under Maintenance</h1>
    //   <p style={{ fontSize: '1.2rem', color: '#666' }}>
    //     We are currently performing scheduled maintenance. Please check back later.
    //   </p>
    // </div>

    <div className="App">
      {/* Navbar changes based on login state */}
      {email && email !== "" ? <Navbar /> : <NoTabNavBar />}
      <br />
      <br />

      {/* Application routes */}
      <main>
        <Routes>
          {/* Public Route: Login */}
          <Route path="/" element={<Login />} />

          {/* Protected Routes: Require login */}
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

          {/* Admin Routes: Require admin role */}
          <Route
            path="/admin"
            element={
              loading ? (
                // Loader while admin check is pending
                <Box
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "400px",
                  }}
                >
                  Loading...
                  <CircularProgress style={{ marginLeft: "10px" }} />
                </Box>
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
                <Box
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "400px",
                  }}
                >
                  Loading...
                  <CircularProgress style={{ marginLeft: "10px" }} />
                </Box>
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
                <Box
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "400px",
                  }}
                >
                  Loading...
                  <CircularProgress style={{ marginLeft: "10px" }} />
                </Box>
              ) : (
                <ProtectedRoute>
                  {isAdmin ? <ProjectManagement /> : <Navigate to="/unauthorized" replace />}
                </ProtectedRoute>
              )
            }
          />

          {/* Public Route: Unauthorized */}
          <Route path="/unauthorized" element={<Unauthorized />} />
        </Routes>
      </main>

      {/* Feedback Modal */}
      {feedbackData && feedbackData.length > 0 && (
        <TraansitionModal feedbackData={feedbackData} />
      )}
    </div>

  );
}

export default App;