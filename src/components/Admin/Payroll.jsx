// import React, { useEffect, useState } from "react";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogContentText,
//   DialogActions,
//   Button,
//   Pagination,
//   Box,
//   TextField,
//   MenuItem,
// } from "@mui/material";

// const Payroll = () => {
//   const [payrollData, setPayrollData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [open, setOpen] = useState(false);
//   const [selectedPerson, setSelectedPerson] = useState(null);
//   const [page, setPage] = useState(1); // Start from 1 for Pagination component
//   const rowsPerPage = 10;

//   // Filters and Sorting
//   const [nameFilter, setNameFilter] = useState("");
//   const [emailFilter, setEmailFilter] = useState("");
//   const [sortOrder, setSortOrder] = useState("asc");

//   useEffect(() => {
//     fetch(
//       "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/payableDaysCalculation"
//     )
//       .then((response) => response.json())
//       .then((data) => {
//         setPayrollData(data);
//         setLoading(false);
//       })
//       .catch((error) => {
//         console.error("Error fetching payroll data:", error);
//         setLoading(false);
//       });
//   }, []);

//   const handleClickOpen = (person) => {
//     setSelectedPerson(person);
//     setOpen(true);
//   };

//   const handleClose = () => {
//     setOpen(false);
//     setSelectedPerson(null);
//   };

//   const handleChangePage = (event, value) => {
//     setPage(value);
//   };

//     const handleSortChange = (event) => {
//       setSortOrder(event.target.value);
//     };

//     // Filtering and Sorting
//     const filteredData = payrollData
//       .filter(
//         (person) =>
//           person.name.toLowerCase().includes(nameFilter.toLowerCase()) &&
//           person.email.toLowerCase().includes(emailFilter.toLowerCase())
//       )
//       .sort((a, b) => {
//         if (sortOrder === "asc") {
//           return a.totalPayableDays - b.totalPayableDays;
//         } else {
//           return b.totalPayableDays - a.totalPayableDays;
//         }
//       });

