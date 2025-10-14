import React from "react";
import "./LoadingSpinner.css"; 

const LoadingSpinner = ({ loading }) => {
  // Dim background when loading
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
      {/* Wheel outline */}
      <div className="wheel"></div>
      {/* Hamster container */}
      <div className="hamster">
        <div className="hamster__body">
          {/* Head section with ear, eye, and nose */}
          <div className="hamster__head">
            <div className="hamster__ear"></div>
            <div className="hamster__eye"></div>
            <div className="hamster__nose"></div>
          </div>
          {/* Legs (front & back) */}
          <div className="hamster__limb hamster__limb--fr"></div>
          <div className="hamster__limb hamster__limb--fl"></div>
          <div className="hamster__limb hamster__limb--br"></div>
          <div className="hamster__limb hamster__limb--bl"></div>
          {/* Tail */}
          <div className="hamster__tail"></div>
        </div>
      </div>
      {/* Spinning wheel spokes */}
      <div className="spoke"></div>
    </div>
  );
};

export default LoadingSpinner;