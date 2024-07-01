import React, { useState, useEffect } from "react";
import "./Form.css";

const Form = () => {
  const [formData, setFormData] = useState({
    email: "",
    achievements: "",
    blockers: "",
    challenges: "",
    description: "",
    contributions: [],
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
    if (formData.achievements.length < 100) {
      setError("Achievements must be at least 100 characters long.");
      return;
    }
    setError(""); // Clear any previous error messages

    const url =
      "https://script.google.com/macros/s/AKfycbymEomStpJ3EpovGSGQuF2HCpQWigKRQtjPrL_frCwK6L_f1CYDa-JfTT4G-LbFUpRpkQ/exec";
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
        // Optionally reset form state or show success message
        setSuccessMessage("Thanks for sharing the update!");
        setFormData({
          email: "",
          achievements: "",
          blockers: "",
          challenges: "",
          description: "",
          contributions: [],
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
        <label>What did you achieve today?</label>
        <textarea
          name="achievements"
          value={formData.achievements}
          onChange={handleChange}
          required
        />
        {error && <p style={{ color: "red" }}>{error}</p>}
      </div>
      <div>
        <label>Blockers:</label>
        <textarea
          name="blockers"
          value={formData.blockers}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>Challenges:</label>
        <textarea
          name="challenges"
          value={formData.challenges}
          onChange={handleChange}
          required
        />
      </div>

      <div>
        <label>Select a project:</label>
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
            <label>Hours:</label>
            <input
              type="number"
              name="hours"
              value={currentContribution.hours}
              onChange={handleContributionChange}
              min="0"
              required
            />
            <label>What did you achieve:</label>
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
          <button type="button" onClick={() => setShowProjectForm(true)}>
            Add Contribution
          </button>
        </div>
      )}

      <button type="submit">Submit</button>
    </form>
  );
};

export default Form;
