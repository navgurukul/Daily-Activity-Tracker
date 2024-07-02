import React, { useState, useEffect } from "react";
import "./Navbar.css"; // Import the CSS file
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const [selected, setSelected] = useState(
    localStorage.getItem("selectedButton") || "daily-tracker"
  ); // Initial selected button from localStorage or default
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("selectedButton", selected);

    // Redirect to / route if "daily-tracker" is selected on initial load
    if (selected === "daily-tracker") {
      navigate("/");
    }
  }, [selected, navigate]);

  useEffect(() => {
    // Redirect to / route if the user visits the site and "daily-tracker" is selected
    const storedSelected = localStorage.getItem("selectedButton");
    if (storedSelected === "leave-app") {
      navigate("/leaves");
    }
  }, []);

  const handleClick = (button) => {
    const newSelection = button === "" ? "daily-tracker" : "leave-app";
    setSelected(newSelection);
    navigate(`/${button}`); // Navigate to the selected button
  };

  return (
    <nav className="navbar">
      <h1 className="heading">Daily Tracker</h1>
      <ul className="nav-buttons">
        <li
          className={`nav-button ${
            selected === "daily-tracker" ? "selected" : ""
          }`}
          onClick={() => handleClick("")}
        >
          Activity Tracker
        </li>
        <li
          className={`nav-button ${selected === "leave-app" ? "selected" : ""}`}
          onClick={() => handleClick("leaves")}
        >
          Leave Application
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
