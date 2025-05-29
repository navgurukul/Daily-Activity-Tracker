import { useState, useEffect, useCallback } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  IconButton,
  Chip,
  CircularProgress,
} from "@mui/material";

import Autocomplete from "@mui/material/Autocomplete";
import debounce from "lodash/debounce";
import { Edit, Check } from "@mui/icons-material";

function DailyLogs() {
  const [logs, setLogs] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [email, setEmail] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [emailsList, setEmailsList] = useState([]);
  const [projectList, setProjectList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [editLog, setEditLog] = useState(null);
  const [editedData, setEditedData] = useState({
    Id: "",
    approvalEmail: "",
    workDescription: "",
    projectName: "",
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", error: false });
  const [loading, setLoading] = useState(false);

  const itemsPerPage = 5;

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    debouncedFilter();
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [projectName, email, month, year]);

  const fetchLogs = async (url = "") => {
    setLoading(true);
    try {
      const response = await fetch(
        url || "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/activityLogs"
      );
      const data = await response.json();
      const formattedLogs = Object.entries(data.data).flatMap(([email, logs]) =>
        logs.map((log) => ({
          Id: log.Id,
          email,
          date: log.entryDate,
          project: log.projectName,
          hours: log.totalHoursSpent,
          description: log.workDescription,
          updatedAt: log.updatedAt,
          logStatus: log.logStatus || "pending",
        }))
      );
      setLogs(formattedLogs);
      setEmailsList([...new Set(Object.keys(data.data))]);
      setProjectList([...new Set(formattedLogs.map((log) => log.project))]);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      setSnackbar({ open: true, message: "Failed to fetch logs.", error: true });
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    let url = "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/activityLogs";
    const params = new URLSearchParams();
    if (email) url += `/${email}`;
    if (projectName) params.append("projectName", projectName);
    if (month && year) {
      params.append("month", month);
      params.append("year", year);
    }
    if (params.toString()) url += "?" + params.toString();
    fetchLogs(url);
  };

  const clearFilters = () => {
    setProjectName("");
    setEmail("");
    setMonth("");
    setYear("");
    setCurrentPage(1);
    fetchLogs();
  };

  const debouncedFilter = useCallback(debounce(handleFilter, 500), [projectName, email, month, year]);

  const currentLogs = logs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(logs.length / itemsPerPage);

  const handleEditClick = (log) => {
    setEditedData({
      Id: log.Id,
      approvalEmail: log.email,
      workDescription: log.description,
      projectName: log.project,
    });
    setEditLog(log);
  };

  const handleEditChange = (field, value) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditSubmit = async () => {
    try {
      const response = await fetch(
        "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/activityLogs",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
          },
          body: JSON.stringify([{ ...editedData, logStatus: "pending" }]),
        }
      );
      if (response.ok) {
        setSnackbar({ open: true, message: "Log updated successfully", error: false });
        setEditLog(null);
        fetchLogs();
      } else {
        const errorText = await response.text();
        throw new Error(errorText);
      }
    } catch (err) {
      setSnackbar({ open: true, message: "Error updating log: " + err.message, error: true });
    }
  };

  const handleApprove = async (log) => {
    const confirmApprove = window.confirm("Are you sure you want to approve this log?");
    if (!confirmApprove) return;

    try {
      const response = await fetch(
        "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/activityLogs",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
          },
          body: JSON.stringify([{ Id: log.Id, approvalEmail: log.email, logStatus: "approved" }]),
        }
      );
      if (response.ok) {
        setSnackbar({ open: true, message: "Log approved successfully", error: false });
        fetchLogs();
      } else {
        const errorText = await response.text();
        throw new Error(errorText);
      }
    } catch (err) {
      setSnackbar({ open: true, message: "Error approving log: " + err.message, error: true });
    }
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h5" align="center" mb={3}>
        Daily Logs
      </Typography>

      {/* Filters */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 3, justifyContent: "center" }}>
        <Autocomplete
          options={projectList}
          value={projectName}
          onChange={(e, val) => setProjectName(val || "")}
          renderInput={(params) => <TextField {...params} label="Project Name" size="small" />}
          freeSolo
          sx={{ minWidth: 200 }}
        />
        <Autocomplete
          options={emailsList}
          value={email}
          onChange={(e, val) => setEmail(val || "")}
          renderInput={(params) => <TextField {...params} label="Employee Email" size="small" />}
          freeSolo
          sx={{ minWidth: 200 }}
        />
        <TextField label="Month" value={month} onChange={(e) => setMonth(e.target.value)} select size="small" sx={{ minWidth: 150 }} SelectProps={{ native: true }}>
          <option value="" disabled></option>
          {[...Array(12)].map((_, i) => (
            <option key={i + 1} value={String(i + 1).padStart(2, "0")}>{String(i + 1).padStart(2, "0")}</option>
          ))}
        </TextField>
        <TextField label="Year" value={year} onChange={(e) => setYear(e.target.value)} select size="small" sx={{ minWidth: 150 }} SelectProps={{ native: true }}>
          <option value="" disabled></option>
          {[2023, 2024, 2025, 2026].map((yr) => (
            <option key={yr} value={yr}>{yr}</option>
          ))}
        </TextField>
        <Button variant="contained" color="primary" onClick={clearFilters}>Clear Filters</Button>
      </Box>

      {/* Logs Table */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
          <CircularProgress />
        </Box>
      ) : logs.length > 0 ? (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Hours</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentLogs.map((log, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{log.email}</TableCell>
                    <TableCell>{log.date}</TableCell>
                    <TableCell>{log.project}</TableCell>
                    <TableCell>{log.hours}</TableCell>
                    <TableCell>{log.description}</TableCell>
                    <TableCell>
                      <Chip label={log.logStatus} color={log.logStatus === "approved" ? "success" : "warning"} size="small" />
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => handleEditClick(log)} disabled={log.logStatus === "approved"}><Edit /></IconButton>
                      <IconButton size="small" onClick={() => handleApprove(log)} disabled={log.logStatus === "approved"}><Check /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <Pagination count={totalPages} page={currentPage} onChange={(e, val) => setCurrentPage(val)} color="primary" />
          </Box>
        </>
      ) : (
        <Typography align="center" color="textSecondary">No logs found for selected filters.</Typography>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editLog} onClose={() => setEditLog(null)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Log</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField label="Approval Email" value={editedData.approvalEmail} onChange={(e) => handleEditChange("approvalEmail", e.target.value)} />
          <TextField label="Project Name" value={editedData.projectName} onChange={(e) => handleEditChange("projectName", e.target.value)} />
          <TextField label="Work Description" multiline rows={3} value={editedData.workDescription} onChange={(e) => handleEditChange("workDescription", e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditLog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSubmit}>Update</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        ContentProps={{ style: { backgroundColor: snackbar.error ? "#d32f2f" : "#4caf50" } }}
      />
    </Box>
  );
}

export default DailyLogs;
