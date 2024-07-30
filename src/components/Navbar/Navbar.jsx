import React, { useState, useEffect, useContext } from "react";
import "./Navbar.css"; // Import the CSS file
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
import MailIcon from "@mui/icons-material/Mail";
import LogoutIcon from "@mui/icons-material/Logout"; // Import LogoutIcon
import FeedbackIcon from "@mui/icons-material/Feedback";
import MenuBookIcon from "@mui/icons-material/MenuBook";

import AssessmentIcon from "@mui/icons-material/Assessment";
import ParkIcon from "@mui/icons-material/Park";
import PostAddIcon from "@mui/icons-material/PostAdd";
const drawerWidth = 240;

const Navbar = (props) => {
  const { window } = props;
  const [selected, setSelected] = useState(
    localStorage.getItem("selectedButton") || "daily-tracker"
  );
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  const dataContext = useContext(LoginContext);
  const { email, setEmail } = dataContext;

  useEffect(() => {
    if (email) {
      localStorage.setItem("selectedButton", selected);
      if (selected === "daily-tracker") {
        navigate("/activity-tracker");
      }
    } else {
      localStorage.removeItem("selectedButton");
      navigate("/");
    }
  }, [selected, navigate, email]);

  useEffect(() => {
    const storedSelected = localStorage.getItem("selectedButton");
    if (storedSelected === "leave-app") {
      navigate("/leaves");
    } else if (storedSelected === "comp-off") {
      navigate("/comp_off");
    }
  }, [navigate]);

  const handleClick = (button) => {
    if (button === "logout") {
      localStorage.clear();
      setEmail("");
      return navigate("/");
    }
    const newSelection = button === "" ? "daily-tracker" : button;
    setSelected(newSelection);
    navigate(`/${button}`);
    handleDrawerClose();
  };

  const drawer = (
    <div
      style={{
        marginTop: "1rem",
        padding: "none",
      }}
    >
      <h1
        className="heading"
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
        {["Activity Tracker", "Leave Application", "Comp-off Application"].map(
          (text, index) => (
            <ListItem key={text} disablePadding>
              <ListItemButton
                onClick={() =>
                  handleClick(text.toLowerCase().replace(" ", "-"))
                }
              >
                <ListItemIcon>
                  {index === 0 && <AssessmentIcon />}
                  {index === 1 && <ParkIcon />}
                  {index === 2 && <PostAddIcon />}
                </ListItemIcon>
                <ListItemText primary={text} />
              </ListItemButton>
            </ListItem>
          )
        )}
      </List>
      <Divider />
      <List>
        {[
          {
            text: "Tracker-Feedback",
            href: "https://docs.google.com/spreadsheets/d/1pfmdircPsvsxOZpTn7H9Scf3D3xtBwzSAPLqlw-oUyI/edit?gid=0#gid=0",
          },
          {
            text: "Tracker Reports",
            href: "https://docs.google.com/spreadsheets/d/1i8251CwxKATAhjLgDgMcbhJ6T4KMy1EaCOAuxRV2irQ/edit?gid=1381214364#gid=1381214364",
          },
        ].map((item, index) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton component="a" href={item.href} target="_blank">
              <ListItemIcon>
                {index % 2 === 0 ? <FeedbackIcon /> : <MenuBookIcon />}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List
        style={{
          position: "absolute",
          width: "100%",
          bottom: "10px",
        }}
      >
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => handleClick("logout")}
            sx={{ marginTop: "auto", color: "red" }} // Style for logout button
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
        {/* {isMobile ? ( */}
        <div class="responsive-div">
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
        {/* ) : null}  */}
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          container={container}
          variant="temporary"
          open={drawerOpen}
          onClose={handleDrawerClose}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
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
      {/* <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
        }}
      >
        <Toolbar />
      </Box> */}
    </Box>
  );
};

// Navbar.propTypes = {
//   window: PropTypes.func,
// };

export default Navbar;
