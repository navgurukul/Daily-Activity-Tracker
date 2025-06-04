// Leaves.jsx
import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { LoginContext } from "../context/LoginContext";
import { useLoader } from "../context/LoadingContext";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Button,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  FormControlLabel,
  Tooltip,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { styled } from "@mui/material/styles";

// Styled Components
const StyledContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(3),
  maxWidth: "100% !important",
  margin: 0,
  overflowX: "hidden",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },
  [theme.breakpoints.up("md")]: {
    marginLeft: theme.spacing(9),
    maxWidth: "93% !important",
  },
  "& .MuiPaper-root": {
    width: "100%",
    maxWidth: "100%",
    overflow: "hidden",
  },
}));

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  margin: theme.spacing(2, 0),
  borderRadius: "16px",
  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
  background: "#ffffff",
  width: "100%",
  maxWidth: "100%",
  overflow: "hidden",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
    margin: theme.spacing(1, 0),
    borderRadius: "12px",
  },
  "& form": {
    width: "100%",
    maxWidth: "100%",
  },
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  width: "100%",
  "& .MuiInputBase-root": {
    borderRadius: "8px",
    backgroundColor: "#f8f9fa",
    transition: "all 0.2s ease-in-out",
    height: "56px",
    padding: "0 14px",
    "&:hover": {
      backgroundColor: "#fff",
      boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
    },
    "&.Mui-focused": {
      backgroundColor: "#fff",
      boxShadow: "0 0 0 2px rgba(37, 99, 235, 0.2)",
    },
  },
  '& .MuiInputBase-root.MuiOutlinedInput-root[type="date"]': {
    height: "56px",
  },
  "& .MuiSelect-select": {
    height: "24px",
    display: "flex",
    alignItems: "center",
  },
  "& .MuiInputBase-multiline": {
    height: "auto",
    padding: "14px",
  },
  "& .MuiInputLabel-root": {
    fontSize: "0.95rem",
    color: "#6b7280",
    marginBottom: theme.spacing(0.5),
  },
  "& .MuiOutlinedInput-root": {
    "& fieldset": {
      borderColor: "#e5e7eb",
    },
    "&:hover fieldset": {
      borderColor: "#d1d5db",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#2563eb",
    },
  },
}));

