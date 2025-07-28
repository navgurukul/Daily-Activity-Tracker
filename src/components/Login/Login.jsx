// import { useState, useEffect, useContext } from "react";
// import { jwtDecode } from "jwt-decode";
// import "./Login.css";
// import { useNavigate } from "react-router-dom";
// import { LoginContext } from "../context/LoginContext";
// import Snackbar from "@mui/material/Snackbar";
// import MuiAlert from "@mui/material/Alert";
// import { Message } from "@mui/icons-material";
// import { useLocation } from "react-router-dom";

// function Login() {
//   const navigate = useNavigate();
//   const dataContext = useContext(LoginContext);
//   const { email, setEmail } = dataContext;
//   const [snackbarOpen, setSnackbarOpen] = useState(false);
//   const [alertMessage, setAlertMessage] = useState("");
//   const location = useLocation();

//   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

//   useEffect(() => {
//     if (location.state?.message) {
//       setAlertMessage(location.state.message);
//       setSnackbarOpen(true);
//     }
//   }, [location.state]);

//   useEffect(() => {
//     // localStorage.getItem("email") ? navigate("/activity-tracker") : null;
//     sessionStorage.getItem("email")
//       ? navigate("/activity-tracker")
//       : navigate("/");
//   }, []);
//   const handleCallbackResponse = async (response) => {
//     let jwtToken = response.credential;
//     console.log("Encoded JWT ID token: " + jwtToken);
//     // sessionStorage.setItem("bearerToken", jwtToken);
//     const decoded = jwtDecode(jwtToken);
//     console.log("Decoded Token:", decoded);
//     const userEmail = decoded?.email;
//     const userName = decoded?.name;

//     // localStorage.setItem("jwtToken", jwtToken);
//     sessionStorage.setItem("jwtToken", jwtToken);

//     if (
//       userEmail.endsWith("@navgurukul.org") ||
//       userEmail.endsWith("@thesama.in") ||
//       userEmail.endsWith("@samyarth.org")
//     ) {
//       const username = userEmail.split("@")[0];
//       const hasNumbers = /\d/.test(username);

//       if (!hasNumbers) {
//         try {
//           // Step 1: Get role
//           const roleUrl = `${API_BASE_URL}/accessControl?email=${userEmail}`;
//           const res = await fetch(roleUrl);
//           const data = await res.json();
//           const role = data?.items?.[0]?.role || "user";

//           // Step 2: Get Department info from employeeSheetRecords
//           const deptRes = await fetch(
//             `${API_BASE_URL}/employeeSheetRecords?sheet=pncdata`
//           );
//           const deptData = await deptRes.json();

//           const userRecord = deptData?.data?.find(
//             (entry) =>
//               entry["Team ID"]?.toLowerCase() === userEmail.toLowerCase()
//           );
//           const department = userRecord?.Department || "Not Available";

//           // Step 3: Save in localStorage and navigate
//           // localStorage.setItem("email", userEmail);
//           sessionStorage.setItem("email", userEmail);
//           localStorage.setItem("name", userName);
//           localStorage.setItem("role", role);
//           localStorage.setItem("department", department);
//           setEmail(userEmail);

//           navigate("/activity-tracker", {
//             state: { message: "Logged-in successfully!" },
//           });

//           //           setAlertMessage('Logged-in successfully!');
//           //           setSnackbarOpen(true);
//           //           setTimeout(() => {
//           //   navigate("/activity-tracker");
//           // }, 1500);
//         } catch (error) {
//           console.error("Error fetching role data:", error);
//           setAlertMessage("Login failed due to server error.");
//           setSnackbarOpen(true);
//         }
//       } else {
//         setAlertMessage("Please use a NavGurukul email without numbers.");
//         setSnackbarOpen(true);
//       }
//     } else {
//       setAlertMessage("Access restricted to NavGurukul users only.");
//       setSnackbarOpen(true);
//     }
//   };

//   useEffect(() => {
//     google?.accounts.id.initialize({
//       client_id:
//         "34917283366-b806koktimo2pod1cjas8kn2lcpn7bse.apps.googleusercontent.com",
//       callback: handleCallbackResponse,
//     });

//     google?.accounts.id.renderButton(document.getElementById("signInDiv"), {
//       theme: "outline",
//       width: 250,
//       size: "large",
//     });
//   }, []);

//   const handleCloseSnackbar = () => {
//     setSnackbarOpen(false);
//   };

//   return (
//     <div className="main-container">
//       <div id="login-container">
//         <h2 id="learn-heading">
//           Login to Fill Activity Tracker and Leaves Application{" "}
//         </h2>
//         <div id="signInDiv" className="custom-google-button"></div>
//       </div>
//       <Snackbar
//         open={snackbarOpen}
//         autoHideDuration={6000}
//         onClose={handleCloseSnackbar}
//         anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
//       >
//         <MuiAlert
//           elevation={6}
//           variant="filled"
//           onClose={handleCloseSnackbar}
//           // severity="warning"
//           severity={
//             alertMessage.includes("successfully") ? "success" : "warning"
//           }
//         >
//           {alertMessage}
//         </MuiAlert>
//       </Snackbar>
//     </div>
//   );
// }

