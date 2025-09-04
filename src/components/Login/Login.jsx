import { useState, useEffect, useContext } from "react";
import { jwtDecode } from "jwt-decode";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { LoginContext } from "../Context/LoginContext";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import { useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  // Context
  const dataContext = useContext(LoginContext);
  const { email, setEmail, updateUserRole } = dataContext;

  // State management
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // API URLs
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Show alert message if exists
  useEffect(() => {
    if (location.state?.message) {
      setAlertMessage(location.state.message);
      setSnackbarOpen(true);
    }
  }, [location.state]);

  // Auto-redirect if already logged in
  useEffect(() => {
    localStorage.getItem("email")
      ? navigate("/activity-tracker")
      : navigate("/");
  }, []);

  // Auto-show login button after alert message
  useEffect(() => {
    if (alertMessage && snackbarOpen) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [alertMessage, snackbarOpen]);

  // All Existing Google auth Logic preserved 
  useEffect(() => {
    google?.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCallbackResponse,
    });

    google?.accounts.id.renderButton(document.getElementById("signInDiv"), {
      theme: "outline",
      width: 250,
      size: "large",
    });
  }, []);

  // Snackbar close handler
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // Enhanced callback with role management
  const handleCallbackResponse = async (response) => {
    setLoading(true);

    // Get JWT token from response
    let jwtToken = response.credential;
    const decoded = jwtDecode(jwtToken);
    const userEmail = decoded?.email;
    const userName = decoded?.name;

    // Save JWT token to local storage
    localStorage.setItem("jwtToken", jwtToken);

    // All existing email validation preserved
    const username = userEmail.split("@")[0];
    const hasNumbers = /\d/.test(username);

    if (!hasNumbers) {
      try {
        // Step 1: Fetch role from accessControl API
        const roleUrl = `${API_BASE_URL}/accessControl?email=${userEmail}`;
        const res = await fetch(roleUrl);
        const data = await res.json();

        // All existing error handling preserved
        if (
          data.message &&
          data.message.toLowerCase().includes("email not present in pnc")
        ) {
          setLoading(false);
          setAlertMessage("Access denied: User not found in system ");
          setSnackbarOpen(true);
          return;
        }

        // Enhanced role processing
        const rawRole = data?.items?.[0]?.role || "user";

        // Step 2: Fetch Department info
        const deptRes = await fetch(
          `${API_BASE_URL}/employeeSheetRecords?sheet=pncdata`
        );
        const deptData = await deptRes.json();

        const userRecord = deptData?.data?.find(
          (entry) => entry["Team ID"]?.toLowerCase() === userEmail.toLowerCase()
        );
        const department = userRecord?.Department || "Not Available";

        // Step 3: Store user information in local storage
        localStorage.setItem("email", userEmail);
        localStorage.setItem("name", userName);
        localStorage.setItem("role", rawRole);
        localStorage.setItem("department", department);
        setEmail(userEmail);

        // Update context immediately with role
        updateUserRole(rawRole);

        // Navigate to activity tracker
        navigate("/activity-tracker", {
          state: { message: "Logged-in successfully!" },
        });
      } catch (error) {
        console.error("Error fetching role data:", error);
        setLoading(false);
        setAlertMessage("Login failed due to server error.");
        setSnackbarOpen(true);
      }
    } else {
      // Invalid email (not Navgurukul email)
      setLoading(false);
      setAlertMessage(" Please use your Navgurukul email id ");
      setSnackbarOpen(true);
    }
  };

  // All existing JSX completely preserved
  return (
    <div className="main-container">
      <div id="login-container">
        <h2 id="learn-heading">
          Login to Fill Activity Tracker and Leaves Application{" "}
        </h2>

        {/* Google Sign-In button */}
        <div id="signInDiv" className="custom-google-button"></div>

        {/* Show loader below button when loading */}
        {loading && (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            sx={{ mt: 3, mb: 3 }}
          >
            <div className="segmented-loader"></div>
            <Typography
              variant="body1"
              sx={{
                color: "#757575",
                fontSize: "16px",
                fontWeight: 500,
                mt: 2,
              }}
            >
              Authenticating your account...
            </Typography>
          </Box>
        )}
      </div>

      {/* Snackbar for alerts (success or warning) */}
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
          severity={
            alertMessage.includes("successfully") ? "success" : "warning"
          }
        >
          {alertMessage}
        </MuiAlert>
      </Snackbar>
    </div>
  );
}

export default Login;