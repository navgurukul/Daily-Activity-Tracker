import React, { useState, useEffect, useRef } from "react";
import { Modal, Box, Typography, Button, DialogActions, CircularProgress, FormControl, TextField, InputLabel, Select, MenuItem, Tooltip, FormHelperText, Snackbar } from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import { handleBeforeUnload } from "../../utils/beforeUnloadHandler";
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
  const [data, setData] = useState({
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
  });
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
  });

  const [projects, setProjects] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [errors, setErrors] = useState({});

  const [filters, setFilters] = useState({
    department: "",
    campus: "",
    projectName: "",
    projectMasterEmail: "",
    priorities: "",
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
  
  const [showTooltip, setShowTooltip] = useState(false);
  const [showTextareaTooltip, setShowTextareaTooltip] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [residentialProjects, setResidentialProjects] = useState([]);
  const [nonResidentialProjects, setNonResidentialProjects] = useState([]);
  const [filteredResidential, setFilteredResidential] = useState([]);
  const [filteredNonResidential, setFilteredNonResidential] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const [validationMsgOnEdit, setValidationMsgOnEdit] = useState({
  channelName: "",
  channelId: "",
  campus: "",
  discordWebhook: "",
  pocOfProject: "",
  pmEmail: "",
  priorities: "",
  budget: "",
  status: "",
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

  useEffect(() => {
    const filtered = residentialProjects.filter((project) => {
      return (
        (project.campus || "").toLowerCase().includes(filters.campus.toLowerCase()) &&
        (project.projectName || "").toLowerCase().includes(filters.projectName.toLowerCase()) &&
        (project.projectMasterEmail || "").toLowerCase().includes(filters.projectMasterEmail.toLowerCase()) &&
        (project.priorities || "").toLowerCase().includes(filters.priorities.toLowerCase()) &&
        (project.projectStatus || "").toLowerCase().includes(filters.projectStatus.toLowerCase())
      );
    });
    setFilteredResidential(filtered);
  }, [filters, residentialProjects]);

  useEffect(() => {
    const filtered = nonResidentialProjects.filter((project) => {
      return (
        (project.department || "").toLowerCase().includes(filters.department.toLowerCase()) &&
        (project.projectName || "").toLowerCase().includes(filters.projectName.toLowerCase()) &&
        (project.projectMasterEmail || "").toLowerCase().includes(filters.projectMasterEmail.toLowerCase()) &&
        (project.priorities || "").toLowerCase().includes(filters.priorities.toLowerCase()) &&
        (project.projectStatus || "").toLowerCase().includes(filters.projectStatus.toLowerCase())
      );
    });
    setFilteredNonResidential(filtered);
  }, [filters, nonResidentialProjects]);

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
      priorities: "",
      projectStatus: "",
    });
  };

  useEffect(() => {
  setFilters({
    campus: "",
    department: "",
    projectName: "",
    projectMasterEmail: "",
    priorities: "",
    projectStatus: "",
  });
}, [tabIndex]);

  useEffect(() => {
    fetch(
      `${API_BASE_URL}/employees`
    )
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
      });
  }, []);

  const handleAddProject = () => {
    const newErrors = {};
    const residentialDepts = [
      "Residential Program",
      "Culture",
      "Academics",
      "Operations",
      "LXD & ETC",
      "Campus Support Staff",
      "Campus_Security"
    ];
    // Pre-validation
    if (!data.department) {
      newErrors.department = "Please select a department*";
    }
    if (!data.projectName) {
      newErrors.projectName = "Please fill in the project name*";
    }
    if (residentialDepts.includes(data.department)) {
      if (!data.campus) {
        newErrors.campus = "Please select a campus*";
      }
      if (!data.discordWebhook) {
        newErrors.discordWebhook = "Please fill in the Discord channel web hook URL*";
      }
      if (!data.poc_of_project) {
        newErrors.poc_of_project = "Please fill in the POC of project*";
      }
    } else {
      if (!data.channelName) {
        newErrors.channelName = "Please fill in the channel name*";
      }
      if (!data.channelId) {
        newErrors.channelId = "Please fill in the channel ID*";
      }
    }
    if (!data.projectMasterEmail) {
      newErrors.projectMasterEmail = "Please fill in the project master email*";
    }
    if (!data.projectBudget) {
      newErrors.projectBudget = "Please fill in the project budget*";
    } else if (isNaN(data.projectBudget) || Number(data.projectBudget) < 0) {
      newErrors.projectBudget = "Please enter a valid project budget*";
    }
    if (!data.priorities) {
      newErrors.priorities = "Please select a priority*";
    }
    if (!data.projectStatus) {
      newErrors.projectStatus = "Please select a project status*";
    }
    if (Object.keys(newErrors).length > 0) {
      console.log("Validation errors:", newErrors);
      setErrors(newErrors);
      return;
    }
    setErrors({});
    // Make the API call
    fetch(`${API_BASE_URL}/employees`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((newProject) => {
        setSnackbarMessage("Project added successfully!");
        setSnackbarOpen(true);
        setData({
          department: selectedDept,
          projectName: "",
          channelName: "",
          channelId: "",
          projectMasterEmail: "",
          clientName: "",
          projectStatus: "active",
          priorities: "",
          projectBudget: "",
          Id: "",
          campus: "",
          discordWebhook: "",
          poc_of_project: "",
        });
        fetchResidentialProjects();
        fetchNonResidentialProjects();
        window.removeEventListener("beforeunload", handleBeforeUnload);
      })
      .catch((error) => console.error("Error adding project:", error));
  };

  const handleEditProject = (project, index) => {
    setEditData(project);
    setIsEditMode(true);
    setEditingIndex(index);
    setSelectedDept(project.department);
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
          department: selectedDept,
          projectName: "",
          channelName: "",
          channelId: "",
          projectMasterEmail: "",
          clientName: "",
          projectStatus: "active",
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
        fetchResidentialProjects();
        fetchNonResidentialProjects();
        window.removeEventListener("beforeunload", handleBeforeUnload);
      })
      .catch((err) => console.error("Error updating project:", err));
  };