const Leaves = () => {
  const dataContext = useContext(LoginContext);
  const { email } = dataContext;
  const userName = localStorage.getItem("name");
  const { loading, setLoading } = useLoader();
  const navigate = useNavigate();
  const [leaveResult, setLeaveResult] = useState();
  const [isAccordionOpen, setIsAccordionOpen] = useState(true);
  const [leaveData, setLeaveData] = useState({
    "leaveType": "",
    "reasonForLeave": "",
    "startDate": getTodayDate(),
    "endDate": getTodayDate(),
    "userEmail": email,
    "durationType": "",
    "halfDayStatus": "",
    "status": "pending",  
  });
  const [remainingLeaves, setRemainingLeaves] = useState();
  const [halfDay, setHalfDay] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [availableLeaveTypes, setAvailableLeaveTypes] = useState();

  const [leavesData, setLeavesData] = useState([]);
  const [allLeaves, setAllLeaves] = useState({});

  const fetchData = async () => {
    try {
      const response = await fetch(
        `https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employmentLeavePolicy?email=${email}`
      );
      const data = await response.json();
      console.log("Data:", data);
      if (data.success) {
        setAllLeaves(data.data);
      }
    } catch (error) {
      console.error("Error fetching leave data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (allLeaves[0] && allLeaves[0].leaveRecords) {
      setLeavesData(allLeaves[0].leaveRecords);
    } else {
      setLeavesData([]);
    }
  }, [email, allLeaves]);

  function getTodayDate() {
    const today = new Date();
    return today.toISOString().split("T")[0];
  }

  useEffect(() => {
    if (!email) {
      navigate("/");
    } else {
      fetchAvailableLeaveTypes().then((types) => {
        setAvailableLeaveTypes(types);
      });
    }
  }, [email, navigate]);

  const fetchAvailableLeaveTypes = async () => {
    try {
      const response = await fetch(
        `https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employeeSheetRecords?sheet=leaveTypes`
      );
      const result = await response.json();
      setLeaveResult(result.leaveTypes);
    } catch (error) {
      console.error("Error fetching leave types:", error);
      return [];
    }
  };

  const handleChange = (e) => {
    setErrorMessage("");
    const { name, value } = e.target;
    setLeaveData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    setRemainingLeaves(
      allLeaves[email]?.leaveRecords?.find((leave) => leave.leaveType === value)
        ?.leaveLeft
    );
    console.log("Leave Data:", leaveData);
  };

  const handleHalfDayChange = (e) => {
    setHalfDay(e.target.checked);
  };

  const calculateNumberOfDays = (fromDate, toDate, halfDay) => {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    let totalDays = 0;
    let currentDate = new Date(from);

    while (currentDate <= to) {
      const dayOfWeek = currentDate.getDay();
      const dateOfMonth = currentDate.getDate();
      const isSecondSaturday =
        dayOfWeek === 6 && dateOfMonth >= 8 && dateOfMonth <= 14;
      const isFourthSaturday =
        dayOfWeek === 6 && dateOfMonth >= 22 && dateOfMonth <= 28;

      if (dayOfWeek !== 0 && !isSecondSaturday && !isFourthSaturday) {
        totalDays++;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (halfDay && totalDays > 0) {
      totalDays -= 0.5;
    }

    return totalDays;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    // Check for missing fields
    if (
      !leaveData.leaveType ||
      !leaveData.reasonForLeave ||
      !leaveData.startDate ||
      !leaveData.endDate ||
      !leaveData.userEmail
    ) {
      setErrorMessage("All fields are required.");
      setLoading(false);
      return;
    }
  
    // Validate reasonForLeave character length
    // if (leaveData.reasonForLeave.trim().length < 25) {
    //   setError("Reason for leave must be at least 25 characters long.");
    //   setLoading(false);
    //   return;
    // }
  
    const payload = { ...leaveData };
    if (payload.durationType !== "half-day") {
      delete payload.halfDayStatus;
    }
    try {
      const response = await fetch(
        "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employmentLeavePolicy",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
    
      if (!response.ok) {
        const errorData = await response.json();
        setErrorMessage(errorData.message || "Something went wrong.");
        setLoading(false);
        return;
      }
    
      setLoading(false);
      setErrorMessage(""); // Clear error message
      setSuccessMessage("Leave request submitted successfully!");
      setLeaveData({
        endDate: getTodayDate(),
        durationType: "",
        halfDayStatus: "",
        leaveType: "",
        reasonForLeave: "",
        startDate: getTodayDate(),
        status: "pending",
        userEmail: email,
      });
    } catch (error) {
      console.error("Error submitting leave request:", error);
      setErrorMessage("Error submitting leave request.");
      setLoading(false);
    }
  };
  
  return (
    <StyledContainer style={{ overflowY: "scroll", height: "100vh" }}>
      {loading && (
        <Box
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            zIndex: 9999,
          }}
        >
          <CircularProgress />
        </Box>
      )}

      <Typography
        variant="h4"
        component="h1"
        align="center"
        sx={{
          mb: 1,
          fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2.25rem" },
          fontWeight: 600,
          color: "#1e293b",
          letterSpacing: "-0.02em",
          padding: { xs: "0 16px", sm: 0 },
        }}
      >
        Leave Application Form
      </Typography>

      <Typography
        variant="subtitle1"
        align="center"
        sx={{
          mb: { xs: 2, sm: 4 },
          color: "#64748b",
          fontSize: { xs: "0.875rem", sm: "1rem" },
          padding: { xs: "0 16px", sm: 0 },
        }}
      >
        Make sure to check the leave balance before applying
      </Typography>

      <Accordion
        expanded={isAccordionOpen}
        onChange={() => setIsAccordionOpen(!isAccordionOpen)}
        sx={{
          mb: 4,
          borderRadius: "12px !important",
          "&:before": {
            display: "none",
          },
          boxShadow:
            "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            backgroundColor: "#f8fafc",
            borderRadius: "12px",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Allocated Leaves
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {leaveResult && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Leave Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Alloted</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Balance</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Booked</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Pending</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leavesData.length > 0 ? (
                    leavesData.map((leave, index) => (
                      <tr key={index}>
                        <td>{leave.leaveType}</td>
                        <td>{leave.totalLeavesAllotted}</td>
                        <td>{leave.leaveLeft}</td>
                        <td>{leave.usedLeaves}</td>
                        <td>{leave.pendingLeaves}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" style={{ textAlign: "center" }}>
                        No data available for this email
                      </td>
                    </tr>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </AccordionDetails>
      </Accordion>

      <StyledPaper>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <StyledFormControl>
                <TextField
                  label="Employee Email"
                  name="email"
                  value={leaveData.userEmail}
                  onChange={handleChange}
                  disabled
                  fullWidth
                />
              </StyledFormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <StyledFormControl>
                <TextField
                  label="Employee Name"
                  name="name"
                  value={userName}
                  onChange={handleChange}
                  disabled
                  fullWidth
                />
              </StyledFormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <StyledFormControl>
                <InputLabel>Leave Type</InputLabel>
                <Select
                  name="leaveType"
                  value={leaveData.leaveType}
                  onChange={handleChange}
                  required
                  label="Leave Type"
                >
                  <MenuItem value="">--Select Leave Type--</MenuItem>
                  {Array.isArray(leaveResult) &&
                    leaveResult.map((leaveType, index) => (
                      <MenuItem key={index} value={leaveType}>
                        {leaveType}
                      </MenuItem>
                    ))}

                  {/* Only show Casual Leave, Wellness Leave, Festival Leave
                  and Comp-off, if Comp-Off balance > 0 */}
                  {/* {Array.isArray(leaveResult) &&
                    leaveResult.map((leaveType, index) => {
                      if (
                        leaveType === "Compensatory Leave" &&
                        allLeaves[email]?.leaveRecords?.find(
                          (leave) => leave.leaveType === leaveType
                        )?.leaveLeft > 0
                      ) {
                        return (
                          <MenuItem key={index} value={leaveType}>
                            {leaveType}
                          </MenuItem>
                        );
                      } else if (
                        leaveType === "Casual Leave" ||
                        leaveType === "Wellness Leave" ||
                        leaveType === "Festival Leave"
                      ) {
                        return (
                          <MenuItem key={index} value={leaveType}>
                            {leaveType}
                          </MenuItem>
                        );
                      }
                      return null;
                    })} */}
                </Select>
                {leaveData.leaveType && (
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 1,
                      display: "block",
                      color: "#2563eb",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                    }}
                  >
                    You have {remainingLeaves} leaves available in this category
                  </Typography>
                )}
              </StyledFormControl>
            </Grid>

            <Grid item xs={12}>
              <StyledFormControl>
                <TextField
                  label="Reason for Leave"
                  name="reasonForLeave"
                  value={leaveData.reasonForLeave}
                  onChange={handleChange}
                  required
                  multiline
                  rows={4}
                  sx={{
                    "& .MuiInputBase-root": {
                      height: "auto !important",
                      padding: "14px !important",
                    },
                  }}
                />
              </StyledFormControl>
            </Grid>

            {leaveData.leaveType &&
              ![
                "Casual Leave",
                "Wellness Leave",
                "Festival Leave",
                "Compensatory Leave",
              ].includes(leaveData.leaveType) &&
              leaveData.reasonForLeave?.length < 25 && (
                <Grid item xs={12}>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#ef4444",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      mt: -2,
                      mb: 2,
                      ml: 1,
                      textAlign: "left",
                    }}
                  >
                    Please provide a reason with at least 25 characters.
                  </Typography>
                </Grid>
              )}
            <Grid item xs={12} md={6}>
              <StyledFormControl>
                <TextField
                  label="Start Date"
                  type="date"
                  name="startDate"
                  value={leaveData.startDate}
                  onChange={handleChange}
                  required
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    "& .MuiInputBase-root": {
                      display: "flex",
                      alignItems: "center",
                    },
                    "& .MuiInputBase-input": {
                      height: "24px",
                    },
                  }}
                />
              </StyledFormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <StyledFormControl>
                <TextField
                  label="End Date"
                  type="date"
                  name="endDate"
                  value={leaveData.endDate}
                  onChange={handleChange}
                  required
                  InputLabelProps={{ shrink: true }}
                  sx={{
                    "& .MuiInputBase-root": {
                      display: "flex",
                      alignItems: "center",
                    },
                    "& .MuiInputBase-input": {
                      height: "24px",
                    },
                  }}
                />
              </StyledFormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <StyledFormControl>
                <InputLabel>Duration Type</InputLabel>
                <Select
                  name="durationType"
                  value={leaveData.durationType}
                  onChange={handleChange}
                  required
                  label="Duration Type"
                >
                  <MenuItem value="full-day">Full Day</MenuItem>
                  <MenuItem value="half-day">Half Day</MenuItem>
                </Select>
                <Typography
                  variant="caption"
                  sx={{
                    mt: 1,
                    display: "block",
                    color: "#6b7280",
                    fontSize: "0.875rem",
                  }}
                >
                  Select the duration of your leave
                </Typography>
              </StyledFormControl>
            </Grid>

            {leaveData.durationType === "half-day" && (
              <Grid item xs={12} md={6}>
                <StyledFormControl>
                  <InputLabel>Half Day Status</InputLabel>
                  <Select
                    name="halfDayStatus"
                    value={leaveData.halfDayStatus}
                    onChange={handleChange}
                    label="Half Day Status"
                  >
                    <MenuItem value="first-half">First Half</MenuItem>
                    <MenuItem value="second-half">Second Half</MenuItem>
                  </Select>
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 1,
                      display: "block",
                      color: "#6b7280",
                      fontSize: "0.875rem",
                    }}
                  >
                    Select it for availing half day
                  </Typography>
                </StyledFormControl>
              </Grid>
            )}

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={loading}
                sx={{
                  mt: 2,
                  height: "48px",
                  borderRadius: "8px",
                  textTransform: "none",
                  fontSize: "1rem",
                  fontWeight: 600,
                  backgroundColor: "#2563eb",
                  "&:hover": {
                    backgroundColor: "#1d4ed8",
                  },
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                }}
              >
                Submit
              </Button>
            </Grid>
          </Grid>
        </form>
      </StyledPaper>

      {errorMessage && (
        <Snackbar
          open={Boolean(errorMessage)}
          autoHideDuration={6000}
          onClose={() => setErrorMessage("")}
        >
          <Alert
            onClose={() => setErrorMessage("")}
            severity="error"
            variant="filled"
            sx={{ width: "100%" }}
          >
            {errorMessage}
          </Alert>
        </Snackbar>
      )}

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage("")}
      >
        <Alert
          onClose={() => setSuccessMessage("")}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </StyledContainer>
  );
};

export default Leaves;
