import React, { useEffect, useState } from "react";
import {
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  Select,
  FormControl,
  InputLabel,
  Box,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Autocomplete,
  Typography,
} from "@mui/material";
import axios from "axios";
import "./RoleUpdateForm.css";
const RoleUpdateForm = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [teamIds, setTeamIds] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [filterEmail, setFilterEmail] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [tabIndex, setTabIndex] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ email: "", id: "" });
  const [nextPage, setNextPage] = useState(null);
  const [previousPage, setPreviousPage] = useState([]);
  const [currentPage, setCurrentPage] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const fetchFilteredUsers = async (page = 1) => {
    setLoading(true);
    const queryParams = new URLSearchParams();
    if (filterEmail.trim()) queryParams.append("email", filterEmail.trim());
    if (filterRole.trim()) queryParams.append("role", filterRole.trim());
    if (page > 1) queryParams.append("page", page);
    try {
      const res = await fetch(
        `${API_BASE_URL}/accessControl?${queryParams.toString()}`,
      );
      const data = await res.json();
      setUsers(data.items || []);
      setNextPage(data.nextPage || null); // store nextPage instead of nextPage
      setCurrentPage(page); // optional: store the current page number
    } catch (err) {
      console.error("Filtering error:", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setPreviousPage([]);
      fetchFilteredUsers();
    }, 400);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [filterEmail, filterRole]);
  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/employeeSheetRecords?sheet=pncdata`,
        );
        const teamIDs = Array.from(
          new Set(
            response.data?.data
              ?.map((entry) => entry["Team ID"])
              ?.filter((id) => !!id)
          )
        );
        setTeamIds(teamIDs);
      } catch (error) {
        console.error("Error fetching emails:", error);
        setSnackbarMessage("Failed to fetch emails");
      }
    };
    fetchEmails();
  }, []);
  const formatRole = (role) => {
    if (!role) return "";
    return role
      .replace(/([A-Z])/g, " $1") // Insert space before capital letters
      .replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter
  };
  const handleAssignRole = async (e) => {
    e.preventDefault();
    if (!email) {
      setSnackbarMessage("Please select an email");
      setSnackbarSeverity("warning");
      setSnackbarOpen(true);
      return;
    }
    const payload = {
      email,
      roles: [selectedRole],
    };
    try {
      const res = await fetch(
        `${API_BASE_URL}/accessControl`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("jwtToken")}`,
          },
          body: JSON.stringify(payload),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const roleDisplay = formatRole(selectedRole);
        setSnackbarMessage(
          `Successfully assigned the "${roleDisplay}" role to "${email}".`
        );
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        setFilterEmail("");
        setEmail("");
        setSelectedRole("")
        fetchFilteredUsers();
      } else {
        const data = await res.json();
        setSnackbarMessage(data.message || "Failed to assign role");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error("Error assigning role:", err);
      setSnackbarMessage("Something went wrong");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };
  const handleDelete = (emailToDelete, idToDelete) => {
    setDeleteTarget({ email: emailToDelete, id: idToDelete });
    setDeleteDialogOpen(true);
  };
  const confirmDelete = async (option) => {
    setDeleteDialogOpen(false);
    const { email, id } = deleteTarget;
    let url = "";
    if (option === "email") {
      url = `${API_BASE_URL}/accessControl?email=${encodeURIComponent(email
      )}`;
    } else if (option === "id") {
      url = `${API_BASE_URL}/accessControl?Id=${id}`;
    } else {
      setSnackbarMessage("Invalid option. Use 'email' or 'id'.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    try {
      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          // Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
          Authorization: `Bearer ${sessionStorage.getItem("jwtToken")}`,
        },
      });
      if (res.ok) {
        setSnackbarMessage("Deleted successfully");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        fetchFilteredUsers();
      } else {
        const data = await res.json();
        setSnackbarMessage(data.message || "Failed to delete");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    } catch (err) {
      console.error("Error deleting:", err);
      setSnackbarMessage("Something went wrong");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };
  const handleClearFilters = () => {
    setFilterEmail("");
    setFilterRole("");
  };
  const roles = [
    { label: "Admin", value: "admin" },
    { label: "Project Manager", value: "projectManager" },
    { label: "Super Admin", value: "superAdmin" },
  ];
  return (
    <div style={{ overflowY: "scroll", height: "100vh" }}>
      <div className="main">
        <div className="role-update-container">
          <div className="tabs">
            <button
              className={`tabs-button ${tabIndex === 0 ? "active-tab" : ""}`}
              onClick={() => setTabIndex(0)}
            >
              👤 Manage Users
            </button>
            <button
              className={`tabs-button ${tabIndex === 1 ? "active-tab" : ""}`}
              onClick={() => setTabIndex(1)}
            >
              🛡️ Assign Roles
            </button>
          </div>
          {tabIndex === 0 && (
            <div className="all-users">
              <h2>All Users</h2>
              <div className="filter-section">
                <Autocomplete
                  options={teamIds}
                  value={filterEmail}
                  onChange={(event, value) => setFilterEmail(value || "")}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Filter by Email"
                      size="small"
                    />
                  )}
                  freeSolo
                  sx={{ minWidth: 300 }}
                  slotProps={{
                    paper: {
                      sx: {
                        '& ul': {
                          maxHeight: 300,
                          overflow: 'auto',
                        }
                      },
                    }
                  }}
                />
                <Autocomplete
                  options={roles}
                  value={roles.find((role) => role.value === filterRole) || ""}
                  onChange={(event, newValue) => setFilterRole(newValue?.value || "")}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Filter by Role"
                      size="small"
                    />
                  )}
                  freeSolo
                  sx={{ minWidth: { xs: 300, sm: 200 } }}
                />
                <Button
                  onClick={handleClearFilters}
                  sx={{
                    minWidth: { xs: 300, sm: 150 },
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
              </div>
              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", marginTop: "50px" }}>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    Loading...
                  </Typography>
                  <CircularProgress />
                </Box>
              ) : users.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    fontWeight: "bold",
                    fontSize: "18px",
                  }}
                >
                  No user found
                </div>
              ) : (
                <>
                  <div style={{ width: "100%", overflow: "auto" }}>
                    <table
                      border="1"
                      cellPadding="8"
                      style={{ borderCollapse: "collapse", width: "98%" }}
                    >
                      <thead>
                        <tr>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user, idx) => (
                          <tr key={idx}>
                            <td>{user.email}</td>
                            <td>
                              {user.role
                                .split(/(?=[A-Z])/)
                                .join(" ")
                                .replace(/^\w/, (c) => c.toUpperCase())}
                            </td>
                            <td>
                              <button
                                style={{
                                  background: "#f44336",
                                  padding: "5px 10px",
                                  cursor: "pointer",
                                }}
                                onClick={() =>
                                  handleDelete(user.email, user.Id)
                                }
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Dialog
                    open={deleteDialogOpen}
                    onClose={() => setDeleteDialogOpen(false)}
                  >
                    <DialogTitle>Delete Role</DialogTitle>
                    <DialogContent>
                      <p>
                        Choose delete option for{" "}
                        <strong>{deleteTarget.email}</strong>:
                      </p>
                      <Button
                        onClick={() => confirmDelete("email")}
                        color="error"
                        sx={{ m: 1 }}
                      >
                        🧹 Delete all roles associated with this email
                      </Button>
                      <Button
                        onClick={() => confirmDelete("id")}
                        color="error"
                        sx={{ m: 1 }}
                      >
                        🧩 Delete selected role
                      </Button>
                    </DialogContent>
                  </Dialog>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      gap: 2,
                      marginTop: 2,
                    }}
                  >
                    <Button
                      variant="contained"
                      disabled={previousPage.length === 0}
                      onClick={() => {
                        const prev = [...previousPage];
                        const lastToken = prev.pop(); // ✅ Go back to last token
                        setPreviousPage(prev);
                        fetchFilteredUsers(lastToken);
                      }}
                      sx={{
                        width: "120px",
                      }}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="contained"
                      disabled={!nextPage}
                      onClick={() => {
                        setPreviousPage([
                          ...previousPage,
                          currentPage,
                        ]); // ✅ Store current before moving
                        fetchFilteredUsers(nextPage);
                      }}
                      sx={{
                        width: "120px",
                      }}
                    >
                      Next
                    </Button>
                  </Box>
                </>
              )}
            </div>
          )}
          {tabIndex === 1 && (
            <div className="assign-role">
              <h2>Assign Role</h2>
              <div className="filter-role">
                <Autocomplete
                  options={teamIds}
                  value={email}
                  onChange={(event, value) => setEmail(value || "")}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Email"
                      size="small"
                    />
                  )}
                  freeSolo
                  sx={{ minWidth: 300 }}
                  slotProps={{
                    paper: {
                      sx: {
                        '& ul': {
                          maxHeight: 300,
                          overflow: 'auto',
                        }
                      },
                    }
                  }}
                />
                <Autocomplete
                  options={roles}
                  key={selectedRole}
                  value={roles.find((role) => role.value === selectedRole) || null}
                  onChange={(event, newValue) => setSelectedRole(newValue ? newValue.value : "")} 
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select Role"
                      size="small"
                    />
                  )}
                  freeSolo
                  sx={{ minWidth: { xs: 300, sm: 200 } }}
                />
                <Button
                  variant="contained"
                  onClick={handleAssignRole}
                  style={{ backgroundColor: "#4CAF50", color: "white" }}
                >
                  Assign Role
                </Button>
              </div>
              <Box>
                <TableContainer component={Paper} elevation={1} sx={{ overflowX: "hidden" }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Role</strong></TableCell>
                        <TableCell><strong>Access Description</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Admin</TableCell>
                        <TableCell>
                          Can add or remove other admins and project managers. Also view the payable days overview for all employees.
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Project Manager</TableCell>
                        <TableCell>
                          Can manage and assign projects, but cannot manage admins or super admins. Can only view their own payable days overview.
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Super Admin</TableCell>
                        <TableCell>
                          Full access including system-wide settings.
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </div>
          )}
          <Snackbar
            open={snackbarOpen}
            autoHideDuration={3000}
            onClose={() => setSnackbarOpen(false)}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          >
            <Alert
              onClose={() => setSnackbarOpen(false)}
              severity={snackbarSeverity}
              sx={{ width: "100%" }}
              style={{
                backgroundColor:
                  snackbarSeverity === "success" ? "#4CAF50" : "#f44336",
                color: "white",
              }}
            >
              {snackbarMessage}
            </Alert>
          </Snackbar>
        </div>
      </div>
    </div>
  );
};
export default RoleUpdateForm;