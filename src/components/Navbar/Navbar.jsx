import React, { useState, useEffect, useContext } from "react";
import "./Navbar.css";
import { useNavigate } from "react-router-dom";
import { LoginContext } from "../context/LoginContext";
import PropTypes from "prop-types";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import MenuIcon from "@mui/icons-material/Menu";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import LogoutIcon from "@mui/icons-material/Logout";
import FeedbackIcon from "@mui/icons-material/Feedback";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import AssessmentIcon from "@mui/icons-material/Assessment";
import ParkIcon from "@mui/icons-material/Park";
import PostAddIcon from "@mui/icons-material/PostAdd";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import SupportIcon from '@mui/icons-material/Support';
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ApprovalIcon from "@mui/icons-material/Approval";
import WysiwygIcon from "@mui/icons-material/Wysiwyg";

const drawerWidth = 240;
// const AUTHORIZED_EMAILS = [
//   "amruta@navgurukul.org",
//   "shivansh@navgurukul.org",
//   "arunesh@navgurukul.org",
//   "activitytracker@samyarth.org"

// ];

const Navbar = (props) => {
  const { window } = props;
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const dataContext = useContext(LoginContext);
  const { email, setEmail, isAdmin } = dataContext;

  // const isAuthorizedEmail = () => {
  //   const userEmail = localStorage.getItem("email");
  //   return AUTHORIZED_EMAILS.includes(userEmail);
  // };

  // const adminEmails = [
  //   "amitkumar@navgurukul.org",
  //   "puran@navgurukul.org",
  //   "amruta@navgurukul.org",
  //   "ujjwal@navgurukul.org",
  // ];
  // const userEmail = localStorage.getItem("email");
  // const isAdmin = adminEmails.includes(userEmail);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    if (typeof window !== "undefined") {
      setIsMobile(window.innerWidth < 768);
      window.addEventListener("resize", handleResize);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  const handlePasswordDialogOpen = () => {
    setOpenPasswordDialog(true);
    setError("");
  };

  const handlePasswordDialogClose = () => {
    setOpenPasswordDialog(false);
    setPassword("");
    setShowPassword(false);
    setError("");
  };

  // const handlePasswordSubmit = () => {
  //   if (password === "Think4Big$123") {
  //     if (isAuthorizedEmail()) {
  //       sessionStorage.setItem("isAuth", "true");
  //       handlePasswordDialogClose();
  //       navigate("comp-off-application");
  //       setError("");
  //       setSnackbarSeverity("success");
  //       setSnackbarMessage("Successfully authenticated!");
  //       setSnackbarOpen(true);
  //     } else {
  //       setError("You are not authorized to access this feature");
  //       setSnackbarSeverity("error");
  //       setSnackbarMessage("You are not authorized to access this feature");
  //       setSnackbarOpen(true);
  //     }
  //   } else {
  //     setError("Incorrect password");
  //   }
  // };

  const handleClick = (button) => {
    console.log("Handleclick", button);
    if (button === "logout") {
      localStorage.clear();
      sessionStorage.clear();
      setEmail("");
      return navigate("/");
    }

    // if (button === "comp-off-application") {
    //   if (!isAuthorizedEmail()) {
    //     setSnackbarSeverity("info");
    //     setSnackbarMessage(
    //       "Comp-off requests need to be approved by Amruta. Please reach out to amruta@navgurukul.org before raising a request."
    //     );
    //     setSnackbarOpen(true);
    //     return;
    //   }
    //   handlePasswordDialogOpen();
    //   return;
    // }

    navigate(`/${button}`);
    handleDrawerClose();
  };

  const headingClick=()=>{
    navigate('/activity-tracker')
  }

  const drawer = (
    <div style={{ marginTop: "1rem", padding: "none" }}>
      <h1
        className="heading"
        onClick={headingClick}
        style={{
          color: "black",
          fontSize: "1.5rem",
          fontWeight: "bold",
          margin: "0",
          textAlign: "center",
          verticalAlign: "middle",
          marginBottom: "1rem",
        }}
      >
        Daily Tracker
      </h1>
      <Divider />
      <List>
        {[
          // ...(isAdmin
          //   ? [{ text: "Admin", icon: <AdminPanelSettingsIcon /> }]
          //   : []),
          // { text: "Project Management", icon: <MenuBookIcon /> },
          // { text: "Admin", icon: <ParkIcon /> },
          { text: "Activity Tracker", icon: <PostAddIcon /> },
          { text: "Leave Application", icon: <ApprovalIcon /> },
          {
            text: "Comp-off Application",
            icon: <WysiwygIcon />,
            // disabled: !isAuthorizedEmail(),
          },
          { text: "Monthly Activity-Dashboard", icon: <DashboardIcon /> },
          { text: "Leave History", icon: <SupportIcon /> },
        ].map((item, index) => (
          <ListItem
            key={item.text}
            disablePadding
            style={{ marginTop: "0.5rem" }}
          >
            <ListItemButton
              onClick={() =>
                handleClick(item.text.toLowerCase().replace(" ", "-"))
              }
              // disabled={item.disabled}
              sx={{
                opacity: item.disabled ? 0.5 : 1,
                "&.Mui-disabled": {
                  opacity: 0.5,
                },
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      {/* <Divider /> */}
      {/* <List>
        {[
          {
            text: "Tracker-Feedback",
            href: "https://docs.google.com/spreadsheets/d/1pfmdircPsvsxOZpTn7H9Scf3D3xtBwzSAPLqlw-oUyI/edit?gid=0#gid=0",
          },
          {
            text: "Tracker Reports",
            href: "https://docs.google.com/spreadsheets/d/1i8251CwxKATAhjLgDgMcbhJ6T4KMy1EaCOAuxRV2irQ/edit?gid=1381214364#gid=1381214364",
          },
          {
            text: "Support",
            href: "https://docs.google.com/forms/d/e/1FAIpQLScRduzs5MEtojOnVix2rvdJGlPcUAtLqelP5aM_mC5fCcBFfA/viewform",
          },
        ].map((item, index) => (
          <ListItem
            key={item.text}
            disablePadding
            style={{ marginTop: "0.5rem" }}
          >
            <ListItemButton component="a" href={item.href} target="_blank">
              {index === 2 ? (
                <ListItemIcon>
                  <SupportIcon />
                </ListItemIcon>
              ) : (
                <ListItemIcon>
                  {index % 2 === 0 ? <FeedbackIcon /> : <MenuBookIcon />}
                </ListItemIcon>
              )}
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List> */}
      <Divider />
      {isAdmin && (
      <List>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleClick("admin")}
            // sx={{ marginTop: "0.5rem" }}
          >
            <ListItemIcon>
              <AdminPanelSettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Admin" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleClick("project-management")}
            // sx={{ marginTop: "0.5rem" }}
          >
            <ListItemIcon>
              <MenuBookIcon />
            </ListItemIcon>
            <ListItemText primary="Project Management" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton
            sx={{ marginTop: "auto" }}
            onClick={() => handleClick("role-update")}
          >
            <ListItemIcon>
              <ManageAccountsIcon />
            </ListItemIcon>
            <ListItemText primary="Access Control" />
          </ListItemButton>
        </ListItem>
      </List>
      )}
      <Divider />
      <List
        style={{
          position: "absolute",
          width: "100%",
          // top: "0px",
          // bottom: "20px",
        }}
      >
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleClick("logout")}
            sx={{ marginTop: "auto" }}
          >
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  const container =
    window !== undefined ? () => window().document.body : undefined;

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <div className="responsive-div">
          <Toolbar
            style={{
              backdropFilter: "blur(10px)",
              backgroundColor: "gray",
            }}
          >
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { md: "none" } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div">
              Daily Tracker
            </Typography>
          </Toolbar>
        </div>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          container={container}
          variant="temporary"
          open={drawerOpen}
          onClose={handleDrawerClose}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Dialog open={openPasswordDialog} onClose={handlePasswordDialogClose}>
        <DialogTitle>Enter Password</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Password"
            type={showPassword ? "text" : "password"}
            fullWidth
            variant="outlined"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={!!error}
            helperText={error}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            // onKeyPress={(e) => {
            //   if (e.key === "Enter") {
            //     handlePasswordSubmit();
            //   }
            // }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePasswordDialogClose}>Cancel</Button>
          <Button>Submit</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

Navbar.propTypes = {
  window: PropTypes.func,
};

export default Navbar;
