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
  const { loading, setLoading } = useLoader();
  const navigate = useNavigate();
  const [leaveResult, setLeaveResult] = useState();
  const [isAccordionOpen, setIsAccordionOpen] = useState(true);
  const [leaveData, setLeaveData] = useState({
    type: "leave",
    leaveType: "",
    reason: "",
    fromDate: getTodayDate(),
    toDate: getTodayDate(),
    email: email,
  });
  const [remainingLeaves, setRemainingLeaves] = useState();
  const [halfDay, setHalfDay] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [availableLeaveTypes, setAvailableLeaveTypes] = useState();

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
        `https://script.google.com/macros/s/AKfycbzmz4nGQCtVhyEBknRzuP_qEC5nBhDCpDizLdMn4gTC0xsTuXlV_rXSF9yoQgEONpJ87w/exec?email=${email}&type=availableLeaves`
      );
      const result = await response.json();
      setLeaveResult(result.data.leaves);

      const availableTypes = Object.keys(result.data.leaves).filter(
        (key) =>
          typeof result.data.leaves[key] === "object" &&
          result.data.leaves[key].balance > 0
      );

      return availableTypes;
    } catch (error) {
      console.error("Error fetching leave types:", error);
      return [];
    }
  };

  const handleChange = (e) => {
    if (e.target.name === "leaveType")
      setRemainingLeaves(leaveResult[e.target.value]?.balance || 0);

    const { name, value } = e.target;
    setLeaveData({
      ...leaveData,
      [name]: value,
    });
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

    if (
      !leaveData.leaveType ||
      !leaveData.reason ||
      !leaveData.fromDate ||
      !leaveData.toDate ||
      !leaveData.email
    ) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    if (!availableLeaveTypes.includes(leaveData.leaveType)) {
      setError("Selected leave type is not available.");
      setLoading(false);
      return;
    }

    const numberOfDays = calculateNumberOfDays(
      leaveData.fromDate,
      leaveData.toDate,
      halfDay
    );

    const submitTime = new Date();
    const submitTimestamp = `${submitTime.toLocaleDateString("en-GB")} ${String(
      submitTime.getHours()
    ).padStart(2, "0")}:${String(submitTime.getMinutes()).padStart(
      2,
      "0"
    )}:${String(submitTime.getSeconds()).padStart(2, "0")}`;

    try {
      await fetch(
        "https://script.google.com/macros/s/AKfycbxQZqR250EftGC0bjLqcZ0k_8iu8B2kDvQVm1lpxgO4slXfgyfod3UcgKFwAxO6l7Bu/exec",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...leaveData,
            numberOfDays,
            timestamp: submitTimestamp,
          }),
          mode: "no-cors",
        }
      );

      setSuccessMessage("Leave request submitted successfully!");
      setLeaveData({
        type: "leave",
        leaveType: "",
        reason: "",
        fromDate: getTodayDate(),
        toDate: getTodayDate(),
        email: email,
      });
      setHalfDay(false);
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (error) {
      console.error("Error submitting leave request:", error);
      setError("Error submitting leave request.");
    } finally {
      
     await fetchAvailableLeaveTypes();
      setLoading(false);
    }
  };

  return (
    <StyledContainer>
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
                    <TableCell sx={{ fontWeight: 600 }}>Balance</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Booked</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(leaveResult).map(([type, data]) => {
                    if (
                      typeof data === "object" &&
                      data.balance !== undefined
                    ) {
                      return (
                        <TableRow key={type}>
                          <TableCell>{type}</TableCell>
                          <TableCell>{data.balance}</TableCell>
                          <TableCell>{data.booked}</TableCell>
                        </TableRow>
                      );
                    }
                    return null;
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </AccordionDetails>
      </Accordion>

      <StyledPaper>
        <form onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <StyledFormControl>
                <TextField
                  label="Employee Email"
                  name="email"
                  value={leaveData.email}
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
                  {availableLeaveTypes?.map((leaveType, index) => (
                    <MenuItem key={index} value={leaveType}>
                      {leaveType}
                    </MenuItem>
                  ))}
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
                  name="reason"
                  value={leaveData.reason}
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

            <Grid item xs={12} md={6}>
              <StyledFormControl>
                <TextField
                  label="From Date"
                  type="date"
                  name="fromDate"
                  value={leaveData.fromDate}
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
                  label="To Date"
                  type="date"
                  name="toDate"
                  value={leaveData.toDate}
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

            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={1}>
                <Tooltip
                  title="Do not change the date if you want to avail half day for the single day. If the date is increased by 1 and halfday is checked You will be availing today's leave + tomorrow's + half day."
                  arrow
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={halfDay}
                        onChange={handleHalfDayChange}
                        name="halfDay"
                        sx={{
                          color: "#94a3b8",
                          "&.Mui-checked": {
                            color: "#2563eb",
                          },
                        }}
                      />
                    }
                    label="Half Day"
                  />
                </Tooltip>
              </Box>
            </Grid>

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
