// import { useState, useEffect, useCallback } from "react";
// import {
//   TextField,
//   Button,
//   Box,
//   Typography,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   Pagination,
// } from "@mui/material";
// import Autocomplete from "@mui/material/Autocomplete";
// import debounce from "lodash/debounce";

// function DailyLogs() {
//   const [logs, setLogs] = useState([]);
//   const [projectName, setProjectName] = useState("");
//   const [email, setEmail] = useState("");
//   const [month, setMonth] = useState("");
//   const [year, setYear] = useState("");


//   const [allEmails, setAllEmails] = useState([]);
//   const [currentPage, setCurrentPage] = useState(1);
//   const itemsPerPage = 5;

//   const [emailsList, setEmailsList] = useState([]);
//   const [projectList, setProjectList] = useState([]);

//   useEffect(() => {
//     fetchLogs();
//   }, []);

//   useEffect(() => {
//     debouncedFilter();
//   }, [projectName, email, month, year]);

//   const fetchLogs = async (url = "") => {
//     try {
//       const response = await fetch(
//         url ||
//           "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/activityLogs"
//       );
//       const data = await response.json();

//       const formattedLogs = Object.entries(data.data).flatMap(([email, logs]) =>
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

//       // Extract unique emails and set to emailsList
//       const uniqueEmails = [...new Set(Object.keys(data.data))];
//       setEmailsList(uniqueEmails);

//       // Extract unique project names
//       const allProjects = formattedLogs.map((log) => log.project);
//       const uniqueProjects = [...new Set(allProjects)];
//       setProjectList(uniqueProjects);
//     } catch (error) {
//       console.error("Failed to fetch logs:", error);
//     }
//   };

//   const handleFilter = () => {
//     let baseUrl =
//       "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/activityLogs";
//     let url = baseUrl;
//     const params = new URLSearchParams();

//     if (email) url += `/${email}`;
//     if (projectName) params.append("projectName", projectName);
//     if (month && year) {
//       params.append("month", month);
//       params.append("year", year);
//     }    

//     if (params.toString()) {
//       url += "?" + params.toString();
//     }

//     fetchLogs(url);
//   };

//   const clearFilters = () => {
//     setProjectName("");
//     setEmail("");
//     setMonth("");
//     setYear("");
//     setCurrentPage(1);
//     fetchLogs();
//   };

//   const debouncedFilter = useCallback(debounce(handleFilter, 500), [
//     projectName,
//     email,
//     month,
//     year,
//   ]);

//   const indexOfLastItem = currentPage * itemsPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//   const currentLogs = logs.slice(indexOfFirstItem, indexOfLastItem);

//   const totalPages = Math.ceil(logs.length / itemsPerPage);

//   return (
//     <Box sx={{ padding: 3, boxSizing: "border-box" }}>
//       <Typography variant="h5" align="center" marginBottom="30px" gutterBottom>
//         Daily Logs
//       </Typography>

//       <Box
//         sx={{
//           display: "flex",
//           flexWrap: "wrap",
//           gap: 2,
//           marginBottom: 3,
//           justifyContent: "center",
//         }}
//       >
//         <Autocomplete
//           options={projectList}
//           value={projectName}
//           onChange={(event, newValue) => {
//             setProjectName(newValue || "");
//           }}
//           renderInput={(params) => (
//             <TextField {...params} label="Project Name" size="small" />
//           )}
//           freeSolo
//           sx={{ minWidth: 200 }}
//         />

//         {/* Changed Employee Email input to Autocomplete */}
//         <Autocomplete
//           options={emailsList}
//           value={email}
//           onChange={(event, newValue) => setEmail(newValue || "")}
//           renderInput={(params) => (
//             <TextField {...params} label="Employee Email" size="small" />
//           )}
//           freeSolo
//           sx={{ minWidth: 200 }}
//         />
//         <TextField
//           label="Month"
//           value={month}
//           onChange={(e) => setMonth(e.target.value)}
//           select
//           size="small"
//           sx={{ minWidth: 120 }}
//           SelectProps={{ native: true }}
//         >
//           <option value="" disabled></option>
//           {[...Array(12)].map((_, i) => (
//             <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
//               {String(i + 1).padStart(2, "0")}
//             </option>
//           ))}
//         </TextField>

//         <TextField
//           label="Year"
//           value={year}
//           onChange={(e) => setYear(e.target.value)}
//           select
//           size="small"
//           sx={{ minWidth: 120 }}
//           SelectProps={{ native: true }}
//         >
//           <option value="" disabled></option>
//           {[2023, 2024, 2025, 2026].map((yr) => (
//             <option key={yr} value={yr}>
//               {yr}
//             </option>
//           ))}
//         </TextField>

//         <Button
//           variant="contained"
//           color="primary"
//           onClick={clearFilters}
//           sx={{ whiteSpace: "nowrap" }}
//         >
//           Clear Filters
//         </Button>
//         {/* <Button
//           variant="contained"
//           color="primary"
//           onClick={handleFilter}
//           sx={{ whiteSpace: "nowrap" }}
//         >
//           Apply Date Filter
//         </Button> */}
//       </Box>

