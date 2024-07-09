/* global google */
import { useState, useEffect, useContext } from "react";
import {jwtDecode} from "jwt-decode"; // Ensure you have this package installed
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { LoginContext } from "../context/LoginContext";

function Login() {
  const navigate = useNavigate();
  const dataContext = useContext(LoginContext);
  const { email, setEmail } = dataContext;

  const handleCallbackResponse = async (response) => {
    let jwtToken = response.credential;
    const decoded = jwtDecode(jwtToken);
    const userEmail = decoded?.email;

    if (userEmail.endsWith("@navgurukul.org")) {
      console.log(userEmail);
      localStorage.setItem("email", userEmail);
      setEmail(userEmail);
      navigate("/form");
    } else {
     return alert("Access restricted to NavGurukul users only.");
    }
  };

  useEffect(() => {
    google?.accounts.id.initialize({
      client_id:
        "34917283366-b806koktimo2pod1cjas8kn2lcpn7bse.apps.googleusercontent.com",
      callback: handleCallbackResponse,
    });

    google?.accounts.id.renderButton(document.getElementById("signInDiv"), {
      theme: "outline",
      width: 250,
      size: "large",
    });
  }, []);

  return (
    <div className="container">
      <div id="login-container">
        <h2 id="learn-heading">
          Login to Fill Activity Tracker and Leaves Application{" "}
        </h2>
        <div id="signInDiv" className="custom-google-button"></div>
      </div>
    </div>
  );
}

export default Login;
