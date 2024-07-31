import React from "react";
import "./LoadingSpinner.css"; 

const LoadingSpinner = ({ loading }) => {
  document.body.style.opacity = loading ? 0.7 : 1;
  return (
    <div
      aria-label="Orange and tan hamster running in a metal wheel"
      role="img"
      className="wheel-and-hamster"
      style={{
        position: "fixed",
        display: loading ? "block" : "none",
        top: "42%",
        left: "45%",
        zIndex: "100",
      }}
    >
      <div className="wheel"></div>
      <div className="hamster">
        <div className="hamster__body">
          <div className="hamster__head">
            <div className="hamster__ear"></div>
            <div className="hamster__eye"></div>
            <div className="hamster__nose"></div>
          </div>
          <div className="hamster__limb hamster__limb--fr"></div>
          <div className="hamster__limb hamster__limb--fl"></div>
          <div className="hamster__limb hamster__limb--br"></div>
          <div className="hamster__limb hamster__limb--bl"></div>
          <div className="hamster__tail"></div>
        </div>
      </div>
      <div className="spoke"></div>
    </div>
  );
};

export default LoadingSpinner;
