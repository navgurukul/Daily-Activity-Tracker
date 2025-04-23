// import { useState, useEffect } from "react";
// import "./DailyLogs.css";

// function DailyLogs() {
//   const [logs, setLogs] = useState([]);

//   useEffect(() => {
//     async function fetchLogs() {
//       try {
//         const response = await fetch(
//           "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/activityLogs"
//         );
//         const data = await response.json();

//         // Flatten the data into a single array with email included
//         const formattedLogs = Object.entries(data).flatMap(([email, logs]) =>
//           logs.map((log) => ({
//             email,
//             date: log.entryDate,
//             project: log.projectName,
//             hours: log.totalHoursSpent,
//             description: log.workDescription,
//             updatedAt: log.updatedAt,
//           }))
//         );

//         setLogs(formattedLogs);
//       } catch (error) {
//         console.error("Failed to fetch logs:", error);
//       }
//     }

//     fetchLogs();
//   }, []);

//   return (
//     <div className="daily-logs-container">
//       <h2>Daily Logs</h2>
//       {logs.length > 0 ? (
//         <table className="logs-table">
//           <thead>
//             <tr>
//               <th>Email</th>
//               <th>Date</th>
//               <th>Project</th>
//               <th>Hours</th>
//               <th>Description</th>
//               <th>Updated At</th>
//             </tr>
//           </thead>
//           <tbody>
//             {logs.map((log, index) => (
//               <tr key={index}>
//                 <td>{log.email}</td>
//                 <td>{log.date}</td>
//                 <td>{log.project}</td>
//                 <td>{log.hours}</td>
//                 <td>{log.description}</td>
//                 <td>{new Date(log.updatedAt).toLocaleString()}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       ) : (
//         <p className="no-logs">No logs available</p>
//       )}
//     </div>
//   );
// }

// export default DailyLogs;




import { useState, useEffect } from "react";
import "./DailyLogs.css";

function DailyLogs() {
  const [logs, setLogs] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [email, setEmail] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async (
    url = ""
  ) => {
    try {
      const response = await fetch(
        url ||
          "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/activityLogs"
      );
      const data = await response.json();

      const formattedLogs = Object.entries(data).flatMap(([email, logs]) =>
        logs.map((log) => ({
          email,
          date: log.entryDate,
          project: log.projectName,
          hours: log.totalHoursSpent,
          description: log.workDescription,
          updatedAt: log.updatedAt,
        }))
      );

      setLogs(formattedLogs);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    }
  };

  // const handleFilter = () => {
  //   let url =
  //     "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/activityLogs";

  //   if (email && dateStart && dateEnd) {
  //     url = `${url}/${email}/?dateStart=${dateStart}&dateEnd=${dateEnd}`;
  //   } else if (email) {
  //     url = `${url}/${email}/`;
  //   } else if (dateStart && dateEnd) {
  //     url = `${url}/?dateStart=${dateStart}&dateEnd=${dateEnd}`;
  //   } else if (projectName) {
  //     url = `${url}?projectName=${projectName}`;
  //   }
  //   fetchLogs(url);
  // };

  const handleFilter = () => {
    let baseUrl =
      "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/activityLogs";
    let url = baseUrl;
    const params = new URLSearchParams();
    // Case: email present
    if (email) {
      url += `/${email}/`;
    }
    // Add query params if available
    if (projectName) {
      params.append("projectName", projectName);
    }
    if (dateStart && dateEnd) {
      params.append("dateStart", dateStart);
      params.append("dateEnd", dateEnd);
    }
    // If we have any query parameters, append them
    if (params.toString()) {
      url += "?" + params.toString();
    }
    fetchLogs(url);
  };
  
  return (
    <div className="daily-logs-container">
      <h2>Daily Logs</h2>
      <div className="filters">
        <input
          type="text"
          placeholder="Project Name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Employee Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="date"
          value={dateStart}
          onChange={(e) => setDateStart(e.target.value)}
        />
        <input
          type="date"
          value={dateEnd}
          onChange={(e) => setDateEnd(e.target.value)}
        />
        <button onClick={handleFilter}>Apply Filter</button>
      </div>

      {/* Table */}
      {logs.length > 0 ? (
        <table className="logs-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Date</th>
              <th>Project</th>
              <th>Hours</th>
              <th>Description</th>
              <th>Updated At</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, index) => (
              <tr key={index}>
                <td>{log.email}</td>
                <td>{log.date}</td>
                <td>{log.project}</td>
                <td>{log.hours}</td>
                <td>{log.description}</td>
                <td>{new Date(log.updatedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="no-logs">No logs available</p>
      )}
    </div>
  );
}

export default DailyLogs;