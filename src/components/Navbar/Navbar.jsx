import React, { useState, useEffect, useContext } from "react";
import "./Navbar.css"; // Import the CSS file
import { useNavigate } from "react-router-dom";
import { LoginContext } from "../context/LoginContext";
const Navbar = () => {
  const [selected, setSelected] = useState(
    localStorage.getItem("selectedButton") || "daily-tracker"
  ); // Initial selected button from localStorage or default
  const navigate = useNavigate();

  const dataContext = useContext(LoginContext);
  const { email, setEmail } = dataContext;
  useEffect(() => {
    if (email) {
      localStorage.setItem("selectedButton", selected);
      if (selected === "daily-tracker") {
        navigate("/form");
      }
    } else {
      localStorage.removeItem("selectedButton");
      navigate("/");
    }


    // Redirect to / route if "daily-tracker" is selected on initial load
  }, [selected, navigate]);

  useEffect(() => {
    // Redirect to / route if the user visits the site and "daily-tracker" is selected
    
    if (selected === "leave-app") {
      navigate("/leaves");
    }
    if (selected === "comp-off") {
      navigate("/comp_off");
    }
  }, [selected]);

  const handleClick = (button) => {
    console.log(button);
    if (button == "logout") {
      localStorage.clear();
      return navigate("/");
    }
    const newSelection = button === "" ? "daily-tracker" : button;
    setSelected(newSelection);
    navigate(`/${button}`); // Navigate to the selected button
  };

  return (
    <nav className="navbar">
      <h1
        className="heading"
        style={{
          color: "white",
          fontSize: "1.5rem",
          fontWeight: "bold",
          margin: "0",
        }}
      >
        Daily Tracker
      </h1>
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
        className={`nav-button ${
          selected === "comp-off" ? "selected" : ""
        }`}
        // onClick={() => handleClick("comp-off")}
       >
       Comp-off
      </li>
        <li
          className={`nav-button ${selected === "leave-app" ? "selected" : ""}`}
          onClick={() => handleClick("leave-app")}
        >
          Leave Application
        </li>
        <li
          className="logout nav-button"
          onClick={() => {
            localStorage.clear();
            handleClick("logout");
            setEmail("");
          }}
        >
          Logout 💀
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
