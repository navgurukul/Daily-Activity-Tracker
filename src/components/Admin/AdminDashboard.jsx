import { useState } from "react";
import DailyLogs from "./DailyLogs";
import EmployeeManagement from "./EmployeeManagement";
import ProjectManagement from "./ProjectManagement";
import LeaveManagement from "./LeaveManagement";
import "./AdminDashboard.css";
import Payroll from "./Payroll";

const AdminDashboard = () => {
  // const adminEmails = [
  //   "amitkumar@navgurukul.org",
  //   "admin@example.com",
  //   "manager@company.com",
  //   "puran@navgurukul.org",
  //   "amruta@navgurukul.org",
  //   "ujjwal@navgurukul.org",
  // ];

  // const userEmail = localStorage.getItem("email");
  // const userEmail = "amruta@navgurukul.org" || "puran@navgurukul.org" || "ujjwal@navgurukul.org" || "amitkumar@navgurukul.org";

  // Check if the user is an admin
  // const isAdmin = adminEmails.includes(userEmail);

  const [activeSection, setActiveSection] = useState("dailyLogs");

  return (
    <div className="admin-dashboard" style={{ overflowY: "scroll", height: "95vh" }}>
      {/* {isAdmin ? ( */}
        <>
          <div className="admin-navbar">
            <h2>Admin Panel</h2>
            <div className="admin-nav-links">
              <button
                className={activeSection === "dailyLogs" ? "active" : ""}
                onClick={() => setActiveSection("dailyLogs")}
              >
                Daily Logs
              </button>
              <button
                className={activeSection === "employee" ? "active" : ""}
                onClick={() => setActiveSection("employee")}
              >
                Employee Management
              </button>
              {/* <button
                className={activeSection === "project" ? "active" : ""}
                onClick={() => setActiveSection("project")}
              >
                Project Management
              </button> */}
              <button
                className={activeSection === "leave" ? "active" : ""}
                onClick={() => setActiveSection("leave")}
              >
                Leave Management
              </button>
              <button
                className={activeSection === "payroll" ? "active" : ""}
                onClick={() => setActiveSection("payroll")}
              >
                Payable Days Overview
              </button>
            </div>
          </div>

          <div className="content">
            {activeSection === "dailyLogs" && <DailyLogs />}
            {activeSection === "employee" && <EmployeeManagement />}
            {activeSection === "project" && <ProjectManagement />}
            {activeSection === "leave" && <LeaveManagement />}
            {activeSection === "payroll" && <Payroll />}
          </div>
        </>
      {/* ) : (
        <div className="not-admin">
          <h2>Access Denied</h2>
          <p>You are not an admin, so you cannot access this section.</p>
        </div>
      )} */}
    </div>
  );
};

export default AdminDashboard;