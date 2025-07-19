import React, { useState, useEffect, useContext } from "react";
import "./Form.css";
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
} from "@mui/material";
import MuiAlert from "@mui/material/Alert";
import { set } from "lodash";
// import { useLocation } from "react-router-dom";

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
    email: email,
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
  const [departments, setDepartments] = useState([]);

  const [showSaveError, setShowSaveError] = useState(false);
  const [projectNameToId, setProjectNameToId] = useState({});
  
  const location = useLocation();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleCloseSnackbar = () => {
    setSnackbaropen(false);
  };

  useEffect(() => {
    if (location.state?.message) {
      setAlertMessage(location.state.message);
    
      setSnackbaropen(true)
      navigate(location.pathname, {replace: true});
    }
  }, [location.state, location.pathname, navigate]);

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
  let email = sessionStorage.getItem("email") ?? "";
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
  const currentDept = formData.department || userDepartment;
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

  // const handleChange = (e) => {
  //   const { name, value } = e.target;
  //   setFormData({
  //     ...formData,
  //     [name]: value,
  //   });
  // };

  //  function isInvalidDate(dateStr) {
  //    const date = new Date(dateStr);
  //    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  //    const dateNum = date.getDate();
  //    const week = Math.floor((dateNum - 1) / 7) + 1;

  //    // Disable Sunday or 2nd/4th Saturday
  //    return day === 0 || (day === 6 && (week === 2 || week === 4));
  //  }

  function handleChange(e) {
    const { name, value } = e.target;

    // if (isInvalidDate(value)) {
    //   alert("This date is not allowed");
    //   return;
    // }

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
        { project: selectedProject, ...currentContribution, department: prevState.department || userDepartment },
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

    setLoading(true);

    if (!saved) {
      setShowSaveError(true);
      return;
    }

    // const userEmail = localStorage.getItem("email");
    const userEmail = email;
    const department = localStorage.getItem("department");
    // const department = "Residential Program";

    const newEntry = {
      entries: formData.contributions.map((c) => ({
        email: userEmail,
        projectName: c.project,
        projectId: projectNameToId[c.project],
        totalHoursSpent: Number(c.hours),
        workDescription: c.task,
        entryDate: formData.selectedDate,
        department: userDepartment, // original department
        campus: formData.campus || "", // current selected campus
        workingDepartment: c.department || userDepartment, // current selected
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
        `${API_BASE_URL}/activityLogs`,
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
        // console.error("Failed to save entry:");
      }
      showSnackbar("Entry successfully saved!", "success");

      const result = await response.json();
      console.log("Response from backend:", result);

      if (result.message === 'You already finished your 3 attempts') {
        setSnackbarMessage('You have 0 attempts remaining for backdated entries!');
        setSnackbarSeverity('warning');
        setSnackbarOpen(true);
        setFormData((prev) => ({ ...prev, contributions: [] }));
        setLoading(false);
        return;
      }

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

      if (result?.backdatedLeft?.[userEmail] !== undefined) {
        const backdatedLeft = result.backdatedLeft[userEmail];
        showSnackbar(
          `Entry successfully processed! Backdated entries left: ${backdatedLeft}`,
          "info"
        );
        setAttempt(backdatedLeft);
        localStorage.setItem("attemptsLeft", backdatedLeft);
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

  // function getMinDate() {
  //   const today = new Date();
  //   const validDates = [];

  //   // Check the last 3 days
  //   for (let i = 1; i <= 3; i++) {
  //     const date = new Date(today);
  //     date.setDate(today.getDate() - i);
  //     const day = date.getDay(); // 0 = Sunday, 6 = Saturday

  //     // Skip Sundays
  //     if (day === 0) continue;

  //     // Skip 2nd and 4th Saturdays
  //     if (day === 6) {
  //       const dateNum = date.getDate();
  //       const month = date.getMonth();
  //       const year = date.getFullYear();

  //       // Get all Saturdays of the month
  //       let saturdayCount = 0;
  //       for (let d = 1; d <= 31; d++) {
  //         const tempDate = new Date(year, month, d);
  //         if (tempDate.getMonth() !== month) break;
  //         if (tempDate.getDay() === 6) {
  //           saturdayCount++;
  //           if (d === dateNum && (saturdayCount === 2 || saturdayCount === 4)) {
  //             continue; // skip 2nd or 4th Saturday
  //           }
  //         }
  //       }
  //     }

  //     validDates.push(date);
  //   }

  //   // Return the earliest valid date
  //   if (validDates.length > 0) {
  //     return validDates[validDates.length - 1].toISOString().split("T")[0];
  //   } else {
  //     return today.toISOString().split("T")[0]; // fallback
  //   }
  // }

  // Mock today's date to be 12th of the current month
  // const mockToday = new Date();
  // mockToday.setDate(5);
  // const today = mockToday.toISOString().split("T")[0];

  // function getMinDate() {
  //   const minDate = new Date(mockToday);
  //   minDate.setDate(mockToday.getDate() - 2);

  //   // now calculate excluding weekends (Sundays + 2nd & 4th Saturday)
  //   let daysCounted = 0;
  //   while (daysCounted < 3) {
  //     minDate.setDate(minDate.getDate() - 1);
  //     const day = minDate.getDay(); // 0 = Sunday, 6 = Saturday
  //     const date = minDate.getDate();
  //     const week = Math.floor((date - 1) / 7) + 1;

  //     if (day === 0 || (day === 6 && (week === 2 || week === 4))) {
  //       continue; // skip weekend
  //     }
  //     daysCounted++;
  //   }

  //   return minDate.toISOString().split("T")[0];
  // }

  function getMinDate() {
  const today = new Date();
  const validDates = [];
  let i = 1; // Start with yesterday
  while (validDates.length < 3) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    // Skip Sundays
    if (day === 0) {
      i++;
      continue;
    }
    // Skip 2nd and 4th Saturdays
    if (day === 6) {
      const dateNum = date.getDate();
      const month = date.getMonth();
      const year = date.getFullYear();
      // Count which Saturday it is in the month
      let saturdayCount = 0;
      for (let d = 1; d <= dateNum; d++) {
        const tempDate = new Date(year, month, d);
        if (tempDate.getDay() === 6) {
          saturdayCount++;
        }
      }
      if (saturdayCount === 2 || saturdayCount === 4) {
        i++;
        continue; // Skip 2nd or 4th Saturday
      }
    }
    validDates.push(new Date(date)); // Store a copy
    i++;
  }
  // Return the earliest valid date among the 3
  return validDates[validDates.length - 1].toISOString().split("T")[0];
}

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

  const currentDept = formData.department || userDepartment;
  const currentCampus = formData.campus || "";

  return (
    <div className="form-container" style={{ overflowY: "scroll", height: "100vh", marginTop: "-20px" }}>
      <LoadingSpinner loading={loading} className="loader-container" />
      <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
        <h3 style={{ fontSize: "32px", fontWeight: "bold", color: "#000" }}>
          Welcome Back, <span style={{ color: "#2E7D32" }}>{userName}</span>
        </h3>
        <h1
          style={{
            fontSize: "18px",
            fontWeight: "500",
            color: "#000",
            marginTop: "0.5rem",
          }}
        >
          Daily Employee's Activity Tracker
        </h1>
      </div>
      <form onSubmit={handleSubmit} className="from-1">
        {successMessage && <h1 style={{ color: "green" }}>{successMessage}</h1>}
        <div>
          <label>Employee Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled
            color="red"
          />
        </div>
        <div>
          <label>Employee Name:</label>
          <input
            type="text"
            name="name"
            value={userName}
            onChange={handleChange}
            required
            disabled
            color="red"
          />
        </div>
        <div>
          <label>Employee Department:</label>
          <input
            type="text"
            value={userDepartment}
            required
            disabled
            color="red"
          />
        </div>
        <div>
          <label>Current Working Department:</label>
          <select
            name="department"
            value={formData.department || userDepartment}
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
            <option value="" disabled>
              Select Department
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
            min={getMinDate()}
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
            <table>
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Hours</th>
                  <th>Task</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {formData.contributions.map((contribution, index) => (
                  <tr key={index} style={{ height: "auto" }}>
                    {editIndex === index ? (
                      <>
                        <td>{contribution.project}</td>
                        <td>
                          <input
                            type="number"
                            name="hours"
                            value={editContribution.hours}
                            onChange={handleEditContributionChange}
                          />
                        </td>
                        <td className="task-column">
                          <textarea
                            name="task"
                            value={editContribution.task}
                            onChange={handleEditContributionChange}
                          />
                        </td>
                        <td
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            flexDirection: "column",
                          }}
                        >
                          <button
                            type="button"
                            className="save-button"
                            onClick={() => handleSaveEdit(index)}
                          >
                            <SaveIcon className="icon-white" />
                          </button>
                          <button
                            type="button"
                            className="delete-button"
                            onClick={() => handleDelete(index)}
                          >
                            <DeleteIcon className="icon-white" />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{contribution.project}</td>
                        <td>{contribution.hours}</td>
                        <td className="task-cell">
                          <div className="task-content">{contribution.task}</div>
                        </td>
                        <td
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            maxWidth: "100%",
                          }}
                        >
                          <div className="button-container">
                            <button
                              className="edit-button"
                              type="button"
                              onClick={() => handleEdit(index)}
                            >
                              <EditIcon className="icon-white" />
                            </button>
                            <button
                              className="delete-button"
                              type="button"
                              onClick={() => handleDelete(index)}
                            >
                              <DeleteIcon className="icon-white" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
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
            // <select
            //   name="selectedProject"
            //   value={selectedProject}
            //   onChange={handleProjectSelect}
            // >
            //   <option value="">--Select a project--</option>
            //   {projectByDepartment[currentDept].map((project, index) => (
            //     <option key={index} value={project}>
            //       {project}
            //     </option>
            //   ))}
            // </select>
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
        <button type="submit" className="full-width-button" disabled={formData.contributions.length === 0}>
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
