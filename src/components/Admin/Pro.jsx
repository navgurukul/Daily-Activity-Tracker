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
  // const handleAddProject = () => {
  //   fetch(API_URL, {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify(data),
  //   })
  //     .then((response) => response.json())
  //     .then((newProject) => {
  //       // console.log("New project added:", newProject);
  //       setProjects([...projects, newProject]);
  //       setFeedbackMessage(newProject.message);
  //       setData({
  //         projectName: "",
  //         channelName: "",
  //         channelId: "",
  //         projectMasterEmail: "",
  //         clientName: "",
  //         projectStatus: "active",
  //         priorities: "",
  //         projectBudget: "",
  //         Id: "",
  //       });
  //     })
  //     .catch((error) => console.error("Error adding project:", error));
  // };

  const handleAddProject = () => {
    // Pre-validation
    if (!data.projectName) {
      setFeedbackMessage("Please fill in the project name.");
      return;
    }
    if (!data.channelName) {
      setFeedbackMessage("Please fill in the channel name.");
      return;
    }
    if (!data.channelId) {
      setFeedbackMessage("Please fill in the channel ID.");
      return;
    }
    if (!data.projectMasterEmail) {
      setFeedbackMessage("Please fill in the project master email.");
      return;
    }
    if (!data.priorities) {
      setFeedbackMessage("Please select a priority.");
      return;
    }
    if (!data.projectBudget) {
      setFeedbackMessage("Please fill in the project budget.");
      return;
    }
    if (!data.projectStatus) {
      setFeedbackMessage("Please select a project status.");
      return;
    }

    // Check if project name already exists
    const isDuplicate = projects.some(
      (project) =>
        project.projectName.toLowerCase() === data.projectName.toLowerCase()
    );

    if (isDuplicate) {
      setFeedbackMessage("Project name already exists");
      return;
    }

    // Clear feedback if all good
    setFeedbackMessage("");
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
            <option value="P0">P0-Very High</option>
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
      {feedbackMessage && (
        <div className="toast-message">{feedbackMessage}</div>
      )}
    </div>
  );
};

export default ProjectManagement;

// import React, { useState, useEffect } from "react";
// import {
//   Box,
//   Button,
//   Typography,
//   TextField,
//   Select,
//   MenuItem,
//   FormControl,
//   InputLabel,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   Modal,
//   Snackbar,
//   Alert,
// } from "@mui/material";

// import { handleBeforeUnload } from "../../utils/beforeUnloadHandler";

// const API_URL =
//   "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employees";

// const ProjectManagement = () => {
//   const [data, setData] = useState({
//     projectName: "",
//     channelName: "",
//     channelId: "",
//     projectMasterEmail: "",
//     clientName: "",
//     projectStatus: "active",
//     priorities: "",
//     projectBudget: "",
//     Id: "",
//   });

//   const [editData, setEditData] = useState(data);
//   const [projects, setProjects] = useState([]);
//   const [isEditMode, setIsEditMode] = useState(false);
//   const [editingIndex, setEditingIndex] = useState(null);
//   const [feedbackMessage, setFeedbackMessage] = useState("");

//   useEffect(() => {
//     fetch(API_URL)
//       .then((res) => res.json())
//       .then((data) => {
//         if (Array.isArray(data.data)) {
//           setProjects(data.data);
//         } else {
//           setProjects([]);
//         }
//       })
//       .catch((error) => {
//         console.error("Error fetching projects:", error);
//         setProjects([]);
//       });
//   }, []);

//   const handleAddProject = () => {
//     if (
//       !data.projectName ||
//       !data.channelName ||
//       !data.channelId ||
//       !data.projectMasterEmail ||
//       !data.priorities ||
//       !data.projectBudget ||
//       !data.projectStatus
//     ) {
//       setFeedbackMessage("Please fill in all required fields.");
//       return;
//     }

//     const isDuplicate = projects.some(
//       (project) =>
//         project.projectName.toLowerCase() === data.projectName.toLowerCase()
//     );

//     if (isDuplicate) {
//       setFeedbackMessage("Project name already exists");
//       return;
//     }

//     fetch(API_URL, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(data),
//     })
//       .then((response) => response.json())
//       .then((newProject) => {
//         setProjects([...projects, newProject]);
//         setData({
//           projectName: "",
//           channelName: "",
//           channelId: "",
//           projectMasterEmail: "",
//           clientName: "",
//           projectStatus: "active",
//           priorities: "",
//           projectBudget: "",
//           Id: "",
//         });
//         window.removeEventListener("beforeunload", handleBeforeUnload);
//         window.location.reload();
//       })
//       .catch((error) => console.error("Error adding project:", error));
//   };

//   const handleEditProject = (project, index) => {
//     setEditData(project);
//     setIsEditMode(true);
//     setEditingIndex(index);
//   };

