import React, { useState } from "react";
import "./Leaves.css";
import config from "../../config";

const Leaves = () => {
  const [leaveData, setLeaveData] = useState({
    type: "leave",
    leaveType: "",
    reason: "",
    fromDate: "",
    toDate: "",
    email: "",
  });
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLeaveData({
      ...leaveData,
      [name]: value,
    });
  };

  const calculateNumberOfDays = (fromDate, toDate) => {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const timeDiff = to - from;
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return daysDiff;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !leaveData.leaveType ||
      !leaveData.reason ||
      !leaveData.fromDate ||
      !leaveData.toDate ||
      !leaveData.email
    ) {
      setError("All fields are required.");
      return;
    }

    // Calculate the number of days
    const numberOfDays = calculateNumberOfDays(
      leaveData.fromDate,
      leaveData.toDate
    );

    const leaveDataWithDays = {
      ...leaveData,
      numberOfDays,
      };
      console.log(leaveDataWithDays);

    setError(""); // Clear any previous error messages

      const url = config.LEAVE_SUBMIT_URL;
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
        console.log("Response from Google Apps Script:", data);
        setSuccessMessage("Leave request submitted successfully!");
        setLeaveData({
          type: "leave",
          leaveType: "",
          reason: "",
          fromDate: "",
          toDate: "",
          email: "",
        });
        setTimeout(() => setSuccessMessage(""), 3000); // Clear message after 3 seconds
      })
      .catch((error) => {
        console.error("Error sending data to Google Apps Script:", error);
        setError("Error submitting leave request.");
      });
  };

  return (
    <form onSubmit={handleSubmit}>
      {successMessage && <h1 style={{ color: "green" }}>{successMessage}</h1>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div>
        <label>Leave Type:</label>
        <select
          name="leaveType"
          value={leaveData.leaveType}
          onChange={handleChange}
          required
        >
          <option value="">--Select Leave Type--</option>
          <option value="bereavement">Bereavement</option>
          <option value="casual">Casual</option>
          <option value="wellness">Wellness</option>
          <option value="wedding">Wedding</option>
        </select>
      </div>

      <div>
        <label>Reason for Leave:</label>
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

      <button type="submit">Submit</button>
    </form>
  );
};

export default Leaves;
