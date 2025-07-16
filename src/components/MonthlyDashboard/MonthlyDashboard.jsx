import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Paper,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import "./MonthlyDashboard.css";
import CycleSummary from "./CycleSummary";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

// Shared utility function to get leave status attributes
const getLeaveStatusAttributes = (status) => {
  switch (status) {
    case "approved":
      return {
        icon: "✓",
        color: "#4caf50",
        style: {
          backgroundColor: "#4caf50 !important",
          color: "white !important",
        }
      };
    case "pending":
      return {
        icon: "⏰",
        color: "#ff9800",
        style: {
          backgroundColor: "#ff9800 !important",
          color: "white !important",
        }
      };
    case "rejected":
      return {
        icon: "✗",
        color: "#f44336",
        style: {
          backgroundColor: "#f44336 !important",
          color: "white !important",
        }
      };
    default:
      return {
        icon: "",
        color: "#9e9e9e",
        style: {
          backgroundColor: "#9e9e9e !important",
          color: "white !important",
        }
      };
  }
};

// Static styles to avoid recreation
const leavePreviewStyles = {
  backgroundColor: "#fff3e0",
  borderRadius: "6px",
  padding: "8px",
  marginBottom: "8px",
};

const leaveTypeStyles = {
  display: "block",
  fontSize: "11px",
  color: "#e65100",
  fontWeight: "500",
};

const chipContainerStyles = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
  color: "white",
  padding: "2px 6px",
  borderRadius: "4px",
  fontSize: "10px",
  fontWeight: "500",
  textTransform: "capitalize",
  width: "fit-content",
  marginBottom: "4px",
};

const leaveDetailHeaderStyles = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "8px",
};

const approvalDetailsStyles = {
  display: "block",
  marginTop: "8px",
  color: "#666",
};

const MonthlyDashboard = () => {
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const selectedMonth = selectedDate.getMonth();
  const selectedYear = selectedDate.getFullYear();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Memoized email getter
  const email = useMemo(() => {
    return sessionStorage.getItem("email") ?? "";
  }, []);

  // Memoized days calculation
  const daysInMonth = useMemo(() => {
    const daysCount = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    return Array.from({ length: daysCount }, (_, i) => {
      const date = new Date(selectedYear, selectedMonth, i + 1);
      return (
        date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0")
      );
    });
  }, [selectedMonth, selectedYear]);

  // Memoized month and year string
  const currentMonthYear = useMemo(() => {
    return new Date(selectedYear, selectedMonth).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  }, [selectedMonth, selectedYear]);

  // Memoized data getter function
  const getDataForDate = useCallback((date) => {
    if (!employeeData) return { activities: [], leaves: [] };
    
    const activities = employeeData.activities?.filter(
      (activity) => activity.entryDate === date
    ) || [];
    
    const allLeaves = [
      ...(employeeData.leaves?.approved || []),
      ...(employeeData.leaves?.pending || []),
      ...(employeeData.leaves?.rejected || []),
    ];
    
    const leaves = allLeaves.filter((leave) => {
      const fromDate = leave.startDate;
      const toDate = leave.endDate;
      return fromDate && toDate && date >= fromDate && date <= toDate;
    });
    
    return { activities, leaves };
  }, [employeeData]);

  // Memoized day selection handler
  const handleDaySelect = useCallback((date, activities, leaves) => {
    if (activities.length > 0 || leaves.length > 0) {
      setSelectedDay({ date, activities, leaves });
    }
  }, []);

  // Memoized dialog close handler
  const handleDialogClose = useCallback(() => {
    setSelectedDay(null);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [activityRes, leaveRes] = await Promise.all([
          fetch(
            `${API_BASE_URL}/activityLogs/${email}?month=${String(
              selectedMonth + 1
            ).padStart(2, "0")}&year=${selectedYear}`
          ),
          fetch(`${API_BASE_URL}/leave-records?employeeEmail=${email}`),
        ]);
        
        const [activityData, leaveData] = await Promise.all([
          activityRes.json(),
          leaveRes.json(),
        ]);
        
        const userActivities = activityData.data[email] || [];
        const userLeaves = leaveData[email] || [];
        
        setEmployeeData({
          activities: userActivities,
          leaves: userLeaves,
        });
        setLoading(false);
      } catch (error) {
        console.error("Fetch error:", error);
        setError("Failed to fetch data");
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedMonth, selectedYear, email, API_BASE_URL]);

  if (loading) {
    return (
      <Box className="loading-container">
        <p>Loading...</p>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Paper
      className="dashboard-container"
      style={{ overflowY: "scroll", height: "90vh" }}
    >
      <div className="dashboard-header-container">
        <div className="dashboard-header">
          <Typography variant="h4" sx={{ marginBottom: 2 }}>
            Monthly Activity Dashboard
          </Typography>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              views={["year", "month"]}
              label="Select Month"
              value={selectedDate}
              onChange={(newValue) => setSelectedDate(newValue)}
              sx={{ width: 200 }}
            />
          </LocalizationProvider>
        </div>
        <div style={{ minWidth: 290 }}>
          <CycleSummary selectedDate={selectedDate} />
        </div>
      </div>

      <div className="calender">
        <div className="calendar-grid">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="weekday-header">
              {day}
            </div>
          ))}
          {daysInMonth.map((date, index) => {
            const { activities, leaves } = getDataForDate(date);
            const dayOfWeek = new Date(date).getDay();
            
            if (index === 0) {
              const emptyCells = Array(dayOfWeek).fill(null);
              return [
                ...emptyCells.map((_, i) => (
                  <div key={`empty-${i}`} className="empty-cell" />
                )),
                <DayCell
                  key={date}
                  date={date}
                  activities={activities}
                  leaves={leaves}
                  onSelect={handleDaySelect}
                />,
              ];
            }
            
            return (
              <DayCell
                key={date}
                date={date}
                activities={activities}
                leaves={leaves}
                onSelect={handleDaySelect}
              />
            );
          })}
        </div>
      </div>
      
      {selectedDay && (
        <DayDetailsDialog
          selectedDay={selectedDay}
          onClose={handleDialogClose}
        />
      )}
    </Paper>
  );
};

