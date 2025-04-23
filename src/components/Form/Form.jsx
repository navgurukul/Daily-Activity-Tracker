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
// import SimpleSnackbar from "../Snackbar/Snackbar";
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
  // const [formData, setFormData] = useState({
  //   type: "contribution",
  //   email: email,
  //   challenges: " ",
  //   description: "",
  //   contributions: [],
  //   selectedDate: getTodayDate(),
  // });

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
      // fetch(`${url}?email=${email}&type=projects`)
      fetch(
        `https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employees`
      )
        .then((response) => response.json())
        .then((data) => {
          console.log("Fetched data:", data.data);

          const projects = data.data.map((project) => {
            return {
              projectName: project.projectName,
              status: project.status,
            };
          });
          // console.log("Projects:", projects);

          // const activeProjects = projects.filter(function (project) {
          //   return project.status === "Active";
          // });

          // Extract project names from filtered array
          const activeProjectNames = projects.map(function (project) {
            return project.projectName;
          });
          const today = new Date();
          const dayOfWeek = today.getDay();

          // Check if today is Saturday (0 = Sunday, 6 = Saturday)
          if (dayOfWeek === 6) {
            activeProjectNames.push("Saturday-Peer-Learning");
          }
          // console.log("Active Projects:", activeProjectNames);
          setProjectData(activeProjectNames);
          // const filteredProjects = data.content
          //   .map((project) => project[0])
          //   .filter((project) => project !== "");
          // //   setProjectNames(filteredProjects);
          // console.log("Project Names:", filteredProjects);
          // setProjectData(filteredProjects);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

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

  // const handleSubmit = (e) => {
  //   const now = new Date();
  //   const nextDay = new Date();
  //   nextDay.setDate(now.getDate() + 1);
  //   nextDay.setHours(7, 0, 0, 0); // Set time to 7 a.m. next day

  //   if (now >= nextDay) {
  //     setError("Submissions are only allowed before 7 a.m. the next day.");
  //     return;
  //   }
  //   const entry = new Date(formData.selectedDate);
  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0); // Reset today to start of the day

  //   // Check if current time is after 12 a.m. but before 7 a.m.
  //   const isAfterMidnightBefore7am = now.getHours() < 7;

  //   if (isAfterMidnightBefore7am) {
  //     // If it is after midnight but before 7 a.m., treat 'today' as the previous day
  //     today.setDate(today.getDate() - 1);
  //   }
  //   e.preventDefault();
  //   if (formData.contributions.length === 0) {
  //     return alert(
  //       "Please add and save at least one contribution before submitting the form"
  //     );
  //   }
  //   // if (formData.challenges.length < 25) {
  //   //   setError(
  //   //     "Achievements, Blockers, and Challenges must be at least 25 characters long."
  //   //   );
  //   //   return;
  //   // }

  //   setSaved(false);
  //   handleLoading(true);
  //   setLoading(true);

  //   setError(""); // Clear any previous error messages
  //   setShowSelect(true);
  //   const submitTime = new Date();
  //   const submitTimestamp = `${submitTime.toLocaleDateString(
  //     "en-GB"
  //   )} ${submitTime.getHours().toString().padStart(2, "0")}:${submitTime
  //     .getMinutes()
  //     .toString()
  //     .padStart(2, "0")}:${submitTime
  //     .getSeconds()
  //     .toString()
  //     .padStart(2, "0")}`;

  //   const payload = {
  //     ...formData,
  //     timestamp: submitTimestamp,
  //   };
  //   // console.log(payload)

  //   fetch(url, {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //     body: JSON.stringify(payload),
  //     mode: "no-cors",
  //   })
  //     .then((response) => response.text())
  //     .then((data) => {
  //       // console.log("Success:", data);
  //       // setSuccessMessage("Thanks for sharing the update!");
  //       setError("Thanks for sharing the update!");
  //       setFormData({
  //         type: "contribution",
  //         email: email,
  //         challenges: "",
  //         description: "",
  //         contributions: [],
  //         selectedDate: getTodayDate(),
  //       });
  //       setLoading(false);
  //       handleLoading(false);
  //       setTimeout(() => setSuccessMessage(""), 3000); // Clear message after 3 seconds
  //     })
  //     .catch((error) => {
  //       console.error("Error sending data to Google Apps Script:", error);
  //     });
  // };

  // const handleSubmit = (e) => {
  //   e.preventDefault();

  //   const newLog = {
  //     date: formData.selectedDate,
  //     project: formData.contributions.map((c) => c.project).join(", "),
  //     hours: formData.contributions.reduce(
  //       (sum, c) => sum + Number(c.hours),
  //       0
  //     ),
  //     description: formData.contributions.map((c) => c.task).join("; "),
  //   };

  //   // Retrieve existing logs or initialize an empty array
  //   const existingLogs = JSON.parse(localStorage.getItem("dailyLogs")) || [];

  //   // Add new log and update localStorage
  //   localStorage.setItem(
  //     "dailyLogs",
  //     JSON.stringify([...existingLogs, newLog])
  //   );

  //   setFormData({ ...initialFormData }); // Reset form after submission
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userEmail = localStorage.getItem("email");

    // const newEntry = {
    //   email: userEmail,
    //   projectName: formData.contributions.map((c) => c.project).join(", "),
    //   totalHoursSpent: formData.contributions.reduce(
    //     (sum, c) => sum + Number(c.hours),
    //     0
    //   ),
    //   workDescription: formData.contributions.map((c) => c.task).join("; "),
    //   entryDate: formData.selectedDate,
    // };

    // const newEntry = {
    //   entries: [
    //     {
    //       email: userEmail,
    //       projectName: formData.contributions.map((c) => c.project).join(", "),
    //       totalHoursSpent: formData.contributions.reduce(
    //         (sum, c) => sum + Number(c.hours),
    //         0
    //       ),
    //       workDescription: formData.contributions.map((c) => c.task).join("; "),
    //       entryDate: formData.selectedDate,
    //     },
    //   ],
    // };

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
          body: JSON.stringify(
            newEntry
            //   {
            //   email: userEmail,
            //   entry: newEntry,
            // }
          ),
        }
      );
      const result = await response.json();
      console.log("Response from backend:", result);

      // Check if the response has results and the first result's status is "success"
      const entryStatus = result?.results?.[0]?.status;

      console.log(entryStatus,"entryStatus")

      if (entryStatus !== "success") {
        throw new Error(
          result?.results?.[0]?.message || "Entry was skipped or not saved."
        );
        setTimeout(() => setSuccessMessage(results?.results?.[0]?.message), 3000);
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
    }
  };

  const handleLoading = (load) => {
    load == true
      ? (document.getElementById("root").style.opacity = "0.8")
      : (document.getElementById("root").style.opacity = "1");
  };

  function getMinDate() {
    const today = new Date();
    const dayOfWeek = today.getDay();

    const DAYS_BACK_NORMAL = 3;
    const DAYS_BACK_EXTENDED = 5;

    const currentHour = today.getHours();
    let daysBack = currentHour < 8 ? 1 : 0;
    if (attempt > 0) {
      switch (dayOfWeek) {
        case 1: // Monday
        case 2: // Tuesday
        case 3: // Wednesday
          daysBack = DAYS_BACK_EXTENDED;
          break;
        case 4: // Thursday
        case 5: // Friday
        case 6: // Saturday
        case 0: // Sunday
        default:
          daysBack = DAYS_BACK_NORMAL;
          break;
      }
    }
    console.log("Current hour:", currentHour);

    const minDate = new Date();

    attempt == 0 && minDate.getHours() > 7
      ? (daysBack = 0)
      : (daysBack = daysBack);
    minDate.setDate(today.getDate() - daysBack);
    return minDate.toISOString().split("T")[0];
  }

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
      <p style={{ textAlign: "center" }}>
        {/* {attemptLoading ? (
          <CircularProgress />
        ) : ( */}
        {/* <div className="heading">
          <p>
            Note: You have only <span id="green-button">{attempt}</span>{" "}
            attempts left to fill for previous days
          </p>
        </div> */}
        {/* )} */}
      </p>

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

        {/* <div>
          <label>
            Please Mention Any Blockers or Challenges You Are Facing (Minimum 25
            characters):
          </label>
          <textarea
            name="challenges"
            value={formData.challenges}
            onChange={handleChange}
            required
          />
        </div> */}

        <div>
          <label>Select the date for which you want to update the form:</label>
          <input
            type="date"
            name="selectedDate"
            max={today}
            // disabled={isDateDisabled}
            // min={getMinDate()}
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
            {projectData.map((project, index) => (
              <option key={index} value={project}>
                {project}
              </option>
            ))}
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
        open={error}
        autoHideDuration={8000}
        onClose={() => setError("")}
      >
        <Alert
          onClose={() => setError("")}
          severity={
            error == "Thanks for sharing the update!" ? "success" : "error"
          }
          variant="filled"
          sx={{ width: "100%" }}
        >
          {error}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Form;
