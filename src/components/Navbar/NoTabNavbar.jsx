import React from "react";
import "./NoTabNavbar.css";

// Simple Navbar without tabs, only heading
const NoTabNavBar = () => {
  return (
    <nav
      className="navbar"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#282c34",
        marginTop: "0",
      }}
    >
      {/* Main heading */}
      <h1 className="no-tab-heading">
        Welcome to the Daily Activities Tracker
      </h1>
    </nav>
  );
};

export default NoTabNavBar;