//   const visibleData = filteredData.slice(
//     (page - 1) * rowsPerPage,
//     page * rowsPerPage
//   );

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   return (
//     <Box sx={{ p: 3 }}>
//       {/* <h1>Payroll Data</h1> */}

//        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
//          <TextField
//           label="Filter by Name"
//           variant="outlined"
//           value={nameFilter}
//           onChange={(e) => setNameFilter(e.target.value)}
//           size="small"
//         />
//         <TextField
//           label="Filter by Email"
//           variant="outlined"
//           value={emailFilter}
//           onChange={(e) => setEmailFilter(e.target.value)}
//           size="small"
//         />
//         <TextField
//           label="Sort by Payable Days"
//           select
//           value={sortOrder}
//           onChange={handleSortChange}
//           size="small"
//           sx={{ width: 150 }}
//         >
//           <MenuItem value="asc">Low to High</MenuItem>
//           <MenuItem value="desc">High to Low</MenuItem>
//         </TextField>
//       </Box>

//       <TableContainer
//         component={Paper}
//         sx={{ boxShadow: 2, overflow: "hidden" }}
//       >
//         <Table>
//           <TableHead>
//             <TableRow>
//               <TableCell>
//                 <b>Name</b>
//               </TableCell>
//               <TableCell>
//                 <b>Email</b>
//               </TableCell>
//               <TableCell>
//                 <b>Total Payable Days</b>
//               </TableCell>
//               <TableCell>
//                 <b>Total Hours</b>
//               </TableCell>
//             </TableRow>
//           </TableHead>
//           <TableBody>
//             {visibleData.map((person, index) => (
//               <TableRow
//                 key={index}
//                 hover
//                 sx={{ cursor: "pointer" }}
//                 onClick={() => handleClickOpen(person)}
//               >
//                 <TableCell>{person.name}</TableCell>
//                 <TableCell>{person.email}</TableCell>
//                 <TableCell>{person.totalPayableDays}</TableCell>
//                 <TableCell>{person.totalHours}</TableCell>
//               </TableRow>
//             ))}
//           </TableBody>
//         </Table>
//       </TableContainer>

//       {/* Pagination */}
//       <Box display="flex" justifyContent="center" mt={3}>
//         <Pagination
//           count={Math.ceil(filteredData.length / rowsPerPage)}
//           page={page}
//           onChange={handleChangePage}
//           color="primary"
//           // shape="rounded"
//         />
//       </Box>

//       {/* Dialog Popup */}
//       <Dialog open={open} onClose={handleClose}>
//         <DialogTitle>User Details</DialogTitle>
//         <DialogContent>
//           {selectedPerson && (
//             <Box sx={{ overflow: "hidden" }}>
//               {Object.entries(selectedPerson).map(([key, value]) => (
//                 <DialogContentText key={key} sx={{ mb: 1 }} width={400}>
//                   <b>{key}:</b> {value}
//                 </DialogContentText>
//               ))}
//             </Box>
//           )}
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={handleClose}>Close</Button>
//         </DialogActions>
//       </Dialog>
//     </Box>
//   );
// };

// export default Payroll;





import React, { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Pagination,
  TextField,
  MenuItem,
  Grid,
} from "@mui/material";

const Payroll = () => {
  const [payrollData, setPayrollData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [page, setPage] = useState(1);
  const rowsPerPage = 9;

  // Filters and Sorting
  const [nameFilter, setNameFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");

  useEffect(() => {
    fetch(
      "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/payableDaysCalculation"
    )
      .then((response) => response.json())
      .then((data) => {
        setPayrollData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching payroll data:", error);
        setLoading(false);
      });
  }, []);

  const handleClickOpen = (person) => {
    setSelectedPerson(person);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedPerson(null);
  };

  const handleChangePage = (event, value) => {
    setPage(value);
  };

  const handleSortChange = (event) => {
    setSortOrder(event.target.value);
  };

  // Filtering and Sorting
  const filteredData = payrollData
    .filter(
      (person) =>
        person.name.toLowerCase().includes(nameFilter.toLowerCase()) &&
        person.email.toLowerCase().includes(emailFilter.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === "asc") {
        return a.totalPayableDays - b.totalPayableDays;
      } else {
        return b.totalPayableDays - a.totalPayableDays;
      }
    });

  const visibleData = filteredData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" mb={3} fontWeight="bold">
        Payroll Dashboard
      </Typography>

      {/* Filters */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 3 }}>
        <TextField
          label="Filter by Name"
          variant="outlined"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          size="small"
        />
        <TextField
          label="Filter by Email"
          variant="outlined"
          value={emailFilter}
          onChange={(e) => setEmailFilter(e.target.value)}
          size="small"
        />
        <TextField
          label="Sort by Payable Days"
          select
          value={sortOrder}
          onChange={handleSortChange}
          size="small"
          sx={{ width: 150 }}
        >
          <MenuItem value="asc">Low to High</MenuItem>
          <MenuItem value="desc">High to Low</MenuItem>
        </TextField>
      </Box>

      {/* Cards Layout */}
      <Grid container spacing={2}>
        {visibleData.map((person, index) => (
          <Grid item xs={12} md={6} lg={4} key={index}>
            <Card
              sx={{
                cursor: "pointer",
                height: "100%",
                transition: "0.3s",
                "&:hover": {
                  boxShadow: 6,
                  transform: "scale(1.02)",
                },
              }}
              onClick={() => handleClickOpen(person)}
            >
              <CardContent>
                <Typography variant="h6" fontWeight="bold" color={"#2c3e50"}>
                  {person.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {person.email}
                </Typography>
                <Typography variant="body1" mt={1} color={"#2c3e50"}>
                  <b>Total Payable Days:</b> {person.totalPayableDays}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      <Box display="flex" justifyContent="center" mt={4}>
        <Pagination
          count={Math.ceil(filteredData.length / rowsPerPage)}
          page={page}
          onChange={handleChangePage}
          color="primary"
          // shape="rounded"
        />
      </Box>

      {/* Popup Dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>User Details</DialogTitle>
        <DialogContent>
          {selectedPerson && (
            <Box sx={{ overflow: "hidden" }}>
              {Object.entries(selectedPerson).map(([key, value]) => (
                <DialogContentText key={key} sx={{ mb: 1 }} width={400}>
                  <b>{key}:</b> {value}
                </DialogContentText>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Payroll;
