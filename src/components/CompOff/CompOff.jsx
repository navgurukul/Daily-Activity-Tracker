import "./CompOff.css";
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { LoginContext } from "../context/LoginContext";
import LoadingSpinner from "../Loader/LoadingSpinner";
import { useLoader } from "../context/LoadingContext";
import { Snackbar, Alert } from "@mui/material";
import url from "../../../public/api";

const CompOff = () => {
  const dataContext = useContext(LoginContext);
  const { email } = dataContext;
  const { loading, setLoading } = useLoader();
  const navigate = useNavigate();
  const [showAuthError, setShowAuthError] = useState(false);

  const [emailList, setEmailList] = useState([]);

  const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const [leaveData, setLeaveData] = useState({
    leaveType: "Compensatory Leave",
    reasonForLeave: "",
    startDate: getTodayDate(),
    endDate: getTodayDate(),
    userEmail: "",
    leaveIsRaisingFrom: email,
    durationType: "",  // full-day or half-day
    halfDayStatus: "", // first-half or second-half
    status: "pending",
  });

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLeaveData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    handleLoading(true);
  
    const payload = { ...leaveData };
    if (payload.durationType !== "half-day") {
      delete payload.halfDayStatus;
    }
  
    const token = sessionStorage.getItem("jwtToken");
  
    try {
      const response = await fetch(
        "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employmentLeavePolicy/Compensatory",
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
      console.log(responseData, "Response from API");
  
      if (!response.ok) {
        // Show the specific message from backend if available
        const errorMessage =
          responseData?.message || "Failed to submit leave request.";
        throw new Error(errorMessage);
      }
  
      setSuccessMessage("Compensatory request submitted successfully!");
      setLeaveData({
        leaveType: "Compensatory Leave",
        reasonForLeave: "",
        startDate: getTodayDate(),
        endDate: getTodayDate(),
        userEmail: "",
        leaveIsRaisingFrom: email,
        durationType: "",
        halfDayStatus: "",
        status: "pending",
      });
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (error) {
      console.error("Error submitting leave:", error);
      setError(error.message);
    } finally {
      setLoading(false);
      handleLoading(false);
    }
  };  

  const handleLoading = (load) => {
    document.getElementById("root").style.opacity = load ? "0.8" : "1";
  };

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const response = await fetch(
          "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employeeSheetRecords?sheet=pncdata"
        );
        const result = await response.json();
        if (result.success) {
          const emails = result.data
            .map((item) => item["Team ID"])
            .filter((email) => email); // filter out null/undefined
          setEmailList(emails);
        }
      } catch (error) {
        console.error("Error fetching emails:", error);
      }
    };
    fetchEmails();
  }, []);

  return (
    <div style={{ overflowY: "scroll", height: "100vh", marginTop: "45px" }}>
      <LoadingSpinner loading={loading} />
      <h1 style={{ textAlign: "center" }}>
        Compensatory Request Application Form
      </h1>

      <form onSubmit={handleSubmit} className="form-1">
        <div>
          <label htmlFor="userEmail">Employee Email:</label>
          <input
        type="email"
        name="userEmail"
        list="email-options"
        value={leaveData.userEmail}
        onChange={handleChange}
        required
      />
      <datalist id="email-options">
        {emailList.map((email, index) => (
          <option key={index} value={email} />
        ))}
      </datalist>
        </div>

        {/* Reason */}
        <div>
          <label>Reason for Working:</label>
          <textarea
            name="reasonForLeave"
            value={leaveData.reasonForLeave}
            onChange={handleChange}
            required
          />
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
            required
          >
            <option value="">Select Duration</option>
            <option value="full-day">Full Day</option>
            <option value="half-day">Half Day</option>
          </select>
        </div>

        {/* Half Day Status (only if half-day selected) */}
        {leaveData.durationType === "half-day" && (
          <div>
            <label>Half Day Status:</label>
            <select
              name="halfDayStatus"
              value={leaveData.halfDayStatus}
              onChange={handleChange}
              required
            >
              <option value="">Select Half Day Status</option>
              <option value="first-half">First Half</option>
              <option value="second-half">Second Half</option>
            </select>
          </div>
        )}

        {/* Raised By (disabled field) */}
        <div>
          <label>Comp Off Raised By:</label>
          <input
            type="text"
            name="leaveIsRaisingFrom"
            value={leaveData.leaveIsRaisingFrom}
            disabled
            readOnly
          />
        </div>

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