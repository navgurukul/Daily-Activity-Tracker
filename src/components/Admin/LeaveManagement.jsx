// import React, { useEffect, useState, useContext } from "react";
// import "./LeaveManagement.css";
// import { LoginContext } from "../context/LoginContext";

// import Autocomplete from "@mui/material/Autocomplete";
// import TextField from "@mui/material/TextField";

// const LeaveManagement = () => {
//   const dataContext = useContext(LoginContext);
//   const { email } = dataContext;
//   const [pendingLeaves, setPendingLeaves] = useState([]);
//   const [approvedLeaves, setApprovedLeaves] = useState([]);
//   const [selectedTab, setSelectedTab] = useState("pending");
//   const [leaveHistory, setLeaveHistory] = useState([]);
//   const [searchEmail, setSearchEmail] = useState("");
//   const [leaveBalance, setLeaveBalance] = useState([]);
//   const [loadingBalance, setLoadingBalance] = useState(false);
//   const [balanceError, setBalanceError] = useState("");
//   const [allEmails, setAllEmails] = useState([]);
//   const [filteredLeaveHistory, setFilteredLeaveHistory] = useState([]);

//   useEffect(() => {
//     fetch("https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/leave-records")
//       .then((res) => res.json())
//       .then((data) => {
//         const pending = [];
//         const approved = [];
//         const emails = [];

//         Object.keys(data).forEach((email) => {
//           emails.push(email);
//           const userLeaves = data[email];

//           userLeaves?.pending?.forEach((record) =>
//             pending.push({ email, ...record })
//           );

//           userLeaves?.approved?.forEach((record) =>
//             approved.push({ email, ...record })
//           );
//         });

//         setPendingLeaves(pending);
//         setApprovedLeaves(approved);
//         setAllEmails(emails);
//       })
//       .catch((err) => console.error("Failed to fetch data", err));
//   }, []);

//   const handleApprove = async (leaveId) => {
//     try {
//       const approveResponse = await fetch(
//         "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employmentLeavePolicy",
//         {
//           method: "PUT",
//           headers: {
//             "Content-Type": "application/json",
//             "Authorization": `Bearer ${localStorage.getItem("jwtToken")}`,
//           },
//           body: JSON.stringify({
//             Id: leaveId,
//             approverEmail: email,
//             status: "approved",
//           }),
//         }
//       );

//       if (!approveResponse.ok) {
//         throw new Error("Network response was not ok");
//       }


//       const approveResult = await approveResponse.json();

//       if (approveResponse.ok) {
//         alert(`Leave approved for ${email}`);
//         const approvedLeave = pendingLeaves.find((leave) => leave.Id === leaveId);
//         setPendingLeaves((prev) => prev.filter((leave) => leave.Id !== leaveId));
//         setApprovedLeaves((prev) => [...prev, approvedLeave]);
//       } else {
//         alert("Approval failed. Please try again.");
//       }
//     } catch (error) {
//       alert("Something went wrong.");
//     }
//   };

//   const fetchLeaveBalance = async () => {
//     setLoadingBalance(true);
//     setBalanceError("");
//     setLeaveBalance([]);

//     try {
//       const response = await fetch("https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employmentLeavePolicy");
//       const result = await response.json();

//       if (result.success && result.data[searchEmail]) {
//         setLeaveBalance(result.data[searchEmail].leaveRecords);
//       } else {
//         setBalanceError("No leave balance data found for this email.");
//       }
//     } catch (error) {
//       setBalanceError("Error fetching leave balance data.");
//     }

//     setLoadingBalance(false);
//   };

//   const fetchLeaveHistory = async () => {
//     try {
//       const response = await fetch("https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/leave-records");
//       const data = await response.json();

//       const history = [];

//       Object.keys(data).forEach((email) => {
//         const userLeaves = data[email];

//         const allRecords = [
//           ...(userLeaves.pending || []).map((r) => ({ email, status: "Pending", ...r })),
//           ...(userLeaves.approved || []).map((r) => ({ email, status: "Approved", ...r })),
//           ...(userLeaves.rejected || []).map((r) => ({ email, status: "Rejected", ...r })),
//         ];

//         history.push(...allRecords);
//       });

//       setLeaveHistory(history);
//       setFilteredLeaveHistory(history); // Initially, no filtering
//     } catch (error) {
//       console.error("Error fetching leave history:", error);
//     }
//   };

