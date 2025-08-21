import React, { useEffect, useState } from "react";
import axios from "axios";
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
  Autocomplete,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress
} from "@mui/material";

const Payroll = () => {
  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [page, setPage] = useState(1);
  const rowsPerPage = 9;

  // Filters and Sorting
  const [emailFilter, setEmailFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  const [allEmails, setAllEmails] = useState([]);
  const [allNames, setAllNames] = useState([]);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchPayrollData = async () => {
      const token = localStorage.getItem("jwtToken");

      if (!token) {
        console.error("JWT token not found in local storage.");
        setLoading(false);
        return;
      }

      try {
        let url =
          `${API_BASE_URL}/payableDaysCalculation`;
        const queryParams = new URLSearchParams();
        if (emailFilter) queryParams.append("email", emailFilter);
        if (monthFilter) queryParams.append("month", parseInt(monthFilter) - 1);
        if (yearFilter) queryParams.append("year", yearFilter);
        if (queryParams.toString()) {
          url += `?${queryParams.toString()}`;
        }
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
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
  }, [emailFilter, monthFilter, yearFilter]);

  useEffect(() => {
    const fetchEmailsAndNames = async () => {
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
        ).sort((a,b)=>a.localeCompare(b));
        const names = Array.from(
          new Set(
            response.data?.data
              ?.map((entry) => entry["First and Last Name"])
              ?.filter((name) => !!name)
          )
        );
        setAllEmails(teamIDs);
        setAllNames(names);
      } catch (error) {
        console.error("Error fetching emails:", error);
        setSnackbarMessage("Failed to fetch emails");
      }
    };
    fetchEmailsAndNames();
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
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Loading Payroll Data...
        </Typography>
        <br />
        <br />
        <CircularProgress />
      </Box>
    );
  }

async function downloadCSV() {
  try {
    const response = await fetch(`${API_BASE_URL}/payableDaysCalculation`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
      },
    });

    const result = await response.json();
    const data = result.data;

    if (!Array.isArray(data)) {
      throw new Error("Invalid data format");
    }

    // Flatten data like your Node.js function
    const flattened = data.map(item => ({
      email: item.email,
      name: item.name,
      teamName: item.teamName,
      'Week 1': item['Week 1'],
      'Week 2': item['Week 2'],
      'Week 3': item['Week 3'],
      'Week 4': item['Week 4'],
      'Week 5': item['Week 5'],
      totalHours: item.totalHours,
      totalWorkingDays: item.totalWorkingDays,
      paidLeaves: item.paidLeaves,
      totalCompOffLeaveTaken: item.totalCompOffLeaveTaken,
      weekOffDays: item.weekOffDays,
      totalPayableDays: item.totalPayableDays,
      numOfWorkOnWeekendDays: item.numOfWorkOnWeekendDays,
      LWP: item.LWP,
      cycle1_totalHours: item.cycle1?.totalHours,
      cycle1_totalWorkingDays: item.cycle1?.totalWorkingDays,
      cycle1_paidLeaves: item.cycle1?.paidLeaves,
      cycle1_totalCompOffLeaveTaken: item.cycle1?.totalCompOffLeaveTaken,
      cycle1_weekOffDays: item.cycle1?.weekOffDays,
      cycle1_totalPayableDays: item.cycle1?.totalPayableDays,
      cycle1_LWP: item.cycle1?.LWP,
      cycle2_totalHours: item.cycle2?.totalHours,
      cycle2_totalWorkingDays: item.cycle2?.totalWorkingDays,
      cycle2_paidLeaves: item.cycle2?.paidLeaves,
      cycle2_totalCompOffLeaveTaken: item.cycle2?.totalCompOffLeaveTaken,
      cycle2_weekOffDays: item.cycle2?.weekOffDays,
      cycle2_totalPayableDays: item.cycle2?.totalPayableDays,
      cycle2_LWP: item.cycle2?.LWP,
    }));

    // Generate CSV
    const headers = Object.keys(flattened[0]);
    const csv = [
      headers.join(','), // header row
      ...flattened.map(row =>
        headers.map(h => `"${(row[h] ?? "").toString().replace(/"/g, '""')}"`).join(',')
      )
    ].join('\n');

    // Trigger download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'payable_data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('❌ Error downloading CSV:', error);
    alert('Failed to download CSV. See console for error.');
  }
}

  return (
    <Box sx={{ p: { xs: 0, sm: 3 } }}>
<Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
  <Box>
    <Typography
      variant="h4"
      mb={0.5}
      fontWeight="bold"
      sx={{ fontSize: { xs: "1.5rem", sm: "2.15rem" } }}
    >
      Employee Payable Days Overview
    </Typography>
    <Typography variant="subtitle1" color="text.secondary">
      Track total payable days for each team member
    </Typography>
  </Box>

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


      {/* Filters */}
      <Box sx={{ display: "flex", gap: { xs: 1, sm: 2 }, flexWrap: "wrap", mb: 3, justifyContent: "center" }}>
        <Autocomplete
          options={allEmails}
          value={emailFilter}
          onChange={(event, newValue) => setEmailFilter(newValue || "")}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Filter by Email"
              variant="outlined"
              size="small"
              sx={{ width: { xs: 300, sm: 320 } }}
            />
            
          )}
          freeSolo
          ListboxProps={{
            style: {
              maxHeight: 200,
            },
          }}
        />
        <TextField
          select
          label="Filter by Month"
          variant="outlined"
          value={monthFilter}
          onChange={(e) => setMonthFilter(e.target.value)}
          size="small"
          sx={{ width: { xs: 152, sm: 152 } }}
          SelectProps={{
            MenuProps: {
              PaperProps: {
                style: {
                  maxHeight: 200,
                },
              },
            },
          }}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <MenuItem key={i + 1} value={i + 1}>
              {i + 1}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Filter by Year"
          variant="outlined"
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          size="small"
          sx={{ width: { xs: 140, sm: 152 } }}
          SelectProps={{
            MenuProps: {
              PaperProps: {
                style: {
                  maxHeight: 200,
                },
              },
            },
          }}
        >
          {Array.from({ length: 25 }, (_, i) => {
            const currentYear = new Date().getFullYear()
            const year = currentYear - i;
            return (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            );
          })}
        </TextField>
        <TextField
          label="Sort by Payable Days"
          select
          value={sortOrder}
          onChange={handleSortChange}
          size="small"
          sx={{ width: { xs: 152, sm: 152 } }}
        >
          <MenuItem value="asc">Low to High</MenuItem>
          <MenuItem value="desc">High to Low</MenuItem>
        </TextField>
        <Button
          onClick={() => {
            setEmailFilter("");
            setMonthFilter("");
            setYearFilter("");
            setSortOrder("asc");
          }}
          sx={{
            width:{xs:140, sm:150,} ,
                border: '2px solid #f44336',
                color: '#f44336',
                backgroundColor: 'white',
                '&:hover': {
                  backgroundColor: '#b0412e',
                  color: "white",
                  borderColor: '#b0412e',
                },
              }}
        >
          Clear Filters
        </Button>
      </Box>

      {/* Table Layout */}
      <TableContainer
        component={Paper}
        sx={{ maxWidth: "100%", overflow: { xs: "scroll", sm: "hidden" } }}
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
          siblingCount={0}
          boundaryCount={1}
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
          <Button variant="contained" color="success" onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Payroll;