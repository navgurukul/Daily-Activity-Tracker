import "./CompOff.css";
import React, { useState, useEffect, useContext } from "react";
import config from "../../../public/api";
import { useNavigate } from "react-router-dom";
import { LoginContext } from "../context/LoginContext";
import LoadingSpinner from "../Loader/LoadingSpinner";
import { useLoader } from "../context/LoadingContext";
import VisibilityIcon from "@mui/icons-material/Visibility";

const CompOff = () => {
  const dataContext = useContext(LoginContext);
  const { email } = dataContext;
  const { loading, setLoading } = useLoader();
  const navigate = useNavigate();

  const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const [leaveData, setLeaveData] = useState({
    type: "leave",
    reason: "",
    fromDate: getTodayDate(),
    toDate: getTodayDate(),
    email: email,
  });

  const [halfDay, setHalfDay] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!email) {
      navigate("/");
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

  const calculateNumberOfDays = (fromDate, toDate, halfDay) => {
    const from = new Date(fromDate);
    const to = new Date(toDate);

    // If fromDate and toDate are the same and halfDay is checked, return 0.5
    if (fromDate === toDate && halfDay) {
      return 0.5;
    }

    let totalDays = 0;
    let currentDate = new Date(from);

    while (currentDate <= to) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
      const dateOfMonth = currentDate.getDate();
      const isSecondSaturday =
        dayOfWeek === 6 && dateOfMonth >= 8 && dateOfMonth <= 14;
      const isFourthSaturday =
        dayOfWeek === 6 && dateOfMonth >= 22 && dateOfMonth <= 28;

      if (dayOfWeek !== 0 && !isSecondSaturday && !isFourthSaturday) {
        totalDays++;
      }

      // Move to the next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // If half day is selected, add 0.5 to the total days if fromDate and toDate are different
    if (halfDay && fromDate !== toDate) {
      totalDays += 0.5;
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

    // Calculate the number of days
    const numberOfDays = JSON.stringify(
      calculateNumberOfDays(leaveData.fromDate, leaveData.toDate, halfDay)
    );

    const leaveDataWithDays = {
      ...leaveData,
      numberOfDays,
    };

    setError(""); // Clear any previous error messages

    const url =
      "https://script.google.com/macros/s/AKfycbwFbXYZ1LwqVL1qRbhX4xtV1DQnCEWHpC5QTaKK0D04fc1UEko8NFdi3Ie5TQ9fBEe6TA/exec";
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
        setSuccessMessage("Leave request submitted successfully!");
        setLeaveData({
          type: "leave",
          reason: "",
          fromDate: getTodayDate(),
          toDate: getTodayDate(),
          email: email,
        });
        setHalfDay(false);
        setLoading(false);
        handleLoading(false);
        setTimeout(() => setSuccessMessage(""), 4000); // Clear message after 4 seconds
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

  return (
    <div>
      <LoadingSpinner loading={loading} />
      <h1 style={{ textAlign: "center" }}>Compensatory Leave Form </h1>
      <p style={{ textAlign: "center" }}></p>
      <form onSubmit={handleSubmit}>
        {successMessage && <h1 style={{ color: "green" }}>{successMessage}</h1>}
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
              disabled
            />
          </div>
        </div>

        <div>
          <label>Reason for Working :</label>
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
        {/* <div className="tooltip">
          How to use Half Day?
          
        </div> */}

        {/* <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginTop: "10px",
          }}
        >
          <label style={{}}>Half Day:</label>
          <div className="tooltip">
         <VisibilityIcon/>
         <span
            style={{
              width: "300px",
            }}
            className="texttool"
          >
            Note: Do not change the date if you want to avail half day for the
            single day. If the date is increased by 1 and halfday is checked You
            will be availing today's leave + tomorrow's + half day.
          </span>
         </div>
        </div> */}

        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default CompOff;
