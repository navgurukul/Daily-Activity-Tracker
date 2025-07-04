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
    
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = "Please enter a valid number of days greater than 0";
    }
    
    if (formData.amount > 365) {
      newErrors.amount = "Number of days cannot exceed 365";
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
        leaveIncrease: formData.actionType === "increase" ? parseInt(formData.amount) : 0,
        leaveDecrease: formData.actionType === "decrease" ? parseInt(formData.amount) : 0,
        IncreaseOrDecreaseBy: adminEmail,
      };

      const response = await fetch(
        "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employmentLeaveUpgrade",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("jwtToken")}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (response.ok) {
        const successMessage = `Successfully ${formData.actionType}d ${formData.amount} day(s) of ${formData.leaveType} for ${formData.userEmail}`;
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

          {/* Action Type */}
          <FormControl>
            <FormLabel component="legend">Action *</FormLabel>
            <RadioGroup
              row
              value={formData.actionType}
              onChange={(e) => handleInputChange("actionType", e.target.value)}
            >
              <FormControlLabel 
                value="increase" 
                control={<Radio />} 
                label="Increase Leaves" 
              />
              <FormControlLabel 
                value="decrease" 
                control={<Radio />} 
                label="Decrease Leaves" 
              />
            </RadioGroup>
          </FormControl>

          {/* Number of Days */}
          <TextField
            label="Number of Days *"
            type="number"
            value={formData.amount}
            onChange={(e) => handleInputChange("amount", e.target.value)}
            error={Boolean(errors.amount)}
            helperText={errors.amount || "Enter the number of leave days to adjust"}
            inputProps={{ min: 1, max: 365 }}
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
            : `${formData.actionType === "increase" ? "Increase" : "Decrease"} ${formData.amount || 0} Day(s)`
          }
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdjustLeaveModal;