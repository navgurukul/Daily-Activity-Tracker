import * as React from "react";
import Backdrop from "@mui/material/Backdrop";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import Fade from "@mui/material/Fade";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import DescriptionIcon from "@mui/icons-material/Description";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import LaunchIcon from "@mui/icons-material/Launch";
import Button from "@mui/material/Button";

// Styles
const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  display: "flex",
  flexDirection: "column",
  transform: "translate(-50%, -50%)",
  width: {
    xs: 320,
    sm: 480,
    md: 640,
  },
  maxHeight: "85vh",
  bgcolor: "background.paper",
  boxShadow: 24,
  borderRadius: 3,
  overflowY: "auto",
};

const headerStyle = {
  position: "sticky",
  top: 0,
  bgcolor: "background.paper",
  p: 3,
  borderBottom: 1,
  borderColor: "divider",
  zIndex: 1,
  borderRadius: "12px 12px 0 0",
};

const footerStyle = {
  position: "sticky",
  bottom: 0,
  bgcolor: "background.paper",
  p: 2,
  borderTop: 1,
  borderColor: "divider",
  borderRadius: "0 0 12px 12px",
};

// Transition Modal Component
export default function TransitionModal({ feedbackData }) {
  const [hideModal, setHideModal] = React.useState(false);
  const [showModal, setShowModal] = React.useState(true);

  // Filter active feedback forms
  const activeFeedbacks = React.useMemo(
    () => feedbackData.filter((feedback) => feedback.Status === "Active"),
    [feedbackData]
  );

  // Check local storage for modal visibility
  React.useEffect(() => {
    const shouldHideModal = localStorage.getItem("hideFormsModal") === "true";
    if (shouldHideModal) {
      setShowModal(false);
    }
  }, []);

  // Handle modal visibility toggle
  const handleHideModal = (event) => {
    setHideModal(event.target.checked);
    if (event.target.checked) {
      localStorage.setItem("hideFormsModal", "true");
      setShowModal(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Check modal visibility
  if (!showModal) return null;

  return (
    <Modal
      open={showModal}
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 500,
          sx: { backgroundColor: "rgba(0, 0, 0, 0.8)" },
        },
      }}
    >
      <Fade in={showModal}>
        <Box sx={style}>
          {/* Header */}
          <Box sx={headerStyle}>
            <Typography
              variant="h5"
              component="h2"
              sx={{
                fontWeight: 600,
                color: "primary.main",
              }}
            >
              Mandatory forms to be filled
            </Typography>
          </Box>

          {/* Form List */}
          <Box sx={{ p: 3 }}>
            {activeFeedbacks.map((form, index) => (
              <Card
                key={form["Form Link"]}
                sx={{
                  mb: 2,
                  "&:last-child": { mb: 0 },
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: 3,
                  },
                }}
                elevation={1}
              >
                <CardContent>
                  {/* Form title */}
                  <Typography variant="h6" component="h3" gutterBottom>
                    {form.Sheet_Name}
                  </Typography>

                  {/* Description */}
                  <Box sx={{ display: "flex", alignItems: "start", mb: 2 }}>
                    <DescriptionIcon
                      sx={{ mr: 1, color: "text.secondary", mt: 0.5 }}
                    />
                    <Typography variant="body1" color="text.secondary">
                      {form.Description}
                    </Typography>
                  </Box>

                  {/* Due Date */}
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <CalendarTodayIcon sx={{ mr: 1, color: "error.main" }} />
                    <Typography
                      variant="body2"
                      sx={{
                        color: "error.main",
                        fontWeight: 500,
                      }}
                    >
                      Due: {formatDate(form.Due_Date)}
                    </Typography>
                  </Box>

                  {/* Open form Button */}
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                      variant="contained"
                      href={form["Form Link"]}
                      target="_blank"
                      rel="noopener noreferrer"
                      startIcon={<LaunchIcon />}
                      sx={{ flexGrow: 1 }}
                    >
                      Open Form
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>

          {/* Footer */}
          <Box sx={footerStyle}>
            <Box sx={{ mb: 1.5 }}>
              <Typography
                variant="body2"
                color="warning.main"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  backgroundColor: "warning.lighter",
                  p: 1.5,
                  borderRadius: 1,
                  border: "1px solid",
                  borderColor: "warning.light",
                }}
              >
                ⚠️ Please ensure you have filled all the forms before marking as
                completed
              </Typography>
            </Box>

            {/* Checkbox to hide modal in future */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={hideModal}
                  onChange={handleHideModal}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" color="text.secondary">
                  I have filled all forms and don't want to see them again
                </Typography>
              }
            />
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}