const isFormValid = () => {
  const isResidential = selectedDept !== "Residential Program";
  return (
    (editData.projectName?.trim() || "") !== "" &&
    (editData.projectMasterEmail?.trim() || "") !== "" &&
    (editData.priorities || "") !== "" &&
    (editData.projectStatus || "") !== "" &&
    Object.values(validationMsgOnEdit).every((error) => error === "") &&
    (isResidential
      ? (editData.channelName?.trim() || "") !== "" &&
        (editData.channelId?.trim() || "") !== ""
      : (editData.campus || "") !== "" &&
        (editData.discordWebhook?.trim() || "") !== "" &&
        (editData.poc_of_project?.trim() || "") !== "") &&
    (editData.projectMasterEmail?.trim() || "") !== "" &&
    (editData.projectBudget || "") !== "" &&
    Number(editData.projectBudget) >= 0
  );
};

  const fetchResidentialProjects = () => {
  fetch(`${API_BASE_URL}/employees?ResidentialNonResi=Residential-Program`)
    .then((res) => res.json())
    .then((data) => {
      if (Array.isArray(data.data)) {
        setResidentialProjects(data.data);
      }
    })
    .catch((err) => console.error("Error fetching residential:", err))
    .finally(() => setLoading(false));
};

const fetchNonResidentialProjects = () => {
  fetch(`${API_BASE_URL}/employees?ResidentialNonResi=Non-Residential`)
    .then((res) => res.json())
    .then((data) => {
      if (Array.isArray(data.data)) {
        setNonResidentialProjects(data.data);
      }
    })
    .catch((err) => console.error("Error fetching non-residential:", err));
};

  useEffect(() => {
    fetchResidentialProjects();
    fetchNonResidentialProjects();
  }, []);

  return (
    <div
      className="admin-container"
      style={{ overflowY: "scroll", height: "90vh" }}
    >
      <h1 className="admin-title">Admin - Project Tracker</h1>

      <div className="form-container">
        <h2>Add New Project</h2>
        <div className="form-fields">
          <div className="input-wrapper">
            <select
              className="input-field"
              value={selectedDept}
              onChange={(e) => {
                setData({ ...data, department: e.target.value });
                setSelectedDept(e.target.value);
              }}
            >
              <option value="" disabled>
                Select Department
              </option>
              {departments.map((dept, idx) => (
                <option key={idx} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            {errors.department && <div className="error-message">{errors.department}</div>}
          </div>
          {[
            "Residential Program",
            "Culture",
            "Academics",
            "Operations",
            "LXD & ETC",
            "Campus Support Staff",
            "Campus_Security"
          ].includes(selectedDept) && (
              <>
                <div className="input-wrapper">
                  <select
                    name="campus"
                    className="input-field"
                    value={data.campus || ""}
                    onChange={(e) => setData({ ...data, campus: e.target.value })}
                    required
                  >
                    <option value="" disabled>
                      Select Campus
                    </option>
                    {campuses.map((campus, idx) => (
                      <option key={idx} value={campus}>
                        {campus}
                      </option>
                    ))}
                  </select>
                  {errors.campus && <div className="error-message">{errors.campus}</div>}
                </div>
                <div className="input-wrapper">
                  <div className="tooltip-container">
                    <input
                      type="text"
                      placeholder="Discord Channel Web Hook URL"
                      className="input-field"
                      value={data.discordWebhook || ""}
                      onChange={(e) => setData({ ...data, discordWebhook: e.target.value })}
                      onFocus={() => setShowTooltip(true)}
                      onBlur={() => setShowTooltip(false)}
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                    />
                    {showTooltip && (
                      <div className="custom-tooltip">
                        Get your Discord Channel Web Hook URL from your Discord channel settings
                      </div>
                    )}
                  </div>
                  {errors.discordWebhook && <div className="error-message">{errors.discordWebhook}</div>}
                </div>
                <div className="input-wrapper">
                  <div className="tooltip-container tooltip">
                    <textarea
                      placeholder="POC of Project"
                      className="input-field"
                      value={data.poc_of_project || ""}
                      onChange={(e) => setData({ ...data, poc_of_project: e.target.value })}
                      rows="2"
                      onFocus={() => setShowTextareaTooltip(true)}
                      onBlur={() => setShowTextareaTooltip(false)}
                      onMouseEnter={() => setShowTextareaTooltip(true)}
                      onMouseLeave={() => setShowTextareaTooltip(false)}
                    />
                    {showTextareaTooltip && (
                      <div className="custom-tooltip">
                        Enter emails of POC separated by commas (e.g.: john@example.com, jane@example.com)
                      </div>
                    )}
                  </div>
                  {errors.poc_of_project && <div className="error-message">{errors.poc_of_project}</div>}
                </div>
              </>
            )}
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="Project Name"
              className="input-field"
              value={data.projectName}
              onChange={(e) => setData({ ...data, projectName: e.target.value })}
            />
            {errors.projectName && <div className="error-message">{errors.projectName}</div>}
          </div>
          {![
            "Residential Program",
            "Culture",
            "Academics",
            "Operations",
            "LXD & ETC",
            "Campus Support Staff",
            "Campus_Security"
          ].includes(selectedDept) && (
              <>
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="Slack Channel Name"
                    className="input-field"
                    value={data.channelName}
                    onChange={(e) =>
                      setData({ ...data, channelName: e.target.value })
                    }
                  />
                  {errors.channelName && <div className="error-message">{errors.channelName}</div>}
                </div>
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="Slack Channel ID"
                    className="input-field"
                    value={data.channelId}
                    onChange={(e) =>
                      setData({ ...data, channelId: e.target.value })
                    }
                  />
                  {errors.channelId && <div className="error-message">{errors.channelId}</div>}
                </div>
              </>
            )}
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="PM Email"
              className="input-field"
              value={data.projectMasterEmail}
              onChange={(e) =>
                setData({ ...data, projectMasterEmail: e.target.value })
              }
            />
            {errors.projectMasterEmail && <div className="error-message">{errors.projectMasterEmail}</div>}
          </div>
          <div className="input-wrapper">
            <input
              type="text"
              placeholder="Client Name"
              className="input-field"
              value={data.clientName}
              onChange={(e) => setData({ ...data, clientName: e.target.value })}
            />
          </div>
          <div className="input-wrapper">
            <select
              className="input-field"
              value={data.priorities}
              onChange={(e) => setData({ ...data, priorities: e.target.value })}
            >
              <option value="" disabled selected>
                Select Priority
              </option>
              <option value="P0">P0-Very High</option>
              <option value="P1">P1-High</option>
              <option value="P2">P2-Moderate</option>
              <option value="P3">P3-Low</option>
            </select>
            {errors.priorities && <div className="error-message">{errors.priorities}</div>}
          </div>
          <div className="input-wrapper">
            <input
              type="number"
              placeholder="Project Budget"
              className="input-field"
              value={data.projectBudget}
              onChange={(e) =>
                setData({ ...data, projectBudget: e.target.value })
              }
            />
            {errors.projectBudget && <div className="error-message">{errors.projectBudget}</div>}
          </div>
          <div className="input-wrapper">
            <select
              className="input-field"
              value={data.projectStatus}
              onChange={(e) =>
                setData({ ...data, projectStatus: e.target.value })
              }
            >
              <option value="" disabled selected>
                Select Status
              </option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            {errors.projectStatus && <div className="error-message">{errors.projectStatus}</div>}
          </div>
        </div>
        <button className="add-btn" onClick={handleAddProject}>
          Add Project
        </button>
      </div>
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
        <h2>Project List</h2>
        <div className="Project-tab">
          <button
            className={`Project-tab-button ${tabIndex === 0 ? "active-tab" : ""}`}
            onClick={() => setTabIndex(0)}
          >
            🏡 Residential Projects
          </button>
          <button
            className={`Project-tab-button ${tabIndex === 1 ? "active-tab" : ""}`}
            onClick={() => setTabIndex(1)}
          >
            🏢 Non-Residential Projects
          </button>
        </div>
        <div className="filters">
          <h4>Filters:</h4>

          {/* Show Campus only for Residential */}
          {tabIndex === 0 && (
            <input
              type="text"
              name="campus"
              placeholder="Filter by Campus"
              value={filters.campus}
              onChange={handleFilterChange}
            />
          )}

          {/* Show Department only for Non-Residential */}
          {tabIndex === 1 && (
            <input
              type="text"
              name="department"
              placeholder="Filter by Department"
              value={filters.department}
              onChange={handleFilterChange}
            />
          )}

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
            name="priorities"
            value={filters.priorities}
            onChange={handleFilterChange}
          >
            <option value="" disabled>Select Priority</option>
            <option value="">All</option>
            <option value="P0">P0</option>
            <option value="P1">P1</option>
            <option value="P2">P2</option>
            <option value="P3">P3</option>
          </select>
          <select
            name="projectStatus"
            value={filters.projectStatus}
            onChange={handleFilterChange}
          >
            <option value="" disabled>Select Status</option>
            <option value="">All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <button className="clear-filters-btn" onClick={handleClearFilters}>
            CLEAR FILTERS
          </button>
        </div>
        <div className="table-wrapper">
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 5, gap: 1 }}>
              <p>Loading...</p>
              <CircularProgress />
            </Box>
          ) : (
            tabIndex === 0 ? (
              filteredResidential.length !== 0 ? (
                <>
                  <table>
                    <thead>
                      <tr>
                        <th>Project Name</th>
                        <th>Campus</th>
                        <th>PM Email</th>
                        <th>Priorities</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredResidential.map((project, index) => (
                        <tr key={index} onClick={() => handleOpen(project)} style={{ cursor: "pointer" }}>
                          <td>{project.projectName}</td>
                          <td>{project.campus}</td>
                          <td>{project.projectMasterEmail}</td>
                          <td>{project.priorities}</td>
                          <td>{project.projectStatus}</td>
                          <td>
                            <button
                              className="editBtn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditProject(project, index)
                              }}
                            >
                              ✏️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Modal open={open} onClose={handleClose}>
                    <Box sx={style}>
                      {selectedProject && (
                        <>
                          <Typography variant="h6" gutterBottom>
                            Project Details
                          </Typography>
                          <Typography><strong>Project Name:</strong> {selectedProject.projectName}</Typography>
                          <Typography><strong>Campus:</strong> {selectedProject.campus}</Typography>
                          <Typography><strong>POC:</strong> {selectedProject.poc_of_project}</Typography>
                          <Typography><strong>PM Email:</strong> {selectedProject.projectMasterEmail}</Typography>
                          <Typography><strong>Client:</strong> {selectedProject.clientName}</Typography>
                          <Typography><strong>Priorities:</strong> {selectedProject.priorities}</Typography>
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
                <p className="no-data">No residential projects found</p>
              )
            ) : filteredNonResidential.length !== 0 ? (
              <>
                <table>
                  <thead>
                    <tr>
                      <th>Department Name</th>
                      <th>Project Name</th>
                      <th>Channel Name</th>
                      <th>PM Email</th>
                      <th>Priorities</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredNonResidential.map((project, index) => (
                      <tr key={index} onClick={() => handleOpen(project)} style={{ cursor: "pointer" }}>
                        <td>{project.department}</td>
                        <td>{project.projectName}</td>
                        <td>{project.channelName}</td>
                        <td>{project.projectMasterEmail}</td>
                        <td>{project.priorities}</td>
                        <td>{project.projectStatus}</td>
                        <td>
                          <button
                            className="editBtn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditProject(project, index)
                            }}
                          >
                            ✏️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <Modal open={open} onClose={handleClose}>
                  <Box sx={style}>
                    {selectedProject && (
                      <>
                        <Typography variant="h6" gutterBottom>
                          Project Details
                        </Typography>
                        <Typography><strong>Department:</strong> {selectedProject.department}</Typography>
                        <Typography><strong>Project Name:</strong> {selectedProject.projectName}</Typography>
                        <Typography><strong>Channel Name:</strong> {selectedProject.channelName}</Typography>
                        <Typography><strong>Channel ID:</strong> {selectedProject.channelId}</Typography>
                        <Typography><strong>PM Email:</strong> {selectedProject.projectMasterEmail}</Typography>
                        <Typography><strong>Client:</strong> {selectedProject.clientName}</Typography>
                        <Typography><strong>Priorities:</strong> {selectedProject.priorities}</Typography>
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
              <p className="no-data">No non-residential projects found</p>
            )
          )}
        </div>
      </div>
      {isEditMode && (
        <div className="modal-overlay"
          onClick={(e) => {
            if (e.currentTarget === e.target) {
              setIsEditMode(false);
            }
          }}
        >
          <div className="modal-content">
            <button
              className="close-button"
              onClick={() => {
                setIsEditMode(false)
              }}
            >
              &times;
            </button>
            <h2>Edit Project</h2>
            <Box className="update-form-fields" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

  <TextField
    label="Project Name"
    variant="outlined"
    fullWidth
    value={editData.projectName}
    disabled
  />

  {selectedDept !== "Residential Program" && (
    <>
      <TextField
        label="Slack Channel Name"
        variant="outlined"
        fullWidth
        value={editData.channelName}
        onChange={(e) => {
          const value = e.target.value;
          setEditData({ ...editData, channelName: value });
          setValidationMsgOnEdit((prev) => ({
      ...prev,
      channelName: value.trim() === "" ? "Channel name can't be empty" : "",
    }));
        }}
        error={!!validationMsgOnEdit.channelName}
        helperText={validationMsgOnEdit.channelName}
      />
      <TextField
        label="Slack Channel ID"
        variant="outlined"
        fullWidth
        value={editData.channelId}
        onChange={(e) => {
          const value = e.target.value;
          setEditData({ ...editData, channelId: value });
          setValidationMsgOnEdit((prev) => ({
            ...prev,
            channelId: value.trim() === "" ? "Channel ID can't be empty" : "",
          }));
        }}
        error={!!validationMsgOnEdit.channelId}
        helperText={validationMsgOnEdit.channelId}
      />
    </>
  )}

  {selectedDept === "Residential Program" && (
    <>
      <FormControl fullWidth error={!!validationMsgOnEdit.campus}>
        <InputLabel>Campus</InputLabel>
        <Select
          value={editData.campus || ""}
          label="Campus"
          onChange={(e) => {
            const value = e.target.value;
            setEditData({ ...editData, campus: value });
            setValidationMsgOnEdit((prev) => ({
              ...prev,
              campus: value.trim() === "" ? "Campus can't be empty" : "",
            }));
          }}
          onBlur={() => {
            if (editData.campus.trim() === "") {
              setValidationMsgOnEdit((prev) => ({
                ...prev,
                campus: "Campus can't be empty",
              }));
            }
          }}
          required
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
        label="Discord Channel Webhook URL"
        variant="outlined"
        fullWidth
        value={editData.discordWebhook || ""}
        onChange={(e) => {
          const value = e.target.value;
          setEditData({ ...editData, discordWebhook: value });
          setValidationMsgOnEdit((prev) => ({
            ...prev,
            discordWebhook: value.trim() === "" ? "Discord webhook can't be empty" : "",
          }));
        }}
        error={!!validationMsgOnEdit.discordWebhook}
        helperText={validationMsgOnEdit.discordWebhook}
      />

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

  <TextField
    label="PM Email"
    variant="outlined"
    fullWidth
    value={editData.projectMasterEmail}
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

  <TextField
    label="Client Name"
    variant="outlined"
    fullWidth
    value={editData.clientName}
    onChange={(e) =>
      setEditData({ ...editData, clientName: e.target.value })
    }
  />

  <FormControl fullWidth error={!!validationMsgOnEdit.priority}>
    <InputLabel>Priority</InputLabel>
    <Select
      value={editData.priorities}
      label="Priority"
      onChange={(e) => {
        const value = e.target.value;
        setEditData({ ...editData, priorities: value });
        setValidationMsgOnEdit((prev) => ({
          ...prev,
          priorities: value.trim() === "" ? "Priority can't be empty" : "",
        }));
      }}
      onBlur={() => {
        if (editData.priorities.trim() === "") {
          setValidationMsgOnEdit((prev) => ({
            ...prev,
            priorities: "Priority can't be empty",
          }));
        }
      }}
    >
      <MenuItem value="P0">P0 - Very High</MenuItem>
      <MenuItem value="P1">P1 - High</MenuItem>
      <MenuItem value="P2">P2 - Moderate</MenuItem>
      <MenuItem value="P3">P3 - Low</MenuItem>
    </Select>
    {!!validationMsgOnEdit.priorities && (
      <FormHelperText>{validationMsgOnEdit.priorities}</FormHelperText>
    )}
  </FormControl>

  <TextField
    label="Project Budget"
    variant="outlined"
    type="number"
    fullWidth
    value={editData.projectBudget}
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

  <FormControl fullWidth error={!!validationMsgOnEdit.projectStatus}>
  <InputLabel>Status</InputLabel>
  <Select
    value={editData.projectStatus}
    label="Status"
    onChange={(e) => {
      const value = e.target.value;
      setEditData({ ...editData, projectStatus: value });
      setValidationMsgOnEdit((prev) => ({
        ...prev,
        projectStatus: value.trim() === "" ? "Project status can't be empty" : "",
      }));
    }}
    onBlur={() => {
      if (editData.projectStatus.trim() === "") {
        setValidationMsgOnEdit((prev) => ({
          ...prev,
          projectStatus: "Project status can't be empty",
        }));
      }
    }}
  >
    <MenuItem value="">Select Status</MenuItem>
    <MenuItem value="Active">Active</MenuItem>
    <MenuItem value="Inactive">Inactive</MenuItem>
  </Select>
  {!!validationMsgOnEdit.projectStatus && (
    <FormHelperText>{validationMsgOnEdit.projectStatus}</FormHelperText>
  )}
</FormControl>

</Box>
            <button className="update-btn" onClick={handleUpdateProject}
            disabled={!isFormValid()}
  style={{
    opacity: !isFormValid() ? 0.6 : 1,
    cursor: !isFormValid() ? 'not-allowed' : 'pointer'
  }}>
              Update Project
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;