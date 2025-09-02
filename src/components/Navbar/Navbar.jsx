
import React, { useState, useEffect, useContext } from "react";
import "./Navbar.css";
import { useNavigate, useLocation } from "react-router-dom";
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
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PostAddIcon from "@mui/icons-material/PostAdd";
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

const Navbar = (props) => {
  const { window } = props;
  const navigate = useNavigate();
  const location = useLocation();

  // All existing state preserved
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // Context data (role and permissions)
  const dataContext = useContext(LoginContext);
  const {
    email,
    setEmail,
    isAdmin,
    userRole,
    canSeeAdminPanel,
    canSeeAccessControl,
    canSeeProjectManagement
  } = dataContext;

  // Helper function to check active tab
  const isActiveTab = (route) => {
    return location.pathname === `/${route}` || location.pathname === route;
  };

  // Handle resize for mobile detection
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

  // Drawer toggle functions
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  // Password dialog handlers
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

  // Handle navigation clicks
  const handleClick = (button) => {
    if (button === "logout") {
      localStorage.clear();
      sessionStorage.clear();
      setEmail("");
      return navigate("/", {
        state: { message: "Logged-out successfully!" }
      })
    }

    navigate(`/${button}`);
    handleDrawerClose();
  };

  // Navigate on heading click
  const headingClick = () => {
    navigate('/activity-tracker')
  }

  // Drawer content with navigation and role-based items
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

      {/* Basic navigation items (all users) */}
      <List>
        {[
          { text: "Activity Tracker", icon: <PostAddIcon />, route: "activity-tracker" },
          { text: "Leave Application", icon: <ApprovalIcon />, route: "leave-application" },
          { text: "Comp-off Application", icon: <WysiwygIcon />, route: "comp-off-application" },
          { text: "Monthly Activity-Dashboard", icon: <DashboardIcon />, route: "monthly-activity-dashboard" },
          { text: "Leave History", icon: <SupportIcon />, route: "leave-history" },
        ].map((item, index) => (
          <ListItem
            key={item.text}
            disablePadding
            style={{ marginTop: "0.5rem" }}
          >
            <ListItemButton
              onClick={() => handleClick(item.route)}
              sx={{
                backgroundColor: isActiveTab(item.route) ? "#e0e0e0" : "transparent", // Grey background for active tab
                "&:hover": {
                  backgroundColor: isActiveTab(item.route) ? "#e0e0e0" : "#f5f5f5",
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: "28px", marginRight: "6px" }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                sx={{
                  color: isActiveTab(item.route) ? "#4caf50" : "inherit" // Green color for active tab text
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {/* Role-based navigation items */}
      {(canSeeAdminPanel() || canSeeAccessControl() || canSeeProjectManagement()) && (
        <>
          <Divider />
          <List>
            {/* Project Management - Visible to Project Manager and above */}
            {canSeeProjectManagement() && (
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => handleClick("project-management")}
                  sx={{
                    backgroundColor: isActiveTab("project-management") ? "#e0e0e0" : "transparent", // Grey background for active tab
                    "&:hover": {
                      backgroundColor: isActiveTab("project-management") ? "#e0e0e0" : "#f5f5f5",
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: "28px", marginRight: "6px" }}>
                    <MenuBookIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Project Management"
                    sx={{
                      color: isActiveTab("project-management") ? "#4caf50" : "inherit" // Green color for active tab text
                    }}
                  />
                </ListItemButton>
              </ListItem>
            )}

            {/* Admin Panel - Visible to Admin and Super Admin */}
            {canSeeAdminPanel() && (
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => handleClick("admin")}
                  sx={{
                    backgroundColor: isActiveTab("admin") ? "#e0e0e0" : "transparent", // Grey background for active tab
                    "&:hover": {
                      backgroundColor: isActiveTab("admin") ? "#e0e0e0" : "#f5f5f5",
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: "28px", marginRight: "6px" }}>
                    <AdminPanelSettingsIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Admin"
                    sx={{
                      color: isActiveTab("admin") ? "#4caf50" : "inherit" // Green color for active tab text
                    }}
                  />
                </ListItemButton>
              </ListItem>
            )}

            {/* Access Control - Visible to Admin and Super Admin */}
            {canSeeAccessControl() && (
              <ListItem disablePadding>
                <ListItemButton
                  onClick={() => handleClick("role-update")}
                  sx={{
                    backgroundColor: isActiveTab("role-update") ? "#e0e0e0" : "transparent", // Grey background for active tab
                    "&:hover": {
                      backgroundColor: isActiveTab("role-update") ? "#e0e0e0" : "#f5f5f5",
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: "28px", marginRight: "6px" }}>
                    <ManageAccountsIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Access Control"
                    sx={{
                      color: isActiveTab("role-update") ? "#4caf50" : "inherit" // Green color for active tab text
                    }}
                  />
                </ListItemButton>
              </ListItem>
            )}
          </List>
        </>
      )}

      {/* Logout section */}
      <Divider />
      <List
        style={{
          position: "absolute",
          width: "100%",
        }}
      >
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleClick("logout")}
            sx={{ marginTop: "auto" }}
          >
            <ListItemIcon sx={{ minWidth: "28px", marginRight: "6px" }}>
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

  // All existing JSX structure completely preserved
  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      {/* Top AppBar (visible on small screens) */}
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

      {/* Drawer for navigation */}
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

      {/* Password dialog */}
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
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePasswordDialogClose}>Cancel</Button>
          <Button>Submit</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for feedback */}
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