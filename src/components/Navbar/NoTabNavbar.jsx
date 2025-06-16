import React from "react";
import "./NoTab.css"

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
      <h1
        className="no-tab-heading"
        style={{
          textAlign: "center",
          fontSize: "1.5rem",
          color: "white",
        }}
      >
        Welcome to the Daily Activities Tracker
      </h1>
    </nav>
  );
};

export default NoTabNavBar;
