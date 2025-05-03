import React, { useEffect, useState, useContext } from "react";
import {
  Grid,
  Paper,
  Typography,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
} from "@mui/material";
import { LoginContext } from "../context/LoginContext";
import "./LeaveHistory.css";

const LeaveHistory = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [leaveData, setLeaveData] = useState({
    approved: [],
    pending: [],
    rejected: [],
  });
  const dataContext = useContext(LoginContext);
  const { email } = dataContext;

  useEffect(() => {
    if (!email) {
      console.error("Email is missing from context.");
      return;
    }

    fetch(
      `https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/leave-records?employeeEmail=${email}`
    )
      .then((response) => response.json())
      .then((data) => {
        if (data[email]) {
          const userData = data[email];
          setLeaveData({
            approved: userData.approved,
            pending: userData.pending,
            rejected: userData.rejected,
          });
        } else {
          console.error(`No leave records found for the email: ${email}`);
        }
      })
      .catch((error) => {
        console.error("Error fetching leave records:", error);
      });
  }, [email]);

  const renderTableRow = (leave, index) => (
    <TableRow key={index}>
      <TableCell>{leave.leaveType}</TableCell>
      {/* <TableCell>{leave.status}</TableCell> */}
      <TableCell>{leave.startDate}</TableCell>
      <TableCell>{leave.endDate}</TableCell>
      <TableCell>{leave.leaveDuration} days</TableCell>
      <TableCell>{leave.reasonForLeave}</TableCell>
    </TableRow>
  );

  const renderLeaveCategory = (leaves) => (
    <TableContainer component={Paper} style={{ overflow: "hidden" }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Leave Type</TableCell>
            {/* <TableCell>Status</TableCell> */}
            <TableCell>Start Date</TableCell>
            <TableCell>End Date</TableCell>
            <TableCell>Duration</TableCell>
            <TableCell>Reason</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {leaves.map((leave, index) => renderTableRow(leave, index))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  return (
    <div style={{ marginLeft: "50px", padding: "20px" }}>
      {/* Tab navigation for approved, pending, rejected categories */}
      {/* <Tabs value={tabIndex} onChange={handleTabChange} aria-label="Leave Tabs">
        <Tab label="Approved Leaves" />
        <Tab label="Pending Leaves" />
        <Tab label="Rejected Leaves" />
      </Tabs> */}
      <div className="tabs">
        <button
          className={`tab-button ${tabIndex === 0 ? "active-tab" : ""}`}
          onClick={() => setTabIndex(0)}
        >
          Approved Leaves
        </button>
        <button
          className={`tab-button ${tabIndex === 1 ? "active-tab" : ""}`}
          onClick={() => setTabIndex(1)}
        >
          Pending Leaves
        </button>
        <button
          className={`tab-button ${tabIndex === 2 ? "active-tab" : ""}`}
          onClick={() => setTabIndex(2)}
        >
          Rejected Leaves
        </button>
      </div>

      {/* Tab panels to show leave records */}
      <Box sx={{ marginTop: "20px" }}>
        {tabIndex === 0 && (
          <div>
            {/* <Typography variant="h6" color="primary" gutterBottom>
              Approved Leaves
            </Typography> */}
            {leaveData.approved.length > 0 ? (
              renderLeaveCategory(leaveData.approved)
            ) : (
              <Typography variant="body2" color="textSecondary">
                No records available
              </Typography>
            )}
          </div>
        )}
        {tabIndex === 1 && (
          <div>
            {/* <Typography
              variant="h6"
              color="primary"
              gutterBottom
            >
              Pending Leaves
            </Typography> */}
            {leaveData.pending.length > 0 ? (
              renderLeaveCategory(leaveData.pending)
            ) : (
              <Typography variant="body2" color="textSecondary">
                No records available
              </Typography>
            )}
          </div>
        )}
        {tabIndex === 2 && (
          <div>
            {/* <Typography variant="h6" color="primary" gutterBottom>
              Rejected Leaves
            </Typography> */}
            {leaveData.rejected.length > 0 ? (
              renderLeaveCategory(leaveData.rejected)
            ) : (
              <Typography variant="body2" color="textSecondary">
                No records available
              </Typography>
            )}
          </div>
        )}
      </Box>
    </div>
  );
};

export default LeaveHistory;
