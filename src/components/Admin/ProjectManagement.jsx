import React, { useState, useEffect } from "react";
import { Modal, Box, Typography, Button, DialogActions } from "@mui/material"
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
        (project.projectStatus || "").includes(filters.projectStatus)
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
        (project.projectStatus || "").includes(filters.projectStatus)
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

  // const handleAddProject = () => {
  //   const newErrors = {};
  //   // Pre-validation
  //   if (!data.department) {
  //     newErrors.department = "Please select a department*";
  //   }
  //   if (!data.projectName) {
  //     newErrors.projectName = "Please fill in the project name*";
  //   }

  //   if (data.department !== "Residential Program") {
  //     if (!data.channelName) {
  //       newErrors.channelName = "Please fill in the channel name*";
  //     }
  //     if (!data.channelId) {
  //       newErrors.channelId = "Please fill in the channel ID*";
  //     }
  //     if (!data.projectMasterEmail) {
  //       newErrors.projectMasterEmail = "Please fill in the project master email*";
  //     }
  //     if (!data.projectBudget) {
  //       newErrors.projectBudget = "Please fill in the project budget*";
  //     }
  //   }
  //   if (data.department === "Residential Program") {
  //     if (!data.campus) {
  //       newErrors.campus = "Please select a campus*";
  //     }
  //     if (!data.discordWebhook) {
  //       newErrors.discordWebhook = "Please fill in the Discord channel web hook URL*";
  //     }
  //     if (!data.poc_of_project) {
  //       newErrors.poc_of_project = "Please fill in the POC of project*";
  //     }
  //   }

  //   if (!data.priorities) {
  //     newErrors.priorities = "Please select a priority*";
  //   }

  //   if (!data.projectStatus) {
  //     newErrors.projectStatus = "Please select a project status*";
  //   }

  //   // Check if project name already exists
  //   // const isDuplicate = projects.some(
  //   //   (project) =>
  //   //     project.projectName.toLowerCase() === data.projectName.toLowerCase()
  //   // );

  //   // if (isDuplicate) {
  //   //   newErrors.projectName = "Project name already exists";
  //   //   return;
  //   // }

  //   if (Object.keys(newErrors).length > 0) {
  //     setErrors(newErrors);
  //     return;
  //   }

  //   setErrors({});

  //   // Make the API call
  //   fetch(API_URL, {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify(data),
  //   })
  //     .then((response) => response.json())
  //     .then((newProject) => {
  //       setProjects([...projects, newProject]);
  //       setData({
  //         department: selectedDept,
  //         projectName: "",
  //         channelName: "",
  //         channelId: "",
  //         projectMasterEmail: "",
  //         clientName: "",
  //         projectStatus: "active",
  //         priorities: "",
  //         projectBudget: "",
  //         Id: "",
  //         campus: "",
  //         discordWebhook: "",
  //         poc_of_project: "",
  //       });
  //       window.removeEventListener("beforeunload", handleBeforeUnload);
  //       window.location.reload();
  //     })
  //     .catch((error) => console.error("Error adding project:", error));
  // };

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
      setProjects([...projects, newProject]);
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
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.location.reload(); // You can remove this if you prefer smoother UX
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
        const updatedProjects = [...projects];
        updatedProjects[editingIndex] = updatedProject;
        setProjects(updatedProjects);
        // setFeedbackMessage(updatedProject.message);
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
        window.removeEventListener("beforeunload", handleBeforeUnload);
        window.location.reload();
      })
      .catch((err) => console.error("Error updating project:", err));
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/employees?ResidentialNonResi=Residential-Program`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.data)) {
          setResidentialProjects(data.data);
        }
      })
      .catch((err) => console.error("Error fetching residential:", err));
  }, []);

  useEffect(() => {
    fetch(`${API_BASE_URL}/employees?ResidentialNonResi=Non-Residential`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.data)) {
          setNonResidentialProjects(data.data);
        }
      })
      .catch((err) => console.error("Error fetching non-residential:", err));
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
          {/* {selectedDept ===  "Residential Program" && ( */}
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
          {/* {selectedDept !== "Residential Program"  && ( */}
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

      <div className="table-container">
        <h2>Project List</h2>
        <div className="tabs">
          <button
            className={`tab-button ${tabIndex === 0 ? "active-tab" : ""}`}
            onClick={() => setTabIndex(0)}
          >
            🏡 Residential Projects
          </button>
          <button
            className={`tab-button ${tabIndex === 1 ? "active-tab" : ""}`}
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
          {tabIndex === 0 ? (
            filteredResidential.length !== 0 ? (
              <>
                <table>
                  <thead>
                    <tr>
                      {/* <th>Department Name</th> */}
                      <th>Project Name</th>
                      <th>Campus</th>
                      {/* <th>Discord Channel Web Hook URL</th> */}
                      {/* <th>POC of Project</th> */}
                      <th>PM Email</th>
                      {/* <th>Client Name</th> */}
                      <th>Priorities</th>
                      {/* <th>Project Budget</th> */}
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResidential.map((project, index) => (
                      <tr key={index} onClick={() => handleOpen(project)} style={{ cursor: "pointer" }}>
                        {/* <td>{project.department}</td> */}
                        <td>{project.projectName}</td>
                        <td>{project.campus}</td>
                        {/* <td>{project.discordWebhook}</td> */}
                        {/* <td>{project.poc_of_project}</td> */}
                        <td>{project.projectMasterEmail}</td>
                        {/* <td>{project.clientName}</td> */}
                        <td>{project.priorities}</td>
                        {/* <td>{project.projectBudget}</td> */}
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
                    {/* <th>Channel ID</th> */}
                    <th>PM Email</th>
                    {/* <th>Client Name</th> */}
                    <th>Priorities</th>
                    {/* <th>Project Budget</th> */}
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
                      {/* <td>{project.channelId}</td> */}
                      <td>{project.projectMasterEmail}</td>
                      {/* <td>{project.clientName}</td> */}
                      <td>{project.priorities}</td>
                      {/* <td>{project.projectBudget}</td> */}
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
          )}
        </div>
      </div>
      {isEditMode && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              className="close-button"
              onClick={() => setIsEditMode(false)}
            >
              &times;
            </button>
            <h2>Edit Project</h2>
            <div className="form-fields">
              <input
                type="text"
                placeholder="Project Name"
                className="input-field"
                value={editData.projectName}
                onChange={(e) =>
                  setEditData({ ...editData, projectName: e.target.value })
                }
                disabled
              />
              {selectedDept !== "Residential Program" && (
                <>
                  <input
                    type="text"
                    placeholder="Slack Channel Name"
                    className="input-field"
                    value={editData.channelName}
                    onChange={(e) =>
                      setEditData({ ...editData, channelName: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Slack Channel ID"
                    className="input-field"
                    value={editData.channelId}
                    onChange={(e) =>
                      setEditData({ ...editData, channelId: e.target.value })
                    }
                  />
                </>
              )}
              {selectedDept === "Residential Program" && (
                <>
                  <select
                    name="campus"
                    className="input-field"
                    value={editData.campus || ""}
                    onChange={(e) =>
                      setEditData({ ...editData, campus: e.target.value })
                    }
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
                  <div className="tooltip-container">
                    <input
                      type="text"
                      placeholder="Discord Channel Web Hook URL"
                      className="input-field"
                      value={editData.discordWebhook || ""}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          discordWebhook: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="tooltip-container">
                    <textarea
                      placeholder="POC of Project"
                      className="input-field"
                      value={editData.poc_of_project || ""}
                      onChange={(e) =>
                        setEditData({
                          ...editData,
                          poc_of_project: e.target.value,
                        })
                      }
                      rows="1"
                    />
                  </div>
                </>
              )}
              <input
                type="text"
                placeholder="PM Email"
                className="input-field"
                value={editData.projectMasterEmail}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    projectMasterEmail: e.target.value,
                  })
                }
              />
              <input
                type="text"
                placeholder="Client Name"
                className="input-field"
                value={editData.clientName}
                onChange={(e) =>
                  setEditData({ ...editData, clientName: e.target.value })
                }
              />
              <select
                className="input-field"
                value={editData.priorities}
                onChange={(e) =>
                  setEditData({ ...editData, priorities: e.target.value })
                }
              >
                <option value="" disabled selected>
                  Select Priority
                </option>
                <option value="P0">P0-Very High</option>
                <option value="P1">P1-High</option>
                <option value="P2">P2-Moderate</option>
                <option value="P3">P3-Low</option>
              </select>
              <input
                type="number"
                placeholder="Project Budget"
                className="input-field"
                value={editData.projectBudget}
                onChange={(e) =>
                  setEditData({ ...editData, projectBudget: e.target.value })
                }
              />
              <select
                className="input-field"
                value={editData.projectStatus}
                onChange={(e) =>
                  setEditData({ ...editData, projectStatus: e.target.value })
                }
              >
                <option value="" disabled selected>
                  Select Status
                </option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <button className="add-btn" onClick={handleUpdateProject}>
              Update Project
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;