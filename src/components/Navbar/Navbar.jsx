import React, { useState, useEffect, useContext } from "react";
import "./Navbar.css"; // Import the CSS file
import { useNavigate } from "react-router-dom";
import { LoginContext } from "../context/LoginContext";
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';

const Navbar = () => {
  const [selected, setSelected] = useState(localStorage.getItem("selectedButton") || "daily-tracker");
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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
        navigate("/form");
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

  return (
    <nav className="navbar">
      {isMobile ? (
        <>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleDrawerToggle}
          >
            <MenuIcon />
          </IconButton>
          <Drawer
            anchor="left"
            open={drawerOpen}
            onClose={handleDrawerClose}
          >
            <Box
              sx={{ width: 250, display: 'flex', flexDirection: 'column', height: '100%' }}
            >
              <List>
                <ListItem button onClick={() => handleClick("")}>
                  <ListItemText primary="Activity Tracker" />
                </ListItem>
                <ListItem button onClick={() => handleClick("leaves")}>
                  <ListItemText primary="Leave Application" />
                </ListItem>
                <ListItem button onClick={() => handleClick("comp-off")}>
                  <ListItemText primary="Comp off" />
                </ListItem>
                <Divider />
                <ListItem
                  button
                  component="a"
                  href="https://docs.google.com/spreadsheets/d/1pfmdircPsvsxOZpTn7H9Scf3D3xtBwzSAPLqlw-oUyI/edit?gid=0#gid=0"
                  target="_blank"
                >
                  <ListItemText primary="Tracker-Feedback" />
                </ListItem>
                <ListItem
                  button
                  component="a"
                  href="https://docs.google.com/spreadsheets/d/1i8251CwxKATAhjLgDgMcbhJ6T4KMy1EaCOAuxRV2irQ/edit?gid=1381214364#gid=1381214364"
                  target="_blank"
                >
                  <ListItemText primary="Tracker Reports" />
                </ListItem>
              </List>
              <Box sx={{ flexGrow: 1 }} />
              <ListItem
                button
                onClick={() => handleClick("logout")}
                className="logoutbutton"
              >
                <ListItemText primary="Logout 💀" />
              </ListItem>
            </Box>
          </Drawer>
        </>
      ) : (
        <div className="left-buttons">
          <button className="btns">
            <a
              className="text"
              href="https://docs.google.com/spreadsheets/d/1pfmdircPsvsxOZpTn7H9Scf3D3xtBwzSAPLqlw-oUyI/edit?gid=0#gid=0"
              target="_blank"
            >
              Tracker-Feedback
            </a>
          </button>
          <button className="btns">
            <a
              className="text"
              href="https://docs.google.com/spreadsheets/d/1i8251CwxKATAhjLgDgMcbhJ6T4KMy1EaCOAuxRV2irQ/edit?gid=1381214364#gid=1381214364"
              target="_blank"
            >
              Tracker Reports
            </a>
          </button>
        </div>
      )}
      <h1
        className="heading"
        style={{ color: "white", fontSize: "1.5rem", fontWeight: "bold", margin: "0" }}
      >
        Daily Tracker
      </h1>
      <ul className="nav-buttons">
        <li
          className={`nav-button ${selected === "daily-tracker" ? "selected" : ""
            }`}
          onClick={() => handleClick("")}
        >
          Activity Tracker
        </li>
        <li
          className={`nav-button ${selected === "comp-off" ? "selected" : ""
            }`}
          onClick={() => handleClick("comp-off")}
        >
          Comp-off
        </li>
        <li
          className={`nav-button ${selected === "leave-app" ? "selected" : ""}`}
          onClick={() => handleClick("leave-app")}
        >
          Leave Application
        </li>
        <li
          className="logout nav-button"
          onClick={() => {
            localStorage.clear();
            handleClick("logout");
            setEmail("");
          }}
        >
          Logout 💀
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