//   useEffect(() => {
//     if (selectedTab === "history") {
//       fetchLeaveHistory();
//     }
//   }, [selectedTab]);

//   // Filter leave history based on selected email
//   const filterLeaveHistoryByEmail = (email) => {
//     if (email) {
//       const filteredHistory = leaveHistory.filter((record) => record.email === email);
//       setFilteredLeaveHistory(filteredHistory);
//     } else {
//       setFilteredLeaveHistory(leaveHistory); // Reset to all records when no email is selected
//     }
//   };

//   useEffect(() => {
//     filterLeaveHistoryByEmail(searchEmail);
//   }, [searchEmail, leaveHistory]);

//   return (
//     <div className="leave-container">
//       <h1>Leave Management</h1>

//       <div className="tabs">
//         <button
//           className={`tab-button ${selectedTab === "pending" ? "active-tab" : ""}`}
//           onClick={() => setSelectedTab("pending")}
//         >
//           Pending Leaves
//         </button>
//         <button
//           className={`tab-button ${selectedTab === "approved" ? "active-tab" : ""}`}
//           onClick={() => setSelectedTab("approved")}
//         >
//           Approved Leaves
//         </button>
//         <button
//           className={`tab-button ${selectedTab === "balance" ? "active-tab" : ""}`}
//           onClick={() => setSelectedTab("balance")}
//         >
//           Leave Balance
//         </button>
//         <button
//           className={`tab-button ${selectedTab === "history" ? "active-tab" : ""}`}
//           onClick={() => setSelectedTab("history")}
//         >
//           Leave History
//         </button>
//       </div>

//       {selectedTab === "pending" && (
//         <div>
//           {pendingLeaves.length === 0 ? (
//             <p>No pending leaves found.</p>
//           ) : (
//             <table>
//               <thead>
//                 <tr>
//                   <th>ID</th>
//                   <th>Email</th>
//                   <th>Leave Type</th>
//                   <th>From</th>
//                   <th>To</th>
//                   <th>Duration</th>
//                   <th>Type</th>
//                   <th>Reason</th>
//                   <th>Action</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {pendingLeaves.map((leave, index) => (
//                   <tr key={index}>
//                     <td>{leave.Id}</td>
//                     <td>{leave.email}</td>
//                     <td>{leave.leaveType}</td>
//                     <td>{leave.startDate}</td>
//                     <td>{leave.endDate}</td>
//                     <td>{leave.leaveDuration}</td>
//                     <td>{leave.durationType}</td>
//                     <td>{leave.reasonForLeave}</td>
//                     <td>
//                       <button className="approve-button" onClick={() => handleApprove(leave.Id)}>
//                         Approve
//                       </button>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>
//       )}

//       {selectedTab === "approved" && (
//         <div>
//           {approvedLeaves.length === 0 ? (
//             <p>No approved leaves found.</p>
//           ) : (
//             <table>
//               <thead>
//                 <tr>
//                   <th>ID</th>
//                   <th>Email</th>
//                   <th>Leave Type</th>
//                   <th>From</th>
//                   <th>To</th>
//                   <th>Duration</th>
//                   <th>Type</th>
//                   <th>Reason</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {approvedLeaves.map((leave, index) => (
//                   <tr key={index}>
//                     <td>{leave.Id}</td>
//                     <td>{leave.email}</td>
//                     <td>{leave.leaveType}</td>
//                     <td>{leave.startDate}</td>
//                     <td>{leave.endDate}</td>
//                     <td>{leave.leaveDuration}</td>
//                     <td>{leave.durationType}</td>
//                     <td>{leave.reasonForLeave}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>
//       )}

//       {selectedTab === "balance" && (
//         <div>
//           <div style={{ marginBottom: "15px", display: "flex", gap: "10px", alignItems: "center" }}>
//             {/* <select
//               value={searchEmail}
//               onChange={(e) => setSearchEmail(e.target.value)}
//               style={{ padding: "8px", width: "300px", fontSize: "14px" }}
//             >
//               <option value="">-- Select Email --</option>
//               {allEmails.map((email, index) => (
//                 <option key={index} value={email}>
//                   {email}
//                 </option>
//               ))}
//             </select> */}
//             <Autocomplete
//               options={allEmails}
//               value={searchEmail}
//               onChange={(event, newValue) => {
//                 setSearchEmail(newValue || "");
//               }}
//               renderInput={(params) => (
//                 <TextField {...params} label="Select Email" size="small" />
//               )}
//               freeSolo
//               sx={{ minWidth: 300 }}
//             />
//             <button
//               className="filter-btn"
//               onClick={fetchLeaveBalance}
//               disabled={loadingBalance || !searchEmail}
//             >
//               {loadingBalance ? "Loading..." : "View Balance"}
//             </button>
//           </div>