//       {logs.length > 0 ? (
//         <Box>
//           <TableContainer component={Paper}>
//             <Table>
//               <TableHead>
//                 <TableRow>
//                   <TableCell>Email</TableCell>
//                   <TableCell>Date</TableCell>
//                   <TableCell>Project</TableCell>
//                   <TableCell>Hours</TableCell>
//                   <TableCell>Description</TableCell>
//                   <TableCell>Updated At</TableCell>
//                 </TableRow>
//               </TableHead>
//               <TableBody>
//                 {currentLogs.map((log, index) => (
//                   <TableRow key={index}>
//                     <TableCell>{log.email}</TableCell>
//                     <TableCell>{log.date}</TableCell>
//                     <TableCell>{log.project}</TableCell>
//                     <TableCell>{log.hours}</TableCell>
//                     <TableCell>{log.description}</TableCell>
//                     <TableCell>
//                       {new Date(log.updatedAt).toLocaleString()}
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </TableContainer>
//           <Box sx={{ display: "flex", justifyContent: "center", marginTop: 2 }}>
//             <Pagination
//               count={totalPages}
//               page={currentPage}
//               onChange={(event, value) => setCurrentPage(value)}
//               siblingCount={1}
//               boundaryCount={1}
//               color="primary"
//             />
//           </Box>
//         </Box>
//       ) : (
//         <Typography align="center" color="textSecondary">
//           No logs available
//         </Typography>
//       )}
//     </Box>
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
  Pagination,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
import debounce from "lodash/debounce";
function DailyLogs() {
  const [logs, setLogs] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [email, setEmail] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [allEmails, setAllEmails] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [emailsList, setEmailsList] = useState([]);
  const [projectList, setProjectList] = useState([]);
  useEffect(() => {
    fetchLogs();
  }, []);
  useEffect(() => {
    debouncedFilter();
  }, [projectName, email, month, year]);
  const fetchLogs = async (url = "") => {
    try {
      const response = await fetch(
        url ||
          "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/activityLogs"
      );
      const data = await response.json();
      const formattedLogs = Object.entries(data.data).flatMap(([email, logs]) =>
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
      // Extract unique emails and set to emailsList
      const uniqueEmails = [...new Set(Object.keys(data.data))];
      setEmailsList(uniqueEmails);
      // Extract unique project names
      const allProjects = formattedLogs.map((log) => log.project);
      const uniqueProjects = [...new Set(allProjects)];
      setProjectList(uniqueProjects);
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    }
  };
  const handleFilter = () => {
    let baseUrl =
      "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/activityLogs";
    let url = baseUrl;
    const params = new URLSearchParams();
    if (email) url += `/${email}`;
    if (projectName) params.append("projectName", projectName);
    if (month && year) {
      params.append("month", month);
      params.append("year", year);
    }
    if (params.toString()) {
      url += "?" + params.toString();
    }
    fetchLogs(url);
  };

    const clearFilters = () => {
      setProjectName("");
      setEmail("");
      setMonth("");
      setYear("");
      setCurrentPage(1);
      fetchLogs();
    };

  const debouncedFilter = useCallback(debounce(handleFilter, 500), [
    projectName,
    email,
    month,
    year,
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
        <Autocomplete
          options={projectList}
          value={projectName}
          onChange={(event, newValue) => {
            setProjectName(newValue || "");
          }}
          renderInput={(params) => (
            <TextField {...params} label="Project Name" size="small" />
          )}
          freeSolo
          sx={{ minWidth: 200 }}
        />
        {/* Changed Employee Email input to Autocomplete */}
        <Autocomplete
          options={emailsList}
          value={email}
          onChange={(event, newValue) => setEmail(newValue || "")}
          renderInput={(params) => (
            <TextField {...params} label="Employee Email" size="small" />
          )}
          freeSolo
          sx={{ minWidth: 200 }}
        />
        <TextField
          label="Month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          select
          size="small"
          sx={{ minWidth: { xs: 150, sm: 120, md: 150 } }}
          SelectProps={{ native: true }}
        >
          <option value="" disabled></option>
          {[...Array(12)].map((_, i) => (
            <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
              {String(i + 1).padStart(2, "0")}
            </option>
          ))}
        </TextField>
        <TextField
          label="Year"
          value={year}
          onChange={(e) => setYear(e.target.value)}
          select
          size="small"
          sx={{ minWidth: { xs: 150, sm: 120, md: 150 } }}
          SelectProps={{ native: true }}
        >
          <option value="" disabled></option>
          {[2023, 2024, 2025, 2026].map((yr) => (
            <option key={yr} value={yr}>
              {yr}
            </option>
          ))}
        </TextField>
        <Button
          variant="contained"
          color="primary"
          onClick={clearFilters}
          sx={{ whiteSpace: "nowrap" }}
        >
          Clear Filters
        </Button>
        {/* <Button
          variant="contained"
          color="primary"
          onClick={handleFilter}
          sx={{ whiteSpace: "nowrap" }}
        >
          Apply Date Filter
        </Button> */}
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