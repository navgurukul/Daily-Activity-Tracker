import React, { useEffect, useState, useContext } from "react";
import "./LeaveManagement.css";
import { LoginContext } from "../context/LoginContext";
import { Snackbar, Alert, TextField, Autocomplete, CircularProgress, Select, MenuItem, FormControl, InputLabel, } from "@mui/material";
import axios from "axios";

const LeaveManagement = () => {
  const dataContext = useContext(LoginContext);
  const { email } = dataContext;
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const [selectedTab, setSelectedTab] = useState("pending");
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState("");
  const [allEmails, setAllEmails] = useState([]);
  const [filteredLeaveHistory, setFilteredLeaveHistory] = useState([]);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const [isApproving, setIsApproving] = useState(false);

  const [filterEmail, setFilterEmail] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  const fetchLeavesData = async (status, email = '', month = '') => {
    try {
      const response = await fetch(
        `https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/leave-records?status=${status}&employeeEmail=${email}&month=${month}&limit=100&page=1`
      );
      const data = await response.json();

      const result = [];
      const emails = [];




      Object.keys(data).forEach((email) => {
        emails.push(email);
        const userLeaves = data[email];

        userLeaves?.[status]?.forEach((record) =>
          result.push({ email, ...record })
        );
      });

      if (status === "pending") {
        setPendingLeaves(result);
      } else if (status === "approved") {
        setApprovedLeaves(result);
      }

    } catch (err) {
      console.error(`Failed to fetch ${status} leaves`, err);
    }
  };

  useEffect(() => {
    fetchLeavesData("pending");
  }, []);

  useEffect(() => {
    setSearchEmail("");
    setFilterEmail("");
    setFilterMonth("");
  }, [selectedTab]);

  useEffect(() => {
    if (selectedTab === "pending") {
      if (filterEmail || filterMonth) {
        fetchLeavesData("pending", filterEmail, filterMonth);
      } else {
        fetchLeavesData("pending"); // No filters applied
      }
    } else if (selectedTab === "approved") {
      if (filterEmail || filterMonth) {
        fetchLeavesData("approved", filterEmail, filterMonth);
      } else {
        fetchLeavesData("approved"); // No filters applied
      }
    }
  }, [filterEmail, filterMonth, selectedTab]);


  const handleApprove = async (leaveId) => {
    setIsApproving(true);
    try {
      const approveResponse = await fetch(
        "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employmentLeavePolicy",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            // Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
            Authorization: `Bearer ${sessionStorage.getItem("jwtToken")}`,
          },
          body: JSON.stringify({
            Id: leaveId,
            approverEmail: email,
            status: "approved",
          }),
        }
      );

      const approveResult = await approveResponse.json();
      if (approveResponse.ok) {
        const approvedLeave = pendingLeaves.find((leave) => leave.Id === leaveId);
        setPendingLeaves((prev) => prev.filter((leave) => leave.Id !== leaveId));
        setApprovedLeaves((prev) => [...prev, approvedLeave]);

        setSnackbarMessage(`Leave approved for ${approvedLeave.email}`);
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      } else {
        // setSnackbarMessage("Approval failed. Please try again.");
        setSnackbarMessage(
          approveResult?.message || "Approval failed. Please try again."
        );
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }

    } catch (error) {
      setSnackbarMessage("Something went wrong.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setIsApproving(false);
    }
  };

  const fetchLeaveBalance = async () => {
    if (!searchEmail) return;

    setLoadingBalance(true);
    setBalanceError("");
    setLeaveBalance([]);

    try {
      const response = await fetch(
        `https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employmentLeavePolicy?email=${searchEmail}`
      );
      const result = await response.json();

      if (result.success && result.data.length > 0) {
        setLeaveBalance(result.data[0].leaveRecords);
      } else {
        setBalanceError("No leave balance data found for this email.");
      }
    } catch (error) {
      console.error("Error:", error);
      setBalanceError("Error fetching leave balance data.");
    }

    setLoadingBalance(false);
  };

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const response = await axios.get(
          "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employeeSheetRecords?sheet=pncdata"
        );
        const teamIDs = Array.from(
          new Set(
            response.data?.data
              ?.map((entry) => entry["Team ID"])
              ?.filter((id) => !!id)
          )
        );
        setAllEmails(teamIDs);
      } catch (error) {
        console.error("Error fetching emails:", error);
        setSnackbarMessage("Failed to fetch emails");
      }
    };
    fetchEmails();
  }, []);

