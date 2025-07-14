import { useState, useEffect, useContext } from "react";
import {jwtDecode} from "jwt-decode";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { LoginContext } from "../context/LoginContext";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Message } from "@mui/icons-material";
import { useLocation } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const dataContext = useContext(LoginContext);
  const { email, setEmail } = dataContext;
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [loading, setLoading] = useState(false);
   const location=useLocation();

   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    
    useEffect(()=>{
      if(location.state?.message){
        setAlertMessage(location.state.message);
        setSnackbarOpen(true)
      }
    },[location.state])

  useEffect(() => {
    // localStorage.getItem("email") ? navigate("/activity-tracker") : null;
    sessionStorage.getItem("email") ? navigate("/activity-tracker") : navigate("/");
  },[])

  const handleCallbackResponse = async (response) => {
    setLoading(true); // Start loading
    
    let jwtToken = response.credential;
    console.log("Encoded JWT ID token: " + jwtToken);
    // sessionStorage.setItem("bearerToken", jwtToken);
    const decoded = jwtDecode(jwtToken);
    console.log("Decoded Token:", decoded);
    const userEmail = decoded?.email;
    const userName = decoded?.name;

    // localStorage.setItem("jwtToken", jwtToken);
    sessionStorage.setItem("jwtToken", jwtToken);
      const username = userEmail.split("@")[0];
      const hasNumbers = /\d/.test(username);

      if (!hasNumbers) {
        try {
          // Step 1: Get role - Backend will validate if user is authorized
          const roleUrl = `${API_BASE_URL}/accessControl?email=${userEmail}`;
          const res = await fetch(roleUrl);
          const data = await res.json();
          
          // Check if backend returned valid user data
          if (data?.items?.[0]?.role) {
            const role = data.items[0].role;

            // Step 2: Get Department info from employeeSheetRecords
            const deptRes = await fetch(
              `${API_BASE_URL}/employeeSheetRecords?sheet=pncdata`
            );
            const deptData = await deptRes.json();

            const userRecord = deptData?.data?.find(
              (entry) =>
                entry["Team ID"]?.toLowerCase() === userEmail.toLowerCase()
            );
            const department = userRecord?.Department || "Not Available";

            // Step 3: Save in localStorage and navigate
            // localStorage.setItem("email", userEmail);
            sessionStorage.setItem("email", userEmail);
            localStorage.setItem("name", userName);
            localStorage.setItem("role", role);
            localStorage.setItem("department", department);
            setEmail(userEmail);

            // Note: loading will automatically stop when navigation happens
            navigate("/activity-tracker",{
              state:{message:"Logged-in successfully!"}
            })

          } else {
            // Backend didn't return valid role - user not authorized
            setLoading(false); // Stop loading - IMPORTANT!
            setAlertMessage("Access denied. User not found in system.");
            setSnackbarOpen(true);
          }

        } catch (error) {
          console.error("Error fetching role data:", error);
          setLoading(false); // Stop loading - IMPORTANT!
          setAlertMessage("Login failed due to server error.");
          setSnackbarOpen(true);
        }
      } else {
        setLoading(false); // Stop loading - IMPORTANT!
        setAlertMessage("Please use your NavGurukul team email ID");
        setSnackbarOpen(true);
      }
  
  };

  useEffect(() => {
  google?.accounts.id.initialize({
    client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    callback: handleCallbackResponse,
  });

  google?.accounts.id.renderButton(document.getElementById("signInDiv"), {
    theme: "outline",
    width: 250,
    size: "large",
  });
}, []);

  // Re-render Google button when loading stops (after errors)
  useEffect(() => {
    if (!loading && document.getElementById("signInDiv")) {
      google?.accounts.id.renderButton(document.getElementById("signInDiv"), {
        theme: "outline",
        width: 250,
        size: "large",
      });
    }
  }, [loading]);

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <div className="main-container">
      <div id="login-container">
        <h2 id="learn-heading">
          Login to Fill Activity Tracker and Leaves Application{" "}
        </h2>
        
        {loading ? (
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
                color: '#757575',
                fontSize: '16px',
                fontWeight: 500,
                mt: 2
              }}
            >
              Authenticating your account...
            </Typography>
          </Box>
        ) : (
          <div id="signInDiv" className="custom-google-button"></div>
        )}
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
          // severity="warning"
          severity={alertMessage.includes("successfully") ? "success" : "warning"}
        >
          {alertMessage}
        </MuiAlert>
      </Snackbar>
    </div>
  );
}

export default Login;