//   const handleUpdateProject = () => {
//     fetch(API_URL, {
//       method: "PUT",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(editData),
//     })
//       .then((res) => res.json())
//       .then((updatedProject) => {
//         const updatedProjects = [...projects];
//         updatedProjects[editingIndex] = updatedProject;
//         setProjects(updatedProjects);
//         setEditData(data);
//         setIsEditMode(false);
//         setEditingIndex(null);
//         window.removeEventListener("beforeunload", handleBeforeUnload);
//         window.location.reload();
//       })
//       .catch((err) => console.error("Error updating project:", err));
//   };

//   const handleCloseSnackbar = () => setFeedbackMessage("");

//   return (
//     <Box p={3} bgcolor="#F4F4F4" minHeight="100vh">
//       <Typography variant="h4" textAlign="center" mb={3}>
//         Admin - Project Tracker
//       </Typography>

//       {/* Form */}
//       <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
//         <Typography variant="h6" mb={2}>
//           Add New Project
//         </Typography>
//         <Box display="flex" flexWrap="wrap" gap={2}>
//           <TextField
//             label="Project Name"
//             fullWidth
//             value={data.projectName}
//             onChange={(e) => setData({ ...data, projectName: e.target.value })}
//           />
//           <TextField
//             label="Channel Name"
//             fullWidth
//             value={data.channelName}
//             onChange={(e) => setData({ ...data, channelName: e.target.value })}
//           />
//           <TextField
//             label="Channel ID"
//             fullWidth
//             value={data.channelId}
//             onChange={(e) => setData({ ...data, channelId: e.target.value })}
//           />
//           <TextField
//             label="PM Email"
//             fullWidth
//             value={data.projectMasterEmail}
//             onChange={(e) =>
//               setData({ ...data, projectMasterEmail: e.target.value })
//             }
//           />
//           <TextField
//             label="Client Name"
//             fullWidth
//             value={data.clientName}
//             onChange={(e) => setData({ ...data, clientName: e.target.value })}
//           />

//           <FormControl fullWidth>
//             <InputLabel>Priority</InputLabel>
//             <Select
//               value={data.priorities}
//               label="Priority"
//               onChange={(e) => setData({ ...data, priorities: e.target.value })}
//             >
//               <MenuItem value="P0">P0 - Very High</MenuItem>
//               <MenuItem value="P1">P1 - High</MenuItem>
//               <MenuItem value="P2">P2 - Moderate</MenuItem>
//               <MenuItem value="P3">P3 - Low</MenuItem>
//             </Select>
//           </FormControl>

//           <TextField
//             label="Project Budget"
//             fullWidth
//             value={data.projectBudget}
//             onChange={(e) =>
//               setData({ ...data, projectBudget: e.target.value })
//             }
//           />

//           <FormControl fullWidth>
//             <InputLabel>Status</InputLabel>
//             <Select
//               value={data.projectStatus}
//               label="Status"
//               onChange={(e) =>
//                 setData({ ...data, projectStatus: e.target.value })
//               }
//             >
//               <MenuItem value="Active">Active</MenuItem>
//               <MenuItem value="Inactive">Inactive</MenuItem>
//             </Select>
//           </FormControl>
//         </Box>
//         <Button
//           variant="contained"
//           color="success"
//           fullWidth
//           sx={{ mt: 2 }}
//           onClick={handleAddProject}
//         >
//           Add Project
//         </Button>
//       </Paper>

