import React, { useState, useEffect, useContext } from "react";
import "../Form/Form.css";
import url from "../../../public/api";
import { json, useLocation, useNavigate } from "react-router-dom";
import { LoginContext } from "../context/LoginContext";
import DeleteIcon from "@mui/icons-material/Delete";

import CircularProgress from "@mui/material/CircularProgress";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import LoadingSpinner from "../Loader/LoadingSpinner";
import { useLoader } from "../context/LoadingContext";
import TraansitionModal from "../Modal/TraansitionModal";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  Box,
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import { set } from "lodash";


const Form = () => {
  const dataContext = useContext(LoginContext);
  const { email } = dataContext;
  const userName = localStorage.getItem("name");
  const userDepartment = localStorage.getItem("department");
  // const userDepartment = "Residential Program";
  const { loading, setLoading } = useLoader();
  const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const initialFormData = {
    email: "",
    selectedDate: dataContext.selectedDate || getTodayDate(),
    contributions: [],
    blockers: "",
    campus: "",
  };
  const [formData, setFormData] = useState(initialFormData);

  // const [projectData, setProjectData] = useState([]);
  // const [residentialProjectData, setResidentialProjectData] = useState([]);
  const [projectByDepartment, setProjectByDepartment] = useState({});
  const [projectByCampus, setProjectByCampus] = useState({});
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState("");
  const [currentContribution, setCurrentContribution] = useState({
    hours: "0",
    task: "",
  });
  const [maxHours, setMaxHours] = useState(12);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [showSelect, setShowSelect] = useState(true);
  const [editIndex, setEditIndex] = useState(null);

  const [editContribution, setEditContribution] = useState({
    hours: "",
    task: "",
  });

  const [open, setOpen] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const navigate = useNavigate();
  const [previousEntriesDone, setPreviousEntriesDone] = useState(0);
  const today = new Date().toISOString().split("T")[0];
  const [attempt, setAttempt] = useState(0);
  const [isDateDisabled, setIsDateDisabled] = useState(true);
  const [attemptLoading, setAttemptLoading] = useState(true);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbaropen, setSnackbaropen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [alertMessage, setAlertMessage] = useState("");

  const [campuses, setCampuses] = useState([]);

  const [showProjectError, setShowProjectError] = useState(false);
  const [showHoursError, setShowHoursError] = useState(false);
  const [showTaskError, setShowTaskError] = useState(false);
  const [showEmailError, setShowEmailError] = useState(false);
  const [departments, setDepartments] = useState([]);

  const [showSaveError, setShowSaveError] = useState(false);
  const [projectNameToId, setProjectNameToId] = useState({});
  const [employees, setEmployees] = useState([]);
  const [employeeDepartment, setEmployeeDepartment] = useState("");



  const location = useLocation();
  const role = localStorage.getItem("role");

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleCloseSnackbar = () => {
    setSnackbaropen(false);
  };


  useEffect(() => {
    const fetchCampuses = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/campuses`
        );
        const data = await res.json();
        const parsedBody = JSON.parse(data.body);
        setCampuses(parsedBody.data);
      } catch (error) {
        console.error("Failed to fetch campuses:", error);
      }
    };
    fetchCampuses();
  }, []);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/employeeSheetRecords?sheet=pncdata`);
        const data = await res.json();
        if (data.success) {
          setEmployees(data.data);
        }
      } catch (err) {
        console.error("Error fetching employees:", err);
      }
    };
    fetchEmployees();
  }, []);


  const showSnackbar = (message, severity = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  useEffect(() => {
    let email = localStorage.getItem("email") ?? "";
    setAttemptLoading(true);

    const initPreviousEntries = () => {
      const storedData = JSON.parse(localStorage.getItem("previousEntriesDone"));
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      if (storedData) {
        if (new Date(storedData.lastUpdated).getTime() < firstDayOfMonth.getTime()) {
          localStorage.setItem(
            "previousEntriesDone",
            JSON.stringify({ count: 0, lastUpdated: today })
          );
          setPreviousEntriesDone(0);
        } else {
          setPreviousEntriesDone(storedData.count);
        }
      } else {
        localStorage.setItem(
          "previousEntriesDone",
          JSON.stringify({ count: 0, lastUpdated: today })
        );
        setPreviousEntriesDone(0);
      }
    };

    initPreviousEntries();

    try {
      fetch(`${API_BASE_URL}/employees`)
        .then((response) => response.json())
        .then((data) => {
          console.log("Fetched data:", data.data);

          const projectByDepartment = {}; // move declaration here
          const projectByCampus = {}; // <- new state object
          const nameToIdMap = {};
          const projects = data.data.map((project) => {
            return {
              projectId: project.Id,
              projectName: project.projectName,
              status: project.projectStatus,
              department: project.department,
              campus: project.campus, // <- assuming this exists in API response
            };
          });

          const activeProjectNames = projects
            .map((project) => project.status === "Active" && project.projectName)
            .filter(Boolean);

          const today = new Date();
          const dayOfWeek = today.getDay();
          if (dayOfWeek === 6) {
            activeProjectNames.push("Saturday-Peer-Learning");
          }

          projects.forEach((project) => {
            if (project.status === "Active") {
              const dept = project.department.trim();
              const campus = (project.campus || "Unknown").trim();
              const projectName = project.projectName;

              // Department-based mapping
              if (!projectByDepartment[dept]) {
                projectByDepartment[dept] = new Set();
              }
              projectByDepartment[dept].add(projectName);

              // Campus-based mapping
              if (!projectByCampus[campus]) {
                projectByCampus[campus] = new Set();
              }
              projectByCampus[campus].add(projectName);

              // Name to ID mapping
              nameToIdMap[projectName] = project.projectId;
            }
          });

          // Convert Sets to Arrays
          Object.keys(projectByDepartment).forEach((dept) => {
            projectByDepartment[dept] = Array.from(projectByDepartment[dept]);
          });

          Object.keys(projectByCampus).forEach((campus) => {
            projectByCampus[campus] = Array.from(projectByCampus[campus]);
          });

          setProjectByDepartment(projectByDepartment);
          setProjectByCampus(projectByCampus); // ✅ Set campus data
          console.log("Project By Department:", projectByDepartment);
          console.log("Project By Campus:", projectByCampus);

          setProjectNameToId(nameToIdMap);
          setProjectsLoading(false);
        });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, []);

  useEffect(() => {
    const currentDept = formData.department;
    if (!currentDept) {
      setFilteredProjects([]);
      return;
    }
    const fetchDepartmentProjects = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/employees?department=${encodeURIComponent(currentDept)}`);
        const data = await response.json();
        if (data?.data?.length > 0) {
          const activeProjects = data.data.filter(
            (project) => project.projectStatus === "Active"
          );
          let filtered = activeProjects.map((p) => p.projectName);
          // Optional: If you still want to filter by campus (e.g. if Culture department has multiple campuses)
          if (formData.campus) {
            filtered = activeProjects
              .filter((p) => p.campus?.trim() === formData.campus.trim())
              .map((p) => p.projectName);
          }
          setFilteredProjects(filtered);
        } else {
          setFilteredProjects([]);
        }
      } catch (error) {
        console.error("Error fetching department projects:", error);
        setFilteredProjects([]);
      }
    };
    fetchDepartmentProjects();
  }, [formData.department, userDepartment, formData.campus]);

  document.querySelectorAll('input[type="number"]').forEach(function (input) {
    input.addEventListener("wheel", function (event) {
      event.preventDefault();
    });
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  const handleProjectSelect = (e) => {
    setSaved(false);
    //  setOpen(true);
    if (e.target.value === "Ad-hoc tasks")
      setError("You can only log a maximum of 2 hours for Ad-hoc tasks");
    setSelectedProject(e.target.value);
    setCurrentContribution({ hours: "", task: "" }); // Reset current contribution

    if (e.target.value !== "") {
      setShowProjectError(false);
    }
  };

  useEffect(() => {
    setMaxHours(15);
  }, [selectedProject]);

  useEffect(() => {
    if (showSaveError) {
      const timer = setTimeout(() => {
        setShowSaveError(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showSaveError]);

  function checkMaxValue(input) {
    if (selectedProject === "Ad-hoc tasks") {
      if (input.value > 2) {
        input.value = 2;
      }
    }
  }
  const handleContributionChange = (e) => {
    const { name, value } = e.target;
    setCurrentContribution({
      ...currentContribution,
      [name]: value,
    });
  };

  const addContribution = () => {
    if (!selectedProject) {
      setShowProjectError(true);
      return;
    } else {
      setShowProjectError(false);
    }
    if (!currentContribution.hours) {
      setShowHoursError(true);
      return;
    } else {
      setShowHoursError(false);
    }
    if (!currentContribution.task) {
      setShowTaskError(true);
      return;
    } else {
      setShowTaskError(false);
    }
    if (currentContribution.hours < 0) {
      setShowHoursError(true);
      return;
    } else {
      setShowHoursError(false);
    }

    setFormData((prevState) => ({
      ...prevState,
      contributions: [
        ...prevState.contributions,
        { project: selectedProject, ...currentContribution, department: prevState.department },
      ],
      blockers: formData.blockers,
      campus: formData.campus,
    }));
    setSaved(true); // Set saved to true when a contribution is added
    setSelectedProject(""); // Reset project selection
    setCurrentContribution({ hours: "", task: "" });
    setShowProjectForm(false); // Hide the project form
  };
  const handleEditContributionChange = (e) => {
    const { name, value } = e.target;
    setEditContribution({
      ...editContribution,
      [name]: value,
    });
  };

  const handleEdit = (index) => {
    setEditIndex(index);
    setEditContribution(formData.contributions[index]);
  };

  const handleSaveEdit = (index) => {
    const updatedContributions = formData.contributions.map(
      (contribution, idx) => (idx === index ? editContribution : contribution)
    );
    setFormData({
      ...formData,
      contributions: updatedContributions,
    });
    setEditIndex(null);
  };

  const handleDelete = (index) => {
    setDeleteIndex(index);
    setOpen(true);
  };

  const confirmDelete = () => {
    const updatedContributions = formData.contributions.filter(
      (contribution, idx) => idx !== deleteIndex
    );
    setFormData({
      ...formData,
      contributions: updatedContributions,
    });
    setOpen(false);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if(!formData.email){
      setShowEmailError(true);
      return;
    }
    setLoading(true);
    if (!saved) {
      setShowSaveError(true);
      return;
    }

    // const userEmail = localStorage.getItem("email");
    const userEmail = email;
    const department = employeeDepartment || formData.department;
    // const department = "Residential Program";

    const newEntry = {
      entries: formData.contributions.map((c) => ({
        email: formData.email,
        raisedEmail: userEmail,
        projectName: c.project,
        projectId: projectNameToId[c.project],
        totalHoursSpent: Number(c.hours),
        workDescription: c.task,
        entryDate: formData.selectedDate,
        department: employeeDepartment, // original department
        campus: formData.campus || "", // current selected campus
        workingDepartment: c.department, // current selected
        ...(department === "Residential Program" && {
          blockers: formData.blockers,
          campus: formData.campus,
        }),
      })),
    };
    console.log("New Entry:", newEntry);

    // Save to localStorage for dashboard view
    const newLog = {
      date: newEntry.entryDate,
      project: newEntry.projectName,
      hours: newEntry.totalHoursSpent,
      description: newEntry.workDescription,
    };

    const existingLogs = JSON.parse(localStorage.getItem("dailyLogs")) || [];
    localStorage.setItem(
      "dailyLogs",
      JSON.stringify([...existingLogs, newLog])
    );
    console.log("Existing Logs:", existingLogs);

    if (formData.contributions.length === 0) {
      setShowProjectError(true);
      return;
    }

    // Send to API
    try {
      console.log("Ready to send to backend", newEntry);
      const response = await fetch(
        `${API_BASE_URL}/activityLogs/admin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newEntry),
        }
      );
      console.log("Response of Post API:", response);
      if (!response.ok) {
        throw new Error(result.message || "Failed to save entry");
      }
      showSnackbar("Entry successfully saved!", "success");

      const result = await response.json();
      console.log("Response from backend:", result);


      // Check if the response has results and the first result's status is "success"
      const entryStatus = result?.results?.[0]?.status;

      console.log(entryStatus, "entryStatus");

      const resultItem = result?.results?.[0];
      const EntryStatus = resultItem?.status;
      if (EntryStatus === "failed") {
        showSnackbar(resultItem?.reason || "Entry was skipped or not saved.", "error");
        setFormData((prev) => ({ ...prev, contributions: [] }));
        setLoading(false);
        return;
      }

      if (entryStatus !== "success" && entryStatus !== "updated") {
        throw new Error(
          result?.results?.[0]?.message || "Entry was skipped or not saved."
        );
      }


      if (entryStatus === "updated") {
        showSnackbar("Entry successfully updated!", "info");
      }

      console.log("Entry successfully sent to backend");

      // Clear the form
      setFormData({ ...initialFormData });
      console.log("Form Data after submission:", formData);

      setLoading(false);
    } catch (error) {
      console.error("Error posting entry:", error);
      showSnackbar(error.message || "Failed to save entry", "error");
    }
    setShowProjectError(false);
  };

  const handleLoading = (load) => {
    load == true
      ? (document.getElementById("root").style.opacity = "0.8")
      : (document.getElementById("root").style.opacity = "1");
  };


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

  const currentDept = formData.department || "";
  const currentCampus = formData.campus || "";

  return (
    <div className="" style={{ overflowY: "scroll", height: "85vh", marginBottom: "5px", width: "100%" }}>
      <LoadingSpinner loading={loading} className="loader-container" />
      <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
        <h1
          style={{
            fontSize: "26px",
            fontWeight: "bold",
            color: "#272829ff",
            marginTop: "0.5rem",
          }}
        >
          Add New Logs
        </h1>
      </div>
      <form onSubmit={handleSubmit} className="admin-from">
        {successMessage && <h1 style={{ color: "green" }}>{successMessage}</h1>}
        <div>
          <label>Employee Email:</label>
          <select
            name="email"
            value={formData.email || ""}
            onChange={(e) => {
              const selectedEmail = e.target.value;
              const emp = employees.find(emp => emp["Team ID"] === selectedEmail);
              setFormData(prev => ({
                ...prev,
                email: selectedEmail,
                name: emp ? emp["First and Last Name"] : "",
                department: emp ? emp["Department"] || "" : ""
              }));
              setEmployeeDepartment(emp ? emp["Department"] || "" : "");
              setShowEmailError(false)
            }}
            
          >
            <option value="">--Select an email--</option>
            {employees
              .filter(emp => role === "superAdmin" || emp["Team ID"] !== email)
              .sort((a, b) => a["Team ID"].toLowerCase().localeCompare(b["Team ID"].toLowerCase()))
              .map((emp, idx) => (
                <option key={idx} value={emp["Team ID"]}>
                  {emp["Team ID"]}
                </option>
              ))}
          </select>
          {showEmailError && (
              <div style={{ display: "flex", color: "red", marginTop: "4px", fontSize: "0.85rem" }}>
                Email cannot be empty*
              </div>
              )}
        </div>

        <div>
          <label>Employee Name:</label>
          <input
            type="text"
            name="name"
            placeholder="Please select an employee email first"
            value={formData.name || ""}
            readOnly
          />
        </div>

        <div>
          <label>Employee Department:</label>
          <input
            type="text"
            name="department"
            placeholder="Please select an employee email first"
            value={employeeDepartment}
            readOnly
          />
        </div>

        <div>
          <label>Current Working Department:</label>
          <select
          style={{ maxHeight: "50px", overflowY: "auto" }}
            name="department"
            value={formData.department || ""}
            onChange={(e) => {
              const newDepartment = e.target.value;
              setFormData((prev) => ({
                ...prev,
                department: newDepartment,
              }));
              // Reset project and contribution when department changes
              setSelectedProject("");
              setCurrentContribution({ hours: "", task: "" });
            }}
          >
            <option style={{ maxHeight: "50px", overflowY: "auto" }} value="" disabled>
              --Select a department--
            </option>
            {departments.map((dept, idx) => (
              <option key={idx} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Select the date for which you want to update the form:</label>
          <input
            type="date"
            name="selectedDate"
            max={today}
            value={formData.selectedDate}
            onChange={handleChange}
          />
        </div>

        {((formData.department || userDepartment) === "Residential Program"
          || formData.department === "Culture"
          || formData.department === "Academics"
          || formData.department === "Operations"
          || formData.department === "LXD & ETC"
          || formData.department === "Campus Support Staff"
          || formData.department === "Campus_Security"
        ) && (
            <div>
              <label>Please select your campus :</label>
              <select
                name="campus"
                value={formData.campus}
                onChange={handleChange}
                required
              >
                <option value="">--Select a campus--</option>
                {campuses.map((c, index) => (
                  <option key={index} value={c.campus}>
                    {c.campus}
                  </option>
                ))}
              </select>
            </div>
          )}

        {formData.contributions.length > 0 && (
          <div>
            <h3>Contributions Summary</h3>
            <TableContainer
              component={Paper}
              sx={{
                width: '100%',
                maxWidth: '100%',
                overflow: 'hidden',
                boxShadow: 'none',
                border: '1px solid #ddd',
                margin: 0,
                padding: 0
              }}
            >
              <Table
                sx={{
                  width: '100%',
                  tableLayout: 'fixed',
                  margin: 0,
                  padding: 0,
                  '& .MuiTableCell-root': {
                    border: '1px solid #ddd',
                    padding: { xs: '6px 4px', sm: '8px 6px' },
                    overflow: 'hidden'
                  }
                }}
                size="small"
              >
                <TableHead sx={{ margin: 0, padding: 0 }}>
                  <TableRow sx={{ backgroundColor: '#f5f5f5', margin: 0, padding: 0 }}>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        width: { xs: '22%', sm: '18%' },
                        fontSize: { xs: '12px', sm: '14px' }
                      }}
                    >
                      Project
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        width: { xs: '12%', sm: '10%' },
                        textAlign: 'center',
                        fontSize: { xs: '12px', sm: '14px' }
                      }}
                    >
                      Hours
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        width: { xs: '48%', sm: '55%' },
                        fontSize: { xs: '12px', sm: '14px' }
                      }}
                    >
                      Task
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: 'bold',
                        width: { xs: '18%', sm: '17%' },
                        textAlign: 'center',
                        fontSize: { xs: '12px', sm: '14px' }
                      }}
                    >
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.contributions.map((contribution, index) => (
                    <TableRow key={index}>
                      <TableCell
                        sx={{
                          fontSize: { xs: '11px', sm: '13px' },
                          wordBreak: 'break-word',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {contribution.project}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        {editIndex === index ? (
                          <TextField
                            type="number"
                            name="hours"
                            value={editContribution.hours}
                            onChange={handleEditContributionChange}
                            size="small"
                            sx={{
                              width: '50px',
                              '& .MuiInputBase-input': {
                                textAlign: 'center',
                                fontSize: { xs: '11px', sm: '13px' },
                                padding: '4px'
                              }
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: window.innerWidth < 600 ? '11px' : '13px' }}>
                            {contribution.hours}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editIndex === index ? (
                          <TextField
                            name="task"
                            value={editContribution.task}
                            onChange={handleEditContributionChange}
                            multiline
                            minRows={2}
                            maxRows={4}
                            size="small"
                            sx={{
                              width: '100%',
                              '& .MuiInputBase-input': {
                                fontSize: { xs: '11px', sm: '13px' },
                                padding: '4px'
                              }
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              minHeight: '80px',
                              maxHeight: '120px',
                              overflowY: 'auto',
                              overflowX: 'hidden',
                              wordBreak: 'break-word',
                              fontSize: { xs: '11px', sm: '13px' },
                              lineHeight: 1.4,
                              padding: '8px 4px',
                              display: 'flex',
                              alignItems: 'flex-start'
                            }}
                          >
                            {contribution.task}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <Box
                          sx={{
                            display: 'flex',
                            gap: '2px',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {editIndex === index ? (
                            <>
                              <IconButton
                                onClick={() => handleSaveEdit(index)}
                                size="small"
                                sx={{
                                  color: '#666',
                                  padding: '2px',
                                  minWidth: 'auto',
                                  width: '24px',
                                  height: '24px',
                                  '&:hover': {
                                    color: '#4CAF50'
                                  }
                                }}
                              >
                                <SaveIcon sx={{ fontSize: '20px' }} />
                              </IconButton>
                              <IconButton
                                onClick={() => handleDelete(index)}
                                size="small"
                                sx={{
                                  color: '#666',
                                  padding: '2px',
                                  minWidth: 'auto',
                                  width: '25px',
                                  height: '25px',
                                  '&:hover': {
                                    color: '#f44336'
                                  }
                                }}
                              >
                                <DeleteIcon sx={{ fontSize: '20px' }} />
                              </IconButton>
                            </>
                          ) : (
                            <>
                              <IconButton
                                onClick={() => handleEdit(index)}
                                size="small"
                                sx={{
                                  color: '#666',
                                  padding: '2px',
                                  minWidth: 'auto',
                                  width: '25px',
                                  height: '25px',
                                  '&:hover': {
                                    color: '#4CAF50'
                                  }
                                }}
                              >
                                <EditIcon sx={{ fontSize: '20px' }} />
                              </IconButton>
                              <IconButton
                                onClick={() => handleDelete(index)}
                                size="small"
                                sx={{
                                  color: '#666',
                                  padding: '2px',
                                  minWidth: 'auto',
                                  width: '25px',
                                  height: '25px',
                                  '&:hover': {
                                    color: '#f44336'
                                  }
                                }}
                              >
                                <DeleteIcon sx={{ fontSize: '16px' }} />
                              </IconButton>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <br />

            <p
              style={{
                color: "green",
              }}
            >
              You can select multiple projects by clicking on the dropdown below
            </p>
          </div>
        )}
        <div>
          <label>Select a project in which you contributed:</label>
          {projectsLoading ? (
            <select disabled>
              <option value="">Loading projects...</option>
            </select>
          ) : Object.keys(projectByDepartment).length > 0 && currentDept in projectByDepartment ? (
            <select
              name="selectedProject"
              value={selectedProject}
              onChange={handleProjectSelect}
            >
              <option value="">--Select a project--</option>
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project, index) => (
                  <option key={index} value={project}>
                    {project}
                  </option>
                ))
              ) : (
                <option disabled>No projects available</option>
              )}
            </select>
          ) : (
            <select disabled>
              <option value="">No projects available for your department</option>
            </select>
          )}
          {showProjectError && (
            <div style={{ display: "flex", color: "red", marginTop: "4px", fontSize: "0.85rem" }}>
              Project cannot be empty*
            </div>
          )}
          <br />
          <br />
          {selectedProject && (
            <div>
              <label>Total Hours Spent:</label>
              <input
                type="number"
                name="hours"
                max={maxHours}
                value={currentContribution.hours}
                onChange={handleContributionChange}
                onInput={(e) => checkMaxValue(e.target)}
                min="0"
              />
              {showHoursError && (
                <div style={{ display: "flex", color: "red", marginTop: "4px", fontSize: "0.85rem" }}>
                  Total hours spent cannot be empty or negative*
                </div>
              )}
              <br />
              <label>What did you achieve in this project?</label>
              <textarea
                name="task"
                value={currentContribution.task}
                onChange={handleContributionChange}
              />
              {showTaskError && (
                <div style={{ display: "flex", color: "red", marginTop: "4px", fontSize: "0.85rem" }}>
                  Task cannot be empty*
                </div>
              )}
              <button
                type="button"
                onClick={addContribution}
                className="full-width-button"
              >
                Save Contribution
              </button>
            </div>
          )}
        </div>
        {showSaveError && (
          <p style={{ display: "flex", color: "red", marginTop: "4px" }}>
            Please save your contribution before submitting.
          </p>
        )}
        <button type="submit" className="full-width-button" disabled={formData.contributions.length === 0 || editIndex !== null}>
          Submit
        </button>
      </form>
      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirm Delete"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this contribution?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={confirmDelete} color="primary" autoFocus>
            Yes
          </Button>
          <Button onClick={handleClose} color="primary">
            No
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <Snackbar
        open={snackbaropen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
        >
          {alertMessage}
        </MuiAlert>
      </Snackbar>
    </div>
  );
};

export default Form;