//           {balanceError && <p style={{ color: "red" }}>{balanceError}</p>}

//           {leaveBalance.length > 0 && (
//             <table>
//               <thead>
//                 <tr>
//                   <th>Leave Type</th>
//                   <th>Leaves Used</th>
//                   <th>Pending Leaves</th>
//                   <th>Total Allotted</th>
//                   <th>Balance</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {leaveBalance.map((record, index) => (
//                   <tr key={index}>
//                     <td>{record.leaveType}</td>
//                     <td>{record.usedLeaves}</td>
//                     <td>{record.pendingLeaves}</td>
//                     <td>{record.totalLeavesAllotted}</td>
//                     <td>{record.leaveLeft}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>
//       )}

//       {selectedTab === "history" && (
//         <div>
//           <div 
//           style={{ marginBottom: "15px", display: "flex", gap: "10px", alignItems: "center" }}>
//            {/* <select
//               value={searchEmail}
//               onChange={(e) => setSearchEmail(e.target.value)}
//               style={{ padding: "8px", width: "300px", fontSize: "14px" }}
//             >
//               <option value="">-- Select Email --</option>
//               {allEmails.map((email, index) => (
//                 <option key={index} value={email}>
//                   {email}
//                 </option>
//               ))}
//             </select> */}
//             <Autocomplete
//               options={allEmails}
//               value={searchEmail}
//               onChange={(event, newValue) => {
//                 setSearchEmail(newValue || "");
//               }}
//               renderInput={(params) => (
//                 <TextField
//                   {...params}
//                   label="Select Email"
//                   size="small"
//                   sx={{ fontSize: "14px" }}
//                 />
//               )}
//               freeSolo
//               sx={{ minWidth: 300 }}
//             />
//           </div>

//           {filteredLeaveHistory.length === 0 ? (
//             <p>No leave history found.</p>
//           ) : (
//             <table>
//               <thead>
//                 <tr>
//                   <th>ID</th>
//                   <th>Email</th>
//                   <th>Leave Type</th>
//                   <th>From</th>
//                   <th>To</th>
//                   <th>Duration</th>
//                   <th>Type</th>
//                   <th>Reason</th>
//                   <th>Status</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredLeaveHistory.map((leave, index) => (
//                   <tr key={index}>
//                     <td>{leave.Id}</td>
//                     <td>{leave.email}</td>
//                     <td>{leave.leaveType}</td>
//                     <td>{leave.startDate}</td>
//                     <td>{leave.endDate}</td>
//                     <td>{leave.leaveDuration}</td>
//                     <td>{leave.durationType}</td>
//                     <td>{leave.reasonForLeave}</td>
//                     <td>{leave.status}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>
//       )}
//     </div>
//   );
// };

// export default LeaveManagement;




import React, { useEffect, useState, useContext } from "react";
import "./LeaveManagement.css";
import { LoginContext } from "../context/LoginContext";
import { Snackbar, Alert, TextField, Autocomplete } from "@mui/material";

