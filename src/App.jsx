import React, { useContext, useEffect, useState } from "react";
import Form from "./components/Form/Form";
import "./App.css";
import { Route, Routes, Link } from "react-router-dom";
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

function App() {
  const dataContext = useContext(LoginContext);
  const { email } = dataContext;
  const [feedbackData, setFeedbackData] = useState(null);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = true;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  useEffect(() => {
    const fetchFeedbackData = async () => {
      try {
        const response = await fetch(
          "https://script.google.com/macros/s/AKfycbyD6c544p-aVISBAlLUKlkEJRbXuV8tzpwv_YEUP3wKu7cSiKynMaTpqY3c6TqTQYtcOw/exec?type=getProjectFeedbackForm"
        );
        const data = await response.json();
        console.log("Feedback data:", data);
        setFeedbackData(data);
      } catch (error) {
        console.error("Error fetching feedback data:", error);
      }
    };

    fetchFeedbackData();
  }, []);

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
            element={<ProtectedRoute element={<Form />} />}
          />
          <Route
            path="/comp-off-application"
            element={<ProtectedRoute element={<CompOff />} />}
          />
          <Route
            path="/leave-application"
            element={<ProtectedRoute element={<Leaves />} />}
          />
          <Route
            path="/leaves"
            element={<ProtectedRoute element={<Leaves />} />}
          />
          <Route
            path="/monthly-activity-dashboard"
            element={<ProtectedRoute element={<MonthlyDashboard />} />}
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
