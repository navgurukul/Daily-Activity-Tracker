import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Pagination,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";

const Payroll = () => {
  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [page, setPage] = useState(1);
  const rowsPerPage = 9;

  // Filters and Sorting
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    const fetchPayrollData = async () => {
      const token = localStorage.getItem("jwtToken");

      if (!token) {
        console.error("JWT token not found in local storage.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/payableDaysCalculation",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch payroll data");
        }

        const result = await response.json();
        setPayrollData(result.data);
      } catch (error) {
        console.error("Error fetching payroll data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayrollData();
  }, []);

  const handleClickOpen = (person) => {
    setSelectedPerson(person);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedPerson(null);
  };

  const handleChangePage = (event, value) => {
    setPage(value);
  };

  const handleSortChange = (event) => {
    setSortOrder(event.target.value);
  };

  // Filtering and Sorting
  const filteredData = payrollData
    .filter(
      (person) =>
        person.name.toLowerCase().includes(nameFilter.toLowerCase()) &&
        person.email.toLowerCase().includes(emailFilter.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === "asc") {
        return a.totalPayableDays - b.totalPayableDays;
      } else {
        return b.totalPayableDays - a.totalPayableDays;
      }
    });

  const visibleData = filteredData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" mb={3} fontWeight="bold">
        Employee Payable Days Overview
      </Typography>
      <Typography variant="subtitle1" mb={3} color="text.secondary">
        Track total payable days for each team member
      </Typography>

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
        <TextField
          label="Filter by Name"
          variant="outlined"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          size="small"
        />
        <TextField
          label="Filter by Email"
          variant="outlined"
          value={emailFilter}
          onChange={(e) => setEmailFilter(e.target.value)}
          size="small"
        />
        <TextField
          label="Sort by Payable Days"
          select
          value={sortOrder}
          onChange={handleSortChange}
          size="small"
          sx={{ width: 150 }}
        >
          <MenuItem value="asc">Low to High</MenuItem>
          <MenuItem value="desc">High to Low</MenuItem>
        </TextField>
      </Box>

      {/* Table Layout */}
      <TableContainer
        component={Paper}
        sx={{ maxWidth: "100%", overflow: "hidden" }}
      >
        <Table
          sx={{ minWidth: 650, tableLayout: "auto" }}
          aria-label="employee payroll table"
        >
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Total Hours</TableCell>
              <TableCell>Total Working Days</TableCell>
              <TableCell>Paid Leaves</TableCell>
              <TableCell>Total Payable Days</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleData.map((person, index) => (
              <TableRow
                key={index}
                sx={{
                  "&:hover": { backgroundColor: "#f4f4f4", cursor: "pointer" },
                }}
                onClick={() => handleClickOpen(person)}
              >
                <TableCell>{person.name}</TableCell>
                <TableCell>{person.email}</TableCell>
                <TableCell>{person.totalHours}</TableCell>
                <TableCell>{person.totalWorkingDays}</TableCell>
                <TableCell>{person.paidLeaves}</TableCell>
                <TableCell>{person.totalPayableDays}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      <Box display="flex" justifyContent="center" mt={4}>
        <Pagination
          count={Math.ceil(filteredData.length / rowsPerPage)}
          page={page}
          onChange={handleChangePage}
          color="primary"
        />
      </Box>

      {/* Detail Dialog */}
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>{selectedPerson?.name}'s Payroll Details</DialogTitle>
        <DialogContent dividers>
          <DialogContentText>
            <strong>Email:</strong> {selectedPerson?.email} <br />
            <strong>Team:</strong> {selectedPerson?.teamName} <br />
            <strong>Total Hours:</strong> {selectedPerson?.totalHours} <br />
            <strong>Total Working Days:</strong>{" "}
            {selectedPerson?.totalWorkingDays} <br />
            <strong>Paid Leaves:</strong> {selectedPerson?.paidLeaves} <br />
            <strong>Total Comp-Off Leave Taken:</strong>{" "}
            {selectedPerson?.totalCompOffLeaveTaken} <br />
            <strong>Week Off Days:</strong> {selectedPerson?.weekOffDays} <br />
            <strong>Number of Work on Weekend Days:</strong>{" "}
            {selectedPerson?.numOfWorkOnWeekendDays} <br />
            <strong>Total Payable Days:</strong>{" "}
            {selectedPerson?.totalPayableDays} <br />
            <strong>LWP:</strong> {selectedPerson?.LWP} <br />
            <br />
            <strong>Cycle 1:</strong>
            <ul>
              <li>Total Hours: {selectedPerson?.cycle1?.totalHours}</li>
              <li>
                Total Working Days: {selectedPerson?.cycle1?.totalWorkingDays}
              </li>
              <li>Paid Leaves: {selectedPerson?.cycle1?.paidLeaves}</li>
              <li>
                Comp-Off Leave Taken:{" "}
                {selectedPerson?.cycle1?.totalCompOffLeaveTaken}
              </li>
              <li>Week Off Days: {selectedPerson?.cycle1?.weekOffDays}</li>
              <li>
                Worked on Weekend:{" "}
                {selectedPerson?.cycle1?.numOfWorkOnWeekendDays}
              </li>
              <li>
                Total Payable Days: {selectedPerson?.cycle1?.totalPayableDays}
              </li>
              <li>LWP: {selectedPerson?.cycle1?.LWP}</li>
            </ul>
            <strong>Cycle 2:</strong>
            <ul>
              <li>Total Hours: {selectedPerson?.cycle2?.totalHours}</li>
              <li>
                Total Working Days: {selectedPerson?.cycle2?.totalWorkingDays}
              </li>
              <li>Paid Leaves: {selectedPerson?.cycle2?.paidLeaves}</li>
              <li>
                Comp-Off Leave Taken:{" "}
                {selectedPerson?.cycle2?.totalCompOffLeaveTaken}
              </li>
              <li>Week Off Days: {selectedPerson?.cycle2?.weekOffDays}</li>
              <li>
                Worked on Weekend:{" "}
                {selectedPerson?.cycle2?.numOfWorkOnWeekendDays}
              </li>
              <li>
                Total Payable Days: {selectedPerson?.cycle2?.totalPayableDays}
              </li>
              <li>LWP: {selectedPerson?.cycle2?.LWP}</li>
            </ul>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Payroll;