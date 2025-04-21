/* global google */
import { useState, useEffect, useContext } from "react";
import {jwtDecode} from "jwt-decode"; // Ensure you have this package installed
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { LoginContext } from "../context/LoginContext";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";

function Login() {
  const navigate = useNavigate();
  const dataContext = useContext(LoginContext);
  const { email, setEmail } = dataContext;
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    localStorage.getItem("email") ? navigate("/activity-tracker") : null;
  },[])
  const handleCallbackResponse = async (response) => {
    let jwtToken = response.credential;
    console.log("Encoded JWT ID token: " + jwtToken);
    
    const decoded = jwtDecode(jwtToken);
    console.log("Decoded Token:", decoded);
    const userEmail = decoded?.email;
    console.log("User Email:", userEmail);

    if (userEmail.endsWith("@navgurukul.org") || userEmail.endsWith("@thesama.in") || userEmail.endsWith("@samyarth.org") ){
      const username = userEmail.split("@")[0];
      const hasNumbers = /\d/.test(username);

      if (!hasNumbers) {
        console.log(userEmail);
        localStorage.setItem("email", userEmail);
        setEmail(userEmail);
        navigate("/activity-tracker");
      } else {
        setAlertMessage("Please use a NavGurukul email without numbers.");
        setSnackbarOpen(true);
      }
    } else {
      setAlertMessage("Access restricted to NavGurukul users only.");
      setSnackbarOpen(true);
    }
  };

  useEffect(() => {
    google?.accounts.id.initialize({
      client_id: "34917283366-b806koktimo2pod1cjas8kn2lcpn7bse.apps.googleusercontent.com",
      callback: handleCallbackResponse,
    });

    google?.accounts.id.renderButton(document.getElementById("signInDiv"), {
      theme: "outline",
      width: 250,
      size: "large",
    });
  }, []);

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <div className="main-container">
      <div id="login-container">
        <h2 id="learn-heading">
          Login to Fill Activity Tracker and Leaves Application{" "}
        </h2>
        <div id="signInDiv" className="custom-google-button"></div>
      </div>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <MuiAlert
          elevation={6}
          variant="filled"
          onClose={handleCloseSnackbar}
          severity="warning"
        >
          {alertMessage}
        </MuiAlert>
      </Snackbar>
    </div>
  );
}

export default Login;
