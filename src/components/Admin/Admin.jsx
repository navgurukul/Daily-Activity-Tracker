import { useState } from "react";
import "./Admin.css";

const admin = () => {
  // State to store form inputs 
  const [data, setData] = useState({
    projectName: "",
    channelName: "",
    channelID: "",
    PMEmail: "",
    clientName: "",
    status: "active",
    priorities: "",
    budget: "",
  });

  // Add project handler
  const handleAddProject = () => {
    if (projectName && clientName) {
      setProjects([...projects, { projectName, clientName, status }]);
      setProjectName("");
      setClientName("");
      setStatus("active");
    }
  };

  return (
    <div className="admin-container">
      {/* Page Title */}
      <h1 className="admin-title">Admin - Project Tracker </h1>
      {/* Form to Add New Project */}
      <div className="form-container">
        <h2>Add New Project</h2>
        <div className="form-fields">
          {/* Project input fields */}
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
            value={data.channelID}
            onChange={(e) => setData({ ...data, channelID: e.target.value })}
          />
          <input
            type="text"
            placeholder="PM Email"
            className="input-field"
            value={data.PMEmail}
            onChange={(e) => setData({ ...data, PMEmail: e.target.value })}
          />
          <input
            type="text"
            placeholder="Client Name"
            className="input-field"
            value={data.clientName}
            onChange={(e) => setData({ ...data, clientName: e.target.value })}
          />
          <input
            type="text"
            placeholder="Priorities"
            className="input-field"
            value={data.priorities}
            onChange={(e) => setData({ ...data, priorities: e.target.value })}
          />
          <input
            type="text"
            placeholder="Budget"
            className="input-field"
            value={data.budget}
            onChange={(e) => setData({ ...data, budget: e.target.value })}
          />

          {/* Status Dropdown */}
          <select
            className="input-field"
            value={data.status}
            onChange={(e) => setData({ ...data, status: e.target.value })}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Add Project Button */}
        <button className="add-btn" onClick={handleAddProject}>
          Add Project
        </button>
      </div>
      {/* Projects Table */}
      <div className="table-container">
        <h2>Project List</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Client Name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default admin;