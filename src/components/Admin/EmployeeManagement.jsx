import { useState, useEffect } from "react";
import "./EmployeeManagement.css";

const EmployeeManagement = () => {
  const [employeeData, setEmployeeData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

useEffect(() => {
  const fetchEmployeeData = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employeeSheetRecords?sheet=pncdata"
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      // console.log("Feedback data:", data);
      setEmployeeData(data.data);
    } catch (error) {
      // setError("Failed to fetch data");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };
  fetchEmployeeData();
}, []);
  return (
    <div className="employee-management">
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      {!loading && employeeData.length === 0 && <p>No employee data found.</p>}

      {employeeData.length > 0 && (
        <table
          border="1"
          cellPadding="10"
          style={{ borderCollapse: "collapse", marginTop: "20px" }}
        >
          <thead>
            <tr>
              <th>Name</th>
              <th>Active email address for work</th>
              <th>Department</th>
              <th>Employment Type</th>
              <th>Reporting Manager</th>
              <th>Employment Type</th>
              <th>Work Location Type</th>
              <th>Department</th>
              <th>DOJ</th>
              <th>Employment Status</th>
              <th>NG Slack ID (Active member)</th>
              <th>NGVerse Slack ID (Active Member)</th>
              <th>Reporting Manager Email ID</th>
              <th>Alumni</th>
              <th>Gender</th>
            </tr>
          </thead>
          <tbody>
            {employeeData.map((employee, index) => (
              <tr key={index}>
                <td>{employee["First and Last Name"]}</td>
                <td>{employee["Team ID"]}</td>
                <td>{employee.Department}</td>
                <td>{employee["Employment Type"]}</td>
                <td>{employee["Reporting Manager"]}</td>
                <td>{employee["Employment Type"]}</td>
                <td>{employee["Work Location Type"]}</td>
                <td>{employee.Department}</td>
                <td>{employee["Date Of Joining"]}</td>
                <td>{employee["Employment Status"]}</td>
                <td>{employee["NG Slack ID (Active member)"]}</td>
                <td>{employee["NGVerse Slack ID (Active Member)"]}</td>
                <td>{employee["Reporting maanger email ID"]}</td>
                <td>{employee.Alumni}</td>
                <td>{employee.Gender}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default EmployeeManagement;