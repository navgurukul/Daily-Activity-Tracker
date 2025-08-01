import React, { useEffect, useState, useContext } from "react";
import {
  Box,
  Typography,
  Card,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import { LoginContext } from "../context/LoginContext";
import { se } from "date-fns/locale";

const CycleSummary = ({ selectedDate }) => {
  const dataContext = useContext(LoginContext);
  const { email } = dataContext;
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openCycle, setOpenCycle] = useState(null); // 'cycle1' or 'cycle2' or null

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("jwtToken");

      if (!token) {
        console.error("JWT token not found in local storage.");
        setLoading(false);
        return;
      }

      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();

      try {
        const response = await fetch(
          `${API_BASE_URL}/payableDaysCalculation?email=${email}&year=${year}&month=${month}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch payroll data");
        }

        const result = await response.json();
        const data = result?.data?.[0];

        if (data) {
          setSummaryData({ cycle1: data.cycle1, cycle2: data.cycle2 });
        } else {
          throw new Error("No data found");
        }
      } catch (error) {
        console.error("Error fetching payroll data:", error);
        setError("Failed to fetch cycle summary");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [email, selectedDate]);

  const labels = {
    totalHours: "⏰ Total Hours Worked",
    totalWorkingDays: "📆 Total Working Days",
    paidLeaves: "🛌 Paid Leaves",
    totalCompOffLeaveTaken: "🆓 Comp Off Leaves Taken",
    weekOffDays: "🛑 Week Off Days",
    numOfWorkOnWeekendDays: "🌞 Work on Weekend Days",
    totalPayableDays: "🗓️ Total Payable Days",
    LWP: "⚠️ Leave Without Pay",
    startDate: "📅 Start Date",
    endDate: "📅 End Date",
    overtimeHours: "⚡ Overtime Hours",
  };

  // Render the clickable card showing only totalPayableDays
  const renderCycleSummary = (cycle, title, cycleKey) => (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        boxShadow: 1,
        minWidth: 180,
        p: 2,
        cursor: "pointer",
        "&:hover": { boxShadow: 4, backgroundColor: "#f0f0f0" },
      }}
      onClick={() => setOpenCycle(cycleKey)}
    >
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body2" sx={{ color: "text.secondary" }}>
        {labels.totalPayableDays}:{" "}
        <strong>{cycle.totalPayableDays ?? "N/A"}</strong>
      </Typography>
    </Card>
  );

  // Modal content displaying friendly labels with emojis and values
  const renderCycleDetails = (cycle, title) => (
    <>
      <DialogTitle sx={{ m: 0, p: 2 }}>
        {title} Details
        <IconButton
          aria-label="close"
          onClick={() => setOpenCycle(null)}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {Object.entries(cycle).map(([key, value]) => {
          if (value === null || value === undefined) return null;
          // Use label if exists, else show raw key
          const label = labels[key] ?? key;
          return (
            <Box
              key={key}
              display="flex"
              justifyContent="space-between"
              sx={{ mb: 1 }}
            >
              <Typography variant="body2" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {value.toString()}
              </Typography>
            </Box>
          );
        })}
      </DialogContent>
    </>
  );

  if (loading)
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <CircularProgress size={20} />
        <Typography>Loading your data... almost there 🚀</Typography>
      </Box>
    );
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{mt:4, textAlign:'center'}}>
      <Typography variant="h6" gutterBottom fontWeight="bold">
        Payable Days Cycle Summary
      </Typography>
      <Typography
        variant="subtitle2"
        sx={{ color: "text.secondary", width:'100%', fontSize: {xs:'10.5px', sm:"13px"}, flexWrap:'wrap' }}
        gutterBottom
      >
        ( Cycle 1 - 1st to 25th, Cycle 2 - 26th to end of the month )
      </Typography>
      <Box sx={{display:'flex', justifyContent:'center',alignItems:'center', flexDirection:{xs:'column', sm:'row'}, gap: {xs:1,md:3},mb:{xs:3,sm:0}}}>
        {renderCycleSummary(summaryData.cycle1, "Cycle 1", "cycle1")}
        {renderCycleSummary(summaryData.cycle2, "Cycle 2", "cycle2")}
      </Box>

      <Dialog
        open={!!openCycle}
        onClose={() => setOpenCycle(null)}
        maxWidth="sm"
        fullWidth
      >
        {openCycle === "cycle1" &&
          renderCycleDetails(summaryData.cycle1, "Cycle 1")}
        {openCycle === "cycle2" &&
          renderCycleDetails(summaryData.cycle2, "Cycle 2")}
      </Dialog>
    </Box>
  );
};

export default CycleSummary;
