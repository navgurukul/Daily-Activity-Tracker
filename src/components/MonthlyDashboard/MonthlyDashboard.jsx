import React, { useState, useEffect } from "react";
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

const MonthlyDashboard = () => {
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const selectedMonth = selectedDate.getMonth();
  const selectedYear = selectedDate.getFullYear();

  const getDaysInMonth = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    // Get only current month's days
    const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(selectedYear, selectedMonth, i + 1);
      // console.log(date);
      return (
        date.getFullYear() +
        "-" +
        String(date.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getDate()).padStart(2, "0")
      );
    });
    return currentMonthDays;
  };
  // console.log(getDaysInMonth());
  let email = localStorage.getItem("email") ?? "";
  const getMonthAndYear = () => {
    return new Date(selectedYear, selectedMonth).toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  };
  const currentMonthYear = getMonthAndYear();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const email = localStorage.getItem("email");
        const [activityRes, leaveRes] = await Promise.all([
          fetch(
            `https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/activityLogs/${email}?month=${String(
              selectedMonth + 1
            ).padStart(2, "0")}&year=${selectedYear}`
          ),
          fetch(
            `https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/leave-records?employeeEmail=${email}`
          ),
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
  }, [selectedMonth, selectedYear]);
  const getDataForDate = (date) => {
    if (!employeeData) return { activities: [], leaves: [] };
    const activities =
      employeeData.activities?.filter(
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
  };
  if (loading) {
    return (
      <Box className="loading-container">
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
      <div
        className="dashboard-header-container"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 16px",
          marginBottom: 24,
        }}
      >
        <div className="dashboard-header">
          <Typography variant="h6" sx={{ color: "text.secondary", marginBottom: 2 }}>
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
        <div style={{ minWidth: 320 }}>
          <CycleSummary selectedDate={selectedDate}/>
        </div>
      </div>

      <div className="calendar-grid">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="weekday-header">
            {day}
          </div>
        ))}
        {getDaysInMonth().map((date, index) => {
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
                onSelect={() =>
                  activities.length > 0 || leaves.length > 0
                    ? setSelectedDay({ date, activities, leaves })
                    : null
                }
              />,
            ];
          }
          return (
            <DayCell
              key={date}
              date={date}
              activities={activities}
              leaves={leaves}
              onSelect={() =>
                activities.length > 0 || leaves.length > 0
                  ? setSelectedDay({ date, activities, leaves })
                  : null
              }
            />
          );
        })}
      </div>
      {selectedDay && (
        <DayDetailsDialog
          selectedDay={selectedDay}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </Paper>
  );
};
const DayCell = ({ date, activities = [], leaves = [], onSelect }) => {
  const isToday =
    new Date(date).toISOString().split("T")[0] ===
    new Date().toISOString().split("T")[0];
  const totalHours = activities.reduce(
    (sum, act) => sum + (act["totalHoursSpent"] || 0),
    0
  );
  const hasData = activities.length > 0 || leaves.length > 0;
  const maxDisplayItems = 2;
  return (
    <Card
      className={`day-cell ${isToday ? "today" : ""} ${
        hasData ? "has-activities" : ""
      }`}
      onClick={onSelect}
    >
      <CardContent className="day-content">
        <div className="day-header">
          <Typography variant="body2" className="date-number">
            {new Date(date).getDate()}
          </Typography>
          <div className="chips-container">
            {leaves.length > 0 && (
              <Chip
                label={`Leave${leaves.length > 1 ? "s" : ""}`}
                size="small"
                className="leave-chip"
              />
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
          {activities.slice(0, maxDisplayItems).map((activity, idx) => (
            <div key={idx} className="activity-preview-item">
              <Typography variant="caption" className="project-name">
                {/* {activity["Project Name"]} */}
                {activity["projectName"]}
              </Typography>
            </div>
          ))}
          {leaves
            .slice(0, !activities.length ? maxDisplayItems : 1)
            .map((leave, idx) => (
              <div key={`leave-${idx}`} className="leave-preview-item">
                <Typography variant="caption" className="leave-type">
                  {leave["leaveType"]}
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
};
const DayDetailsDialog = ({ selectedDay, onClose }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
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
            Total Hours:{" "}
            {selectedDay.activities.reduce(
              // (sum, act) => sum + (act["Time Spent"] || 0),
              (sum, act) => sum + (act["totalHoursSpent"] || 0),
              0
            )}
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
            {selectedDay.leaves.map((leave, index) => (
              <Card key={`leave-${index}`} className="leave-detail-card">
                <CardContent>
                  <Typography variant="subtitle1" className="leave-type">
                    {leave["leaveType"]}
                  </Typography>
                  <Chip
                    label={`${leave["leaveDuration"]} day${
                      leave["leaveDuration"] > 1 ? "s" : ""
                    }`}
                    className="days-chip"
                  />
                  <Typography className="leave-reason">
                    {leave["reasonForLeave"]}
                  </Typography>
                </CardContent>
              </Card>
            ))}
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
};
export default MonthlyDashboard;
