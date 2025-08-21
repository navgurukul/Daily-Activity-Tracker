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
  DialogContentText,
  DialogTitle,
  Snackbar,
  IconButton,
  Chip,
  CircularProgress,
  MenuItem,
} from "@mui/material";

import Autocomplete from "@mui/material/Autocomplete";
import debounce from "lodash/debounce";
import { Edit, Check, Close } from "@mui/icons-material";
import axios from "axios";
import AddLogModal from "./AddLogModal";

function DailyLogs() {
  const [projectName, setProjectName] = useState("");
  const [email, setEmail] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [emailsList, setEmailsList] = useState([]);
  const [projectList, setProjectList] = useState([]);
  const userEmail = localStorage.getItem("email");
  const [editLog, setEditLog] = useState(null);
  const [editedData, setEditedData] = useState({
    Id: "",
    approvalEmail: userEmail,
    workDescription: "",
    projectName: "",
    totalHoursSpent: "",
    date: "",
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: "", error: false });
  const [loading, setLoading] = useState(false);

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [logToApprove, setLogToApprove] = useState(null);

  // state to reject logs
  const [logToReject, setLogToReject] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const [logs, setLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [nextPage, setNextPage] = useState(null);
  const [previousPages, setPreviousPages] = useState([]);
  const [allEmails, setAllEmails] = useState([]);
  const [adjustModalOpen, setAdjustModalOpen] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const ACTIVITY_LOGS_URL = `${API_BASE_URL}/activityLogs`;

  useEffect(() => {
    debouncedFilter();
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [projectName, email, month, year]);

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
        ).sort((a,b)=>a.localeCompare(b));
        setAllEmails(teamIDs);
      } catch (error) {
        console.error("Error fetching emails:", error);
        setSnackbarMessage("Failed to fetch emails");
      }
    };
    fetchEmails();
  }, []);

  const fetchLogs = async ({ pageToken = 1, email = "", projectName = "", month = "", year = "" } = {}) => {
    setLoading(true);
    try {
      let url = ACTIVITY_LOGS_URL;

      // If email is present, it's part of the path
      if (email) url += `/${email}`;

      // Add query params
      const params = new URLSearchParams();
      if (projectName) params.append("projectName", projectName);
      if (month && year) {
        params.append("month", month);
        params.append("year", year);
      }
      params.append("page", pageToken); // ✅ pagination query

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
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
      setCurrentPage(data.page || 1);
      setNextPage(data.nextPage || null);
      console.log("currentPage:", data.page);
      console.log("nextPage:", data.nextPage);

    } catch (err) {
      console.error("Fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    let url = ACTIVITY_LOGS_URL;
    const params = new URLSearchParams();
    if (email) url += `/${email}`;
    if (projectName) params.append("projectName", projectName);
    if (month && year) {
      params.append("month", month);
      params.append("year", year);
    }
    if (params.toString()) url += "?" + params.toString();
    setPreviousPages([]);
    fetchLogs({
      pageToken: 1,
      email,
      projectName,
      month,
      year
    });
  };

  const clearFilters = () => {
    setProjectName("");
    setEmail("");
    setMonth("");
    setYear("");
    setCurrentPage(1);
    fetchLogs();
  };

  const debouncedFilter = useCallback(debounce(handleFilter, 500), [projectName, email, month, year])

  const handleEditClick = (log) => {
    setEditedData({
      Id: log.Id,
      approvalEmail: userEmail,
      workDescription: log.description,
      projectName: log.project,
      totalHoursSpent: log.totalHoursSpent,
      date: log.date,
    });
    setEditLog(log);
  };

  const handleEditChange = (field, value) => {
    setEditedData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEditSubmit = async () => {
    const dateOfLog = editLog.date;
    // Convert edited hours to number (in case user enters string)
    const editedHours = Number(editedData.totalHoursSpent) || 0;
    // Calculate total hours for the same date, excluding the current editing log
    const totalHoursForDate = logs
      .filter((log) => log.date === dateOfLog && log.Id !== editLog.Id && log.email === editLog.email)
      .reduce((sum, log) => sum + (Number(log.totalHoursSpent) || 0), 0);

    const newTotal = totalHoursForDate + editedHours;
    console.log(`Total hours for ${dateOfLog} excluding current log: ${totalHoursForDate}`);

    if (newTotal > 15) {
      setSnackbar({
        open: true,
        message: `You cannot log more than 15 hours for ${dateOfLog}. Total would become ${newTotal}.`,
        error: true,
      });
      return;
    }
    // Proceed to update
    try {
      const entryDate = editedData?.date;
      const response = await fetch(
        ACTIVITY_LOGS_URL,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
          },
          body: JSON.stringify([{ ...editedData, logStatus: "approved", entryDate }]),
        }
      );
      if (response.ok) {
        setSnackbar({
          open: true,
          message: "Log updated successfully",
          error: false,
        });
        setEditLog(null);
        fetchLogs();
      } else {
        const errorText = await response.text();
        throw new Error(errorText);
      }
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Error updating log: " + err.message,
        error: true,
      });
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
    setIsApproving(true);

    try {
      const response = await fetch(
        ACTIVITY_LOGS_URL,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
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
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!logToReject) return;
    setIsRejecting(true);

    try {
      const response = await fetch(
        ACTIVITY_LOGS_URL,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
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
      setIsRejecting(false);
    }
  }

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch(ACTIVITY_LOGS_URL);
      const data = await response.json();
      const AllProject = await fetch(`${API_BASE_URL}/employees`);
      const projectData = await AllProject.json();

      const allLogs = Object.entries(data.data).flatMap(([email, logs]) =>
        logs.map((log) => ({
          email,
          project: log.projectName,
        }))
      );

      setEmailsList([...new Set(allLogs.map(log => log.email))]);
      // setProjectList([...new Set(allLogs.map(log => log.project))]);
      setProjectList([...new Set(projectData?.data?.map(project => project.projectName))]);
    } catch (error) {
      console.error("Failed to load filters:", error);
    }
  };

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
          options={allEmails}
          value={email}
          onChange={(e, val) => setEmail(val || "")}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Employee Email"
              size="small"
            />
          )}
          freeSolo
          sx={{ minWidth: 280 }}
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
        <TextField
          select
          label="Month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          size="small"
          sx={{ minWidth: { xs: 130, sm: 200 } }}
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
          label="Year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          size="small" sx={{ minWidth: { xs: 130, sm: 200 } }}
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
        <Button
          onClick={clearFilters}
          sx={{
            border: '2px solid #f44336',
            color: '#f44336',
            // fontWeight:'bold',
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
        <Button
          variant="contained"
          color="secondary"
          onClick={() => setAdjustModalOpen(true)}
          sx={{
            backgroundColor: "#168625ff",
            fontWeight: "bold",
            "&:hover": {
              backgroundColor: "#135a05ff"
            },
            textTransform: "none"
          }}
        >
          Add New Logs
        </Button>
      </Box>

      {isApproving && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, background: "rgba(255, 255, 255, 0.7)" }}>
          <CircularProgress size={24} />
          <span style={{ marginLeft: "10px", fontWeight: "bold" }}>Approving logs...</span>
        </div>
      )}
      {isRejecting && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, background: "rgba(255, 255, 255, 0.7)" }}>
          <CircularProgress size={24} />
          <span style={{ marginLeft: "10px", fontWeight: "bold" }}>Rejecting logs...</span>
        </div>
      )}

      {/* Logs Table */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Loading...
          </Typography>
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
                  <TableCell
                    sx={{
                      whiteSpace: "wrap",
                      minWidth: { xs: 50, sm: 80, md: 150 },
                    }}
                  >
                    Submission Time
                  </TableCell>
                  {/* <TableCell>Status</TableCell> */}
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{log.email}</TableCell>
                    <TableCell>{log.date}</TableCell>
                    <TableCell>{log.project}</TableCell>
                    <TableCell>{log.totalHoursSpent}</TableCell>
                    <TableCell>{log.description}</TableCell>
                    <TableCell>{log.updatedAt?.split(".")[0]}</TableCell>
                    {/* <TableCell>
                      <Chip label={log.logStatus} color={log.logStatus === "approved" ? "success" : log.logStatus === "rejected" ? "error" : "warning"} size="small" />
                    </TableCell> */}
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 1,
                          alignItems: "center",
                          justifyContent: "center",
                          height: "100%",
                        }}
                      >
                        <IconButton size="small" onClick={() => handleEditClick(log)} title="Edit Log" sx={{ height: '50px', width: '50px', color: "primary", "&:hover": { backgroundColor: "#1976d21a" } }}><Edit /></IconButton>
                        {/* <IconButton size="small" onClick={() => handleApproveClick(log)} disabled={log.logStatus === "approved"} title="Approve Log" sx={{ height:'50px', width:'50px', color: "primary", "&:hover": { backgroundColor: "#2e7d321a"}}}><Check /></IconButton> */}
                        <IconButton
                          size="small"
                          title="Reject Log"
                          color="error"
                          onClick={() => handleRejectClick(log)}
                          // disabled={log.logStatus === "approved" || log.logStatus === "rejected"}
                          disabled={log.logStatus === "rejected"}
                          sx={{ height: '50px', width: '50px', color: "primary", "&:hover": { backgroundColor: "#d32f2f1a" } }}
                        >
                          <Close />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
            <Pagination
              count={nextPage ? nextPage : currentPage} // total pages (adjust if API provides totalPages)
              page={currentPage}
              onChange={(event, value) => {
                fetchLogs({
                  pageToken: value,
                  email,
                  projectName,
                  month,
                  year
                });
              }}
              color="primary"
              shape="rounded"
              siblingCount={1}
              boundaryCount={1}
            />
          </Box>
        </>
      ) : (
        <Typography align="center" color="textSecondary">No logs found for selected filters.</Typography>
      )}

      {/* add new log */}
      <Dialog
        open={adjustModalOpen}
        onClose={() => setAdjustModalOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <AddLogModal onClose={() => setAdjustModalOpen(false)} />
        <DialogActions sx={{ borderTop: 1, borderColor: "divider" }}>
          <Button
            variant="contained"
            color="success"
            onClick={() => setAdjustModalOpen(false)}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

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
          <TextField label="Approver Email" value={userEmail} disabled sx={{ mt: 1 }} />
          <TextField
            label="Log Date"
            value={editedData.date} // ✅ Changed from editLog.date to editedData.date
            onChange={(e) => handleEditChange("date", e.target.value)}
          />
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
      <Dialog
        open={showApprovalModal}
        onClose={() => {
          setShowApprovalModal(false);
          setLogToApprove(null);
        }}
        aria-labelledby="approval-dialog-title"
        aria-describedby="approval-dialog-description"
      >
        <DialogTitle id="approval-dialog-title">{"Approve Log"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="approval-dialog-description">
            Are you sure you want to approve this log?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleApprove} color="primary" autoFocus>
            Yes
          </Button>
          <Button
            onClick={() => {
              setShowApprovalModal(false);
              setLogToApprove(null);
            }}
            color="primary"
          >
            No
          </Button>
        </DialogActions>
      </Dialog>
      {/* Reject Modal */}
      <Dialog
        open={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setLogToReject(null);
        }}
        aria-labelledby="reject-dialog-title"
        aria-describedby="reject-dialog-description"
      >
        <DialogTitle id="reject-dialog-title">{"Reject Log"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="reject-dialog-description">
            Are you sure you want to reject this log?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleReject} color="primary" autoFocus>
            Yes
          </Button>
          <Button
            onClick={() => {
              setShowRejectModal(false);
              setLogToReject(null);
            }}
            color="primary"
          >
            No
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default DailyLogs;
