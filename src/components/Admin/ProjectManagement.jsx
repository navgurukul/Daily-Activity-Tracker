import React, { useState, useEffect, useRef } from "react";
import { Modal, Box, Typography, Button, DialogActions, CircularProgress, FormControl, TextField, InputLabel, Select, MenuItem, Tooltip, FormHelperText, Snackbar } from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import { handleBeforeUnload } from "../../utils/beforeUnloadHandler";
import AddProjectModal from "./AddProjectModal";
import "./ProjectManagement.css";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  maxWidth: 650,
  minWidth: 250,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const ProjectManagement = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editData, setEditData] = useState({
    department: "",
    projectName: "",
    channelName: "",
    channelId: "",
    projectMasterEmail: "",
    clientName: "",
    status: "active",
    priorities: "",
    projectBudget: "",
    Id: "",
    campus: "",
    discordWebhook: "",
    poc_of_project: "",
    projectStatus: "", // Add this field
  });

  const [filters, setFilters] = useState({
    department: "",
    campus: "",
    projectName: "",
    projectMasterEmail: "",
    projectStatus: "",
  });

  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");

  const [campuses, setCampuses] = useState([
    "Bangalore",
    "Himachal",
    "Kishanganj",
    "Udaipur",
    "Dantewada",
    "Raipur",
    "Jashpur",
    "Dharamshala",
    "Sarjapur",
    "Pune",
    "Team Channels",
    "Support Team Updates",
    "Raigarh"
  ]);
  
  const [open, setOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);

  // Add Project Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [validationMsgOnEdit, setValidationMsgOnEdit] = useState({
    channelId: "",
    campus: "",
    discordWebhook: "",
    pocOfProject: "",
    pmEmail: "",
    projectBudget: "",
    projectStatus: "",
  });

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const Alert = React.forwardRef(function Alert(props, ref) {
    return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleOpen = (project) => {
    setSelectedProject(project);
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/employeeSheetRecords?sheet=pncdata`
        );
        const data = await res.json();
        if (data.success) {
          const allDepartments = data.data.map((item) => item.Department);
          const uniqueDepartments = [...new Set(allDepartments)];
          setDepartments(uniqueDepartments);
        }
      } catch (err) {
        console.error("Error fetching departments:", err);
      }
    };
    fetchDepartments();
  }, []);

  // Single filtering logic for all projects
  useEffect(() => {
    const filtered = projects.filter((project) => {
      return (
        (project.department || "").toLowerCase().includes(filters.department.toLowerCase()) &&
        (project.campus || "").toLowerCase().includes(filters.campus.toLowerCase()) &&
        (project.projectName || "").toLowerCase().includes(filters.projectName.toLowerCase()) &&
        (project.projectMasterEmail || "").toLowerCase().includes(filters.projectMasterEmail.toLowerCase()) &&
        (project.projectStatus || "").toLowerCase().includes(filters.projectStatus.toLowerCase())
      );
    });
    setFilteredProjects(filtered);
  }, [filters, projects]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      department: "",
      campus: "",
      projectName: "",
      projectMasterEmail: "",
      projectStatus: "",
    });
  };

  // Fetch all projects from single API
  useEffect(() => {
    fetch(`${API_BASE_URL}/employees`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.data)) {
          setProjects(data.data);
        } else {
          setProjects([]);
        }
      })
      .catch((error) => {
        console.error("Error fetching projects:", error);
        setProjects([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Refetch all projects function
  const refetchProjects = () => {
    fetch(`${API_BASE_URL}/employees`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.data)) {
          setProjects(data.data);
        }
      })
      .catch((error) => {
        console.error("Error refetching projects:", error);
      });
  };

  // Handle Add Project Modal Submit
  const handleAddProjectSubmit = (projectData) => {
    fetch(`${API_BASE_URL}/employees`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(projectData),
    })
      .then((response) => response.json())
      .then((newProject) => {
        setSnackbarMessage("Project added successfully!");
        setSnackbarOpen(true);
        setIsAddModalOpen(false);
        refetchProjects();
        window.removeEventListener("beforeunload", handleBeforeUnload);
      })
      .catch((error) => {
        console.error("Error adding project:", error);
        setSnackbarMessage("Error adding project. Please try again.");
        setSnackbarOpen(true);
      });
  };

  const handleEditProject = (project, index) => {
    setEditData(project);
    setIsEditMode(true);
    setEditingIndex(index);
    setSelectedDept(project.department);
    // Clear validation errors when opening edit modal
    setValidationMsgOnEdit({
      channelId: "",
      campus: "",
      discordWebhook: "",
      pocOfProject: "",
      pmEmail: "",
      projectBudget: "",
      projectStatus: "",
    });
  };

  const handleUpdateProject = () => {
    fetch(`${API_BASE_URL}/employees`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(editData),
    })
      .then((res) => {
        console.log("Response from server:", res);
        return res.json();
      })
      .then((updatedProject) => {
        setSnackbarMessage("Project updated successfully!");
        setSnackbarOpen(true);
        const updatedProjects = [...projects];
        updatedProjects[editingIndex] = updatedProject;
        setProjects(updatedProjects);
        setEditData({
          department: "",
          projectName: "",
          channelName: "",
          channelId: "",
          projectMasterEmail: "",
          clientName: "",
          projectStatus: "",
          status: "",
          priorities: "",
          projectBudget: "",
          Id: "",
          campus: "",
          discordWebhook: "",
          poc_of_project: "",
        });
        setIsEditMode(false);
        setEditingIndex(null);
        refetchProjects();
        window.removeEventListener("beforeunload", handleBeforeUnload);
      })
      .catch((err) => console.error("Error updating project:", err));
  };

  // FIXED: Simplified validation logic
  const isFormValid = () => {
    const isNonResidential = selectedDept !== "Residential Program";
    
    console.log("Form validation check:", {
      projectName: editData.projectName,
      projectMasterEmail: editData.projectMasterEmail,
      projectBudget: editData.projectBudget,
      projectStatus: editData.projectStatus,
      selectedDept: selectedDept,
      isNonResidential: isNonResidential
    });
    
    // Basic required fields check
    if (!editData.projectName?.trim()) return false;
    if (!editData.projectMasterEmail?.trim()) return false;
    if (!editData.projectBudget || Number(editData.projectBudget) < 0) return false;
    if (!editData.projectStatus) return false;

    // Type-specific validation - MADE CHANNELID OPTIONAL
    if (!isNonResidential) {
      // Residential needs campus and POC
      if (!editData.campus?.trim()) return false;
      if (!editData.poc_of_project?.trim()) return false;
    }
    // Note: Removed channelId requirement for Non-Residential projects

    // Check if there are validation errors
    const hasErrors = Object.values(validationMsgOnEdit).some((error) => error !== "");
    if (hasErrors) return false;

    return true;
  };

  return (
    <div
      className="admin-container"
      style={{ overflowY: "scroll", height: "90vh" }}
    >
      {/* Header with Add Project Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 className="admin-title" style={{ textAlign: 'left', margin: 0 }}>Project Dashboard</h1>
          <p style={{ color: '#666', margin: '5px 0 0 0', fontSize: '16px' }}>Manage and track all your projects</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #4CAF50, #45a049)',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 4px 12px rgba(76, 175, 80, 0.4)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 2px 8px rgba(76, 175, 80, 0.3)';
          }}
        >
          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>+</span>
          Add Project
        </button>
      </div>

      {/* Add Project Modal */}
      <AddProjectModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddProjectSubmit}
        departments={departments}
      />
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <div className="table-container">
        <h2>All Projects</h2>
        
        {/* Updated Filters - Show all filter options */}
        <div className="filters">
          <h4>Filters:</h4>

          {/* Department Filter */}
          <input
            type="text"
            name="department"
            placeholder="Filter by Department"
            value={filters.department}
            onChange={handleFilterChange}
          />

          {/* Campus Filter */}
          <input
            type="text"
            name="campus"
            placeholder="Filter by Campus"
            value={filters.campus}
            onChange={handleFilterChange}
          />

          {/* Common Filters */}
          <input
            type="text"
            name="projectName"
            placeholder="Filter by Project Name"
            value={filters.projectName}
            onChange={handleFilterChange}
          />
          <input
            type="text"
            name="projectMasterEmail"
            placeholder="Filter by PM Email"
            value={filters.projectMasterEmail}
            onChange={handleFilterChange}
          />
          <select
            name="projectStatus"
            value={filters.projectStatus}
            onChange={handleFilterChange}
          >
            <option value="" disabled>Select Status</option>
            <option value="">All</option>
            <option value="Active">Active</option>
            <option value="InActive">InActive</option>
          </select>
          <button className="clear-filters-btn" onClick={handleClearFilters}>
            CLEAR FILTERS
          </button>
        </div>

        {/* Single Unified Table */}
        <div className="table-wrapper">
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 5, gap: 1 }}>
              <p>Loading...</p>
              <CircularProgress />
            </Box>
          ) : filteredProjects.length !== 0 ? (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Project Name</th>
                    <th>PM Email</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project, index) => (
                    <tr key={index} onClick={() => handleOpen(project)} style={{ cursor: "pointer" }}>
                      <td>
                        {project.campus || project.department}
                      </td>
                      <td>{project.projectName}</td>
                      <td>{project.projectMasterEmail}</td>
                      <td>{project.projectStatus}</td>
                      <td>
                        <button
                          className="editBtn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditProject(project, index);
                          }}
                        >
                          ✏️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Single Modal for all project types */}
              <Modal open={open} onClose={handleClose}>
                <Box sx={style}>
                  {selectedProject && (
                    <>
                      <Typography variant="h6" gutterBottom>
                        Project Details
                      </Typography>
                      <Typography>
                        <strong>Type:</strong> {selectedProject.department === "Residential Program" ? "Residential" : "Non-Residential"}
                      </Typography>
                      
                      {/* Show different fields based on project type */}
                      {selectedProject.department === "Residential Program" ? (
                        <>
                          <Typography><strong>Campus:</strong> {selectedProject.campus}</Typography>
                          <Typography><strong>POC:</strong> {selectedProject.poc_of_project}</Typography>
                        </>
                      ) : (
                        <>
                          <Typography><strong>Department:</strong> {selectedProject.department}</Typography>
                          <Typography><strong>Channel ID:</strong> {selectedProject.channelId}</Typography>
                        </>
                      )}
                      
                      <Typography><strong>Project Name:</strong> {selectedProject.projectName}</Typography>
                      <Typography><strong>PM Email:</strong> {selectedProject.projectMasterEmail}</Typography>
                      <Typography>
                        <strong>Discord Webhook:</strong> 
                        <span style={{ 
                          wordBreak: 'break-all', 
                          fontSize: '12px',
                          color: '#666',
                          display: 'block',
                          marginTop: '4px',
                          lineHeight: '1.4',
                          whiteSpace: 'normal'
                        }}>
                          {selectedProject.discordWebhook || 'Not provided'}
                        </span>
                      </Typography>
                      <Typography><strong>Budget:</strong> {selectedProject.projectBudget}</Typography>
                      <Typography><strong>Status:</strong> {selectedProject.projectStatus}</Typography>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "flex-end",
                          mt: 3,
                          mb: 0,
                        }}
                      >
                        <Button variant="contained" color="success" onClick={handleClose}>
                          Close
                        </Button>
                      </Box>
                    </>
                  )}
                </Box>
              </Modal>
            </>
          ) : (
            <p className="no-data">No projects found</p>
          )}
        </div>
      </div>
      
      {/* EDIT PROJECT MODAL - BOTH ISSUES FIXED */}
      {isEditMode && (
        <div 
          className="modal-overlay edit-modal"
          onClick={(e) => {
            if (e.currentTarget === e.target) {
              setIsEditMode(false);
            }
          }}
        >
          <div 
            className="modal-content edit-modal" 
            style={{ 
              maxHeight: '90vh', 
              overflowY: 'auto',
              position: 'relative'
            }}
          >
            <button
              className="close-button"
              onClick={() => {
                setIsEditMode(false)
              }}
            >
              &times;
            </button>
            <h2>Edit Project</h2>
            <Box 
              className="update-form-fields" 
              sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 2,
                position: 'relative'
              }}
            >

              {/* Project Name - Disabled */}
              <TextField
                label="Project Name"
                variant="outlined"
                fullWidth
                value={editData.projectName || ""}
                disabled
              />

              {/* Non-Residential Projects Fields */}
              {selectedDept !== "Residential Program" && (
                <TextField
                  label="Slack Channel ID (Optional)"
                  variant="outlined"
                  fullWidth
                  value={editData.channelId || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEditData({ ...editData, channelId: value });
                    // No validation needed since it's optional
                  }}
                />
              )}

              {/* Residential Projects Fields */}
              {selectedDept === "Residential Program" && (
                <>
                  <FormControl fullWidth error={!!validationMsgOnEdit.campus}>
                    <InputLabel>Campus</InputLabel>
                    <Select
                      value={editData.campus || ""}
                      label="Campus"
                      MenuProps={{
                        anchorOrigin: {
                          vertical: "bottom",
                          horizontal: "left"
                        },
                        transformOrigin: {
                          vertical: "top",
                          horizontal: "left"
                        },
                        PaperProps: {
                          style: {
                            maxHeight: 200,
                            zIndex: 9999
                          }
                        }
                      }}
                      onChange={(e) => {
                        const value = e.target.value;
                        setEditData({ ...editData, campus: value });
                        setValidationMsgOnEdit((prev) => ({
                          ...prev,
                          campus: value === "" ? "Campus can't be empty" : "",
                        }));
                      }}
                    >
                      {campuses.map((campus, idx) => (
                        <MenuItem key={idx} value={campus}>
                          {campus}
                        </MenuItem>
                      ))}
                    </Select>
                    {!!validationMsgOnEdit.campus && (
                      <FormHelperText>{validationMsgOnEdit.campus}</FormHelperText>
                    )}
                  </FormControl>

                  <TextField
                    label="POC of Project"
                    variant="outlined"
                    fullWidth
                    multiline
                    rows={1}
                    value={editData.poc_of_project || ""}
                    onChange={(e) => {
                      const value = e.target.value;
                      setEditData({ ...editData, poc_of_project: value });
                      setValidationMsgOnEdit((prev) => ({
                        ...prev,
                        pocOfProject: value.trim() === "" ? "POC of project can't be empty" : "",
                      }));
                    }}
                    error={!!validationMsgOnEdit.pocOfProject}
                    helperText={validationMsgOnEdit.pocOfProject}
                  />
                </>
              )}

              {/* Common Fields for All Projects */}
              <TextField
                label="PM Email"
                variant="outlined"
                fullWidth
                value={editData.projectMasterEmail || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setEditData({ ...editData, projectMasterEmail: value });
                  setValidationMsgOnEdit((prev) => ({
                    ...prev,
                    pmEmail: value.trim() === "" ? "PM email can't be empty" : "",
                  }));
                }}
                error={!!validationMsgOnEdit.pmEmail}
                helperText={validationMsgOnEdit.pmEmail}
              />

              {/* Discord Channel Web Hook URL - For All Projects */}
              <TextField
                label="Discord Channel Web Hook URL"
                variant="outlined"
                fullWidth
                value={editData.discordWebhook || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setEditData({ ...editData, discordWebhook: value });
                }}
                placeholder="https://discord.com/api/webhooks/..."
              />

              <TextField
                label="Project Budget"
                variant="outlined"
                type="number"
                fullWidth
                value={editData.projectBudget || ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setEditData({ ...editData, projectBudget: value });
                  setValidationMsgOnEdit((prev) => ({
                    ...prev,
                    projectBudget: value.trim() === "" ? "Project budget can't be empty" : "",
                  }));
                }}
                error={!!validationMsgOnEdit.projectBudget}
                helperText={validationMsgOnEdit.projectBudget}
              />

              {/* STATUS DROPDOWN - COMPLETELY FIXED */}
              <FormControl fullWidth error={!!validationMsgOnEdit.projectStatus}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editData.projectStatus || ""}
                  label="Status"
                  MenuProps={{
                    anchorOrigin: {
                      vertical: "bottom",
                      horizontal: "left"
                    },
                    transformOrigin: {
                      vertical: "top", 
                      horizontal: "left"
                    },
                    PaperProps: {
                      style: {
                        maxHeight: 200,
                        zIndex: 9999
                      }
                    },
                    disablePortal: true
                  }}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEditData({ ...editData, projectStatus: value });
                    setValidationMsgOnEdit((prev) => ({
                      ...prev,
                      projectStatus: value === "" ? "Project status can't be empty" : "",
                    }));
                  }}
                >
                  <MenuItem value="Active">Active</MenuItem>
                  <MenuItem value="InActive">InActive</MenuItem>
                </Select>
                {!!validationMsgOnEdit.projectStatus && (
                  <FormHelperText>{validationMsgOnEdit.projectStatus}</FormHelperText>
                )}
              </FormControl>

            </Box>
            <button 
              className="update-btn" 
              onClick={handleUpdateProject}
              disabled={!isFormValid()}
              style={{
                opacity: !isFormValid() ? 0.6 : 1,
                cursor: !isFormValid() ? 'not-allowed' : 'pointer',
                marginTop: '20px',
                backgroundColor: isFormValid() ? '#4CAF50' : '#ccc',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              Update Project
            </button>

          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;