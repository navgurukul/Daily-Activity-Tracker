import React, { useState, useEffect, useContext } from "react";
import "./Leaves.css";
import config from "../../config";
import { useNavigate } from "react-router-dom";
import { LoginContext } from "../context/LoginContext";

const Leaves = () => {
  const dataContext = useContext(LoginContext);
  const { email } = dataContext;
  const [leaveData, setLeaveData] = useState({
    type: "leave",
    leaveType: "",
    reason: "",
    fromDate: "",
    toDate: "",
    email: email,
  });

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLeaveData({
      ...leaveData,
      [name]: value,
    });
  };
  useEffect(() => {
    if (!email) {
      navigate("/");
    }
  }, []);

  const calculateNumberOfDays = (fromDate, toDate) => {
    const from = new Date(fromDate);
    const to = new Date(toDate);
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

    return totalDays;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    handleLoading(true);
    setLoading(true);
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
          email: email,
        });

        setLoading(false);

        handleLoading(false);
        setTimeout(() => setSuccessMessage(""), 4000); // Clear message after 3 seconds
      })
      .catch((error) => {
        console.error("Error sending data to Google Apps Script:", error);
        setError("Error submitting leave request.");
      });
  };
  const handleLoading = (load) => {
    load == true
      ? (document.getElementById("root").style.opacity = "0.8")
      : (document.getElementById("root").style.opacity = "1");
  };

  return (
    <div>
      <div
        aria-label="Orange and tan hamster running in a metal wheel"
        role="img"
        class="wheel-and-hamster"
        style={{
          position: "absolute",
          display: loading ? "block" : "none",
          top: "42%",
          left: "45%",
          zIndex: "100",
        }}
      >
        <div class="wheel"></div>
        <div class="hamster">
          <div class="hamster__body">
            <div class="hamster__head">
              <div class="hamster__ear"></div>
              <div class="hamster__eye"></div>
              <div class="hamster__nose"></div>
            </div>
            <div class="hamster__limb hamster__limb--fr"></div>
            <div class="hamster__limb hamster__limb--fl"></div>
            <div class="hamster__limb hamster__limb--br"></div>
            <div class="hamster__limb hamster__limb--bl"></div>
            <div class="hamster__tail"></div>
          </div>
        </div>
        <div class="spoke"></div>
      </div>
      <h1 style={{ textAlign: "center" }}>Leave Application Form</h1>
      <p style={{ textAlign: "center" }}>
        {" "}
        Make Sure to check the leave balance before applying
      </p>
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

        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default Leaves;