//       {/* Table */}
//       <Paper elevation={3} sx={{ p: 3 }}>
//         <Typography variant="h6" mb={2}>
//           Project List
//         </Typography>
//         <TableContainer component={Paper}>
//           <Table>
//             <TableHead>
//               <TableRow>
//                 {[
//                   "Project Name",
//                   "Channel Name",
//                   "Channel ID",
//                   "PM Email",
//                   "Client Name",
//                   "Priorities",
//                   "Project Budget",
//                   "Status",
//                   "Edit",
//                 ].map((head) => (
//                   <TableCell key={head}>{head}</TableCell>
//                 ))}
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {projects.length > 0 ? (
//                 projects.map((project, index) => (
//                   <TableRow key={index}>
//                     <TableCell>{project.projectName}</TableCell>
//                     <TableCell>{project.channelName}</TableCell>
//                     <TableCell>{project.channelId}</TableCell>
//                     <TableCell>{project.projectMasterEmail}</TableCell>
//                     <TableCell>{project.clientName}</TableCell>
//                     <TableCell>{project.priorities}</TableCell>
//                     <TableCell>{project.projectBudget}</TableCell>
//                     <TableCell>{project.projectStatus}</TableCell>
//                     <TableCell>
//                       <Button
//                         variant="outlined"
//                         size="small"
//                         onClick={() => handleEditProject(project, index)}
//                       >
//                         ✏️
//                       </Button>
//                     </TableCell>
//                   </TableRow>
//                 ))
//               ) : (
//                 <TableRow>
//                   <TableCell colSpan={9} align="center">
//                     No Projects Found
//                   </TableCell>
//                 </TableRow>
//               )}
//             </TableBody>
//           </Table>
//         </TableContainer>
//       </Paper>

//       {/* Edit Modal */}
//       <Modal open={isEditMode} onClose={() => setIsEditMode(false)}>
//         <Box
//           sx={{
//             position: "absolute",
//             top: "50%",
//             left: "50%",
//             transform: "translate(-50%, -50%)",
//             bgcolor: "background.paper",
//             p: 4,
//             borderRadius: 2,
//             width: 600,
//             maxHeight: "90vh",
//             overflowY: "auto",
//           }}
//         >
//           <Typography variant="h6" mb={2}>
//             Edit Project
//           </Typography>
//           <Box display="flex" flexWrap="wrap" gap={2}>
//             <TextField
//               label="Project Name"
//               fullWidth
//               value={editData.projectName}
//               disabled
//             />
//             <TextField
//               label="Channel Name"
//               fullWidth
//               value={editData.channelName}
//               onChange={(e) =>
//                 setEditData({ ...editData, channelName: e.target.value })
//               }
//             />
//             <TextField
//               label="Channel ID"
//               fullWidth
//               value={editData.channelId}
//               onChange={(e) =>
//                 setEditData({ ...editData, channelId: e.target.value })
//               }
//             />
//             <TextField
//               label="PM Email"
//               fullWidth
//               value={editData.projectMasterEmail}
//               onChange={(e) =>
//                 setEditData({ ...editData, projectMasterEmail: e.target.value })
//               }
//             />
//             <TextField
//               label="Client Name"
//               fullWidth
//               value={editData.clientName}
//               onChange={(e) =>
//                 setEditData({ ...editData, clientName: e.target.value })
//               }
//             />
//             <FormControl fullWidth>
//               <InputLabel>Priority</InputLabel>
//               <Select
//                 value={editData.priorities}
//                 label="Priority"
//                 onChange={(e) =>
//                   setEditData({ ...editData, priorities: e.target.value })
//                 }
//               >
//                 <MenuItem value="P0">P0 - Very High</MenuItem>
//                 <MenuItem value="P1">P1 - High</MenuItem>
//                 <MenuItem value="P2">P2 - Moderate</MenuItem>
//                 <MenuItem value="P3">P3 - Low</MenuItem>
//               </Select>
//             </FormControl>
//             <TextField
//               label="Project Budget"
//               fullWidth
//               value={editData.projectBudget}
//               onChange={(e) =>
//                 setEditData({ ...editData, projectBudget: e.target.value })
//               }
//             />
//             <FormControl fullWidth>
//               <InputLabel>Status</InputLabel>
//               <Select
//                 value={editData.projectStatus}
//                 label="Status"
//                 onChange={(e) =>
//                   setEditData({ ...editData, projectStatus: e.target.value })
//                 }
//               >
//                 <MenuItem value="Active">Active</MenuItem>
//                 <MenuItem value="Inactive">Inactive</MenuItem>
//               </Select>
//             </FormControl>
//           </Box>
//           <Button
//             variant="contained"
//             color="success"
//             fullWidth
//             sx={{ mt: 2 }}
//             onClick={handleUpdateProject}
//           >
//             Update Project
//           </Button>
//         </Box>
//       </Modal>

//       {/* Snackbar Toast */}
//       <Snackbar
//         open={!!feedbackMessage}
//         autoHideDuration={3000}
//         onClose={handleCloseSnackbar}
//       >
//         <Alert
//           onClose={handleCloseSnackbar}
//           severity="success"
//           sx={{ width: "100%" }}
//         >
//           {feedbackMessage}
//         </Alert>
//       </Snackbar>
//     </Box>
//   );
// };

// export default ProjectManagement;

// import React, { useState, useEffect } from "react";
// import {
//   Box,
//   Button,
//   Typography,
//   TextField,
//   Select,
//   MenuItem,
//   FormControl,
//   InputLabel,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   Modal,
//   Snackbar,
//   Alert,
// } from "@mui/material";
// import { handleBeforeUnload } from "../../utils/beforeUnloadHandler";

// const API_URL =
//   "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employees";

// const ProjectManagement = () => {
//   const [data, setData] = useState({
//     projectName: "",
//     channelName: "",
//     channelId: "",
//     projectMasterEmail: "",
//     clientName: "",
//     projectStatus: "active",
//     priorities: "",
//     projectBudget: "",
//     Id: "",
//   });

//   const [editData, setEditData] = useState(data);
//   const [projects, setProjects] = useState([]);
//   const [isEditMode, setIsEditMode] = useState(false);
//   const [editingIndex, setEditingIndex] = useState(null);
//   const [feedbackMessage, setFeedbackMessage] = useState("");
//   const [filters, setFilters] = useState({
//     projectName: "",
//     projectMasterEmail: "",
//     priorities: "",
//   });
//   const [openAddProjectPopup, setOpenAddProjectPopup] = useState(false);

//   useEffect(() => {
//     fetch(API_URL)
//       .then((res) => res.json())
//       .then((data) => {
//         if (Array.isArray(data.data)) {
//           setProjects(data.data);
//         } else {
//           setProjects([]);
//         }
//       })
//       .catch((error) => {
//         console.error("Error fetching projects:", error);
//         setProjects([]);
//       });
//   }, []);

//   const handleAddProject = () => {
//     if (
//       !data.projectName ||
//       !data.channelName ||
//       !data.channelId ||
//       !data.projectMasterEmail ||
//       !data.priorities ||
//       !data.projectBudget ||
//       !data.projectStatus
//     ) {
//       setFeedbackMessage("Please fill in all required fields.");
//       return;
//     }

//     const isDuplicate = projects.some(
//       (project) =>
//         project.projectName.toLowerCase() === data.projectName.toLowerCase()
//     );

//     if (isDuplicate) {
//       setFeedbackMessage("Project name already exists");
//       return;
//     }

//     fetch(API_URL, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(data),
//     })
//       .then((response) => response.json())
//       .then((newProject) => {
//         setProjects([...projects, newProject]);
//         setData({
//           projectName: "",
//           channelName: "",
//           channelId: "",
//           projectMasterEmail: "",
//           clientName: "",
//           projectStatus: "active",
//           priorities: "",
//           projectBudget: "",
//           Id: "",
//         });
//         setOpenAddProjectPopup(false);
//         window.removeEventListener("beforeunload", handleBeforeUnload);
//         window.location.reload();
//       })
//       .catch((error) => console.error("Error adding project:", error));
//   };

//   const handleCloseSnackbar = () => setFeedbackMessage("");

//   const filteredProjects = projects.filter((project) => {
//     return (
//       (filters.projectName === "" ||
//         project.projectName
//           .toLowerCase()
//           .includes(filters.projectName.toLowerCase())) &&
//       (filters.projectMasterEmail === "" ||
//         project.projectMasterEmail
//           .toLowerCase()
//           .includes(filters.projectMasterEmail.toLowerCase())) &&
//       (filters.priorities === "" ||
//         project.priorities
//           .toLowerCase()
//           .includes(filters.priorities.toLowerCase()))
//     );
//   });

//   return (
//     <Box className="p-6 bg-gray-100 min-h-screen">
//       <Typography variant="h4" align="center" className="mb-6 text-2xl">
//         Admin - Project Tracker
//       </Typography>

//       {/* Filters Section */}
//       <Paper elevation={3} className="p-4 mb-6 bg-white">
//         <Typography variant="h6" className="mb-4">
//           Filters
//         </Typography>
//         <Box className="flex gap-4 mb-4">
//           <TextField
//             label="Project Name"
//             value={filters.projectName}
//             onChange={(e) =>
//               setFilters({ ...filters, projectName: e.target.value })
//             }
//             fullWidth
//             className="mb-4"
//           />
//           <TextField
//             label="PM Email"
//             value={filters.projectMasterEmail}
//             onChange={(e) =>
//               setFilters({ ...filters, projectMasterEmail: e.target.value })
//             }
//             fullWidth
//             className="mb-4"
//           />
//           <FormControl fullWidth className="mb-4">
//             <InputLabel>Priority</InputLabel>
//             <Select
//               value={filters.priorities}
//               label="Priority"
//               onChange={(e) =>
//                 setFilters({ ...filters, priorities: e.target.value })
//               }
//             >
//               <MenuItem value="">All</MenuItem>
//               <MenuItem value="P0">P0 - Very High</MenuItem>
//               <MenuItem value="P1">P1 - High</MenuItem>
//               <MenuItem value="P2">P2 - Moderate</MenuItem>
//               <MenuItem value="P3">P3 - Low</MenuItem>
//             </Select>
//           </FormControl>
//         </Box>
//       </Paper>

//       {/* Add Project Button */}
//       <Button
//         variant="contained"
//         color="primary"
//         onClick={() => setOpenAddProjectPopup(true)}
//       >
//         Add Project
//       </Button>

//       {/* Table */}
//       <Paper elevation={3} className="p-4 mt-6 bg-white">
//         <Typography variant="h6" className="mb-4">
//           Project List
//         </Typography>
//         <TableContainer component={Paper}>
//           <Table>
//             <TableHead>
//               <TableRow>
//                 {[
//                   "Project Name",
//                   "Channel Name",
//                   "Channel ID",
//                   "PM Email",
//                   "Client Name",
//                   "Priorities",
//                   "Project Budget",
//                   "Status",
//                 ].map((head) => (
//                   <TableCell key={head}>{head}</TableCell>
//                 ))}
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {filteredProjects.length > 0 ? (
//                 filteredProjects.map((project, index) => (
//                   <TableRow key={index}>
//                     <TableCell>{project.projectName}</TableCell>
//                     <TableCell>{project.channelName}</TableCell>
//                     <TableCell>{project.channelId}</TableCell>
//                     <TableCell>{project.projectMasterEmail}</TableCell>
//                     <TableCell>{project.clientName}</TableCell>
//                     <TableCell>{project.priorities}</TableCell>
//                     <TableCell>{project.projectBudget}</TableCell>
//                     <TableCell>{project.projectStatus}</TableCell>
//                   </TableRow>
//                 ))
//               ) : (
//                 <TableRow>
//                   <TableCell colSpan={8} align="center">
//                     No Projects Found
//                   </TableCell>
//                 </TableRow>
//               )}
//             </TableBody>
//           </Table>
//         </TableContainer>
//       </Paper>

//       {/* Add Project Popup */}
//       <Modal
//         open={openAddProjectPopup}
//         onClose={() => setOpenAddProjectPopup(false)}
//       >
//         <Box
//           sx={{
//             position: "absolute",
//             top: "50%",
//             left: "50%",
//             transform: "translate(-50%, -50%)",
//             bgcolor: "background.paper",
//             p: 4,
//             borderRadius: 2,
//             width: 600,
//             maxHeight: "90vh",
//             overflowY: "auto",
//           }}
//         >
//           <Typography variant="h6" mb={2}>
//             Add New Project
//           </Typography>
//           <Box display="flex" flexWrap="wrap" gap={2}>
//             <TextField
//               label="Project Name"
//               fullWidth
//               value={data.projectName}
//               onChange={(e) =>
//                 setData({ ...data, projectName: e.target.value })
//               }
//             />
//             <TextField
//               label="Channel Name"
//               fullWidth
//               value={data.channelName}
//               onChange={(e) =>
//                 setData({ ...data, channelName: e.target.value })
//               }
//             />
//             <TextField
//               label="Channel ID"
//               fullWidth
//               value={data.channelId}
//               onChange={(e) => setData({ ...data, channelId: e.target.value })}
//             />
//             <TextField
//               label="PM Email"
//               fullWidth
//               value={data.projectMasterEmail}
//               onChange={(e) =>
//                 setData({ ...data, projectMasterEmail: e.target.value })
//               }
//             />
//             <TextField
//               label="Client Name"
//               fullWidth
//               value={data.clientName}
//               onChange={(e) => setData({ ...data, clientName: e.target.value })}
//             />
//             <FormControl fullWidth>
//               <InputLabel>Priority</InputLabel>
//               <Select
//                 value={data.priorities}
//                 label="Priority"
//                 onChange={(e) =>
//                   setData({ ...data, priorities: e.target.value })
//                 }
//               >
//                 <MenuItem value="P0">P0 - Very High</MenuItem>
//                 <MenuItem value="P1">P1 - High</MenuItem>
//                 <MenuItem value="P2">P2 - Moderate</MenuItem>
//                 <MenuItem value="P3">P3 - Low</MenuItem>
//               </Select>
//             </FormControl>
//             <TextField
//               label="Project Budget"
//               fullWidth
//               value={data.projectBudget}
//               onChange={(e) =>
//                 setData({ ...data, projectBudget: e.target.value })
//               }
//             />
//             <FormControl fullWidth>
//               <InputLabel>Status</InputLabel>
//               <Select
//                 value={data.projectStatus}
//                 label="Status"
//                 onChange={(e) =>
//                   setData({ ...data, projectStatus: e.target.value })
//                 }
//               >
//                 <MenuItem value="Active">Active</MenuItem>
//                 <MenuItem value="Inactive">Inactive</MenuItem>
//               </Select>
//             </FormControl>
//           </Box>
//           <Box mt={2}>
//             <Button
//               variant="contained"
//               color="primary"
//               onClick={handleAddProject}
//             >
//               Add Project
//             </Button>
//           </Box>
//         </Box>
//       </Modal>

//       {/* Feedback Snackbar */}
//       {feedbackMessage && (
//         <Snackbar
//           open={true}
//           autoHideDuration={6000}
//           onClose={handleCloseSnackbar}
//         >
//           <Alert severity="error">{feedbackMessage}</Alert>
//         </Snackbar>
//       )}
//     </Box>
//   );
// };

// export default ProjectManagement;

// import React, { useState, useEffect } from "react";
// import {
//   Box,
//   Button,
//   Typography,
//   TextField,
//   Select,
//   MenuItem,
//   FormControl,
//   InputLabel,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   Modal,
//   Snackbar,
//   Alert,
// } from "@mui/material";
// import { handleBeforeUnload } from "../../utils/beforeUnloadHandler";

// const API_URL =
//   "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employees";

// const ProjectManagement = () => {
//   const [data, setData] = useState({
//     projectName: "",
//     channelName: "",
//     channelId: "",
//     projectMasterEmail: "",
//     clientName: "",
//     projectStatus: "active",
//     priorities: "",
//     projectBudget: "",
//     Id: "",
//   });

//   const [editData, setEditData] = useState(data);
//   const [projects, setProjects] = useState([]);
//   const [isEditMode, setIsEditMode] = useState(false);
//   const [editingIndex, setEditingIndex] = useState(null);
//   const [feedbackMessage, setFeedbackMessage] = useState("");
//   const [filters, setFilters] = useState({
//     projectName: "",
//     projectMasterEmail: "",
//     priorities: "",
//   });
//   const [openAddProjectPopup, setOpenAddProjectPopup] = useState(false);
//   const [openEditProjectPopup, setOpenEditProjectPopup] = useState(false);
//   const [openSnackbar, setOpenSnackbar] = useState(false);

//   useEffect(() => {
//     fetch(API_URL)
//       .then((res) => res.json())
//       .then((data) => {
//         if (Array.isArray(data.data)) {
//           setProjects(data.data);
//         } else {
//           setProjects([]);
//         }
//       })
//       .catch((error) => {
//         console.error("Error fetching projects:", error);
//         setProjects([]);
//       });
//   }, []);

//   const handleAddProject = () => {
//     if (
//       !data.projectName ||
//       !data.channelName ||
//       !data.channelId ||
//       !data.projectMasterEmail ||
//       !data.priorities ||
//       !data.projectBudget ||
//       !data.projectStatus
//     ) {
//       setFeedbackMessage("Please fill in all required fields.");
//       return;
//     }

//     const isDuplicate = projects.some(
//       (project) =>
//         project.projectName.toLowerCase() === data.projectName.toLowerCase()
//     );

//     if (isDuplicate) {
//       setFeedbackMessage("Project name already exists");
//       return;
//     }

//     fetch(API_URL, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(data),
//     })
//       .then((response) => response.json())
//       .then((newProject) => {
//         setProjects([...projects, newProject]);
//         setData({
//           projectName: "",
//           channelName: "",
//           channelId: "",
//           projectMasterEmail: "",
//           clientName: "",
//           projectStatus: "active",
//           priorities: "",
//           projectBudget: "",
//           Id: "",
//         });
//         setOpenAddProjectPopup(false);
//         setOpenSnackbar(true);
//         window.removeEventListener("beforeunload", handleBeforeUnload);
//                 window.location.reload();
//       })
//       .catch((error) => console.error("Error adding project:", error));
//   };

//   const handleEditProject = () => {
//     fetch(`${API_URL}/${data.Id}`, {
//       method: "PUT",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(data),
//     })
//       .then((response) => response.json())
//       .then((updatedProject) => {
//         const updatedProjects = [...projects];
//         updatedProjects[editingIndex] = updatedProject;
//         setProjects(updatedProjects);
//         setOpenEditProjectPopup(false);
//         setOpenSnackbar(true);
//       })
//       .catch((error) => console.error("Error editing project:", error));
//   };

//   const handleEditClick = (project, index) => {
//     setEditData(project);
//     setEditingIndex(index);
//     setOpenEditProjectPopup(true);
//   };

//   const handleCloseSnackbar = () => setOpenSnackbar(false);

//   const filteredProjects = projects.filter((project) => {
//     return (
//       (filters.projectName === "" ||
//         project.projectName
//           .toLowerCase()
//           .includes(filters.projectName.toLowerCase())) &&
//       (filters.projectMasterEmail === "" ||
//         project.projectMasterEmail
//           .toLowerCase()
//           .includes(filters.projectMasterEmail.toLowerCase())) &&
//       (filters.priorities === "" ||
//         project.priorities
//           .toLowerCase()
//           .includes(filters.priorities.toLowerCase()))
//     );
//   });

//   return (
//     <Box sx={{ padding: 4, backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
//       <Typography variant="h4" align="center" sx={{ marginBottom: 4 }}>
//         Admin - Project Tracker
//       </Typography>

//       {/* Filters Section */}
//       <Paper
//         elevation={3}
//         sx={{ padding: 3, marginBottom: 4, backgroundColor: "#fff" }}
//       >
//         <Typography variant="h6" sx={{ marginBottom: 2 }}>
//           Filters
//         </Typography>
//         <Box sx={{ display: "flex", gap: 2, marginBottom: 3 }}>
//           <TextField
//             label="Project Name"
//             value={filters.projectName}
//             onChange={(e) =>
//               setFilters({ ...filters, projectName: e.target.value })
//             }
//             fullWidth
//           />
//           <TextField
//             label="PM Email"
//             value={filters.projectMasterEmail}
//             onChange={(e) =>
//               setFilters({ ...filters, projectMasterEmail: e.target.value })
//             }
//             fullWidth
//           />
//           <FormControl fullWidth>
//             <InputLabel>Priority</InputLabel>
//             <Select
//               value={filters.priorities}
//               label="Priority"
//               onChange={(e) =>
//                 setFilters({ ...filters, priorities: e.target.value })
//               }
//             >
//               <MenuItem value="">All</MenuItem>
//               <MenuItem value="P0">P0 - Very High</MenuItem>
//               <MenuItem value="P1">P1 - High</MenuItem>
//               <MenuItem value="P2">P2 - Moderate</MenuItem>
//               <MenuItem value="P3">P3 - Low</MenuItem>
//             </Select>
//           </FormControl>
//         </Box>
//       </Paper>

//       {/* Add Project Button */}
//       <Button
//         variant="contained"
//         color="primary"
//         onClick={() => setOpenAddProjectPopup(true)}
//       >
//         Add Project
//       </Button>

//       {/* Table */}
//       <Paper
//         elevation={3}
//         sx={{ padding: 3, marginTop: 4, backgroundColor: "#fff" }}
//       >
//         <Typography variant="h6" sx={{ marginBottom: 2 }}>
//           Project List
//         </Typography>
//         <TableContainer component={Paper}>
//           <Table>
//             <TableHead>
//               <TableRow>
//                 {[
//                   "Project Name",
//                   "Channel Name",
//                   "Channel ID",
//                   "PM Email",
//                   "Client Name",
//                   "Priorities",
//                   "Project Budget",
//                   "Status",
//                   "Actions",
//                 ].map((head) => (
//                   <TableCell key={head}>{head}</TableCell>
//                 ))}
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {filteredProjects.length > 0 ? (
//                 filteredProjects.map((project, index) => (
//                   <TableRow key={index}>
//                     <TableCell>{project.projectName}</TableCell>
//                     <TableCell>{project.channelName}</TableCell>
//                     <TableCell>{project.channelId}</TableCell>
//                     <TableCell>{project.projectMasterEmail}</TableCell>
//                     <TableCell>{project.clientName}</TableCell>
//                     <TableCell>{project.priorities}</TableCell>
//                     <TableCell>{project.projectBudget}</TableCell>
//                     <TableCell>{project.projectStatus}</TableCell>
//                     <TableCell>
//                       <Button
//                         variant="contained"
//                         color="secondary"
//                         onClick={() => handleEditClick(project, index)}
//                       >
//                         Edit
//                       </Button>
//                     </TableCell>
//                   </TableRow>
//                 ))
//               ) : (
//                 <TableRow>
//                   <TableCell colSpan={9} align="center">
//                     No Projects Found
//                   </TableCell>
//                 </TableRow>
//               )}
//             </TableBody>
//           </Table>
//         </TableContainer>
//       </Paper>

//       {/* Add Project Popup */}
//       <Modal
//         open={openAddProjectPopup}
//         onClose={() => setOpenAddProjectPopup(false)}
//       >
//         <Box
//           sx={{
//             position: "absolute",
//             top: "50%",
//             left: "50%",
//             transform: "translate(-50%, -50%)",
//             bgcolor: "background.paper",
//             p: 4,
//             borderRadius: 2,
//             width: 600,
//             maxHeight: "90vh",
//             overflowY: "auto",
//           }}
//         >
//           <Typography variant="h6" sx={{ marginBottom: 2 }}>
//             Add New Project
//           </Typography>
//           <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
//             <TextField
//               label="Project Name"
//               fullWidth
//               value={data.projectName}
//               onChange={(e) =>
//                 setData({ ...data, projectName: e.target.value })
//               }
//             />
//             <TextField
//               label="Channel Name"
//               fullWidth
//               value={data.channelName}
//               onChange={(e) =>
//                 setData({ ...data, channelName: e.target.value })
//               }
//             />
//             <TextField
//               label="Channel ID"
//               fullWidth
//               value={data.channelId}
//               onChange={(e) => setData({ ...data, channelId: e.target.value })}
//             />
//             <TextField
//               label="PM Email"
//               fullWidth
//               value={data.projectMasterEmail}
//               onChange={(e) =>
//                 setData({ ...data, projectMasterEmail: e.target.value })
//               }
//             />
//             <TextField
//               label="Client Name"
//               fullWidth
//               value={data.clientName}
//               onChange={(e) => setData({ ...data, clientName: e.target.value })}
//             />
//             <FormControl fullWidth>
//               <InputLabel>Priority</InputLabel>
//               <Select
//                 value={data.priorities}
//                 label="Priority"
//                 onChange={(e) =>
//                   setData({ ...data, priorities: e.target.value })
//                 }
//               >
//                 <MenuItem value="P0">P0 - Very High</MenuItem>
//                 <MenuItem value="P1">P1 - High</MenuItem>
//                 <MenuItem value="P2">P2 - Moderate</MenuItem>
//                 <MenuItem value="P3">P3 - Low</MenuItem>
//               </Select>
//             </FormControl>
//             <TextField
//               label="Project Budget"
//               fullWidth
//               value={data.projectBudget}
//               onChange={(e) =>
//                 setData({ ...data, projectBudget: e.target.value })
//               }
//             />
//             <FormControl fullWidth>
//               <InputLabel>Status</InputLabel>
//               <Select
//                 value={data.projectStatus}
//                 label="Status"
//                 onChange={(e) =>
//                   setData({ ...data, projectStatus: e.target.value })
//                 }
//               >
//                 <MenuItem value="Active">Active</MenuItem>
//                 <MenuItem value="Inactive">Inactive</MenuItem>
//               </Select>
//             </FormControl>
//           </Box>
//           <Box
//             sx={{
//               display: "flex",
//               justifyContent: "space-between",
//               marginTop: 3,
//             }}
//           >
//             <Button
//               variant="outlined"
//               onClick={() => setOpenAddProjectPopup(false)}
//             >
//               Cancel
//             </Button>
//             <Button
//               variant="contained"
//               color="primary"
//               onClick={handleAddProject}
//             >
//               Add Project
//             </Button>
//           </Box>
//         </Box>
//       </Modal>

//       {/* Edit Project Popup */}
//       <Modal
//         open={openEditProjectPopup}
//         onClose={() => setOpenEditProjectPopup(false)}
//       >
//         <Box
//           sx={{
//             position: "absolute",
//             top: "50%",
//             left: "50%",
//             transform: "translate(-50%, -50%)",
//             bgcolor: "background.paper",
//             p: 4,
//             borderRadius: 2,
//             width: 600,
//             maxHeight: "90vh",
//             overflowY: "auto",
//           }}
//         >
//           <Typography variant="h6" sx={{ marginBottom: 2 }}>
//             Edit Project
//           </Typography>
//           <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
//             <TextField
//               label="Project Name"
//               fullWidth
//               value={data.projectName}
//               onChange={(e) =>
//                 setData({ ...data, projectName: e.target.value })
//               }
//             />
//             <TextField
//               label="Channel Name"
//               fullWidth
//               value={data.channelName}
//               onChange={(e) =>
//                 setData({ ...data, channelName: e.target.value })
//               }
//             />
//             <TextField
//               label="Channel ID"
//               fullWidth
//               value={data.channelId}
//               onChange={(e) => setData({ ...data, channelId: e.target.value })}
//             />
//             <TextField
//               label="PM Email"
//               fullWidth
//               value={data.projectMasterEmail}
//               onChange={(e) =>
//                 setData({ ...data, projectMasterEmail: e.target.value })
//               }
//             />
//             <TextField
//               label="Client Name"
//               fullWidth
//               value={data.clientName}
//               onChange={(e) => setData({ ...data, clientName: e.target.value })}
//             />
//             <FormControl fullWidth>
//               <InputLabel>Priority</InputLabel>
//               <Select
//                 value={data.priorities}
//                 label="Priority"
//                 onChange={(e) =>
//                   setData({ ...data, priorities: e.target.value })
//                 }
//               >
//                 <MenuItem value="P0">P0 - Very High</MenuItem>
//                 <MenuItem value="P1">P1 - High</MenuItem>
//                 <MenuItem value="P2">P2 - Moderate</MenuItem>
//                 <MenuItem value="P3">P3 - Low</MenuItem>
//               </Select>
//             </FormControl>
//             <TextField
//               label="Project Budget"
//               fullWidth
//               value={data.projectBudget}
//               onChange={(e) =>
//                 setData({ ...data, projectBudget: e.target.value })
//               }
//             />
//             <FormControl fullWidth>
//               <InputLabel>Status</InputLabel>
//               <Select
//                 value={data.projectStatus}
//                 label="Status"
//                 onChange={(e) =>
//                   setData({ ...data, projectStatus: e.target.value })
//                 }
//               >
//                 <MenuItem value="Active">Active</MenuItem>
//                 <MenuItem value="Inactive">Inactive</MenuItem>
//               </Select>
//             </FormControl>
//           </Box>
//           <Box
//             sx={{
//               display: "flex",
//               justifyContent: "space-between",
//               marginTop: 3,
//             }}
//           >
//             <Button
//               variant="outlined"
//               onClick={() => setOpenEditProjectPopup(false)}
//             >
//               Cancel
//             </Button>
//             <Button
//               variant="contained"
//               color="primary"
//               onClick={handleEditProject}
//             >
//               Update Project
//             </Button>
//           </Box>
//         </Box>
//       </Modal>

//       {/* Snackbar */}
//       <Snackbar
//         open={openSnackbar}
//         autoHideDuration={6000}
//         onClose={handleCloseSnackbar}
//       >
//         <Alert severity="success" sx={{ width: "100%" }}>
//           {feedbackMessage || "Project added/updated successfully!"}
//         </Alert>
//       </Snackbar>
//     </Box>
//   );
// };

// export default ProjectManagement;
