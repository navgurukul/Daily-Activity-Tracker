import React, { useState, useEffect, useContext } from "react";
import "./Form.css";
import url from "../../../public/api";
import { json, useNavigate } from "react-router-dom";
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

const Form = () => {
  const dataContext = useContext(LoginContext);
  const { email } = dataContext;
  const userName = localStorage.getItem("name");
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
  };
  const [formData, setFormData] = useState(initialFormData);

  const [projectData, setProjectData] = useState([]);
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
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success"); // 'success', 'error', 'warning', 'info'

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
    fetch(`${url}?email=${email}&type=attempts`)
      .then((response) => response.json())
      .then((data) => {
        setAttempt(data.attemptsLeft);
        localStorage.setItem("attemptsLeft", data.attemptsLeft);
        setIsDateDisabled(false);
        setAttemptLoading(false);
      });

    const initPreviousEntries = () => {
      const storedData = JSON.parse(
        localStorage.getItem("previousEntriesDone")
      );
      const today = new Date();
      const firstDayOfMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      );

      if (storedData) {
        // Check if it's the first day of the month
        if (
          new Date(storedData.lastUpdated).getTime() < firstDayOfMonth.getTime()
        ) {
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
      fetch(
        `https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employees`
      )
        .then((response) => response.json())
        .then((data) => {
          console.log("Fetched data:", data.data);

          const projects = data.data.map((project) => {
            return {
              projectName: project.projectName,
              status: project.projectStatus,
            };
          });

          const activeProjectNames = projects
            .map(
              (project) => project.status === "Active" && project.projectName
            )
            .filter(Boolean);

          const today = new Date();
          const dayOfWeek = today.getDay();

          // Check if today is Saturday (0 = Sunday, 6 = Saturday)
          if (dayOfWeek === 6) {
            activeProjectNames.push("Saturday-Peer-Learning");
          }
          // console.log("Active Projects:", activeProjectNames);
          setProjectData(activeProjectNames);
        });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, []);

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
  };

  useEffect(() => {
    // console.log("Selected Project:", selectedProject);
    setMaxHours(2);
  }, [selectedProject]);

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
      alert("Please select a project before saving the contribution");
      return;
    }

    if (!currentContribution.hours || !currentContribution.task.trim()) {
      alert("Please fill in both the total hours spent and the task achieved");
      return;
    }

    setFormData((prevState) => ({
      ...prevState,
      contributions: [
        ...prevState.contributions,
        { project: selectedProject, ...currentContribution },
      ],
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

    const userEmail = localStorage.getItem("email");

    const newEntry = {
      entries: formData.contributions.map((c) => ({
        email: userEmail,
        projectName: c.project,
        totalHoursSpent: Number(c.hours),
        workDescription: c.task,
        entryDate: formData.selectedDate,
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

    // Send to API
    try {
      console.log("Ready to send to backend", newEntry);
      const response = await fetch(
        "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/activityLogs",
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
        throw new Error("Failed to save entry");
      }
      showSnackbar("Entry successfully saved!", "success");

      const result = await response.json();
      console.log("Response from backend:", result);

      // Check if the response has results and the first result's status is "success"
      const entryStatus = result?.results?.[0]?.status;

      console.log(entryStatus, "entryStatus");

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
      }

      if (entryStatus === "updated") {
        showSnackbar("Entry successfully updated!", "info");
      }

      // Update backdated entries left if available in the response
      if (result?.backdatedLeft?.[userEmail] !== undefined) {
        setAttempt(result.backdatedLeft[userEmail]);
        localStorage.setItem("attemptsLeft", result.backdatedLeft[userEmail]);
      }
      if (!response.ok) {
        throw new Error(result.message || "Failed to save entry");
      }
      console.log("Entry successfully sent to backend");

      // Clear the form
      setFormData({ ...initialFormData });
      console.log("Form Data after submission:", formData);
    } catch (error) {
      console.error("Error posting entry:", error);
      showSnackbar(error.message || "Failed to save entry", "error");
    }
  };

  const handleLoading = (load) => {
    load == true
      ? (document.getElementById("root").style.opacity = "0.8")
      : (document.getElementById("root").style.opacity = "1");
  };

  // function getMinDate() {
  //   const today = new Date();
  //   const minDate = new Date();
  //   minDate.setDate(today.getDate() - 3);
  //   return minDate.toISOString().split("T")[0];
  // }

  function getMinDate() {
    const today = new Date();
    const validDates = [];

    // Check the last 3 days
    for (let i = 1; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const day = date.getDay(); // 0 = Sunday, 6 = Saturday

      // Skip Sundays
      if (day === 0) continue;

      // Skip 2nd and 4th Saturdays
      if (day === 6) {
        const dateNum = date.getDate();
        const month = date.getMonth();
        const year = date.getFullYear();

        // Get all Saturdays of the month
        let saturdayCount = 0;
        for (let d = 1; d <= 31; d++) {
          const tempDate = new Date(year, month, d);
          if (tempDate.getMonth() !== month) break;
          if (tempDate.getDay() === 6) {
            saturdayCount++;
            if (d === dateNum && (saturdayCount === 2 || saturdayCount === 4)) {
              continue; // skip 2nd or 4th Saturday
            }
          }
        }
      }

      validDates.push(date);
    }

    // Return the earliest valid date
    if (validDates.length > 0) {
      return validDates[validDates.length - 1].toISOString().split("T")[0];
    } else {
      return today.toISOString().split("T")[0]; // fallback
    }
  }

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

  return (
    <div>
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
          <label>Select the date for which you want to update the form:</label>
          <input
            type="date"
            name="selectedDate"
            max={today}
            // disabled={isDateDisabled}
            min={getMinDate()}
            value={formData.selectedDate}
            onChange={handleChange}
          />
        </div>

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
                        <td>
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
                        <td
                          style={{
                            height: "auto",
                            maxWidth: "100px",
                          }}
                        >
                          {contribution.task}
                        </td>
                        <td
                          style={{
                            display: "flex",
                            justifyContent: "center",
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
          <select value={selectedProject} onChange={handleProjectSelect}>
            <option value="">--Select a project--</option>
            {projectData.map(
              (project, index) => (
                console.log("Project:", project),
                console.log("Project:", project?.projectStatus),
                (
                  <option key={index} value={project}>
                    {project}
                  </option>
                )
              )
            )}
          </select>
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
                required
              />
              <br />
              <label>What did you achieve in this project?</label>
              <textarea
                name="task"
                value={currentContribution.task}
                onChange={handleContributionChange}
                required
              />
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
        <button type="submit" className="full-width-button">
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
    </div>
  );
};

export default Form;
