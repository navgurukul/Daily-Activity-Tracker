
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Autocomplete,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  InputLabel,
  Button,
  Box,
  CircularProgress,
  Alert,
} from "@mui/material";

const AdjustLeaveModal = ({ 
  open, 
  onClose, 
  allEmails, 
  adminEmail, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState({
    userEmail: "",
    leaveType: "",
    actionType: "increase",
    amount: "",
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const leaveTypes = [
    "Exam Leave",
    "Casual Leave", 
    "Bereavement Leave",
    "Vipassana Leave",
    "Wellness Leave",
    "SRS Leave",
    "Maternity Leave",
    "Parental Leave",
    "Miscarriage Leave"
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
    setSubmitError("");
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.userEmail) {
      newErrors.userEmail = "Please select an employee email";
    }
    
    if (!formData.leaveType) {
      newErrors.leaveType = "Please select a leave type";
    }
    
    if (formData.amount === "" || formData.amount < 0) {
      newErrors.amount = "Please enter a valid number of days (0 or greater)";
    }
    
    if (formData.amount > 365) {
      newErrors.amount = "Number of days cannot exceed 365";
    }
    
    // Validate half-day increments (0.5 steps) - but allow 0
    const amount = parseFloat(formData.amount);
    if (amount > 0 && (amount * 2) % 1 !== 0) {
      newErrors.amount = "Please enter days in 0.5 increments (e.g., 0, 0.5, 1, 1.5, 2)";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 const handleSubmit = async () => {
  if (!validateForm()) return;
  
  setLoading(true);
  setSubmitError("");
  
  try {
    const payload = {
      userEmail: formData.userEmail,
      leaveType: formData.leaveType,
      IncreaseOrDecreaseBy: adminEmail,
    };

    payload.allotedLeaves = parseFloat(formData.amount);
    
    const response = await fetch(
      `${API_BASE_URL}/employmentLeaveUpgrade`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    if (response.ok) {
      const days = parseFloat(formData.amount);
      let successMessage;
      
      const dayText = days === 1 ? "day" : "days";
successMessage = `Successfully allotted ${days} ${dayText} of ${formData.leaveType} to ${formData.userEmail}`;
      
      onSuccess(successMessage);
      handleClose();
    } else {
      setSubmitError(result?.message || "Failed to adjust leave balance. Please try again.");
    }
  } catch (error) {
    setSubmitError("Something went wrong. Please try again.");
  } finally {
    setLoading(false);
  }
};
  const handleClose = () => {
    setFormData({
      userEmail: "",
      leaveType: "",
      actionType: "increase",
      amount: "",
    });
    setErrors({});
    setSubmitError("");
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
      sx={{
        margin: -1,
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        Adjust Leave Balance
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pt: 1 }}>
          
          {/* Employee Email */}
          <Autocomplete
            options={allEmails}
            value={formData.userEmail}
            onChange={(e, newValue) => handleInputChange("userEmail", newValue || "")}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Employee Email *"
                error={Boolean(errors.userEmail)}
                helperText={errors.userEmail}
                required
              />
            )}
            freeSolo
            slotProps={{
              paper: {
                sx: {
                  '& ul': {
                    maxHeight: 200,
                    overflowY: 'auto',
                  },
                },
              },
            }}
          />

          {/* Leave Type */}
          <FormControl 
            error={Boolean(errors.leaveType)}
            required
          >
            <InputLabel>Leave Type *</InputLabel>
            <Select
              value={formData.leaveType}
              label="Leave Type *"
              onChange={(e) => handleInputChange("leaveType", e.target.value)}
            >
              {leaveTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </Select>
            {errors.leaveType && (
              <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5, ml: 1.5 }}>
                {errors.leaveType}
              </Box>
            )}
          </FormControl>

          {/* Number of Days */}
          <TextField
            label="Alloted Days *"
            type="number"
            value={formData.amount}
            onChange={(e) => handleInputChange("amount", e.target.value)}
            error={Boolean(errors.amount)}
            helperText={errors.amount || "Enter the number of leave days to adjust"}
            inputProps={{ 
              min: 0, 
              max: 365, 
              step: 0.5 
            }}
            required
          />

          {/* Error Message */}
          {submitError && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {submitError}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={handleClose}
          disabled={loading}
          sx={{ textTransform: "none" }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          startIcon={loading && <CircularProgress size={20} />}
          sx={{ textTransform: "none" }}
        >
          {loading 
  ? "Processing..." 
  : `Allot ${formData.amount || 0} ${parseFloat(formData.amount) === 1 ? "Day" : "Days"}`
}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdjustLeaveModal;