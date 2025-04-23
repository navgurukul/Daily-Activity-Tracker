import React, { useEffect, useState } from "react";
import "./LeaveHistory.css";

const LeaveHistory = () => {
  const [leaveRecords, setLeaveRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(
      "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/leave-records?employeeEmail=Amitkumar@navgurukul.org"
    )
      .then((res) => res.json())
      .then((data) => {
        setLeaveRecords(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching leave records:", err);
        setLeaveRecords([]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="leave-history-container">
      <h2>Leave History</h2>

      {loading ? (
        <p>Loading leave records...</p>
      ) : leaveRecords.length === 0 ? (
        <p>No leave records found.</p>
      ) : (
        <table className="leave-table">
          <thead>
            <tr>
              <th>From Date</th>
              <th>To Date</th>
              <th>Leave Type</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {leaveRecords.map((record, index) => (
              <tr key={index}>
                <td>{record.fromDate}</td>
                <td>{record.toDate}</td>
                <td>{record.leaveType}</td>
                <td>{record.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default LeaveHistory;
