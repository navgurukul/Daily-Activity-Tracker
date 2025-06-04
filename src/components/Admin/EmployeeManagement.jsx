// import { useState, useEffect } from "react";
// import {
//   Box,
//   Typography,
//   List,
//   ListItem,
//   ListItemText,
//   TextField,
//   Modal,
//   Pagination,
// } from "@mui/material";

// const EmployeeManagement = () => {
//   const [employeeData, setEmployeeData] = useState([]);
//   const [filteredData, setFilteredData] = useState([]);
//   const [selectedEmployee, setSelectedEmployee] = useState(null);
//   const [searchQuery, setSearchQuery] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [page, setPage] = useState(1);
//   const itemsPerPage = 10;

//   useEffect(() => {
//     const fetchEmployeeData = async () => {
//       setLoading(true);
//       try {
//         const response = await fetch(
//           "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employeeSheetRecords?sheet=pncdata"
//         );
//         const data = await response.json();
//         setEmployeeData(data.data);
//         setFilteredData(data.data);
//       } catch (error) {
//         console.error("Error fetching data:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchEmployeeData();
//   }, []);

//   useEffect(() => {
//     const lowerQuery = searchQuery.toLowerCase();
//     const filtered = employeeData.filter(
//       (employee) =>
//         employee["First and Last Name"]?.toLowerCase().includes(lowerQuery) ||
//         employee["Team ID"]?.toLowerCase().includes(lowerQuery)
//     );
//     setFilteredData(filtered);
//     setPage(1); // reset to first page on search
//   }, [searchQuery, employeeData]);

//   const handlePageChange = (event, value) => setPage(value);

//   const paginatedData = filteredData.slice(
//     (page - 1) * itemsPerPage,
//     page * itemsPerPage
//   );

//   return (
//     <Box sx={{ p: 4 }}>
//       <Typography variant="h5" gutterBottom>
//         Employee List
//       </Typography>

//       <TextField
//         label="Search by name or email"
//         variant="outlined"
//         fullWidth
//         margin="normal"
//         value={searchQuery}
//         onChange={(e) => setSearchQuery(e.target.value)}
//       />

//       {loading && <Typography>Loading...</Typography>}
//       {!loading && paginatedData.length === 0 && (
//         <Typography>No employee data found.</Typography>
//       )}

//       <List sx={{ bgcolor: "#f7f7f7", borderRadius: 2 }}>
//         {paginatedData.map((employee, index) => (
//           <ListItem
//             key={index}
//             divider
//             button
//             onClick={() => setSelectedEmployee(employee)}
//             sx={{ justifyContent: "space-between" }}
//           >
//             <ListItemText
//               primary={
//                 <strong>{employee["First and Last Name"] || "No Name"}</strong>
//               }
//             />
//             <Typography>{employee["Team ID"] || "No Email"}</Typography>
//           </ListItem>
//         ))}
//       </List>

//       <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
//         <Pagination
//           count={Math.ceil(filteredData.length / itemsPerPage)}
//           page={page}
//           onChange={handlePageChange}
//           color="primary"
//         />
//       </Box>

//       <Modal
//         open={!!selectedEmployee}
//         onClose={() => setSelectedEmployee(null)}
//         aria-labelledby="employee-detail-modal"
//       >
//         <Box
//           sx={{
//             position: "absolute",
//             top: "50%",
//             left: "50%",
//             transform: "translate(-50%, -50%)",
//             width: 700, 
//             bgcolor: "background.paper",
//             borderRadius: 3,
//             boxShadow: 24,
//             p: 4,
//             maxHeight: "80vh",
//             overflowY: "auto",
//           }}
//         >
//           <Typography variant="h6" fontWeight="bold" gutterBottom>
//             {selectedEmployee?.["First and Last Name"]}
//           </Typography>
//           <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }} />

//           {Object.entries(selectedEmployee || {}).map(([key, value]) => (
//             <Box key={key} sx={{ mb: 1 }}>
//               <Typography variant="subtitle2" color="text.secondary">
//                 {key}
//               </Typography>
//               <Typography variant="body1">{value || "—"}</Typography>
//             </Box>
//           ))}
//         </Box>
//       </Modal>
//     </Box>
//   );
// };

// export default EmployeeManagement;




import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  TextField,
  Modal,
  Pagination,
  CircularProgress
} from "@mui/material";

const EmployeeManagement = () => {
  const [employeeData, setEmployeeData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchEmployeeData = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employeeSheetRecords?sheet=pncdata"
        );
        const data = await response.json();
        setEmployeeData(data.data);
        setFilteredData(data.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployeeData();
  }, []);

  useEffect(() => {
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = employeeData.filter(
      (employee) =>
        employee["First and Last Name"]?.toLowerCase().includes(lowerQuery) ||
        employee["Team ID"]?.toLowerCase().includes(lowerQuery)
    );
    setFilteredData(filtered);
    setPage(1); // reset to first page on search
  }, [searchQuery, employeeData]);

  const handlePageChange = (event, value) => setPage(value);

  const paginatedData = filteredData.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      <Typography variant="h5" gutterBottom>
        Employee List
      </Typography>

      <TextField
        label="Search by name or email"
        variant="outlined"
        fullWidth
        margin="normal"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
          <CircularProgress />
        </Box>
      )}
      {!loading && paginatedData.length === 0 && (
        <Typography>No employee data found.</Typography>
      )}

      <List sx={{ bgcolor: "#f7f7f7", borderRadius: 2 }}>
        {paginatedData.map((employee, index) => (
          <ListItem
            key={index}
            divider
            button
            onClick={() => setSelectedEmployee(employee)}
            sx={{
              justifyContent: "space-between",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "flex-start", sm: "center" },
            }}
          >
            <ListItemText
              primary={
                <strong>{employee["First and Last Name"] || "No Name"}</strong>
              }
            />
            <Typography>{employee["Team ID"] || "No Email"}</Typography>
          </ListItem>
        ))}
      </List>

      <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
        <Pagination
          count={Math.ceil(filteredData.length / itemsPerPage)}
          page={page}
          onChange={handlePageChange}
          color="primary"
        />
      </Box>

      <Modal
        open={!!selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
        aria-labelledby="employee-detail-modal"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "88vw", sm: "85vw", md: 600, lg: 700 },
            bgcolor: "background.paper",
            borderRadius: 3,
            boxShadow: 24,
            p: { xs: 2, sm: 3, md: 4 },
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            {selectedEmployee?.["First and Last Name"]}
          </Typography>
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }} />

          {Object.entries(selectedEmployee || {}).map(([key, value]) => (
            <Box key={key} sx={{ mb: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {key}
              </Typography>
              <Typography variant="body1">{value || "—"}</Typography>
            </Box>
          ))}
        </Box>
      </Modal>
    </Box>
  );
};

export default EmployeeManagement;