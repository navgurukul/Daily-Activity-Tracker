import React, { useState, useEffect } from "react";
import "./ProjectManagement.css";

import { handleBeforeUnload } from "../../utils/beforeUnloadHandler";

const API_URL =
  "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employees";

const ProjectManagement = () => {
  const [data, setData] = useState({
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
  const [feedbackMessage, setFeedbackMessage] = useState("");

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

  // Handle adding a new project
  const handleAddProject = () => {
    fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((newProject) => {
        // console.log("New project added:", newProject);
        setProjects([...projects, newProject]);
        setFeedbackMessage(newProject.message);
        setData({
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
        setFeedbackMessage(updatedProject.message);
        setEditData({
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

  useEffect(() => {
    if (feedbackMessage) {
      const timer = setTimeout(() => setFeedbackMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedbackMessage]);


  return (
    <div className="admin-container">
      <h1 className="admin-title">Admin - Project Tracker</h1>

      <div className="form-container">
        <h2>Add New Project</h2>
        <div className="form-fields">
          <input
            type="text"
            placeholder="Project Name"
            className="input-field"
            value={data.projectName}
            onChange={(e) => setData({ ...data, projectName: e.target.value })}
          />
          <input
            type="text"
            placeholder="Channel Name"
            className="input-field"
            value={data.channelName}
            onChange={(e) => setData({ ...data, channelName: e.target.value })}
          />
          <input
            type="text"
            placeholder="Channel ID"
            className="input-field"
            value={data.channelId}
            onChange={(e) => setData({ ...data, channelId: e.target.value })}
          />
          <input
            type="text"
            placeholder="PM Email"
            className="input-field"
            value={data.projectMasterEmail}
            onChange={(e) =>
              setData({ ...data, projectMasterEmail: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Client Name"
            className="input-field"
            value={data.clientName}
            onChange={(e) => setData({ ...data, clientName: e.target.value })}
          />
          <select
            className="input-field"
            value={data.priorities}
            onChange={(e) => setData({ ...data, priorities: e.target.value })}
          >
            <option value="" disabled selected>
              Select Priority
            </option>
            <option value="P1">P1-High</option>
            <option value="P2">P2-Moderate</option>
            <option value="P3">P3-Low</option>
          </select>
          <input
            type="text"
            placeholder="Project Budget"
            className="input-field"
            value={data.projectBudget}
            onChange={(e) =>
              setData({ ...data, projectBudget: e.target.value })
            }
          />
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
            <option value="Pending">Pending</option>
          </select>
        </div>
        <button className="add-btn" onClick={handleAddProject}>
          Add Project
        </button>
      </div>

      <div className="table-container">
        <h2>Project List</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
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
              {projects.map((project, index) => (
                <tr key={index}>
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
              <input
                type="text"
                placeholder="Channel Name"
                className="input-field"
                value={editData.channelName}
                onChange={(e) =>
                  setEditData({ ...editData, channelName: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Channel ID"
                className="input-field"
                value={editData.channelId}
                onChange={(e) =>
                  setEditData({ ...editData, channelId: e.target.value })
                }
              />
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
                <option value="Pending">Pending</option>
              </select>
            </div>
            <button className="add-btn" onClick={handleUpdateProject}>
              Update Project
            </button>
          </div>
        </div>
      )}
      {feedbackMessage && (
        <div className="toast-message">{feedbackMessage}</div>
      )}
    </div>
  );
};

export default ProjectManagement;
