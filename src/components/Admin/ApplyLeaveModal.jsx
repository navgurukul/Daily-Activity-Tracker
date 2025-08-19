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
  Autocomplete,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { styled } from "@mui/material/styles";

import LoadingSpinner from "../Loader/LoadingSpinner";
import axios from "axios";


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
    maxWidth: "91% !important",
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

const ApplyLeaveModal = () => {
  const dataContext = useContext(LoginContext);
  const { email } = dataContext;
  const userName = localStorage.getItem("name");
  const department = localStorage.getItem("department");
  const { loading, setLoading } = useLoader();
  const navigate = useNavigate();
  const [leaveResult, setLeaveResult] = useState();
  const [isAccordionOpen, setIsAccordionOpen] = useState(true);
  const [leaveData, setLeaveData] = useState({
    "leaveType": "",
    "reasonForLeave": "",
    "startDate": getTodayDate(),
    "endDate": getTodayDate(),
    "userEmail": "",
    // "name": userName,
    "durationType": "",
    "halfDayStatus": "",
    "status": "pending",
    "leaveRaisedByAdmin": true,
    "leaveRaisedByAdminEmail": email,
    // "department": department,
  });
  const [remainingLeaves, setRemainingLeaves] = useState();
  const [halfDay, setHalfDay] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [availableLeaveTypes, setAvailableLeaveTypes] = useState();

  const [leavesData, setLeavesData] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);

  const [allEmails, setAllEmails] = useState([]);
  const [leavesLoading, setLeavesLoading] = useState(false);


  const [fieldErrors, setFieldErrors] = useState({
    leaveType: "",
    reasonForLeave: "",
    durationType: "",
    halfDayStatus: "",
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;



  useEffect(() => {
    const fetchData = async () => {
      if (!leaveData.userEmail) {
        setAllEmails([]);
        return;
      }
      setLeavesLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/employmentLeavePolicy?email=${leaveData.userEmail}`
        );
        const data = await response.json();
        // console.log("Data:", data);
        if (data.success && Array.isArray(data.data)) {
          setAllLeaves(data.data);
        } else {
          setAllLeaves([]);
        }
      } catch (error) {
        console.error("Error fetching leave data:", error);
        setAllLeaves([]);
      } finally {
        setLeavesLoading(false);
      }
    };
    fetchData();
  }, [leaveData.userEmail]);

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

  useEffect(() => {
    const fetchEmails = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/employeeSheetRecords?sheet=pncdata`
        );
        const teamIDs = Array.from(
          new Set(
            response.data?.data
              ?.map((entry) => entry["Team ID"])
              ?.filter((id) => !!id)
          )
        );
        setAllEmails(teamIDs);
      } catch (error) {
        console.error("Error fetching emails:", error);
        setSnackbarMessage("Failed to fetch emails");
      }
    };
    fetchEmails();
  }, []);

  const fetchAvailableLeaveTypes = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/employeeSheetRecords?sheet=leaveTypes`
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

    const keyToUpdate = name === "email" ? "userEmail" : name;

    setLeaveData((prevData) => ({
      ...prevData,
      [keyToUpdate]: value,
    }));

    if (value) {
      setFieldErrors((prevErrors) => ({
        ...prevErrors,
        [name]: "",
      }));
    }
  };

  useEffect(() => {
    const email = leaveData.userEmail;
    const type = leaveData.leaveType;
    if (type && allLeaves[0]) {
      const userData = allLeaves.find((user) => user.userEmail === email);
      const matchedLeave = allLeaves[0]?.leaveRecords?.find(
        (leave) => leave.leaveType?.toLowerCase() === type.toLowerCase()
      );
      setRemainingLeaves(matchedLeave?.leaveLeft ?? 0);
    } else {
      setRemainingLeaves(0);
    }

  }, [leaveData.leaveType, allLeaves]);

  // NEW: Half-day date synchronization useEffect
  useEffect(() => {
    // Only sync dates when durationType is "half-day"
    if (leaveData.durationType === "half-day") {
      // Auto-set end date to match start date for half-day leaves
      if (leaveData.startDate && leaveData.startDate !== leaveData.endDate) {
        setLeaveData(prevData => ({
          ...prevData,
          endDate: prevData.startDate
        }));
      }
    }
    // For "full-day" or empty durationType, do nothing - allow independent date selection
  }, [leaveData.durationType, leaveData.startDate]);

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

    // 1️⃣ Reset errors
    const errors = {
      leaveType: "",
      reasonForLeave: "",
      durationType: "",
      halfDayStatus: "",
    };

    // 2️⃣ Validate each field
    if (!leaveData.leaveType) {
      errors.leaveType = "Please select a leave type*";
    }

    if (!leaveData.reasonForLeave.trim()) {
      errors.reasonForLeave = "Please enter a reason for leave*";
    } else if (
      !["Casual Leave", "Wellness Leave", "Festival Leave", "Compensatory Leave"]
        .includes(leaveData.leaveType) &&
      leaveData.reasonForLeave.trim().length < 25
    ) {
      errors.reasonForLeave = "Please provide a reason with at least 25 characters*";
    }

    if (!leaveData.durationType) {
      errors.durationType = "Please select a duration type*";
    }

    if (leaveData.durationType === "half-day" && !leaveData.halfDayStatus) {
      errors.halfDayStatus = "Please select a half day status*";
    }

    // 3️⃣ Apply errors to state
    setFieldErrors(errors);

    // 4️⃣ If any error found, stop here
    const hasError = Object.values(errors).some(Boolean);
    if (hasError) {
      setLoading(false);
      return;
    }

    // ✅ 5️⃣ Also check required non-error-tracked fields
    if (
      !leaveData.startDate ||
      !leaveData.endDate ||
      !leaveData.userEmail
    ) {
      setErrorMessage("All fields are required.");
      setLoading(false);
      return;
    }

    // 6️⃣ Submit to backend
    const payload = { ...leaveData };
    if (payload.durationType !== "half-day") {
      delete payload.halfDayStatus;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/employmentLeavePolicy`,
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

      // ✅ Success
      setSuccessMessage("Leave request submitted successfully!");
      setErrorMessage("");
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
    } finally {
      setLoading(false);
    }
  };


  return (
    <StyledContainer style={{ overflowY: "auto", maxHeight: "80vh", marginTop: "0", padding: "16px" }}>
      <LoadingSpinner loading={loading} />

      <Typography
        variant="h4"
        component="h1"
        align="center"
        sx={{
          mb: -1,
          fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2.00rem" },
          fontWeight: 600,
          color: "#1e293b",
          padding: { xs: "0 16px", sm: 0 },
        }}
      >
        Leave Application Form
      </Typography>


      <StyledPaper>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <StyledFormControl>
                <Autocomplete
                  options={allEmails}
                  value={leaveData.userEmail || ""}
                  onChange={(e, newValue) => setLeaveData((prev) => ({ ...prev, userEmail: newValue || "", }))}
                  onInputChange={(e, newInputValue) =>
                    setLeaveData((prev) => ({
                      ...prev,
                      userEmail: newInputValue || "",
                    }))
                  }
                  freeSolo
                  disableClearable
                  slotProps={{
                    paper: {
                      sx: {
                        '& ul': {
                          maxHeight: 250,
                          overflowY: 'auto',
                        },
                      },
                    },
                  }}

                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Employee Email"
                    // name="userEmail"
                    // fullWidth
                    // variant="outlined"
                    />
                  )}
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
                  label="Leave Type"
                  error={Boolean(fieldErrors.leaveType)}
                >
                  <MenuItem value="">--Select Leave Type--</MenuItem>
                  {Array.isArray(leaveResult) &&
                    leaveResult.map((leaveType, index) => (
                      <MenuItem key={index} value={leaveType}>
                        {leaveType}
                      </MenuItem>
                    ))}
                </Select>
                {fieldErrors.leaveType && (
                  <Typography variant="caption" sx={{ color: "red", fontSize: 14, fontWeight: 'bold', mt: -1 }}>
                    {fieldErrors.leaveType}
                  </Typography>
                )}
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
                  multiline
                  rows={4}
                  error={Boolean(fieldErrors.reasonForLeave)}
                  helperText={fieldErrors.reasonForLeave}
                  FormHelperTextProps={{
                    sx: {
                      color: "red !important",
                      fontSize: 14,
                      fontWeight: "bold",
                      m: 0,
                      mt: -1,
                    },
                  }}
                  InputLabelProps={{
                    sx: {
                      color: "rgba(0, 0, 0, 0.6)",
                      "&.Mui-focused": {
                        color: "primary.main",
                      },
                      "&.Mui-error": {
                        color: "rgba(0, 0, 0, 0.6)",
                      },
                      "&.Mui-focused.Mui-error": {
                        color: "primary.main",
                      },
                    },
                  }}
                  sx={{
                    "& .MuiInputBase-root": {
                      height: "auto !important",
                      padding: "14px !important",
                    },
                  }}
                />
              </StyledFormControl>
            </Grid>

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
                  disabled={leaveData.durationType === "half-day"}
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

            {leaveData.durationType === "half-day" && (
              <Grid item xs={12}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "red",
                    fontSize: "0.875rem",
                    // fontStyle: "italic",
                    display: "block",
                    textAlign: "center",
                    mt: -1
                  }}
                >
                  Half day leaves can only be applied for single day
                </Typography>
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <StyledFormControl>
                <InputLabel>Duration Type</InputLabel>
                <Select
                  name="durationType"
                  value={leaveData.durationType}
                  onChange={handleChange}
                  label="Duration Type"
                  error={Boolean(fieldErrors.durationType)}
                >
                  <MenuItem value="full-day">Full Day</MenuItem>
                  <MenuItem value="half-day">Half Day</MenuItem>
                </Select>
                {fieldErrors.durationType && (
                  <Typography variant="caption" sx={{ color: "red", fontSize: 14, fontWeight: 'bold', mt: -1 }}>
                    {fieldErrors.durationType}
                  </Typography>
                )}
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
                    error={Boolean(fieldErrors.halfDayStatus)}
                  >
                    <MenuItem value="first-half">First Half</MenuItem>
                    <MenuItem value="second-half">Second Half</MenuItem>
                  </Select>
                  {fieldErrors.halfDayStatus && (
                    <Typography variant="caption" sx={{ color: "red", fontSize: 14, fontWeight: 'bold', mt: -1 }}>
                      {fieldErrors.halfDayStatus}
                    </Typography>
                  )}
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
                  backgroundColor: "#4CAF50",
                  "&:hover": {
                    backgroundColor: "#45A049",
                  },
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


export default ApplyLeaveModal;
