import React, { useState, useEffect } from "react";
import { 
  Box, 
  Typography, 
  Paper, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress
} from "@mui/material";

const OrganizationOverview = () => {
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterEmail, setFilterEmail] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [allEmails, setAllEmails] = useState([]);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Fetch ALL organization-wide approved leaves (all pages)
  const fetchOrganizationLeaves = async (email = '', month = '') => {
    setLoading(true);
    let allLeaves = [];
    let allEmails = [];
    let page = 1;
    let hasMore = true;

    try {
      while (hasMore) {
        const response = await fetch(
          `${API_BASE_URL}/leave-records?status=approved&employeeEmail=${email}&month=${month}&limit=100&page=${page}`
        );
        const data = await response.json();
        
        const pageResults = [];
        const pageEmails = [];

        Object.keys(data).forEach((emailKey) => {
          pageEmails.push(emailKey);
          const userLeaves = data[emailKey];

          userLeaves?.approved?.forEach((record) =>
            pageResults.push({ email: emailKey, ...record })
          );
        });

        allLeaves = [...allLeaves, ...pageResults];
        allEmails = [...allEmails, ...pageEmails];
        
        // Check if we got less than 100 records (no more pages)
        hasMore = pageResults.length === 100;
        page++;

        // Safety check to prevent infinite loops
        if (page > 50) break; // Max 5000 records
      }

      setApprovedLeaves(allLeaves);
      
      // Extract unique emails for filter dropdown
      const uniqueEmails = [...new Set(allEmails)];
      setAllEmails(uniqueEmails);

      console.log(`Fetched ${allLeaves.length} approved leaves from ${page - 1} pages`);

    } catch (err) {
      console.error("Failed to fetch organization leaves", err);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchOrganizationLeaves();
  }, []);

  // Apply filters when changed
  useEffect(() => {
    fetchOrganizationLeaves(filterEmail, filterMonth);
  }, [filterEmail, filterMonth]);

  const clearFilters = () => {
    setFilterEmail("");
    setFilterMonth("");
  };

  return (
    <Box sx={{ p: 0 }}>
      {/* Filter Section */}
      <div style={{ 
        display: "flex", 
        gap: "10px", 
        flexWrap: "wrap", 
        alignItems: "center", 
        justifyContent: 'center',
        marginBottom: "20px"
      }}>
        <Autocomplete
          options={allEmails}
          value={filterEmail}
          onChange={(e, newValue) => setFilterEmail(newValue || "")}
          renderInput={(params) => <TextField {...params} label="Filter by Email" size="small" />}
          sx={{ minWidth: 260 }}
          freeSolo
        />

        <FormControl size="small" sx={{ minWidth: { xs: 260, sm: 160 } }}>
          <InputLabel id="month-select-label">Month</InputLabel>
          <Select
            labelId="month-select-label"
            value={filterMonth}
            label="Month"
            onChange={(e) => setFilterMonth(e.target.value)}
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

      {/* Data Table */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 5, gap: 1 }}>
          <p>Loading...</p>
          <CircularProgress />
        </Box>
      ) : (
        <div>
          {approvedLeaves.length === 0 ? (
            <p style={{ fontSize: '17px', textAlign: "center" }}>No approved leaves found.</p>
          ) : (
            <div style={{ overflowX: 'auto', width: '100%' }}>
  <TableContainer component={Paper} sx={{ minWidth: 800, overflowX: { xs: "auto", sm: "hidden" } }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Email</TableCell>
                    <TableCell>Leave Type</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>End Date</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {approvedLeaves.map((leave, index) => (
                    <TableRow key={index} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                      <TableCell>{leave.email}</TableCell>
                      <TableCell>{leave.leaveType}</TableCell>
                      <TableCell>{leave.startDate}</TableCell>
                      <TableCell>{leave.endDate}</TableCell>
                      <TableCell>{leave.leaveDuration} days</TableCell>
                      <TableCell>{leave.durationType}</TableCell>
                      <TableCell>{leave.reasonForLeave}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </div>
          )}
        </div>
      )}

    </Box>
  );
};

export default OrganizationOverview;