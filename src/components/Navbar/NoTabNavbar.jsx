import React from "react";

const NoTabNavBar = () => {
  return (
      <nav className="navbar" style={{
          display: "flex",
          justifyContent: "center",
            alignItems: "center",
      }}>
      <h1
        className="heading"
        style={{
          textAlign: "center",
        }}
      >
        Welcome to Daily Tracker
      </h1>
    </nav>
  );
};

export default NoTabNavBar;
