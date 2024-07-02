import React, { useState, useEffect } from "react";
import "./Form.css";
import config from "../../config";

const Form = () => {
  const [formData, setFormData] = useState({
    type: "contribution",
    email: "",
    challenges: "",
    description: "",
    contributions: [],
    selectedDate: "",
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

  const [showSelect, setShowSelect] = useState(true);

  useEffect(() => {
    fetch("/data.json")
      .then((response) => response.json())
      .then((data) => {
        setProjectData(data.projects);
      });
  }, []);

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

  const handleSubmit = (e) => {
    setShowSelect(true);
    e.preventDefault();
    handleLoading(true);
    setLoading(true);
    if ( formData.challenges.length < 25) {
      setError(
        "Achievements, Blockers, and Challenges must be at least 25 characters long."
      );
      return;
    }
    setError(""); // Clear any previous error messages

    // Set current date if not selected by user
    if (!formData.selectedDate) {
      const today = new Date();
      const formattedDate = `${today.getFullYear()}-${
        today.getMonth() + 1
      }-${today.getDate()}`;
      setFormData({ ...formData, selectedDate: formattedDate });
    }

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
          email: "",
          challenges: "",
          description: "",
          contributions: [],
          selectedDate: "",
        });
        setLoading(false);
        handleLoading(false);
        setTimeout(() => setSuccessMessage(""), 3000); // Clear message after 3 seconds
      })
      .catch((error) => {
        console.error("Error sending data to Google Apps Script:", error);
        // Handle error
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
        class="wheel-and-hamster"
        style={{
          position: "absolute",
          display: loading ? "block" : "none",
          top: "42%",
          left: "45%",
          zIndex: "100",
        }}
      >
        <div class="wheel"></div>
        <div class="hamster">
          <div class="hamster__body">
            <div class="hamster__head">
              <div class="hamster__ear"></div>
              <div class="hamster__eye"></div>
              <div class="hamster__nose"></div>
            </div>
            <div class="hamster__limb hamster__limb--fr"></div>
            <div class="hamster__limb hamster__limb--fl"></div>
            <div class="hamster__limb hamster__limb--br"></div>
            <div class="hamster__limb hamster__limb--bl"></div>
            <div class="hamster__tail"></div>
          </div>
        </div>
        <div class="spoke"></div>
      </div>
      <h1 style={{ textAlign: "center" }}>Daily Tracker Form</h1>
      <p style={{ textAlign: "center" }}>
        Fill out the form below to record your daily tasks.
      </p>

      <form onSubmit={handleSubmit}>
        {successMessage && <h1 style={{ color: "green" }}>{successMessage}</h1>}
        <div>
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
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
                </tr>
              </thead>
              <tbody>
                {formData.contributions.map((contribution, index) => (
                  <tr key={index}>
                    <td>{contribution.project}</td>
                    <td>{contribution.hours}</td>
                    <td>{contribution.task}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <br />

            <p>
              You can select multiple projects by clicking on the dropdown above
            </p>
            {!showSelect ? (
              <button type="button" onClick={() => setShowSelect(true)}>
                Add Contribution
              </button>
            ) : null}
          </div>
        )}
        <div>
          {showSelect ? (
            <>
              <label>Select a project in which you contributed:</label>
              <select value={selectedProject} onChange={handleProjectSelect}>
                <option value="">--Select a project--</option>
                {projectData.map((project, index) => (
                  <option key={index} value={project}>
                    {project}
                  </option>
                ))}
              </select>
            </>
          ) : null}

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
    </div>
  );
};

export default Form;
