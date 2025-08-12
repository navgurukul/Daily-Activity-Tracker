
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

const Navbar = (props) => {
  const { window } = props;
  const navigate = useNavigate();
  const location = useLocation(); // Added for active tab detection
  
  // ============== ALL EXISTING STATE PRESERVED ==============
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // ============== ENHANCED CONTEXT WITH ROLE FUNCTIONS ==============
  const dataContext = useContext(LoginContext);
  const { 
    email, 
    setEmail, 
    isAdmin, // Your existing isAdmin preserved
    userRole, // New standardized role
    canSeeAdminPanel, 
    canSeeAccessControl, 
    canSeeProjectManagement 
  } = dataContext;

  // ============== HELPER FUNCTION TO CHECK ACTIVE TAB ==============
  const isActiveTab = (route) => {
    return location.pathname === `/${route}` || location.pathname === route;
  };

  // ============== DEBUG LOGGING FOR ROLE PERMISSIONS ==============
  useEffect(() => {
    console.log("=== NAVBAR ROLE DEBUG ===");
    console.log("Current user role:", userRole);
    console.log("Can see admin panel:", canSeeAdminPanel());
    console.log("Can see access control:", canSeeAccessControl());
    console.log("Can see project management:", canSeeProjectManagement());
    console.log("Is Admin (legacy):", isAdmin);
    // console.log("========================");
  }, [email, userRole]);

  // ============== ALL EXISTING useEffects PRESERVED ==============
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

  // ============== ALL EXISTING FUNCTIONS PRESERVED ==============
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

  const handleClick = (button) => {
    console.log("Handleclick", button);
    if (button === "logout") {
      localStorage.clear();
      sessionStorage.clear();
      setEmail("");
      return navigate("/",{
        state:{message:"Logged-out successfully!"}
      })
    }

    navigate(`/${button}`);
    handleDrawerClose();
  };

  const headingClick=()=>{
    navigate('/activity-tracker')
  }

  // ============== ENHANCED DRAWER WITH ROLE-BASED NAVIGATION AND ACTIVE TAB STYLING ==============
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
      
      {/* ============== BASIC NAVIGATION ITEMS (AVAILABLE TO ALL USERS) ============== */}
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

      {/* ============== ROLE-BASED ADMIN NAVIGATION ITEMS ============== */}
      {/* Show admin section only if user has any elevated permissions */}
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

            {/* Admin Panel - Visible only to Admin and Super Admin */}
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

            {/* Access Control - Visible only to Admin and Super Admin */}
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

      {/* ============== EXISTING LOGOUT SECTION PRESERVED ============== */}
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

      {/* ============== DEBUG INFO (REMOVE IN PRODUCTION) ============== */}
      {/* Uncomment below for debugging role permissions during development */}
      {/*
      <div style={{ 
        position: "fixed", 
        bottom: "10px", 
        left: "10px",
        fontSize: "10px", 
        color: "#666",
        backgroundColor: "rgba(255,255,255,0.9)",
        padding: "5px",
        borderRadius: "3px"
      }}>
        Role: {userRole} | 
        Admin Panel: {canSeeAdminPanel() ? "✓" : "✗"} | 
        Access Control: {canSeeAccessControl() ? "✓" : "✗"} |
        Project Mgmt: {canSeeProjectManagement() ? "✓" : "✗"}
      </div>
      */}
    </div>
  );

  const container =
    window !== undefined ? () => window().document.body : undefined;

  // ============== ALL EXISTING JSX STRUCTURE COMPLETELY PRESERVED ============== 
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

      {/* ============== ALL EXISTING DIALOGS AND SNACKBARS PRESERVED ============== */}
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