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
  const calculateNumberOfDays = (fromDate, toDate, halfDay) => {
    const from = new Date(fromDate);
    const to = new Date(toDate);




    let totalDays = 0;
    let currentDate = new Date(from);

    while (currentDate <= to) {
      const dayOfWeek = currentDate.getDay();
      const dateOfMonth = currentDate.getDate();
      const isSecondSaturday =
        dayOfWeek === 6 && dateOfMonth >= 8 && dateOfMonth <= 14;
      const isFourthSaturday =
        dayOfWeek === 6 && dateOfMonth >= 22 && dateOfMonth <= 28;

      if (dayOfWeek === 0 || isSecondSaturday || isFourthSaturday) {
        totalDays++;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (halfDay) {
      if (from.getTime() === to.getTime()) {
        totalDays -= 0.5;
      } else if (from.getTime() !== to.getTime()) {
        totalDays -= 0.5;
      }
    }
    

    return totalDays;
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

    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(leaveDataWithDays),
      mode: "no-cors",
    })
      .then((response) => response.text())
      .then((data) => {
        setSuccessMessage("Compensatory request submitted successfully!");
        setLeaveData({
          type: "leave",
          reason: "",
          fromDate: getTodayDate(),
          toDate: getTodayDate(),
          email: "",
        });
        setHalfDay(false);
        setLoading(false);
        handleLoading(false);
        setTimeout(() => setSuccessMessage(""), 4000);
        setTimeout(()=>{window.location.reload()}, 1000)
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