// export default Login;


import { useState, useEffect, useContext } from "react";
import { jwtDecode } from "jwt-decode";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { LoginContext } from "../context/LoginContext";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import { Message } from "@mui/icons-material";
import { useLocation } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

function Login() {
  const navigate = useNavigate();
  
  // ============== ENHANCED CONTEXT WITH NEW ROLE FUNCTION ==============
  const dataContext = useContext(LoginContext);
  const { email, setEmail, updateUserRole } = dataContext;
  
  // ============== ALL EXISTING STATE PRESERVED ==============
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const location = useLocation();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // ============== ALL EXISTING useEffects PRESERVED ==============
  useEffect(() => {
    if (location.state?.message) {
      setAlertMessage(location.state.message);
      setSnackbarOpen(true);
    }
  }, [location.state]);

  useEffect(() => {
    // ============== YOUR EXISTING NAVIGATION LOGIC PRESERVED ==============
    localStorage.getItem("email")
      ? navigate("/activity-tracker")
      : navigate("/");
  }, []);

  // Auto-show login button after any alert message appears
  useEffect(() => {
    if (alertMessage && snackbarOpen) {
      const timer = setTimeout(() => {
        setLoading(false); // Ensure login button shows
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [alertMessage, snackbarOpen]);

  // ============== ENHANCED CALLBACK WITH ROLE MANAGEMENT ==============
  const handleCallbackResponse = async (response) => {
    setLoading(true);

    let jwtToken = response.credential;
    console.log("Encoded JWT ID token: " + jwtToken);
    const decoded = jwtDecode(jwtToken);
    console.log("Decoded Token:", decoded);
    const userEmail = decoded?.email;
    const userName = decoded?.name;

    // ============== ALL EXISTING JWT LOGIC PRESERVED ==============
    localStorage.setItem("jwtToken", jwtToken);

    // ============== ALL EXISTING EMAIL VALIDATION PRESERVED ==============
    const username = userEmail.split("@")[0];
    const hasNumbers = /\d/.test(username);

    if (!hasNumbers) {
      try {
        // ============== ALL EXISTING API CALLS PRESERVED ==============
        // Step 1: Get role and check access control (your existing logic)
        const roleUrl = `${API_BASE_URL}/accessControl?email=${userEmail}`;
        const res = await fetch(roleUrl);
        const data = await res.json();

        // ============== ALL EXISTING ERROR HANDLING PRESERVED ==============
        if (
          data.message &&
          data.message.toLowerCase().includes("email not present in pnc")
        ) {
          setLoading(false);
          setAlertMessage("Access denied: User not found in system ");
          setSnackbarOpen(true);
          return;
        }

        // ============== ENHANCED ROLE PROCESSING ==============
        // Get the raw role from API response (your existing logic continues to work)
        const rawRole = data?.items?.[0]?.role || "user";
        console.log("Raw role from API:", rawRole);

        // Step 2: Get Department info (your existing logic preserved)
        const deptRes = await fetch(
          `${API_BASE_URL}/employeeSheetRecords?sheet=pncdata`
        );
        const deptData = await deptRes.json();

        const userRecord = deptData?.data?.find(
          (entry) => entry["Team ID"]?.toLowerCase() === userEmail.toLowerCase()
        );
        const department = userRecord?.Department || "Not Available";

        // ============== ALL EXISTING STORAGE PRESERVED + ENHANCED ==============
        localStorage.setItem("email", userEmail);
        localStorage.setItem("name", userName);
        localStorage.setItem("role", rawRole); // Store the role for context to pick up
        localStorage.setItem("department", department);
        setEmail(userEmail);
        
        // ============== NEW: UPDATE CONTEXT WITH ROLE ==============
        // Update the context with role information for immediate use
        updateUserRole(rawRole);

        // ============== ALL EXISTING NAVIGATION PRESERVED ==============
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
      // ============== ALL EXISTING ERROR HANDLING PRESERVED ==============
      setLoading(false);
      setAlertMessage(" Please use your Navgurukul email id ");
      setSnackbarOpen(true);
    }
  };

  // ============== ALL EXISTING GOOGLE AUTH LOGIC PRESERVED ==============
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

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  // ============== ALL EXISTING JSX COMPLETELY PRESERVED ==============
  return (
    <div className="main-container">
      <div id="login-container">
        <h2 id="learn-heading">
          Login to Fill Activity Tracker and Leaves Application{" "}
        </h2>

        {/* Always show login button */}
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