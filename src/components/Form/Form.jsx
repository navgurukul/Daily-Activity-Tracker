import React, { useState, useEffect } from "react";
import "./Form.css";

const Form = () => {
  const [formData, setFormData] = useState({
    email: "",
    achievements: "",
    challenges: "",
    description: "",
    contributions: [],
    selectedDate: "",
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
    e.preventDefault();
    if (
      formData.achievements.length < 25 ||
      formData.challenges.length < 25
    ) {
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

    const url =
      "https://script.google.com/macros/s/AKfycbww1PJau59E-OcH7FGhzESYNfYyVfOjsBCc3GTEXIGVkrOVa4yHgBnuNmzwA7NFfOGyyw/exec";
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
          email: "",
          achievements: "",
          challenges: "",
          description: "",
          contributions: [],
          selectedDate: "",
        });
        setTimeout(() => setSuccessMessage(""), 3000); // Clear message after 3 seconds
      })
      .catch((error) => {
        console.error("Error sending data to Google Apps Script:", error);
        // Handle error
      });
  };

  return (
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
        <label>What did you achieve today? (Minimum 25 characters)</label>
        <textarea
          name="achievements"
          value={formData.achievements}
          onChange={handleChange}
          required
        />
        {error && <p style={{ color: "red" }}>{error}</p>}
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
          value={formData.selectedDate}
          onChange={handleChange}
        />
      </div>

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

      {formData.contributions.length > 0 && (
        <div>
          <h3>Contributions Summary</h3>

          <p>
            You can select multiple projects by clicking on the dropdown above
          </p>
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
        </div>
      )}

      <button type="submit">Submit</button>
    </form>
  );
};

export default Form;
