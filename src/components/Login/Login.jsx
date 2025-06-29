import { useState, useEffect, useContext } from "react";
import {jwtDecode} from "jwt-decode";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { LoginContext } from "../context/LoginContext";
import Snackbar from "@mui/material/Snackbar";
import MuiAlert from "@mui/material/Alert";
import { Message } from "@mui/icons-material";
import { useLocation } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const dataContext = useContext(LoginContext);
  const { email, setEmail } = dataContext;
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
   const location=useLocation();
    
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
    let jwtToken = response.credential;
    console.log("Encoded JWT ID token: " + jwtToken);
    // sessionStorage.setItem("bearerToken", jwtToken);
    const decoded = jwtDecode(jwtToken);
    console.log("Decoded Token:", decoded);
    const userEmail = decoded?.email;
    const userName = decoded?.name;

    // localStorage.setItem("jwtToken", jwtToken);
    sessionStorage.setItem("jwtToken", jwtToken);

    if (userEmail.endsWith("@navgurukul.org") || userEmail.endsWith("@thesama.in") || userEmail.endsWith("@samyarth.org") ){
      const username = userEmail.split("@")[0];
      const hasNumbers = /\d/.test(username);

      if (!hasNumbers) {
        try {
          // Step 1: Get role
          const roleUrl = `https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/accessControl?email=${userEmail}`;
          const res = await fetch(roleUrl);
          const data = await res.json();
          const role = data?.items?.[0]?.role || "user";

          // Step 2: Get Department info from employeeSheetRecords
          const deptRes = await fetch(
            "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employeeSheetRecords?sheet=pncdata"
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

          navigate("/activity-tracker",{
            state:{message:"Logged-in successfully!"}
          })

//           setAlertMessage('Logged-in successfully!');
//           setSnackbarOpen(true);
//           setTimeout(() => {
//   navigate("/activity-tracker");
// }, 1500);
        } catch (error) {
          console.error("Error fetching role data:", error);
          setAlertMessage("Login failed due to server error.");
          setSnackbarOpen(true);
        }
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