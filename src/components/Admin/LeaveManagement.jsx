import React, { useEffect, useState, useContext } from "react";
import "./LeaveManagement.css";
import { LoginContext } from "../context/LoginContext";
import { Snackbar, Alert, TextField, Autocomplete, CircularProgress, Select, MenuItem, FormControl, InputLabel, Box, Button, Chip, FormControlLabel, Checkbox } from "@mui/material";
import axios from "axios";
import AdjustLeaveModal from "./AdjustLeaveModal";

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

  const [inputError, setInputError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState([]);

  const [isDownloading, setIsDownloading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  // NEW STATE FOR MODAL
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);

  const fetchLeavesData = async (status, email = '', month = '') => {
    setLoading(true)
    try {
      const response = await fetch(
        `${API_BASE_URL}/leave-records?status=${status}&employeeEmail=${email}&month=${month}&limit=100&page=1`
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
    } finally {
      setLoading(false);
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
        `${API_BASE_URL}/employmentLeavePolicy`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
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
    if (!searchEmail) {
      setInputError("Please select an email*")
      return;
    }
    setInputError("");

    setLoadingBalance(true);
    setBalanceError("");
    setLeaveBalance([]);

    try {
      const response = await fetch(
        `${API_BASE_URL}/employmentLeavePolicy?email=${searchEmail}`
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

  // NEW FUNCTION FOR HANDLING SUCCESSFUL LEAVE ADJUSTMENT
  const handleAdjustSuccess = (message) => {
    setSnackbarMessage(message);
    setSnackbarSeverity("success");
    setSnackbarOpen(true);

    // Refresh leave balance data if user is still selected
    if (searchEmail) {
      fetchLeaveBalance();
    }
  };

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/employeeSheetRecords?sheet=pncdata`
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
    setLoading(true)
    try {
      const response = await fetch(
        `${API_BASE_URL}/leave-records?employeeEmail=${email}&month=${month}&limit=100&page=1`
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
            ...r
          })),
          ...(userLeaves.rejected || []).map((r) => ({
            email: emailKey,
            status: "Rejected",
            ...r
          })),
        ];
        history.push(...allRecords);
      });
      setLeaveHistory(history);
      setFilteredLeaveHistory(history);
    } catch (error) {
      console.error("Error fetching leave history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTab === "history") {
      fetchLeaveHistory(searchEmail, filterMonth);
    }
  }, [selectedTab, searchEmail, filterMonth]);

  const clearFilters = () => {
    setFilterEmail("");
    setSearchEmail("")
    setFilterMonth("");
  };

  const handleCheckbox = (leaveId) => {
    setSelectedLeave((prevSelected) =>
      prevSelected.includes(leaveId)
        ? prevSelected.filter((id) => id !== leaveId)
        : [...prevSelected, leaveId]
    );
  };


  const handleApproveAll = async () => {
    if (selectedLeave.length === 0) {
      setSnackbarMessage("Please select leave to approve.");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }
    setIsApproving(true);

    const approverEmail = email;
    const token = localStorage.getItem("jwtToken");

    const leaveData = pendingLeaves
    .filter((leave) => selectedLeave.includes(leave.Id))
    .map((leave) => ({
      Id: leave.Id,
      approverEmail,
      status: "approved",
    }));

    try {
      const response = await fetch(
        `${API_BASE_URL}/employmentLeavePolicy`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            isBulkUpload: true,
            leaveData,
          }),
        }
      );

      const result = await response.json();
      console.log("Bulk approval response:", result);

      if (response.ok) {
        // setApprovedLeaves((prev) => [...prev, ...pendingLeaves]);
        // setPendingLeaves([]);
        const newlyApproved = pendingLeaves.filter((leave) => selectedLeave.includes(leave.Id));
        const stillPending = pendingLeaves.filter((leave) => !selectedLeave.includes(leave.Id));

        setApprovedLeaves((prev) => [...prev, ...newlyApproved]);
        setPendingLeaves(stillPending);

        setSnackbarMessage("Selected leaves approved successfully.");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      } else {
        setSnackbarMessage(result?.message || "Bulk approval failed.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }

    } catch (error) {
      console.error("Bulk approval error:", error);
      setSnackbarMessage("Something went wrong during bulk approval.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setIsApproving(false);
    }
  };

  const handleSelectAll = (isChecked) => {
  if (isChecked) {
    const allIds = pendingLeaves.map(leave => leave.Id);
    setSelectedLeave(allIds);
  } else {
    setSelectedLeave([]);
  }
};

const downloadCSV = async () => {
  setIsDownloading(true); // show loader

  let currentPage = 1;
  const totalPages = 45;
  let allUsers = [];

  try {
    while (currentPage <= totalPages) {
      const response = await fetch(`${API_BASE_URL}/employmentLeavePolicy?page=${currentPage}`);
      const result = await response.json();

      if (result.success) {
        const pageData = result.data || [];
        if (pageData.length > 0) {
          allUsers.push(...pageData);
        }
      }
      currentPage++;
    }

    if (allUsers.length === 0) {
      alert('No data found.');
      return;
    }

    const rows = [];
    allUsers.forEach((user) => {
      user.leaveRecords.forEach((record) => {
        rows.push({
          Email: user.userEmail,
          LeaveType: record.leaveType,
          UsedLeaves: record.usedLeaves,
          PendingLeaves: record.pendingLeaves,
          AllottedLeaves: record.totalLeavesAllotted,
          LeaveLeft: record.leaveLeft,
        });
      });
    });

    const header = ['Email', 'LeaveType', 'UsedLeaves', 'PendingLeaves', 'AllottedLeaves', 'LeaveLeft'];
    const csvContent = [
      header.join(','),
      ...rows.map(row => header.map(field => `"${row[field]}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'leave_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('Error downloading:', error);
    alert('Error occurred during download.');
  } finally {
    setIsDownloading(false); // hide loader
  }
};

  return (
    <div className="leave-container">
      <h1>Leave Dashboard </h1>

      <div className="tab">
        <button
          className={`tab_button ${selectedTab === "pending" ? "active-tab" : ""
            }`}
          onClick={() => {
            setSelectedTab("pending");
            fetchLeavesData("pending");
          }}
        >
          ⏳ Pending Requests
        </button>

        <button
          className={`tab_button ${selectedTab === "approved" ? "active-tab" : ""
            }`}
          onClick={() => {
            setSelectedTab("approved");
            fetchLeavesData("approved");
          }}
        >
          ✔️ Approved Leaves
        </button>
        <button
          className={`tab_button ${selectedTab === "balance" ? "active-tab" : ""
            }`}
          onClick={() => setSelectedTab("balance")}
        >
          📋 Allotted Leaves
        </button>
        <button
          className={`tab_button ${selectedTab === "history" ? "active-tab" : ""
            }`}
          onClick={() => setSelectedTab("history")}
        >
          📜 History
        </button>
      </div>

      {selectedTab === "pending" && (
        <>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", justifyContent: 'center' }}>
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
            <Button
              onClick={clearFilters}
              sx={{
                border: '2px solid #f44336',
                color: '#f44336',
                backgroundColor: 'white',
                width: 150,
                '&:hover': {
                  backgroundColor: '#b0412e',
                  color: "white",
                  borderColor: '#b0412e',
                },
              }}
            >
              Clear Filters
            </Button>
          </div>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 5, gap: 1 }}>
              <p>Loading...</p>
              <CircularProgress />
            </Box>
          ) : (
            <div className="pending-data">
              {isApproving && (
                <div className="loader-overlay">
                  <div className="loader-box">
                    <span style={{ margin: "0px", fontWeight: "bold" }}>Approving leave...</span>
                    <CircularProgress size={24} />
                  </div>
                </div>
              )}
              {pendingLeaves.length === 0 ? (
                <p style={{ fontSize: '17px', textAlign: "center" }}>No pending leaves found.</p>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginTop: '10px', marginBottom: '-12px', minWidth: 1180 }}>
    <FormControlLabel
  control={
    <Checkbox
      checked={selectedLeave.length === pendingLeaves.length && pendingLeaves.length > 0}
      onChange={(e) => handleSelectAll(e.target.checked)}
      sx={{
        color: '#1976D2',
        '&.Mui-checked': {
          color: '#72ce47ff',
        },
      }}
    />
  }
  label="Select All"
/>
                    <Button
                      variant="contained"
                      onClick={handleApproveAll}
                      sx={{
                        backgroundColor: '#1976D2',
                        color: '#fff',
                        fontWeight: 'bold',
                        textTransform: 'none',
                        px: 2,
                        py: 1,
                        borderRadius: 2,
                        boxShadow: 2,
                        '&:hover': {
                          backgroundColor: '#115293',
                        }
                      }}>
                      Approve Selected Leaves
                    </Button>
                  </div>
                  <table style={{ minWidth: 1180 }}>
                    <thead>
                      <tr>
                        <th>Select</th>
                        <th>Email</th>
                        <th>Leave Type</th>
                        <th>From</th>
                        <th>To</th>
                        <th>Duration</th>
                        <th>Type</th>
                        <th>Reason</th>
                        {/* <th>Action</th> */}
                      </tr>
                    </thead>
                    <tbody>
                      {pendingLeaves.map((leave, index) => (
                        <tr key={index}>
                          <td>
                            <input 
                              type="checkbox" 
                              checked={selectedLeave.includes(leave.Id)}
                              onChange={()=>handleCheckbox(leave.Id)}
                            />
                          </td>
                          <td>{leave.email}</td>
                          <td>{leave.leaveType}</td>
                          <td>{leave.startDate}</td>
                          <td>{leave.endDate}</td>
                          <td>{leave.leaveDuration}</td>
                          <td>{leave.durationType}</td>
                          <td>{leave.reasonForLeave}</td>
                          {/* <td>
                            <button
                              className="approve-button"
                              onClick={() => handleApprove(leave.Id)}
                            >
                              Approve
                            </button>
                          </td> */}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>
          )}
        </>
      )}

      {selectedTab === "approved" && (
        <>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "10px", alignItems: "center", marginTop: '5px', justifyContent: 'center' }}>
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
            <Button
              onClick={clearFilters}
              sx={{
                width: 150,
                border: '2px solid #F44336',
                color: '#F44336',
                backgroundColor: 'white',
                '&:hover': {
                  backgroundColor: '#B0412E',
                  color: "white",
                  borderColor: '#B0412E',
                },
              }}
            >
              Clear Filters
            </Button>
          </div>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 5, gap: 1 }}>
              <p>Loading...</p>
              <CircularProgress />
            </Box>
          ) : (
            <div className="approved-data">
              {approvedLeaves.length === 0 ? (
                <p style={{ fontSize: '17px', textAlign: "center" }}>No approved leaves found.</p>
              ) : (
                <table style={{ minWidth: 1180 }}>
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
          )}
        </>
      )}

      {selectedTab === "balance" && (
        <>
          <div className="balance-tab"
            style={{
              width: "100%",
              marginBottom: "15px",
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: 'center'
            }}
          >
            <Box sx={{ display: { xs: 'block', sm: 'flex' }, alignItems: 'flex-start', gap: 2 }}>
              <Autocomplete
                options={allEmails}
                value={searchEmail}
                onChange={(event, newValue) => {
                  setSearchEmail(newValue || "");
                  if (!newValue) {
                    setLeaveBalance([]);
                    setInputError("")
                  } else {
                    setInputError("");
                  }
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Filter by Email"
                    size="small"
                    sx={{ fontSize: "14px" }}
                    error={Boolean(inputError)}
                    helperText={inputError}
                    FormHelperTextProps={{
                      sx: {
                        fontSize: '14px',
                        fontWeight: 'bold'
                      },
                    }}
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
                disabled={loadingBalance}
              >
                View Balance
              </button>
              <Button
                className="adjust-leaves-button"
                variant="contained"
                color="secondary"
                onClick={() => setAdjustModalOpen(true)}
                sx={{
                  backgroundColor: "#ff9800",
                  "&:hover": {
                    backgroundColor: "#f57c00"
                  },
                  textTransform: "none"
                }}
              >
                Adjust Leaves
              </Button>
              <Button variant="contained" onClick={downloadCSV}
  sx={{
    backgroundColor: '#1976D2',
    color: '#fff',
    fontWeight: 'bold',
    textTransform: 'none',
    px: 3,
    py: 1,
    borderRadius: 2,
    boxShadow: 2,
    '&:hover': {
      backgroundColor: '#115293',
    }
  }}>
    Download CSV
  </Button>
            </Box>
          </div>

          {isDownloading && (
  <div style={{
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  }}>
    <CircularProgress size={60} thickness={5} />
    <p style={{ marginTop: 20, fontSize: 18, color: '#333', textAlign: 'center' }}>
      Downloading leave records…<br />
      This may take more than a minute. Please wait patiently.
    </p>
  </div>
)}

          <div className="balance-data">
            {loadingBalance ? (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 5, gap: 1 }}>
                <CircularProgress size={24} />
                <p>Loading balance...</p>
              </Box>
            ) : (
              <div>
                {balanceError ? (
                  <p style={{ color: "red", textAlign: "center" }}>{balanceError}</p>
                ) : leaveBalance.length === 0 ? (
                  <p style={{ fontSize: '17px', textAlign: "center" }}>No records available</p>
                ) : (
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
            )}
          </div>

          {/* NEW MODAL COMPONENT */}
          <AdjustLeaveModal
            open={adjustModalOpen}
            onClose={() => setAdjustModalOpen(false)}
            allEmails={allEmails}
            adminEmail={email}
            onSuccess={handleAdjustSuccess}
          />
        </>
      )}

      {selectedTab === "history" && (
        <>
          <div
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              justifyContent: 'center',
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
            <Button
              onClick={clearFilters}
              sx={{
                width: 150,
                border: '2px solid #F44336',
                color: '#F44336',
                backgroundColor: 'white',
                '&:hover': {
                  backgroundColor: '#B0412E',
                  color: "white",
                  borderColor: '#B0412E',
                },
              }}
            >
              Clear Filters
            </Button>
          </div>

          <div className="history-data">
            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 5, gap: 1 }}>
                <p>Loading...</p>
                <CircularProgress />
              </Box>
            ) : (
              <div>
                {filteredLeaveHistory.length === 0 ? (
                  <p style={{ fontSize: "17px", textAlign: "center" }}>No leave history found.</p>
                ) : (
                  <table style={{ minWidth: 1180 }}>
                    <thead>
                      <tr>
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
                          <td>{leave.email}</td>
                          <td>{leave.leaveType}</td>
                          <td>{leave.startDate}</td>
                          <td>{leave.endDate}</td>
                          <td>{leave.leaveDuration}</td>
                          <td>{leave.durationType}</td>
                          <td>{leave.reasonForLeave}</td>
                          <td>
                            <Chip
                              label={leave.status}
                              color={
                                leave.status === "approved"
                                  ? "success"
                                  : leave.status === "pending"
                                    ? "warning"
                                    : "error"
                              }
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </>
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