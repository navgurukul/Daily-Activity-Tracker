// import React, { useEffect, useState, useContext } from "react";
// import {
//   Grid,
//   Paper,
//   Typography,
//   Tab,
//   Tabs,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Box,
// } from "@mui/material";
// import { LoginContext } from "../context/LoginContext";
// import "./LeaveHistory.css";

// const LeaveHistory = () => {
//   const [tabIndex, setTabIndex] = useState(0);
//   const [leaveData, setLeaveData] = useState({
//     approved: [],
//     pending: [],
//     rejected: [],
//   });
//   const dataContext = useContext(LoginContext);
//   const { email } = dataContext;

//   useEffect(() => {
//     if (!email) {
//       console.error("Email is missing from context.");
//       return;
//     }

//     fetch(
//       `https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/leave-records?employeeEmail=${email}`
//     )
//       .then((response) => response.json())
//       .then((data) => {
//         if (data[email]) {
//           const userData = data[email];
//           setLeaveData({
//             approved: userData.approved,
//             pending: userData.pending,
//             rejected: userData.rejected,
//           });
//         } else {
//           console.error(`No leave records found for the email: ${email}`);
//         }
//       })
//       .catch((error) => {
//         console.error("Error fetching leave records:", error);
//       });
//   }, [email]);

//   const renderTableRow = (leave, index) => (
//     <TableRow key={index}>
//       <TableCell>{leave.leaveType}</TableCell>
//       {/* <TableCell>{leave.status}</TableCell> */}
//       <TableCell>{leave.startDate}</TableCell>
//       <TableCell>{leave.endDate}</TableCell>
//       <TableCell>{leave.leaveDuration} days</TableCell>
//       <TableCell>{leave.reasonForLeave}</TableCell>
//     </TableRow>
//   );

//   const renderLeaveCategory = (leaves) => (
//     <TableContainer component={Paper} style={{ overflow: "hidden" }}>
//       <Table>
//         <TableHead>
//           <TableRow>
//             <TableCell>Leave Type</TableCell>
//             {/* <TableCell>Status</TableCell> */}
//             <TableCell>Start Date</TableCell>
//             <TableCell>End Date</TableCell>
//             <TableCell>Duration</TableCell>
//             <TableCell>Reason</TableCell>
//           </TableRow>
//         </TableHead>
//         <TableBody>
//           {leaves.map((leave, index) => renderTableRow(leave, index))}
//         </TableBody>
//       </Table>
//     </TableContainer>
//   );

//   const handleTabChange = (event, newValue) => {
//     setTabIndex(newValue);
//   };

//   return (
//     <div style={{ marginLeft: "50px", padding: "20px" }}>
//       {/* Tab navigation for approved, pending, rejected categories */}
//       {/* <Tabs value={tabIndex} onChange={handleTabChange} aria-label="Leave Tabs">
//         <Tab label="Approved Leaves" />
//         <Tab label="Pending Leaves" />
//         <Tab label="Rejected Leaves" />
//       </Tabs> */}
//       <div className="tabs">
//         <button
//           className={`tab-button ${tabIndex === 0 ? "active-tab" : ""}`}
//           onClick={() => setTabIndex(0)}
//         >
//           Approved Leaves
//         </button>
//         <button
//           className={`tab-button ${tabIndex === 1 ? "active-tab" : ""}`}
//           onClick={() => setTabIndex(1)}
//         >
//           Pending Leaves
//         </button>
//         <button
//           className={`tab-button ${tabIndex === 2 ? "active-tab" : ""}`}
//           onClick={() => setTabIndex(2)}
//         >
//           Rejected Leaves
//         </button>
//       </div>

//       {/* Tab panels to show leave records */}
//       <Box sx={{ marginTop: "20px" }}>
//         {tabIndex === 0 && (
//           <div>
//             {/* <Typography variant="h6" color="primary" gutterBottom>
//               Approved Leaves
//             </Typography> */}
//             {leaveData.approved.length > 0 ? (
//               renderLeaveCategory(leaveData.approved)
//             ) : (
//               <Typography variant="body2" color="textSecondary">
//                 No records available
//               </Typography>
//             )}
//           </div>
//         )}
//         {tabIndex === 1 && (
//           <div>
//             {/* <Typography
//               variant="h6"
//               color="primary"
//               gutterBottom
//             >
//               Pending Leaves
//             </Typography> */}
//             {leaveData.pending.length > 0 ? (
//               renderLeaveCategory(leaveData.pending)
//             ) : (
//               <Typography variant="body2" color="textSecondary">
//                 No records available
//               </Typography>
//             )}
//           </div>
//         )}
//         {tabIndex === 2 && (
//           <div>
//             {/* <Typography variant="h6" color="primary" gutterBottom>
//               Rejected Leaves
//             </Typography> */}
//             {leaveData.rejected.length > 0 ? (
//               renderLeaveCategory(leaveData.rejected)
//             ) : (
//               <Typography variant="body2" color="textSecondary">
//                 No records available
//               </Typography>
//             )}
//           </div>
//         )}
//       </Box>
//     </div>
//   );
// };

// export default LeaveHistory;







