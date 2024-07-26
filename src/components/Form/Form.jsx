import React, { useState, useEffect, useContext } from "react";
import "./Form.css";
import config from "../../../public/api";
import { json, useNavigate } from "react-router-dom";
import { LoginContext } from "../context/LoginContext";
import DeleteIcon from "@mui/icons-material/Delete";
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
  const { loading, setLoading } = useLoader();
  const getTodayDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const [formData, setFormData] = useState({
    type: "contribution",
    email: email,
    challenges: "",
    description: "",
    contributions: [],
    selectedDate: getTodayDate(),
  });

  const [projectData, setProjectData] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [currentContribution, setCurrentContribution] = useState({
    hours: "",
    task: "",
  });
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

  useEffect(() => {
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
        "https://script.google.com/macros/s/AKfycbzaoy-lue-Hu8dDFgbhRhTKst8zgUbmxUzfiQUhx1yjHJfbAQpBpjkapsdcHqGOTSn83Q/exec"
      )
        .then((response) => response.json())
        .then((data) => {
          const projects = data.projects;
          const activeProjects = projects.filter(function (project) {
            return project.status === "Active";
          });


          // Extract project names from filtered array
          const activeProjectNames = activeProjects.map(function (project) {
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
    setSelectedProject(e.target.value);
    setCurrentContribution({ hours: "", task: "" }); // Reset current contribution
  };

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
    setCurrentContribution({ hours: "", task: "" }); // Reset current contribution
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

  const handleSubmit = (e) => {
    const entry = new Date(formData.selectedDate);
    const today = new Date();
    if (entry.getDate() !== today.getDate()) {
      const newCount = previousEntriesDone + 1;
      // console.log("Date is not today", entry, today, newCount);
      setPreviousEntriesDone(newCount);
      localStorage.setItem(
        "previousEntriesDone",
        JSON.stringify({ count: newCount, lastUpdated: today })
      );


      if (newCount > 3 && entry.getDate() !== today.getDate()) {
        alert(
          "You have exceeded the limit of 3 entries for past dates in a month. Please Contact support for further assistance."
        );
        return;
      }


    }
    e.preventDefault();
    if (formData.contributions.length === 0) {
      return alert(
        "Please add and save at least one contribution before submitting the form"
      );
    }
    if (formData.challenges.length < 25) {
      setError(
        "Achievements, Blockers, and Challenges must be at least 25 characters long."
      );
      return;
    }

    setSaved(false); // Reset saved to false after submission
    handleLoading(true);
    setLoading(true);

    setError(""); // Clear any previous error messages
    setShowSelect(true);
    const submitTime = new Date();
    const submitTimestamp = `${submitTime
      .getHours()
      .toString()
      .padStart(2, "0")}:${submitTime
      .getMinutes()
      .toString()
      .padStart(2, "0")}:${submitTime
      .getSeconds()
      .toString()
      .padStart(2, "0")}`;

    const payload = {
      ...formData,
      timestamp: submitTimestamp,
    };
    // console.log(payload)
    const url = config.FORM_SUBMIT_URL;
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      mode: "no-cors",
    })
      .then((response) => response.text())
      .then((data) => {
        console.log("Response from Google Apps Script:", data);
        setSuccessMessage("Thanks for sharing the update!");
        setFormData({
          type: "contribution",
          email: email,
          challenges: "",
          description: "",
          contributions: [],
          selectedDate: getTodayDate(),
        });
        setLoading(false);
        handleLoading(false);
        setTimeout(() => setSuccessMessage(""), 3000); // Clear message after 3 seconds
      })
      .catch((error) => {
        console.error("Error sending data to Google Apps Script:", error);
      });
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

    let daysBack;

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

    const minDate = new Date();
    minDate.setDate(today.getDate() - daysBack);

    return minDate.toISOString().split("T")[0];
  }

  return (
    <div>
      <LoadingSpinner loading={loading} />
      <h1 style={{ textAlign: "center" }}>Daily Activity Tracker </h1>
      <p style={{ textAlign: "center" }}>
        Fill out the form below to record your daily tasks.
      </p>

      <form onSubmit={handleSubmit}>
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
                        <td>
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
                        <td>
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
                value={currentContribution.hours}
                onChange={handleContributionChange}
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
              <button type="button" onClick={addContribution}>
                Save Contribution
              </button>
            </div>
          )}
        </div>
        <button type="submit">Submit</button>
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
        autoHideDuration={6000}
        onClose={() => setError("")}
      >
        <Alert
          onClose={() => setError("")}
          severity="error"
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
