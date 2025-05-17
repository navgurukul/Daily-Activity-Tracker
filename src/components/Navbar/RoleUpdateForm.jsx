import React, { useEffect, useState } from "react";
import {
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  Select,
  FormControl,
  InputLabel,
  Pagination,
  Box,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import "./RoleUpdateForm.css";

// Dummy email list
const dummyEmails = [
  "amit@navgurukul.org",
  "ujjwal@navgurukul.org",
  "neha@navgurukul.org",
  "rahul@navgurukul.org",
  "sumit@navgurukul.org",
  "pooja@navgurukul.org",
  "amitkumar@navgurukul.org",
  "abc@navgurukul.org",
  "def@navgurukul.org"
];

const RoleUpdateForm = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("admin");

  const [filterEmail, setFilterEmail] = useState("");
  const [filterRole, setFilterRole] = useState("");

  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 100;

  const [tabIndex, setTabIndex] = useState(0);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ email: "", id: "" });

  // Fetch users with filters
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      const queryParams = new URLSearchParams();
      if (filterEmail.trim()) queryParams.append("email", filterEmail.trim());
      if (filterRole.trim()) queryParams.append("role", filterRole.trim());

      const fetchFilteredUsers = async () => {
        setLoading(true);
        try {
          const res = await fetch(
            `https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/accessControl?${queryParams.toString()}`,
            { signal: controller.signal }
          );
          const data = await res.json();
          setUsers(data.items || []);
        } catch (err) {
          if (err.name !== "AbortError") {
            console.error("Filtering error:", err);
          }
        } finally {
          setLoading(false);
        }
      };

      fetchFilteredUsers();
    }, 400);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [filterEmail, filterRole]);

  useEffect(() => {
    setFilteredData(users);
    setCurrentPage(1);
  }, [users]);

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
        "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/accessControl",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        const data = await res.json();
        setSnackbarMessage(data.message || "Role assigned successfully");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        setFilterEmail("");
        setFilterRole("");
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
      url = `https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/accessControl?email=${encodeURIComponent(
        email
      )}`;
    } else if (option === "id") {
      url = `https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/accessControl?Id=${id}`;
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
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      });

      if (res.ok) {
        setSnackbarMessage("Deleted successfully");
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
        setFilterEmail("");
        setFilterRole("");
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

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredData.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredData.length / usersPerPage);

  return (
    <div
      style={{ padding: "20px", fontFamily: "sans-serif", marginLeft: "30px" }}
    >
      <div className="tabs">
        <button
          className={`tab-button ${tabIndex === 0 ? "active-tab" : ""}`}
          onClick={() => setTabIndex(0)}
        >
          {/* View Users */}
          👤 Manage Users
        </button>
        <button
          className={`tab-button ${tabIndex === 1 ? "active-tab" : ""}`}
          onClick={() => setTabIndex(1)}
        >
          🛡️ Assign Roles
        </button>
      </div>

      {tabIndex === 0 && (
        <div>
          <h2>All Users</h2>
          <div
            style={{
              marginBottom: "20px",
              display: "flex",
              gap: "20px",
              alignItems: "center",
            }}
          >
            <FormControl style={{ width: "300px" }} size="small">
              <InputLabel>Filter by Email</InputLabel>
              <Select
                value={filterEmail}
                onChange={(e) => setFilterEmail(e.target.value)}
                label="Filter by Email"
              >
                <MenuItem value="">All</MenuItem>
                {[...new Set(users.map((u) => u.email))].map((email, i) => (
                  <MenuItem key={i} value={email}>
                    {email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Filter by Role"
              variant="outlined"
              select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              style={{ width: "200px" }}
              size="small"
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="projectManager">Project Manager</MenuItem>
              <MenuItem value="superAdmin">Super Admin</MenuItem>
            </TextField>
            <Button
              variant="outlined"
              onClick={handleClearFilters}
              style={{
                border: "2px solid #f44336",
                color: "#f44336",
              }}
            >
              Clear Filters
            </Button>
          </div>

          {loading ? (
            <CircularProgress
              style={{
                display: "block",
                margin: "0 auto",
                marginTop: "100px",
              }}
            />
          ) : currentUsers.length === 0 ? (
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
              <table
                border="1"
                cellPadding="8"
                style={{ borderCollapse: "collapse", width: "100%" }}
              >
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentUsers.map((user, idx) => (
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
                          onClick={() => handleDelete(user.email, user.Id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                    {/* Delete by Email */}
                    🧹 Delete all roles associated with this email
                  </Button>
                  <Button
                    onClick={() => confirmDelete("id")}
                    color="error"
                    sx={{ m: 1 }}
                  >
                    {/* Delete by ID */}
                    🧩 Delete selected role
                  </Button>
                </DialogContent>
              </Dialog>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: 2,
                }}
              >
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(_, page) => setCurrentPage(page)}
                  style={{ marginTop: "20px" }}
                  siblingCount={1}
                  boundaryCount={1}
                  color="primary"
                />
              </Box>
            </>
          )}
        </div>
      )}

      {tabIndex === 1 && (
        <div>
          <h2>Assign Role</h2>
          <div
            style={{
              marginBottom: "20px",
              display: "flex",
              gap: "20px",
              alignItems: "center",
            }}
          >
            <FormControl style={{ width: "300px" }} size="small">
              <InputLabel>Select Email</InputLabel>
              <Select
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                label="Select Email"
              >
                {dummyEmails.map((dummyEmail, i) => (
                  <MenuItem key={i} value={dummyEmail}>
                    {dummyEmail}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Select Role"
              select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{ width: "200px" }}
              size="small"
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="projectManager">Project Manager</MenuItem>
              <MenuItem value="superAdmin">Super Admin</MenuItem>
            </TextField>

            <Button
              variant="contained"
              onClick={handleAssignRole}
              style={{ backgroundColor: "#4CAF50", color: "white" }}
            >
              Assign Role
            </Button>
          </div>
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
  );
};

export default RoleUpdateForm;