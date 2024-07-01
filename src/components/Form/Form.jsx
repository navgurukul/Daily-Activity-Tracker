import React, { useState, useEffect } from "react";
import "./Form.css";

const Form = () => {
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    achievements: "",
    blockers: "",
    challenges: "",
    description: "",
    contributions: {},
  });
  const [projectData, setProjectData] = useState([]);
  const [questions, setQuestions] = useState({});
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    fetch("/data.json")
      .then((response) => response.json())
      .then((data) => {
        setProjectData(data.projects);
        setQuestions(data.questions);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleContributionChange = (e, project) => {
    const { value } = e.target;
    setFormData({
      ...formData,
      contributions: {
        ...formData.contributions,
        [project]: value,
      },
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const url =
      "https://script.google.com/macros/s/AKfycbwHs92cOLBAL6JmHh1tIyEp8fumoNmZLt7GFI_pepk1Q4gNpoF2St_3rQcljzk2bhcNbg/exec";
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
      })
      .catch((error) => {
        console.error("Error sending data to Google Apps Script:", error);
        // Handle error
      });
  };

  return (
    <form onSubmit={handleSubmit}>
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
        <label>Name:</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>{questions.achievements}</label>
        <textarea
          name="achievements"
          value={formData.achievements}
          onChange={handleChange}
          required
        />
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
        <label>What did you do in this project?</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <h3>How many hours have you contributed to the following projects:</h3>
        {projectData.map((project, index) => (
          <div key={index}>
            <label>{project}:</label>
            <input
              type="number"
              name={project}
              value={formData.contributions[project] || 0}
              onChange={(e) => handleContributionChange(e, project)}
              min="0"
              required
            />
          </div>
        ))}
      </div>
      <button type="submit">Submit</button>

      {showSummary && Object.keys(formData.contributions).length > 0 && (
        <>
          <h3>Contributions Summary</h3>
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Hours</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(formData.contributions).map((project, index) => (
                <tr key={index}>
                  <td>{project}</td>
                  <td>{formData.contributions[project]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </form>
  );
};

export default Form;
