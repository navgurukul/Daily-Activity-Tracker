import React, { useState, useEffect } from "react";
import "./ProjectManagement.css";

import { handleBeforeUnload } from "../../utils/beforeUnloadHandler";

const API_URL =
  "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employees";

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
  });

  const [projects, setProjects] = useState([]);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  // const [feedbackMessage, setFeedbackMessage] = useState("");
  const [errors, setErrors] = useState({});

  const [filters, setFilters] = useState({
    department: "",
    projectName: "",
    projectMasterEmail: "",
    priorities: "",
    projectStatus: "",
  });

  const [filteredProjects, setFilteredProjects] = useState(projects);

  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await fetch(
          "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employeeSheetRecords?sheet=pncdata"
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
    const filtered = projects.filter((project) => {
      return (
        (project.department || "")
          .toLowerCase()
          .includes(filters.department.toLowerCase()) &&
        (project.projectName || "")
          .toLowerCase()
          .includes(filters.projectName.toLowerCase()) &&
        (project.projectMasterEmail || "")
          .toLowerCase()
          .includes(filters.projectMasterEmail.toLowerCase()) &&
        (project.priorities || "")
          .toLowerCase()
          .includes(filters.priorities.toLowerCase()) &&
        (project.projectStatus || "")
          .includes(filters.projectStatus)
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
      projectName: "",
      projectMasterEmail: "",
      priorities: "",
      projectStatus: "",
    });
  };

  useEffect(() => {
    fetch(
      "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employees"
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
    // Pre-validation
    if (!data.department) {
      newErrors.department = "Please select a department*";
    }
    if (!data.projectName) {
    newErrors.projectName = "Please fill in the project name*";
  }

  if (data.department !== "Residential Program") {
    if (!data.channelName) {
      newErrors.channelName = "Please fill in the channel name*";
    }
    if (!data.channelId) {
      newErrors.channelId = "Please fill in the channel ID*";
    }
    if (!data.projectMasterEmail) {
      newErrors.projectMasterEmail = "Please fill in the project master email*";
    }
    if (!data.projectBudget) {
      newErrors.projectBudget = "Please fill in the project budget*";
    }
  }

  if (!data.priorities) {
    newErrors.priorities = "Please select a priority*";
  }

  if (!data.projectStatus) {
    newErrors.projectStatus = "Please select a project status*";
  }

    // Check if project name already exists
    const isDuplicate = projects.some(
      (project) =>
        project.projectName.toLowerCase() === data.projectName.toLowerCase()
    );

    if (isDuplicate) {
      newErrors.projectName = "Project name already exists";
      return;
    }

    if (Object.keys(newErrors).length > 0) {
    setErrors(newErrors);
    return;
  }

  setErrors({});
    // Make the API call
    fetch(API_URL, {
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
        });
        window.removeEventListener("beforeunload", handleBeforeUnload);
        window.location.reload();
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
    fetch(`${API_URL}`, {
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
        });
        setIsEditMode(false);
        setEditingIndex(null);
        window.removeEventListener("beforeunload", handleBeforeUnload);
        window.location.reload();
      })
      .catch((err) => console.error("Error updating project:", err));
  };

  // useEffect(() => {
  //   if (feedbackMessage) {
  //     const timer = setTimeout(() => setFeedbackMessage(""), 3000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [feedbackMessage]);

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
          {selectedDept !== "Residential Program" && (
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
            type="text"
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
        <div className="filters">
          <h4>Filters:</h4>
          <input
            type="text"
            name="department"
            placeholder="Filter by Department"
            value={filters.department || ""}
            onChange={handleFilterChange}
          />
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
            <option value="" disabled selected>
              Select Priority
            </option>
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
            <option value="" disabled selected>
              Select Status
            </option>
            <option value="">All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <button
            className="clear-filters-btn"
            variant="contained"
            onClick={handleClearFilters}
          >
            Clear Filters
          </button>
        </div>
        <div className="table-wrapper">
          {filteredProjects.length !== 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Department Name</th>
                  <th>Project Name</th>
                  <th>Channel Name</th>
                  <th>Channel ID</th>
                  <th>PM Email</th>
                  <th>Client Name</th>
                  <th>Priorities</th>
                  <th>Project Budget</th>
                  <th>Status</th>
                  <th>Edit</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project, index) => (
                  <tr key={index}>
                    <td>{project.department}</td>
                    <td>{project.projectName}</td>
                    <td>{project.channelName}</td>
                    <td>{project.channelId}</td>
                    <td>{project.projectMasterEmail}</td>
                    <td>{project.clientName}</td>
                    <td>{project.priorities}</td>
                    <td>{project.projectBudget}</td>
                    <td>{project.projectStatus}</td>
                    <td>
                      <button
                        className="editBtn"
                        onClick={() => handleEditProject(project, index)}
                      >
                        ✏️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="no-data">No projects found</p>
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
                type="text"
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