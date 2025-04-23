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

const MonthlyDashboard = () => {
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

const getDaysInMonth = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    

  // Get only current month's days
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, month, i + 1);
      console.log(date);
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
    console.log(getDaysInMonth());
    let email = localStorage.getItem("email") ?? "";

    const getMonthAndYear = () => {
      const now = new Date();
      return now.toLocaleString("default", { month: "long", year: "numeric" });
    };

    
  const currentMonthYear = getMonthAndYear();

  // useEffect(() => {
    // const fetchData = async () => {
    //   try {
    //     // const response = await fetch(
    //     //   `https://script.google.com/macros/s/AKfycbxV0c61-cL4FkMXj4p3Ctlqo2tIbIJ2stndBo3YUmsSPh7wUbpDn22k2axRF8uT_j9pug/exec?email=${email}&&type=getEmployeeData`
    //     // );
    //     const response = await fetch(
    //       "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/activityLogs"
    //     );
    //     console.log("response from backend", response);
        
    //     const data = await response.json();
    //     console.log("data from backend", data);
        
    //     // setEmployeeData(data);
    //     setLoading(false);
    //   } catch (err) {
    //     setError("Failed to fetch data");
    //     setLoading(false);
    //   }
    // };
    
    useEffect(() => {
      const fetchData = async () => {
        try {
          const email = localStorage.getItem("email"); // Logged-in user's email

          const response = await fetch(
            "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/activityLogs"
          );
          const data = await response.json();

          const userData = data[email] || []; // Get only logged-in user's data

          setEmployeeData(userData);
          setLoading(false);
          // const formatted = formatData(userData);
          // setFormattedData(formatted);
        } catch (error) {
          setError("Failed to fetch data");
          setLoading(false);
          // console.error("Error fetching data:", error);
        }
      };

      fetchData();
    }, []);

  //   fetchData();
  // }, []);

  const getDataForDate = (date) => {
    if (!employeeData) return { activities: [], leaves: [] };
    console.log("employeeData", employeeData);
    console.log("date", date);

    // const activities =
    //   employeeData.activities?.filter(
    //     (activity) => activity["Activity Date"] === date
    //   ) || [];
    
    // const activities =
    //   employeeData.activities?.filter(
    //     (activity) => activity["Activity Date"] === date
    //   ) || [];
    const activities = (
      employeeData?.filter((activity) => activity.entryDate === date) || []
    ).map((activity) => activity);
      console.log("activities", activities);
      
    const leaves =
      employeeData.leaves?.filter((leave) => {
        const fromDate = leave["From date"];
        const toDate = leave["To Date"];
        return date >= fromDate && date <= toDate;
      }) || [];

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
    <Paper className="dashboard-container">
      {/* Add this new header section */}
      <div className="dashboard-header">
        <Typography variant="h4" className="month-title">
          {currentMonthYear}
        </Typography>
        <Typography variant="h5" className="dashboard-title">
          Monthly Activity Dashboard
        </Typography>
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
    // (sum, act) => sum + (act["Time Spent"] || 0),
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
                  {leave["Leave type"]}
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
                    {leave["Leave type"]}
                  </Typography>
                  <Chip
                    label={`${leave["No. of Days"]} day${
                      leave["No. of Days"] > 1 ? "s" : ""
                    }`}
                    className="days-chip"
                  />
                  <Typography className="leave-reason">
                    {leave["Reason for leave"]}
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
                      {/* {activity["Project Name"]} */}
                      {activity["projectName"]}
                    </Typography>
                    <Chip
                      // label={`${activity["Time Spent"]}h`}
                      label={`${activity["totalHoursSpent"]}h`}
                      className="time-chip"
                    />
                    <Typography className="task-description">
                      {/* {activity["Task of project"]} */}
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