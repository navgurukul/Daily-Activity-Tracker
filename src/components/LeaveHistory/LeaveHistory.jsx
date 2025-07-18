import React, { useState } from "react";
import { Box } from "@mui/material";
import PersonalHistory from "./PersonalHistory";
import OrganizationOverview from "./OrganizationOverview";
import "./LeaveHistory.css";

const LeaveHistory = () => {
  const [mainTabIndex, setMainTabIndex] = useState(0);

  const handleMainTabClick = (index) => {
    setMainTabIndex(index);
  };

  return (
    <div className="main_container">
      {/* Admin Panel Style Header */}
      <div className="admin-header-container">
        <div className="admin-header-tabs">
          <div 
            className={`admin-tab ${mainTabIndex === 0 ? "active" : ""}`}
            onClick={() => handleMainTabClick(0)}
          >
            👤 Personal History
          </div>
          <div 
            className={`admin-tab ${mainTabIndex === 1 ? "active" : ""}`}
            onClick={() => handleMainTabClick(1)}
          >
            🏢 Organization Records
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="content-area">
        {mainTabIndex === 0 && <PersonalHistory />}
        {mainTabIndex === 1 && <OrganizationOverview />}
      </div>
    </div>
  );
};

export default LeaveHistory;