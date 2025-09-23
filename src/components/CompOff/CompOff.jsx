import "./CompOff.css";
import React, { useState, useEffect, useContext } from "react";
import { LoginContext } from "../Context/LoginContext";
import LoadingSpinner from "../Loader/LoadingSpinner";
import { useLoader } from "../Context/LoadingContext";
import { Snackbar, Alert, Box, Typography, Autocomplete, TextField } from "@mui/material";

const CompOff = () => {
  // Context
  const dataContext = useContext(LoginContext);
  const { email } = dataContext;

  // Loading State
  const { loading, setLoading } = useLoader();

  // Email State
  const [emailList, setEmailList] = useState([]);

  // Get today’s date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Leave Data State
  const [leaveData, setLeaveData] = useState({
    leaveType: "Compensatory Leave",
    reasonForLeave: "",
    startDate: getTodayDate(),
    endDate: getTodayDate(),
    userEmail: "",
    durationType: "",
    halfDayStatus: "",
    status: "pending",
  });

  // Error & Success State
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    userEmail: "",
    reasonForLeave: "",
    durationType: "",
    halfDayStatus: "",
  });

  // API Base URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Fetch team email IDs
  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/employeeSheetRecords?sheet=pncdata`
        );
        const result = await response.json();
        if (result.success) {
          const emails = result.data
            .map((item) => item["Team ID"])
            .filter((email) => email)
            .sort((a, b) => a.localeCompare(b));
          setEmailList(emails);
        }
      } catch (error) {
        console.error("Error fetching emails:", error);
      }
    };
    fetchEmails();
  }, []);

  // Input change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setLeaveData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    handleLoading(true);
    // Local validation
    const errors = {
      userEmail: leaveData.userEmail.trim() === "" ? "Please select an email*" : "",
      reasonForLeave: leaveData.reasonForLeave.trim() === "" ? "Please enter a reason*" : "",
      durationType: leaveData.durationType.trim() === "" ? "Please select a duration type*" : "",
      halfDayStatus:
        leaveData.durationType === "half-day" && leaveData.halfDayStatus.trim() === ""
          ? "Please select a half day status*"
          : "",
    };

    setFieldErrors(errors);

    // Stop submission if errors exist
    if (Object.values(errors).some(Boolean)) {
      setLoading(false);
      handleLoading(false);
      return;
    }

    // Prepare payload for submission
    const payload = { ...leaveData };
    if (payload.durationType !== "half-day") {
      delete payload.halfDayStatus;
    }

    // Get JWT token from local storage
    const token = localStorage.getItem("jwtToken");

    // Submit leave request
    try {
      const response = await fetch(
        `${API_BASE_URL}/employmentLeavePolicy/Compensatory`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(payload),
        }
      );

      const responseData = await response.json();

      // Handle Backend validation errors
      if (!response.ok) {
        const errorMessage =
          responseData?.message || "Failed to submit leave request.";
        throw new Error(errorMessage);
      }

      // Reset form and show success message
      setSuccessMessage("Compensatory request submitted successfully!");
      setLeaveData({
        leaveType: "Compensatory Leave",
        reasonForLeave: "",
        startDate: getTodayDate(),
        endDate: getTodayDate(),
        userEmail: "",
        durationType: "",
        halfDayStatus: "",
        status: "pending",
      });

      setFieldErrors({});
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (error) {
      console.error("Error submitting leave:", error);
      setError(error.message);
    } finally {
      setLoading(false);
      handleLoading(false);
    }
  };

  // Loading state handler
  const handleLoading = (load) => {
    document.getElementById("root").style.opacity = load ? "0.8" : "1";
  };


  return (
    <div style={{ overflowY: "scroll", height: "100vh", marginTop: "45px" }}>
      {/* Loading Spinner */}
      <LoadingSpinner loading={loading} />
      {/* Form Header */}
      <h1 style={{ textAlign: "center" }}>
        Compensatory Request Application Form
      </h1>

      {/* Comp Off Form */}
      <form onSubmit={handleSubmit} className="form-1">
        {/* Employee Email with Dropdown */}
        <Box sx={{ textAlign: 'left', mb: 0 }}>
          <Typography
            htmlFor="userEmail"
            sx={{ fontWeight: 'bold', mb: 1.2, color: 'black' }}
          >
            Employee Email:
          </Typography>

          <Autocomplete
            options={emailList}
            value={leaveData.userEmail}
            onChange={(event, newValue) => {
              handleChange({
                target: { name: 'userEmail', value: newValue || "" },
              });
            }}
            freeSolo
            renderInput={(params) => (
              <TextField
                {...params}
                id="userEmail"
                name="userEmail"
                variant="outlined"
                size="small"
                fullWidth
                sx={{
                  '& .MuiInputBase-root': {
                    height: 36,
                  },
                  '& .MuiInputBase-input': {
                    border: 'none',
                    outline: 'none',
                  },
                }}
              />
            )}
          />
          {/** Error Message */}
          {fieldErrors.userEmail && (
            <div className="error-message" style={{ marginTop: "-24px" }}>{fieldErrors.userEmail}</div>
          )}
        </Box>


        {/* Reason field */}
        <div>
          <label>Reason for Working:</label>
          <textarea
            name="reasonForLeave"
            value={leaveData.reasonForLeave}
            onChange={handleChange}
          />
          {fieldErrors.reasonForLeave && (
            <div className="error-message" style={{ marginTop: "-5px" }}>{fieldErrors.reasonForLeave}</div>
          )}
        </div>

        {/* Start Date */}
        <div>
          <label>From Date:</label>
          <input
            type="date"
            name="startDate"
            value={leaveData.startDate}
            onChange={handleChange}
            required
          />
        </div>

        {/* End Date */}
        <div>
          <label>To Date:</label>
          <input
            type="date"
            name="endDate"
            value={leaveData.endDate}
            onChange={handleChange}
            required
          />
        </div>

        {/* Duration Type */}
        <div>
          <label>Duration Type:</label>
          <select
            name="durationType"
            value={leaveData.durationType}
            onChange={handleChange}
          >
            <option value="">Select Duration</option>
            <option value="full-day">Full Day</option>
            <option value="half-day">Half Day</option>
          </select>
          {fieldErrors.durationType && (
            <div className="error-message" style={{ marginTop: "0px" }}>{fieldErrors.durationType}</div>
          )}
        </div>

        {/* Half Day Status (only if half-day selected) */}
        {leaveData.durationType === "half-day" && (
          <div>
            <label>Half Day Status:</label>
            <select
              name="halfDayStatus"
              value={leaveData.halfDayStatus}
              onChange={handleChange}
            >
              <option value="">Select Half Day Status</option>
              <option value="first-half">First Half</option>
              <option value="second-half">Second Half</option>
            </select>
            {/* Error Message */}
            {fieldErrors.halfDayStatus && (
              <div className="error-message" style={{ marginTop: "0px" }}>{fieldErrors.halfDayStatus}</div>
            )}
          </div>
        )}

        {/* Raised By (disabled field) */}
        <div>
          <label>Comp Off Raised By:</label>
          <input
            type="text"
            name="leaveIsRaisingFrom"
            value={email}
            disabled
            readOnly
          />
        </div>

        {/* Submit Button */}
        <button type="submit">Submit</button>
      </form>

      {/* Success Snackbar */}
      <Snackbar
        open={Boolean(successMessage)}
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

      {/* Error Snackbar */}
      <Snackbar
        open={Boolean(error)}
        autoHideDuration={6000}
        onClose={() => setError("")}
      >
        <Alert
          onClose={() => setError("")}
          severity="error"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default CompOff;