const DayCell = React.memo(({ date, activities = [], leaves = [], onSelect }) => {
  const isToday = useMemo(() => {
    return new Date(date).toISOString().split("T")[0] ===
           new Date().toISOString().split("T")[0];
  }, [date]);

  const totalHours = useMemo(() => {
    return activities.reduce(
      (sum, act) => sum + Number(act["totalHoursSpent"] || 0),
      0
    );
  }, [activities]);

  const hasData = activities.length > 0 || leaves.length > 0;
  const maxDisplayItems = 2;

  const handleClick = useCallback(() => {
    onSelect(date, activities, leaves);
  }, [date, activities, leaves, onSelect]);

  const leaveStatusAttributes = useMemo(() => {
    return leaves.length > 0 ? getLeaveStatusAttributes(leaves[0].status) : null;
  }, [leaves]);

  return (
    <Card
      className={`day-cell ${isToday ? "today" : ""} ${
        hasData ? "has-activities" : ""
      }`}
      onClick={handleClick}
    >
      <CardContent className="day-content">
        <div className="day-header">
          <Typography variant="body2" className="date-number">
            {new Date(date).getDate()}
          </Typography>
          <div className="chips-container">
            {leaves.length > 0 && leaveStatusAttributes && (
              <div
                style={{
                  ...chipContainerStyles,
                  backgroundColor: leaveStatusAttributes.color,
                }}
              >
                <span style={{ fontSize: "10px" }}>
                  {leaveStatusAttributes.icon}
                </span>
                <span>{leaves[0].status}</span>
              </div>
            )}
            {totalHours > 0 && (
              <Chip
                label={`${totalHours}h`}
                size="small"
                className="hours-chip"
              />
            )}
          </div>
        </div>
        <div className="activities-preview">
          {leaves.length > 0 && (
            <div style={leavePreviewStyles}>
              <Typography
                variant="caption"
                style={leaveTypeStyles}
              >
                {leaves[0]["leaveType"]}
              </Typography>
            </div>
          )}

          {activities.slice(0, maxDisplayItems).map((activity, idx) => (
            <div key={idx} className="activity-preview-item">
              <Typography variant="caption" className="project-name">
                {activity["projectName"]}
              </Typography>
            </div>
          ))}
          {activities.length + leaves.length > maxDisplayItems && (
            <Typography variant="caption" className="more-activities">
              +{activities.length + leaves.length - maxDisplayItems} more
            </Typography>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

const DayDetailsDialog = React.memo(({ selectedDay, onClose }) => {
  const formatDate = useCallback((dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  const totalHours = useMemo(() => {
    return selectedDay.activities.reduce(
      (sum, act) => sum + (act["totalHoursSpent"] || 0),
      0
    );
  }, [selectedDay.activities]);

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      className="day-dialog"
    >
      <DialogTitle className="dialog-title">
        <div>
          {formatDate(selectedDay.date)}
          <Typography variant="subtitle1">
            Total Hours: {totalHours}
            {selectedDay.leaves.length > 0 &&
              ` | Leaves: ${selectedDay.leaves.length}`}
          </Typography>
        </div>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {selectedDay.leaves.length > 0 && (
          <div className="leaves-section">
            <Typography variant="h6" className="section-title">
              Leaves
            </Typography>
            {selectedDay.leaves.map((leave, index) => {
              const statusAttributes = getLeaveStatusAttributes(leave.status);
              return (
                <Card key={`leave-${index}`} className="leave-detail-card">
                  <CardContent>
                    <div style={leaveDetailHeaderStyles}>
                      <Typography variant="subtitle1" className="leave-type">
                        {leave["leaveType"]}
                      </Typography>
                      <Chip
                        label={leave.status}
                        size="small"
                        sx={statusAttributes.style}
                      />
                    </div>
                    <Chip
                      label={`${leave["leaveDuration"]} day${
                        leave["leaveDuration"] > 1 ? "s" : ""
                      }`}
                      className="days-chip"
                    />
                    <Typography className="leave-reason">
                      {leave["reasonForLeave"]}
                    </Typography>
                    {leave.status === "approved" && leave.approvalDate && (
                      <Typography
                        variant="caption"
                        style={approvalDetailsStyles}
                      >
                        Approved on:{" "}
                        {new Date(leave.approvalDate).toLocaleDateString()}
                        {leave.approvalEmail && ` by ${leave.approvalEmail}`}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        {selectedDay.activities.length > 0 && (
          <div className="activities-section">
            <Typography variant="h6" className="section-title">
              Activities
            </Typography>
            <div className="activities-list">
              {selectedDay.activities.map((activity, index) => (
                <Card key={index} className="activity-detail-card">
                  <CardContent>
                    <Typography variant="h6" className="project-title">
                      {activity["projectName"]}
                    </Typography>
                    <Chip
                      label={`${activity["totalHoursSpent"]}h`}
                      className="time-chip"
                    />
                    <Typography className="task-description">
                      {activity["workDescription"]}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
});

DayCell.displayName = 'DayCell';
DayDetailsDialog.displayName = 'DayDetailsDialog';

export default MonthlyDashboard;