const fetchLeaveHistory = async (email, month) => {
    try {
      const response = await fetch(
        `https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/leave-records?employeeEmail=${email}&month=${month}&limit=100&page=1`
      );
      const data = await response.json();
      const history = [];
      Object.keys(data).forEach((emailKey) => {
        const userLeaves = data[emailKey];
        const allRecords = [
          ...(userLeaves.pending || []).map((r) => ({
            email: emailKey,
            status: "Pending",
            ...r
          })),
          ...(userLeaves.approved || []).map((r) => ({
            email: emailKey,
            status: "Approved",
            ...r })),
          ...(userLeaves.rejected || []).map((r) => ({
            email: emailKey,
            status: "Rejected",
            ...r })),
        ];
        history.push(...allRecords);
      });
      setLeaveHistory(history);
      setFilteredLeaveHistory(history);
    } catch (error) {
      console.error("Error fetching leave history:", error);
    }
  };
  useEffect(() => {
    if (selectedTab === "history") {
      fetchLeaveHistory(searchEmail, filterMonth);
    }
  }, [selectedTab, searchEmail, filterMonth]);     

  return (
    <div className="leave-container">
      <h1>Leave Dashboard</h1>

      <div className="tab">
        <button
          className={`tabs_button ${selectedTab === "pending" ? "active-tab" : ""
            }`}
          onClick={() => {
            setSelectedTab("pending");
            fetchLeavesData("pending");
          }}
        >
          Pending Requests
        </button>

        <button
          className={`tabs_button ${selectedTab === "approved" ? "active-tab" : ""
            }`}
          onClick={() => {
            setSelectedTab("approved");
            fetchLeavesData("approved");
          }}
        >
          Approved Leaves
        </button>
        <button
          className={`tabs_button ${selectedTab === "balance" ? "active-tab" : ""
            }`}
          onClick={() => setSelectedTab("balance")}
        >
          Allotted Leaves
        </button>
        <button
          className={`tabs_button ${selectedTab === "history" ? "active-tab" : ""
            }`}
          onClick={() => setSelectedTab("history")}
        >
          History
        </button>
      </div>


      {selectedTab === "pending" && (
        <div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <Autocomplete
              options={allEmails}
              value={filterEmail}
              onChange={(e, newValue) => setFilterEmail(newValue || "")}
              renderInput={(params) => <TextField {...params} label="Filter by Email" size="small" />}
              sx={{ minWidth: 260 }}
              freeSolo
              slotProps={{
                paper: {
                  sx: {
                    '& ul': {
                      maxHeight: 250,
                      overflowY: 'auto',
                    },
                  },
                },
              }}
            />

            <FormControl size="small" sx={{ minWidth: { xs: 260, sm: 160 } }}>
              <InputLabel id="month-select-label">Month</InputLabel>
              <Select
                labelId="month-select-label"
                value={filterMonth}
                label="Month"
                onChange={(e) => setFilterMonth(e.target.value)}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 200,
                      marginLeft: { xs: -1.5, sm: 0 },
                    },
                  },
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="01">January</MenuItem>
                <MenuItem value="02">February</MenuItem>
                <MenuItem value="03">March</MenuItem>
                <MenuItem value="04">April</MenuItem>
                <MenuItem value="05">May</MenuItem>
                <MenuItem value="06">June</MenuItem>
                <MenuItem value="07">July</MenuItem>
                <MenuItem value="08">August</MenuItem>
                <MenuItem value="09">September</MenuItem>
                <MenuItem value="10">October</MenuItem>
                <MenuItem value="11">November</MenuItem>
                <MenuItem value="12">December</MenuItem>
              </Select>
            </FormControl>
          </div>
          <div className="pending-data">

            {isApproving && (
              <div className="loader-overlay">
                <div className="loader-box">
                  <span style={{ marginLeft: "10px", fontWeight: "bold" }}>Approving leave...</span>
                  <CircularProgress size={24} />
                </div>
              </div>
            )}
            {pendingLeaves.length === 0 ? (
              <p>No pending leaves found.</p>
            ) : (
              <div style={{ sx: { overflowX: "auto" }, sm: { overflowX: "hidden" } }}>
                <table>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Leave Type</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Duration</th>
                      <th>Type</th>
                      <th>Reason</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingLeaves.map((leave, index) => (
                      <tr key={index}>
                        <td>{leave.email}</td>
                        <td>{leave.leaveType}</td>
                        <td>{leave.startDate}</td>
                        <td>{leave.endDate}</td>
                        <td>{leave.leaveDuration}</td>
                        <td>{leave.durationType}</td>
                        <td>{leave.reasonForLeave}</td>
                        <td>
                          <button
                            className="approve-button"
                            onClick={() => handleApprove(leave.Id)}
                          >
                            Approve
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedTab === "approved" && (
        <div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "10px", alignItems: "center", marginTop: '5px' }}>
            <Autocomplete
              options={allEmails}
              value={filterEmail}
              onChange={(e, newValue) => setFilterEmail(newValue || "")}
              renderInput={(params) => <TextField {...params} label="Filter by Email" size="small" />}
              sx={{ minWidth: 260 }}
              freeSolo
              slotProps={{
                paper: {
                  sx: {
                    '& ul': {
                      maxHeight: 250,
                      overflowY: 'auto',
                    },
                  },
                },
              }}
            />

            <FormControl size="small" sx={{ minWidth: { xs: 260, sm: 160 } }}>
              <InputLabel id="month-select-label">Month</InputLabel>
              <Select
                labelId="month-select-label"
                value={filterMonth}
                label="Month"
                onChange={(e) => setFilterMonth(e.target.value)}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 200,
                      marginLeft: { xs: -1.5, sm: 0 },
                    },
                  },
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="01">January</MenuItem>
                <MenuItem value="02">February</MenuItem>
                <MenuItem value="03">March</MenuItem>
                <MenuItem value="04">April</MenuItem>
                <MenuItem value="05">May</MenuItem>
                <MenuItem value="06">June</MenuItem>
                <MenuItem value="07">July</MenuItem>
                <MenuItem value="08">August</MenuItem>
                <MenuItem value="09">September</MenuItem>
                <MenuItem value="10">October</MenuItem>
                <MenuItem value="11">November</MenuItem>
                <MenuItem value="12">December</MenuItem>
              </Select>
            </FormControl>
          </div>
          <div className="approved-data">
            {approvedLeaves.length === 0 ? (
              <p>No approved leaves found.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Leave Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Duration</th>
                    <th>Type</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedLeaves.map((leave, index) => (
                    <tr key={index}>
                      <td>{leave.email}</td>
                      <td>{leave.leaveType}</td>
                      <td>{leave.startDate}</td>
                      <td>{leave.endDate}</td>
                      <td>{leave.leaveDuration}</td>
                      <td>{leave.durationType}</td>
                      <td>{leave.reasonForLeave}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {selectedTab === "balance" && (
        <div>
          <div className="balance-tab"
            style={{
              width: "100%",
              marginBottom: "15px",
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            <Autocomplete
              options={allEmails}
              value={searchEmail}
              onChange={(event, newValue) => {
                setSearchEmail(newValue || "");
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Filter by Email"
                  size="small"
                  sx={{ fontSize: "14px" }}
                />
              )}
              freeSolo
              sx={{ minWidth: 300 }}
              slotProps={{
                paper: {
                  sx: {
                    '& ul': {
                      maxHeight: 250,
                      overflowY: 'auto',
                    },
                  },
                },
              }}
            />
            <button
              className="filter-btn"
              onClick={fetchLeaveBalance}
              disabled={loadingBalance || !searchEmail}
            >
              View Balance
            </button>
          </div>
          {loadingBalance && (
            <div className="loading-indicator">
              <CircularProgress size={24} />
              <span style={{ marginLeft: "10px" }}>Loading balance...</span>
            </div>
          )}
          <div className="balance-data">
            {balanceError && <p style={{ color: "red" }}>{balanceError}</p>}

            {leaveBalance.length > 0 && (
              <table>
                <thead>
                  <tr>
                    <th>Leave Type</th>
                    <th>Leaves Used</th>
                    <th>Pending Leaves</th>
                    <th>Total Allotted</th>
                    <th>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveBalance.map((record, index) => (
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
        </div>
      )}

      {selectedTab === "history" && (
        <div>
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <Autocomplete
              options={allEmails}
              value={searchEmail}
              onChange={(event, newValue) => {
                setSearchEmail(newValue || "");
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Filter by Email"
                  size="small"
                  sx={{ fontSize: "14px" }}
                />
              )}
              freeSolo
              sx={{ minWidth: 260 }}
              slotProps={{
                paper: {
                  sx: {
                    '& ul': {
                      maxHeight: 250,
                      overflowY: 'auto',
                    },
                  },
                },
              }}
            />
            <FormControl size="small" sx={{ minWidth: { xs: 260, sm: 160 } }}>
              <InputLabel id="month-select-label">Month</InputLabel>
              <Select
                labelId="month-select-label"
                value={filterMonth}
                label="Month"
                onChange={(e) => setFilterMonth(e.target.value)}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 200,
                      marginLeft: { xs: -1.5, sm: 0 },
                    },
                  },
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="01">January</MenuItem>
                <MenuItem value="02">February</MenuItem>
                <MenuItem value="03">March</MenuItem>
                <MenuItem value="04">April</MenuItem>
                <MenuItem value="05">May</MenuItem>
                <MenuItem value="06">June</MenuItem>
                <MenuItem value="07">July</MenuItem>
                <MenuItem value="08">August</MenuItem>
                <MenuItem value="09">September</MenuItem>
                <MenuItem value="10">October</MenuItem>
                <MenuItem value="11">November</MenuItem>
                <MenuItem value="12">December</MenuItem>
              </Select>
            </FormControl>
          </div>
          <div className="history-data">
            {filteredLeaveHistory.length === 0 ? (
              <p>No leave history found.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    {/* <th>ID</th> */}
                    <th>Email</th>
                    <th>Leave Type</th>
                    <th>From</th>
                    <th>To</th>
                    <th>Duration</th>
                    <th>Type</th>
                    <th>Reason</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaveHistory.map((leave, index) => (
                    <tr key={index}>
                      {/* <td>{leave.Id}</td> */}
                      <td>{leave.email}</td>
                      <td>{leave.leaveType}</td>
                      <td>{leave.startDate}</td>
                      <td>{leave.endDate}</td>
                      <td>{leave.leaveDuration}</td>
                      <td>{leave.durationType}</td>
                      <td>{leave.reasonForLeave}</td>
                      <td>{leave.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{
            width: "100%",
            backgroundColor:
              snackbarSeverity === "success" ? "#4CAF50" : "#f44336",
            color: "white",
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default LeaveManagement;