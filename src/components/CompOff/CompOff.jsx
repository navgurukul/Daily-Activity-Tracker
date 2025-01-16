import "./CompOff.css";
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { LoginContext } from "../context/LoginContext";
import LoadingSpinner from "../Loader/LoadingSpinner";
import { useLoader } from "../context/LoadingContext";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { Snackbar, Alert } from "@mui/material";
import url from "../../../public/api";

const CompOff = () => {
  const dataContext = useContext(LoginContext);
  const { email } = dataContext;
  const { loading, setLoading } = useLoader();
  const navigate = useNavigate();
  const [showAuthError, setShowAuthError] = useState(false);

  const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const [leaveData, setLeaveData] = useState({
    type: "compOff",
    reason: "",
    fromDate: getTodayDate(),
    toDate: getTodayDate(),
    email: "",
  });

  const [halfDay, setHalfDay] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Check for authentication and email
  useEffect(() => {
    if (!email) {
      navigate("/");
      return;
    }

    if (sessionStorage.getItem("isAuth") !== "true") {
      setShowAuthError(true);
      setTimeout(() => {
        navigate("/activity-tracker");
      }, 2000);
    }
  }, [email, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLeaveData({
      ...leaveData,
      [name]: value,
    });
  };

  const handleHalfDayChange = (e) => {
    setHalfDay(e.target.checked);
  };

  // Your existing calculateNumberOfDays function
// const calculateNumberOfDays = (fromDate, toDate, halfDay) => {
//   const from = new Date(fromDate);
//   const to = new Date(toDate);
//   let totalDays = 0;
//   let currentDate = new Date(from);

//   // Count each eligible day
//   while (currentDate <= to) {
//     const dayOfWeek = currentDate.getDay();
//     const dateOfMonth = currentDate.getDate();
//     const isSecondSaturday =
//       dayOfWeek === 6 && dateOfMonth >= 8 && dateOfMonth <= 14;
//     const isFourthSaturday =
//       dayOfWeek === 6 && dateOfMonth >= 22 && dateOfMonth <= 28;

//     // Only count Sundays and specified Saturdays
//     if (dayOfWeek === 0 || isSecondSaturday || isFourthSaturday) {
//       totalDays += 1;
//     }

//     currentDate.setDate(currentDate.getDate() + 1);
//   }

//   // Handle half day cases
//   if (halfDay) {
//     if (from.getTime() === to.getTime()) {
//       // Single day selection with half day
//       totalDays = 0.5;
//     } else if (totalDays === 2) {
//       // Two day selection with half day
//       totalDays = 1.5;
//     }
//   }

//   // Cap at maximum 2 days
//   return Math.min(totalDays, 2);
  // };
  
const calculateNumberOfDays = (fromDate, toDate, halfDay) => {
  const from = new Date(fromDate);
  const to = new Date(toDate);

  // Helper function to check if a date is weekend
  const isWeekend = (date) => {
    const day = date.getDay();
    return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
  };

  // If same day
  if (from.getTime() === to.getTime()) {
    return 1;
  }

  // Calculate the difference in days
  const diffTime = Math.abs(to - from);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Adding 1 to include both start and end dates

  // Handle half day case
  if (halfDay) {
    // If consecutive days (difference is 1 day)
    if (diffDays === 2) {
      return 1.5;
    }
  }

  return diffDays;
};
  const handleSubmit = (e) => {
    e.preventDefault();

    setLoading(true);
    handleLoading(true);
    if (
      !leaveData.reason ||
      !leaveData.fromDate || 
      !leaveData.toDate ||
      !leaveData.email
    ) {
      setError("All fields are required.");
      setLoading(false);
      handleLoading(false);
      return;
    }

    const numberOfDays = JSON.stringify(
      calculateNumberOfDays(leaveData.fromDate, leaveData.toDate, halfDay)
    );
    

    const leaveDataWithDays = {
      ...leaveData,
      numberOfDays,
    };

    setError("");

    fetch(
      "https://script.google.com/macros/s/AKfycbw8_FJNtP7duzyAvXqJwyPI-zpzNSY8fpkH4osGbdUGlMGbGZahsPFSeAF9NlsJtnwx/exec",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(leaveDataWithDays),
        mode: "no-cors",
      }
    )
      .then((response) => response.text())
      .then((data) => {
        setSuccessMessage("Compensatory request submitted successfully!");
        setLeaveData({
          type: "compOff",
          reason: "",
          fromDate: getTodayDate(),
          toDate: getTodayDate(),
          email: "",
        });
        setHalfDay(false);
        setLoading(false);
        handleLoading(false);
        setTimeout(() => setSuccessMessage(""), 4000);
      })
      .catch((error) => {
        console.error("Error sending data to Google Apps Script:", error);
        setError("Error submitting leave request.");
        setLoading(false);
        handleLoading(false);
      });
  };

  const handleLoading = (load) => {
    document.getElementById("root").style.opacity = load ? "0.8" : "1";
  };

  if (sessionStorage.getItem("isAuth") !== "true") {
    return (
      <Snackbar
        open={showAuthError}
        autoHideDuration={2000}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity="error" variant="filled" sx={{ width: "100%" }}>
          You are not authorized to access this page
        </Alert>
      </Snackbar>
    );
  }

  return (
    <div>
      <LoadingSpinner loading={loading} />
      <h1 style={{ textAlign: "center" }}>
        Compensatory Request Application Form
      </h1>
      <p style={{ textAlign: "center" }}></p>
      <form onSubmit={handleSubmit} className="form-1">
        {error && <p style={{ color: "red" }}>{error}</p>}
        <div>
          <div>
            <label>Employee Email:</label>
            <input
              type="email"
              name="email"
              value={leaveData.email}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div>
          <label>Reason for Working:</label>
          <textarea
            name="reason"
            value={leaveData.reason}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>From Date:</label>
          <input
            type="date"
            name="fromDate"
            value={leaveData.fromDate}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>To Date:</label>
          <input
            type="date"
            name="toDate"
            value={leaveData.toDate}
            onChange={handleChange}
            required
          />
        </div>
        <div className="tooltip">
          How to use Half Day?
          <span
            style={{
              width: "300px",
            }}
            className="tooltiptext"
          >
            Note: Do not change the date if you want to avail half day for the
            single day. If the date is increased by 1 and halfday is checked You
            will be availing today's leave + tomorrow's + half day.
          </span>
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "baseline",
            marginTop: "10px",
          }}
        >
          <label style={{ width: "25%" }}>Half Day:</label>
          <input
            style={{
              width: "20px",
            }}
            type="checkbox"
            name="halfDay"
            checked={halfDay}
            onChange={handleHalfDayChange}
          />
        </div>

        <button type="submit">Submit</button>
      </form>

      <Snackbar
        open={successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage("")}
      >
        <Alert
          onClose={() => setSuccessMessage("")}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default CompOff;