const LeaveManagement = () => {
  const dataContext = useContext(LoginContext);
  const { email } = dataContext;
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const [selectedTab, setSelectedTab] = useState("pending");
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState("");
  const [allEmails, setAllEmails] = useState([]);
  const [filteredLeaveHistory, setFilteredLeaveHistory] = useState([]);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  useEffect(() => {
    fetch(
      "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/leave-records?status=pending&limit=100&page=1"
    )
      .then((res) => res.json())
      .then((data) => {
        const pending = [];
        const approved = [];
        const emails = [];

        Object.keys(data).forEach((email) => {
          emails.push(email);
          const userLeaves = data[email];

          userLeaves?.pending?.forEach((record) =>
            pending.push({ email, ...record })
          );

          userLeaves?.approved?.forEach((record) =>
            approved.push({ email, ...record })
          );
        });

        setPendingLeaves(pending);
        setApprovedLeaves(approved);
        setAllEmails(emails);
      })
      .catch((err) => console.error("Failed to fetch data", err));
  }, []);

  const handleApprove = async (leaveId) => {
    try {
      const approveResponse = await fetch(
        "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employmentLeavePolicy",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
          },
          body: JSON.stringify({
            Id: leaveId,
            approverEmail: email,
            status: "approved",
          }),
        }
      );

      if (!approveResponse.ok) {
        throw new Error("Network response was not ok");
      }

      const approveResult = await approveResponse.json();

    //   if (approveResponse.ok) {
    //     alert(`Leave approved for ${email}`);
    //     const approvedLeave = pendingLeaves.find(
    //       (leave) => leave.Id === leaveId
    //     );
    //     setPendingLeaves((prev) =>
    //       prev.filter((leave) => leave.Id !== leaveId)
    //     );
    //     setApprovedLeaves((prev) => [...prev, approvedLeave]);
    //   } else {
    //     alert("Approval failed. Please try again.");
    //   }
    // } catch (error) {
    //   alert("Something went wrong.");
    // }
    if (approveResponse.ok) {
      const approvedLeave = pendingLeaves.find((leave) => leave.Id === leaveId);
      setPendingLeaves((prev) => prev.filter((leave) => leave.Id !== leaveId));
      setApprovedLeaves((prev) => [...prev, approvedLeave]);
      
      setSnackbarMessage(`Leave approved for ${email}`);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } else {
      setSnackbarMessage("Approval failed. Please try again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }

  } catch (error) {
    setSnackbarMessage("Something went wrong.");
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
  }
  };

  const fetchLeaveBalance = async () => {
    setLoadingBalance(true);
    setBalanceError("");
    setLeaveBalance([]);

    try {
      const response = await fetch(
        "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employmentLeavePolicy"
      );
      const result = await response.json();

      if (result.success && result.data[searchEmail]) {
        setLeaveBalance(result.data[searchEmail].leaveRecords);
      } else {
        setBalanceError("No leave balance data found for this email.");
      }
    } catch (error) {
      setBalanceError("Error fetching leave balance data.");
    }

    setLoadingBalance(false);
  };

  const fetchLeaveHistory = async () => {
    try {
      const response = await fetch(
        "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/leave-records?limit=100&page=1"
      );
      const data = await response.json();

      const history = [];

      Object.keys(data).forEach((email) => {
        const userLeaves = data[email];

        const allRecords = [
          ...(userLeaves.pending || []).map((r) => ({
            email,
            status: "Pending",
            ...r,
          })),
          ...(userLeaves.approved || []).map((r) => ({
            email,
            status: "Approved",
            ...r,
          })),
          ...(userLeaves.rejected || []).map((r) => ({
            email,
            status: "Rejected",
            ...r,
          })),
        ];

        history.push(...allRecords);
      });

      setLeaveHistory(history);
      setFilteredLeaveHistory(history); // Initially, no filtering
    } catch (error) {
      console.error("Error fetching leave history:", error);
    }
  };

  useEffect(() => {
    if (selectedTab === "history") {
      fetchLeaveHistory();
    }
  }, [selectedTab]);

  // Filter leave history based on selected email
  const filterLeaveHistoryByEmail = (email) => {
    if (email) {
      const filteredHistory = leaveHistory.filter(
        (record) => record.email === email
      );
      setFilteredLeaveHistory(filteredHistory);
    } else {
      setFilteredLeaveHistory(leaveHistory); // Reset to all records when no email is selected
    }
  };

  useEffect(() => {
    filterLeaveHistoryByEmail(searchEmail);
  }, [searchEmail, leaveHistory]);

  return (
    <div className="leave-container">
      <h1>Leave Management</h1>

      <div className="tabs">
        <button
          className={`tab-button ${
            selectedTab === "pending" ? "active-tab" : ""
          }`}
          onClick={() => setSelectedTab("pending")}
        >
          Pending Leaves
        </button>
        <button
          className={`tab-button ${
            selectedTab === "approved" ? "active-tab" : ""
          }`}
          onClick={() => setSelectedTab("approved")}
        >
          Approved Leaves
        </button>
        <button
          className={`tab-button ${
            selectedTab === "balance" ? "active-tab" : ""
          }`}
          onClick={() => setSelectedTab("balance")}
        >
          Leave Balance
        </button>
        <button
          className={`tab-button ${
            selectedTab === "history" ? "active-tab" : ""
          }`}
          onClick={() => setSelectedTab("history")}
        >
          Leave History
        </button>
      </div>

      {selectedTab === "pending" && (
        <div>
          {pendingLeaves.length === 0 ? (
            <p>No pending leaves found.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Leave Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Duration</th>
                  <th>Type</th>
                  <th>Reason</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingLeaves.map((leave, index) => (
                  <tr key={index}>
                    <td>{leave.Id}</td>
                    <td>{leave.email}</td>
                    <td>{leave.leaveType}</td>
                    <td>{leave.startDate}</td>
                    <td>{leave.endDate}</td>
                    <td>{leave.leaveDuration}</td>
                    <td>{leave.durationType}</td>
                    <td>{leave.reasonForLeave}</td>
                    <td>
                      <button
                        className="approve-button"
                        onClick={() => handleApprove(leave.Id)}
                      >
                        Approve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedTab === "approved" && (
        <div>
          {approvedLeaves.length === 0 ? (
            <p>No approved leaves found.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Leave Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Duration</th>
                  <th>Type</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {approvedLeaves.map((leave, index) => (
                  <tr key={index}>
                    <td>{leave.Id}</td>
                    <td>{leave.email}</td>
                    <td>{leave.leaveType}</td>
                    <td>{leave.startDate}</td>
                    <td>{leave.endDate}</td>
                    <td>{leave.leaveDuration}</td>
                    <td>{leave.durationType}</td>
                    <td>{leave.reasonForLeave}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedTab === "balance" && (
        <div>
          <div
            style={{
              marginBottom: "15px",
              display: "flex",
              gap: "10px",
              alignItems: "center",
            }}
          >
            <select
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              style={{ padding: "8px", width: "300px", fontSize: "14px" }}
            >
              <option value="">-- Select Email --</option>
              {allEmails.map((email, index) => (
                <option key={index} value={email}>
                  {email}
                </option>
              ))}
            </select>
            <button
              className="filter-btn"
              onClick={fetchLeaveBalance}
              disabled={loadingBalance || !searchEmail}
            >
              {loadingBalance ? "Loading..." : "View Balance"}
            </button>
          </div>

          {balanceError && <p style={{ color: "red" }}>{balanceError}</p>}

          {leaveBalance.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Leaves Used</th>
                  <th>Pending Leaves</th>
                  <th>Total Allotted</th>
                  <th>Balance</th>
                </tr>
              </thead>
              <tbody>
                {leaveBalance.map((record, index) => (
                  <tr key={index}>
                    <td>{record.leaveType}</td>
                    <td>{record.usedLeaves}</td>
                    <td>{record.pendingLeaves}</td>
                    <td>{record.totalLeavesAllotted}</td>
                    <td>{record.leaveLeft}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {selectedTab === "history" && (
        <div>
          <div
            style={{
              marginBottom: "15px",
              display: "flex",
              gap: "10px",
              alignItems: "center",
            }}
          >
            {/* <select
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              style={{ padding: "8px", width: "300px", fontSize: "14px" }}
            >
              <option value="">-- Select Email --</option>
              {allEmails.map((email, index) => (
                <option key={index} value={email}>
                  {email}
                </option>
              ))}
            </select> */}
            <Autocomplete
              options={allEmails}
              value={searchEmail}
              onChange={(event, newValue) => {
                setSearchEmail(newValue || "");
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Filter by Email"
                  size="small"
                  sx={{ fontSize: "14px" }}
                />
              )}
              freeSolo
              sx={{ minWidth: 300 }}
            />
          </div>

          {filteredLeaveHistory.length === 0 ? (
            <p>No leave history found.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Email</th>
                  <th>Leave Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Duration</th>
                  <th>Type</th>
                  <th>Reason</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaveHistory.map((leave, index) => (
                  <tr key={index}>
                    <td>{leave.Id}</td>
                    <td>{leave.email}</td>
                    <td>{leave.leaveType}</td>
                    <td>{leave.startDate}</td>
                    <td>{leave.endDate}</td>
                    <td>{leave.leaveDuration}</td>
                    <td>{leave.durationType}</td>
                    <td>{leave.reasonForLeave}</td>
                    <td>{leave.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{
            width: "100%",
            backgroundColor:
              snackbarSeverity === "success" ? "#4CAF50" : "f44336",
            color: "white",
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default LeaveManagement;