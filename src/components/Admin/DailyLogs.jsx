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




// import { useState, useEffect } from "react";
// import "./DailyLogs.css";

// function DailyLogs() {
//   const [logs, setLogs] = useState([]);
//   const [projectName, setProjectName] = useState("");
//   const [email, setEmail] = useState("");
//   const [dateStart, setDateStart] = useState("");
//   const [dateEnd, setDateEnd] = useState("");

//   useEffect(() => {
//     fetchLogs();
//   }, []);

//   const fetchLogs = async (
//     url = ""
//   ) => {
//     try {
//       const response = await fetch(
//         url ||
//           "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/activityLogs"
//       );
//       const data = await response.json();

//       const formattedLogs = Object.entries(data).flatMap(([email, logs]) =>
//         logs.map((log) => ({
//           email,
//           date: log.entryDate,
//           project: log.projectName,
//           hours: log.totalHoursSpent,
//           description: log.workDescription,
//           updatedAt: log.updatedAt,
//         }))
//       );

//       setLogs(formattedLogs);
//     } catch (error) {
//       console.error("Failed to fetch logs:", error);
//     }
//   };

//   // const handleFilter = () => {
//   //   let url =
//   //     "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/activityLogs";

//   //   if (email && dateStart && dateEnd) {
//   //     url = `${url}/${email}/?dateStart=${dateStart}&dateEnd=${dateEnd}`;
//   //   } else if (email) {
//   //     url = `${url}/${email}/`;
//   //   } else if (dateStart && dateEnd) {
//   //     url = `${url}/?dateStart=${dateStart}&dateEnd=${dateEnd}`;
//   //   } else if (projectName) {
//   //     url = `${url}?projectName=${projectName}`;
//   //   }
//   //   fetchLogs(url);
//   // };

//   const handleFilter = () => {
//     let baseUrl =
//       "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/activityLogs";
//     let url = baseUrl;
//     const params = new URLSearchParams();
//     // Case: email present
//     if (email) {
//       url += `/${email}/`;
//     }
//     // Add query params if available
//     if (projectName) {
//       params.append("projectName", projectName);
//     }
//     if (dateStart && dateEnd) {
//       params.append("dateStart", dateStart);
//       params.append("dateEnd", dateEnd);
//     }
//     // If we have any query parameters, append them
//     if (params.toString()) {
//       url += "?" + params.toString();
//     }
//     fetchLogs(url);
//   };
  
//   return (
//     <div className="daily-logs-container">
//       <h2>Daily Logs</h2>
//       <div className="filters">
//         <input
//           type="text"
//           placeholder="Project Name"
//           value={projectName}
//           onChange={(e) => setProjectName(e.target.value)}
//         />
//         <input
//           type="email"
//           placeholder="Employee Email"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//         />
//         <input
//           type="date"
//           value={dateStart}
//           onChange={(e) => setDateStart(e.target.value)}
//         />
//         <input
//           type="date"
//           value={dateEnd}
//           onChange={(e) => setDateEnd(e.target.value)}
//         />
//         <button onClick={handleFilter}>Apply Filter</button>
//       </div>

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





import { useState, useEffect, useCallback } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination
} from "@mui/material";
import debounce from "lodash/debounce";

function DailyLogs() {
  const [logs, setLogs] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [email, setEmail] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;


  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    debouncedFilter();
  }, [projectName, email]);

  const fetchLogs = async (url = "") => {
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

  const handleFilter = () => {
    let baseUrl =
      "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/activityLogs";
    let url = baseUrl;
    const params = new URLSearchParams();

    if (email) url += `/${email}/`;
    if (projectName) params.append("projectName", projectName);
    if (dateStart && dateEnd) {
      params.append("dateStart", dateStart);
      params.append("dateEnd", dateEnd);
    }

    if (params.toString()) {
      url += "?" + params.toString();
    }

    fetchLogs(url);
  };

  const debouncedFilter = useCallback(debounce(handleFilter, 500), [
    projectName,
    email,
    dateStart,
    dateEnd,
  ]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = logs.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(logs.length / itemsPerPage);

  return (
    <Box sx={{ padding: 3, boxSizing: "border-box" }}>
      <Typography variant="h5" align="center" marginBottom="30px" gutterBottom>
        Daily Logs
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
          marginBottom: 3,
          justifyContent: "center",
        }}
      >
        <TextField
          label="Project Name"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          size="small"
        />
        <TextField
          label="Employee Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          size="small"
        />
        <TextField
          type="date"
          label="Start Date"
          value={dateStart}
          onChange={(e) => setDateStart(e.target.value)}
          size="small"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          type="date"
          label="End Date"
          value={dateEnd}
          onChange={(e) => setDateEnd(e.target.value)}
          size="small"
          InputLabelProps={{ shrink: true }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleFilter}
          sx={{ whiteSpace: "nowrap" }}
        >
          Apply Date Filter
        </Button>
      </Box>

      {logs.length > 0 ? (
        <Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Hours</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Updated At</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentLogs.map((log, index) => (
                  <TableRow key={index}>
                    <TableCell>{log.email}</TableCell>
                    <TableCell>{log.date}</TableCell>
                    <TableCell>{log.project}</TableCell>
                    <TableCell>{log.hours}</TableCell>
                    <TableCell>{log.description}</TableCell>
                    <TableCell>
                      {new Date(log.updatedAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ display: "flex", justifyContent: "center", marginTop: 2 }}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(event, value) => setCurrentPage(value)}
              siblingCount={1}
              boundaryCount={1}
              color="primary"
            />
          </Box>
        </Box>
      ) : (
        <Typography align="center" color="textSecondary">
          No logs available
        </Typography>
      )}
    </Box>
  );
}

export default DailyLogs;