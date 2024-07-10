import React, { useState, useEffect, useContext } from "react";
import "./Form.css";
import config from "../../../public/api";
import { json, useNavigate } from "react-router-dom";
import { LoginContext } from "../context/LoginContext";
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button } from '@mui/material';


const Form = () => {
  const dataContext = useContext(LoginContext);
  const { email } = dataContext;

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
  const [loading, setLoading] = useState(false);
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



    useEffect(() => {
        try {
          fetch(
            "https://script.google.com/macros/s/AKfycbx0lT1BKg_XHx3P01BChnaROnk79NFSOVVyQLAHYwb1VqC56OsOvxIyINTu93H2NUfTOA/exec",
           
          )
            .then((response) =>response.json()
            )
            .then((data) => {
              console.log("Data fetched:",data.content);
               const filteredProjects = data.content.map((project) => project[0]).filter((project) => project !== "");
           //   setProjectNames(filteredProjects);
              console.log("Project Names:", filteredProjects)
              setProjectData(filteredProjects);
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
    setSaved(true);
    setShowSelect(false); // Hide the project selection dropdown
    if (
      selectedProject &&
      currentContribution.hours &&
      currentContribution.task
    ) {
      setFormData((prevState) => ({
        ...prevState,
        contributions: [
          ...prevState.contributions,
          { project: selectedProject, ...currentContribution },
        ],
      }));
      setSelectedProject(""); // Reset project selection
      setCurrentContribution({ hours: "", task: "" }); // Reset current contribution
      setShowProjectForm(false); // Hide the project form
    }
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
    e.preventDefault();
    if (!saved)
      return alert("Please save the contribution before submitting the form");

    if (formData.challenges.length < 25) {
      setError(
        "Achievements, Blockers, and Challenges must be at least 25 characters long."
      );

      return;
    }

    handleLoading(true);
    setLoading(true);
    setError(""); // Clear any previous error messages
    setShowSelect(true);
    const url = config.FORM_SUBMIT_URL;
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
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

  return (
    <div>
      <div
        aria-label="Orange and tan hamster running in a metal wheel"
        role="img"
        className="wheel-and-hamster"
        style={{
          position: "fixed",
          display: loading ? "block" : "none",
          top: "42%",
          left: "45%",
          zIndex: "100",
        }}
      >
        <div className="wheel"></div>
        <div className="hamster">
          <div className="hamster__body">
            <div className="hamster__head">
              <div className="hamster__ear"></div>
              <div className="hamster__eye"></div>
              <div className="hamster__nose"></div>
            </div>
            <div className="hamster__limb hamster__limb--fr"></div>
            <div className="hamster__limb hamster__limb--fl"></div>
            <div className="hamster__limb hamster__limb--br"></div>
            <div className="hamster__limb hamster__limb--bl"></div>
            <div className="hamster__tail"></div>
          </div>
        </div>
        <div className="spoke"></div>
      </div>
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

          {error && <p style={{ color: "red" }}>{error}</p>}
        </div>

        <div>
          <label>Select the date for which you want to update the form:</label>
          <input
            type="date"
            name="selectedDate"
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

          {selectedProject && (
            <div>
              <h4>{selectedProject}</h4>
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
    </div>
  );
};

export default Form;
