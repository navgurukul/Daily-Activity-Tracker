import React from "react";
import "./NoTabNavbar.css";

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
      <h1 className="no-tab-heading">
        Welcome to the Daily Activities Tracker
      </h1>
    </nav>
  );
};

export default NoTabNavBar;