import React, { useEffect, useState, useContext } from "react";
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Button,
  IconButton,
} from "@mui/material";
import { LoginContext } from "../context/LoginContext";
import ArrowBackIcon from "@mui/icons-material/KeyboardArrowLeft";
import ArrowForwardIcon from "@mui/icons-material/KeyboardArrowRight";
import "./LeaveHistory.css";

const LeaveHistory = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [leaveData, setLeaveData] = useState({
    approved: [],
    pending: [],
    rejected: [],
  });
  const [pages, setPages] = useState({
    approved: 1,
    pending: 1,
    rejected: 1,
  });
  const [hasMore, setHasMore] = useState({
    approved: false,
    pending: false,
    rejected: false,
  });

  const dataContext = useContext(LoginContext);
  const { email } = dataContext;

  const tabKeys = ["approved", "pending", "rejected"];

  const fetchLeaveData = async (statusKey, page) => {
    if (!email) return;

    try {
      const response = await fetch(
        `https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/leave-records?employeeEmail=${email}&limit=5&page=${page}`
      );
      const data = await response.json();

      const userLeaves = data[email] || {};
      const newData = userLeaves[statusKey] || [];

      setLeaveData((prev) => ({
        ...prev,
        [statusKey]: newData,
      }));

      setHasMore((prev) => ({
        ...prev,
        [statusKey]: newData.length === 5,
      }));
    } catch (error) {
      console.error("Error fetching leave records:", error);
    }
  };

  useEffect(() => {
    const key = tabKeys[tabIndex];
    fetchLeaveData(key, pages[key]);
    // eslint-disable-next-line
  }, [email, tabIndex, pages[tabKeys[tabIndex]]]);

  const handlePageChange = (newPage) => {
    const key = tabKeys[tabIndex];
    if (newPage >= 1) {
      setPages((prev) => ({ ...prev, [key]: newPage }));
    }
  };
  
  const renderTableRow = (leave, index) => (
    <TableRow key={index}>
      <TableCell>{leave.leaveType}</TableCell>
      <TableCell>{leave.startDate}</TableCell>
      <TableCell>{leave.endDate}</TableCell>
      <TableCell>{leave.leaveDuration} days</TableCell>
      <TableCell>{leave.reasonForLeave}</TableCell>
    </TableRow>
  );

  const renderPagination = (currentPage, hasNextPage, statusKey) => {
    const pageNumbers = [];

    for (let i = 1; i <= currentPage; i++) {
      pageNumbers.push(i);
    }

    if (hasNextPage) {
      pageNumbers.push(currentPage + 1);
    }

    return (
      <Box display="flex" justifyContent="center" mt={2} gap={1}>
        <IconButton
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ArrowBackIcon />
        </IconButton>

        {pageNumbers.map((num) => (
          <Button
            key={num}
            variant={num === currentPage ? "contained" : "text"}
            onClick={() => handlePageChange(num)}
            sx={{
              minWidth: "36px",
              height: "36px",
              borderRadius: "50%",
              padding: 0,
              fontSize: "14px",
            }}
          >
            {num}
          </Button>
        ))}

        <IconButton
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={!hasNextPage}
        >
          <ArrowForwardIcon />
        </IconButton>
      </Box>
    );
  };

  const renderLeaveCategory = (leaves, statusKey) => (
    <>
      <TableContainer component={Paper} style={{ overflow: "hidden" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Leave Type</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Reason</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaves.map((leave, index) => renderTableRow(leave, index))}
          </TableBody>
        </Table>
      </TableContainer>

      {renderPagination(pages[statusKey], hasMore[statusKey], statusKey)}
    </>
  );

  return (
    <div style={{ marginLeft: "50px", padding: "20px" }}>
      <div className="tabs">
        <button
          className={`tab-button ${tabIndex === 0 ? "active-tab" : ""}`}
          onClick={() => setTabIndex(0)}
        >
          Approved Leaves
        </button>
        <button
          className={`tab-button ${tabIndex === 1 ? "active-tab" : ""}`}
          onClick={() => setTabIndex(1)}
        >
          Pending Leaves
        </button>
        <button
          className={`tab-button ${tabIndex === 2 ? "active-tab" : ""}`}
          onClick={() => setTabIndex(2)}
        >
          Rejected Leaves
        </button>
      </div>

      <Box sx={{ marginTop: "20px" }}>
        {tabIndex === 0 && (
          <div>
            {leaveData.approved.length > 0 ? (
              renderLeaveCategory(leaveData.approved, "approved")
            ) : (
              <Typography variant="body2" color="textSecondary">
                No records available
              </Typography>
            )}
          </div>
        )}
        {tabIndex === 1 && (
          <div>
            {leaveData.pending.length > 0 ? (
              renderLeaveCategory(leaveData.pending, "pending")
            ) : (
              <Typography variant="body2" color="textSecondary">
                No records available
              </Typography>
            )}
          </div>
        )}
        {tabIndex === 2 && (
          <div>
            {leaveData.rejected.length > 0 ? (
              renderLeaveCategory(leaveData.rejected, "rejected")
            ) : (
              <Typography variant="body2" color="textSecondary">
                No records available
              </Typography>
            )}
          </div>
        )}
      </Box>
    </div>
  );
};

export default LeaveHistory;
