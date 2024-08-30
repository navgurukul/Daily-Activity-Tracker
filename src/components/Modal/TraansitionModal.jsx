import * as React from "react";
import Backdrop from "@mui/material/Backdrop";
import Box from "@mui/material/Box";
import Modal from "@mui/material/Modal";
import Fade from "@mui/material/Fade";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

// Style for the modal
const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  transform: "translate(-50%, -50%)",
  width: {
    xs: 300, // Small screens
    sm: 400, // Medium screens
    md: 500, // Large screens
  },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

export default function TransitionModal() {
  const [open, setOpen] = React.useState(true);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [attempt, setAttempts] =  React.useState("0")
  React.useEffect(() => {
    const attempts = localStorage.getItem("attemptsLeft");
    setAttempts(attempts)
    console.log(attempts,"attempts")
  },[])
  return (
    <Modal
      aria-labelledby="transition-modal-title"
      aria-describedby="transition-modal-description"
      open={open}
      onClose={handleClose}
      closeAfterTransition
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          timeout: 500,
        },
      }}
    >
      <Fade in={open}>
        <Box sx={style}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography id="transition-modal-title" variant="h6" component="h2">
              Past 3 days tracker limit
            </Typography>
          </Box>
          <Typography
            id="transition-modal-description"
            sx={{ mt: 2 }}
          ></Typography>
          <Typography color="warning" sx={{ mt: 2 }}>
            Reminder: You can only fill the tracker for past 3 days 3 times a
            month. Exceeding this limit will result in entries for past dates
            not being accepted.
            <br />
            <br />You have only <span style={{
              color: attempt<=0?"red":"green"
            }}>{attempt} </span>attempts
            left.
          </Typography>
          <br />
          <Box display="flex" justifyContent="center">
            <Button
              variant="contained"
              color="success"
              onClick={handleClose}
              style={{ marginTop: "16px" }}
            >
              OK
            </Button>
          </Box>
        </Box>
      </Fade>
    </Modal>
  );
}
