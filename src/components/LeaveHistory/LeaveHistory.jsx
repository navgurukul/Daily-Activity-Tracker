import React, { useContext, useState, useEffect } from "react";
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { LoginContext } from "../context/LoginContext";
import ArrowBackIcon from "@mui/icons-material/KeyboardArrowLeft";
import ArrowForwardIcon from "@mui/icons-material/KeyboardArrowRight";
import "./LeaveHistory.css";
const LeaveHistory = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [currentLeaves, setCurrentLeaves] = useState([]);
  const [pages, setPages] = useState({
    approved: 1,
    pending: 1,
    rejected: 1,
  });
  const [hasMore, setHasMore] = useState({
    approved: false,
    pending: false,
    rejected: false,
  });
  const [selectedMonths, setSelectedMonths] = useState({
    approved: "",
    pending: "",
    rejected: "",
  });
  const dataContext = useContext(LoginContext);
  const { email } = dataContext;
  console.log("User email:", email);
  useEffect(() => {
    const key = tabKeys[tabIndex];
    fetchLeaveData(key, pages[key], selectedMonths[key]);
  }, [email, tabIndex, pages, selectedMonths]);
  const tabKeys = ["pending", "approved", "rejected"];
  const fetchLeaveData = async (statusKey, page, month = "") => {
    if (!email) return;
    try {
      const response = await fetch(
        `https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/leave-records?status=${statusKey}&employeeEmail=${email}&month=${month}&limit=5&page=${page}`
      );
      const data = await response.json();
      const records = data[email]?.[statusKey] || [];
      setCurrentLeaves(records);
      setHasMore((prev) => ({
        ...prev,
        [statusKey]: records.length === 5,
      }));
    } catch (error) {
      console.error("Error fetching leave records:", error);
    }
  };
  const handleTabClick = (index) => {
    const key = tabKeys[index];
    setTabIndex(index);
    fetchLeaveData(key, pages[key], selectedMonths[key]);
  };
  const handleMonthChange = (e, statusKey) => {
    const newMonth = e.target.value;
    setSelectedMonths((prev) => ({
      ...prev,
      [statusKey]: newMonth,
    }));
    setPages((prev) => ({
      ...prev,
      [statusKey]: 1,
    }));
    fetchLeaveData(statusKey, 1, newMonth);
  };
  const handlePageChange = (newPage) => {
    const key = tabKeys[tabIndex];
    if (newPage >= 1) {
      setPages((prev) => ({ ...prev, [key]: newPage }));
      fetchLeaveData(key, newPage, selectedMonths[key]);
    }
  };
  const renderTableRow = (leave, index) => (
    <TableRow key={index}>
      <TableCell>{leave.leaveType}</TableCell>
      <TableCell>{leave.startDate}</TableCell>
      <TableCell>{leave.endDate}</TableCell>
      <TableCell>{leave.leaveDuration} days</TableCell>
      <TableCell>{leave.reasonForLeave}</TableCell>
    </TableRow>
  );
  const renderPagination = (currentPage, hasNextPage) => {
    const pageNumbers = [];
    for (let i = 1; i <= currentPage; i++) pageNumbers.push(i);
    if (hasNextPage) pageNumbers.push(currentPage + 1);
    return (
      <Box display="flex" justifyContent="center" mt={2} gap={1}>
        <IconButton
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ArrowBackIcon />
        </IconButton>
        {pageNumbers.map((num) => (
          <Button
            key={num}
            variant={num === currentPage ? "contained" : "text"}
            onClick={() => handlePageChange(num)}
            sx={{
              minWidth: "36px",
              height: "36px",
              borderRadius: "50%",
              padding: 0,
              fontSize: "14px",
            }}
          >
            {num}
          </Button>
        ))}
        <IconButton
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={!hasNextPage}
        >
          <ArrowForwardIcon />
        </IconButton>
      </Box>
    );
  };
  const renderLeaveCategory = (leaves, statusKey) => (
    <>
      <FormControl sx={{ minWidth: 155, mb: 1 , ml:{xs:1, sm:0}}}>
        <InputLabel>Month</InputLabel>
        <Select
          value={selectedMonths[statusKey]}
          label="Month"
          onChange={(e) => handleMonthChange(e, statusKey)}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="1">January</MenuItem>
          <MenuItem value="2">February</MenuItem>
          <MenuItem value="3">March</MenuItem>
          <MenuItem value="4">April</MenuItem>
          <MenuItem value="5">May</MenuItem>
          <MenuItem value="6">June</MenuItem>
          <MenuItem value="7">July</MenuItem>
          <MenuItem value="8">August</MenuItem>
          <MenuItem value="9">September</MenuItem>
          <MenuItem value="10">October</MenuItem>
          <MenuItem value="11">November</MenuItem>
          <MenuItem value="12">December</MenuItem>
        </Select>
      </FormControl>
      <TableContainer component={Paper} sx={{ width:{md:'99%'} , overflowX: { xs: "auto",   sm: "hidden", }}}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Leave Type</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Reason</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaves.length > 0 ? (
              leaves.map((leave, index) => renderTableRow(leave, index))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No records available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {renderPagination(pages[statusKey], hasMore[statusKey])}
    </>
  );
  return (
    <div className="main_container">
      <div className="tabs">
        <button
          className={`tab-button ${tabIndex === 0 ? "active-tab" : ""}`}
          onClick={() => handleTabClick(0)}
        >
          Pending Leaves
        </button>
        <button
          className={`tab-button ${tabIndex === 1 ? "active-tab" : ""}`}
          onClick={() => handleTabClick(1)}
        >
          Approved Leaves
        </button>
        
        <button
          className={`tab-button ${tabIndex === 2 ? "active-tab" : ""}`}
          onClick={() => handleTabClick(2)}
        >
          Rejected Leaves
        </button>
      </div>
      <Box sx={{ marginTop: "20px" }}>
        {renderLeaveCategory(currentLeaves, tabKeys[tabIndex])}
      </Box>
    </div>
  );
};
export default LeaveHistory;