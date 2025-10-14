import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

const SimpleSnackbar = ({ message, isOpen, onClose }) => {
  // Snackbar state
  const [open, setOpen] = useState(isOpen);

  // Sync state with prop
  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  // Click handler
  const handleClick = () => {
    setOpen(true);
  };

  // Close handler
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
    onClose(event, reason);
  };

  // Action buttons inside Snackbar
  const action = (
    <React.Fragment>
      <Button color="secondary" size="small" onClick={handleClose}>
        UNDO
      </Button>
      <IconButton
        size="small"
        aria-label="close"
        color="inherit"
        onClick={handleClose}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </React.Fragment>
  );

  return (
    <div>
      {/* Snackbar trigger button */}
      <Button onClick={handleClick}>Open Snackbar</Button>

      {/* Snackbar component */}
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        message={message}
        action={action}
      />
    </div>
  );
}

export default SimpleSnackbar;