import React, { useEffect, useState } from "react";
import "./LeaveManagement.css";

const LeaveManagement = () => {
  const [leaveData, setLeaveData] = useState({});
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [selectedTab, setSelectedTab] = useState("pending");
  const [allEmail, setAllEmail] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");

  useEffect(() => {
    fetch("https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employmentLeavePolicy")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLeaveData(data.data);

          const pending = [];
          Object.keys(data.data).forEach((email) => {
            data.data[email].leaveRecords.forEach((record) => {
              if (record.pendingLeaves > 0) {
                pending.push({
                  email,
                  leaveType: record.leaveType,
                  pendingLeaves: record.pendingLeaves,
                  raisedDate: new Date().toLocaleDateString() // Placeholder
                });
              }
            });
          });
          setPendingLeaves(pending);
        }
      })
      .catch((err) => console.error("Failed to fetch data", err));
  }, []);

  const handleApprove = (email, leaveType) => {
    console.log(`Approving leave for ${email} - ${leaveType}`);
    alert(`Leave approved for ${email} (${leaveType})`);
    // TODO: Call API to update backend
  };

  const getFilteredLeaveRecords = () => {
    if (!allEmail || !selectedMonth) return [];
    const records = leaveData[allEmail]?.leaveRecords || [];
    return records.filter((record) => {
      const start = new Date(record.startDate);
      return start.getMonth() + 1 === parseInt(selectedMonth);
    });
  };
  

  return (
    <div className="leave-container">
      <h1>Leave Management</h1>

      <div className="tabs">
        <button
          className={`tab-button ${selectedTab === "pending" ? "active-tab" : ""}`}
          onClick={() => setSelectedTab("pending")}
        >
          Pending Leaves
        </button>
        <button
          className={`tab-button ${selectedTab === "viewer" ? "active-tab" : ""}`}
          onClick={() => setSelectedTab("viewer")}
        >
          Leave Viewer
        </button>
        <button
          className={`tab-button ${selectedTab === "all" ? "active-tab" : ""}`}
          onClick={() => setSelectedTab("all")}
        >
          All Leave Applications
        </button>
      </div>

      {selectedTab === "pending" && (
        <div>
          {pendingLeaves.length === 0 ? (
            <p>No pending leaves found.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Leave Type</th>
                  <th>Pending Leaves</th>
                  <th>Raised Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingLeaves.map((leave, index) => (
                  <tr key={index}>
                    <td>{leave.email}</td>
                    <td>{leave.leaveType}</td>
                    <td>{leave.pendingLeaves}</td>
                    <td>{leave.raisedDate}</td>
                    <td>
                      <button
                        className="approve-button"
                        onClick={() => handleApprove(leave.email, leave.leaveType)}
                      >
                        Approve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedTab === "viewer" && (
        <div>
          <label>Filter by Email:</label>
          <select
            value={selectedEmail}
            onChange={(e) => setSelectedEmail(e.target.value)}
          >
            <option value="">Select an email</option>
            {Object.keys(leaveData).map((email) => (
              <option key={email} value={email}>
                {email}
              </option>
            ))}
          </select>

          {selectedEmail && leaveData[selectedEmail] && (
            <table>
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Used</th>
                  <th>Pending</th>
                  <th>Allotted</th>
                  <th>Left</th>
                </tr>
              </thead>
              <tbody>
                {leaveData[selectedEmail].leaveRecords.map((record, index) => (
                  <tr key={index}>
                    <td>{record.leaveType}</td>
                    <td>{record.usedLeaves}</td>
                    <td>{record.pendingLeaves}</td>
                    <td>{record.totalLeavesAllotted}</td>
                    <td>{record.leaveLeft}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedTab === "all" && (
        <div>
          <label>Email:</label>
          <select
            value={allEmail}
            onChange={(e) => setAllEmail(e.target.value)}
          >
            <option value="">Select an email</option>
            {Object.keys(leaveData).map((email) => (
              <option key={email} value={email}>
                {email}
              </option>
            ))}
          </select>

          <label style={{ marginLeft: "10px" }}>Month:</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            <option value="">Select month</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>

          {allEmail && selectedMonth && (
            <table>
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>Reason</th>
                <th>No. of Days</th>
                <th>Start Date</th>
                <th>End Date</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredLeaveRecords().map((record, index) => (
                <tr key={index}>
                  <td>{record.leaveType}</td>
                  <td>{record.reason || "—"}</td>
                  <td>{record.totalDays || "—"}</td>
                  <td>{record.startDate || "—"}</td>
                  <td>{record.endDate || "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="5">Will be Available Soon</td>
              </tr>
            </tfoot>
          </table>          
          )}
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
