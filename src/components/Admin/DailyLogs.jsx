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
import { Edit, Check, Close } from "@mui/icons-material";

function DailyLogs() {
  const [logs, setLogs] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [email, setEmail] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [emailsList, setEmailsList] = useState([]);
  const [projectList, setProjectList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const userEmail = sessionStorage.getItem("email");
  const [editLog, setEditLog] = useState(null);
  const [editedData, setEditedData] = useState({
    Id: "",
    approvalEmail: userEmail,
    workDescription: "",
    projectName: "",
    totalHoursSpent: "",
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", error: false });
  const [loading, setLoading] = useState(false);

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [logToApprove, setLogToApprove] = useState(null);

  // state to reject logs
  const [logToReject, setLogToReject] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);

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
          totalHoursSpent: log.totalHoursSpent,
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
      approvalEmail: userEmail,
      workDescription: log.description,
      projectName: log.project,
      totalHoursSpent: log.totalHoursSpent,
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
            // Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
            Authorization: `Bearer ${sessionStorage.getItem("jwtToken")}`,
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

  // Function to handle log approval
  const handleApproveClick = (log) => {
    setLogToApprove(log);
    setShowApprovalModal(true);
  };

  // Function to handle log rejection
  const handleRejectClick = (log) => {
    setLogToReject(log);
    setShowRejectModal(true);
  };

  const handleApprove = async (log) => {
    if (!logToApprove) return;

    try {
      const response = await fetch(
        "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/activityLogs",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            // Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
            Authorization: `Bearer ${sessionStorage.getItem("jwtToken")}`,
          },
          body: JSON.stringify([{ Id: logToApprove.Id, approvalEmail: userEmail, logStatus: "approved" }]),
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
    } finally {
      setShowApprovalModal(false);
      setLogToApprove(null);
    }
  };

  const handleReject = async () => {
    if (!logToReject) return;

    try {
      const response = await fetch(
        "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/activityLogs",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            // Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
            Authorization: `Bearer ${sessionStorage.getItem("jwtToken")}`,
          },
          body: JSON.stringify([{ Id: logToReject.Id, approvalEmail: userEmail, logStatus: "rejected" }]),
        }
      );
      if (response.ok) {
        setSnackbar({ open: true, message: "Log rejected successfully", error: false });
        fetchLogs();
      } else {
        const errorText = await response.text();
        throw new Error(errorText);
      }
    } catch (err) {
      setSnackbar({ open: true, message: "Error rejecting log: " + err.message, error: true });
    } finally {
      setShowRejectModal(false);
      setLogToReject(null);
    }
  }

  return (
    <Box>
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
          sx={{ minWidth: 280 }}
        />
        <Autocomplete
          options={emailsList}
          value={email}
          onChange={(e, val) => setEmail(val || "")}
          renderInput={(params) => <TextField {...params} label="Employee Email" size="small" />}
          freeSolo
          sx={{ minWidth: 280 }}
        />
        <TextField label="Month" value={month} onChange={(e) => setMonth(e.target.value)} select size="small" sx={{ minWidth: {xs:130, sm:200} }} SelectProps={{ native: true }}>
          <option value="" disabled></option>
          {[...Array(12)].map((_, i) => (
            <option key={i + 1} value={String(i + 1).padStart(2, "0")}>{String(i + 1).padStart(2, "0")}</option>
          ))}
        </TextField>
        <TextField label="Year" value={year} onChange={(e) => setYear(e.target.value)} select size="small" sx={{ minWidth:{xs:130, sm:200}}} SelectProps={{ native: true }}>
          <option value="" disabled></option>
          {[2023, 2024, 2025, 2026].map((yr) => (
            <option key={yr} value={yr}>{yr}</option>
          ))}
        </TextField>
        <Button variant="contained" color="primary" onClick={clearFilters}>Clear Filters</Button>
      </Box>

      {/* Logs Table */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center"}}>
          <CircularProgress />
        </Box>
      ) : logs.length > 0 ? (
        <>
          <TableContainer component={Paper} sx={{ overflowX: { xs: "scroll", sm: "hidden" } }}>
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
                    <TableCell>{log.totalHoursSpent}</TableCell>
                    <TableCell>{log.description}</TableCell>
                    <TableCell>
                      <Chip label={log.logStatus} color={log.logStatus === "approved" ? "success" : "warning"} size="small" />
                    </TableCell>
                    <TableCell sx={{ display: "flex", gap: 1, flexDirection:"column", alignItems: "center", justifyContent: "center" }}>
                      <IconButton size="small" onClick={() => handleEditClick(log)} disabled={log.logStatus === "approved"} title="Edit Log" sx={{ hight:'50px', width:'50px', color: "primary", "&:hover": { backgroundColor: "#1976d21a"}}}><Edit /></IconButton>
                      <IconButton size="small" onClick={() => handleApproveClick(log)} disabled={log.logStatus === "approved"} title="Approve Log" sx={{ hight:'50px', width:'50px', color: "primary", "&:hover": { backgroundColor: "#2e7d321a"}}}><Check /></IconButton>
                      <IconButton
                        size="small"
                        title="Reject Log"
                        color="error"
                        onClick={() => handleRejectClick(log)}
                        disabled={log.logStatus === "approved" || log.logStatus === "rejected"}
                        sx={{ hight:'50px', width:'50px', color: "primary", "&:hover": { backgroundColor: "#d32f2f1a"}}}
                      >
                        <Close />
                      </IconButton>
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

      {/* Edit Dialog  */}
        <Dialog
          open={!!editLog}
          onClose={() => setEditLog(null)}
          fullWidth
          maxWidth="md" 
          PaperProps={{
            sx: { minHeight: 400, minWidth: 600 },
          }}
        >
          <DialogTitle>Edit Log</DialogTitle>
          <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField label="Approver Email" value={userEmail} disabled sx={{mt:1}} />
            <TextField label="Project Name" value={editedData.projectName} onChange={(e) => handleEditChange("projectName", e.target.value)} />
            <TextField label="Work Description" multiline rows={3} value={editedData.workDescription} onChange={(e) => handleEditChange("workDescription", e.target.value)} />
            <TextField
          label="Total Hours Spent"
          type="number"
          value={editedData.totalHoursSpent}
          onChange={(e) => handleEditChange("totalHoursSpent", e.target.value)}
          InputProps={{ inputProps: { min: 0 } }}
            />
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
      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="modal-overlay">
          <div className="modal-content"
          style={{ width: "300px", height: "100px", padding: 0 }}>
            <p style={{ margin: 0, padding: "15px 0px", fontSize: "15px", textAlign: 'center' }}>Are you sure you want to approve this log?</p>
            <Button onClick={handleApprove}>Yes</Button>
            <Button onClick={() => {
              setShowApprovalModal(false);
              setLogToApprove(null);
            }}>No</Button>
          </div>
            </div>)}
      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{ width: "300px", height: "100px", padding: 0 }}
          >
            <p style={{ margin: 0, padding: "15px 0px", fontSize: "15px", textAlign: 'center' }}>
              Are you sure you want to reject this log?
            </p>
            <Button onClick={handleReject}>Yes</Button>
            <Button
              onClick={() => {
                setShowRejectModal(false);
                setLogToReject(null);
              }}
            >
              No
            </Button>
          </div>
        </div>
      )}
    </Box>
  );
}

export default DailyLogs;
