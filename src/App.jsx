import React, { useContext, useEffect} from "react";
import Form from "./components/Form/Form";
import "./App.css";
import { Route, Routes, Link } from "react-router-dom";
import Leaves from "./components/Leaves/Leaves";
import Navbar from "./components/Navbar/Navbar";
import Login from "./components/Login/Login";
import NoTabNavBar from "./components/Navbar/NoTabNavbar";
import { LoginContext } from "./components/context/LoginContext";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";
import brainImg from "../public/brain.png";
import CompOff from "./components/CompOff/CompOff";
import TraansitionModal from "./components/Modal/TraansitionModal";
function App() {
  const dataContext = useContext(LoginContext);
  const { email } = dataContext;
  useEffect(() => {
    const handleBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = true; // This is required for modern browsers to show the confirmation dialog
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);
  return (
    <div className="App">
        {email && email !== "" ? <Navbar /> : <NoTabNavBar />}
     <br /><br />
      <main>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/activity-tracker"
            element={<ProtectedRoute element={<Form />} />}
          />
          <Route
            path="/comp-off-application"
            element={<ProtectedRoute element={<CompOff />} />}
          />
          <Route
            path="/leave-application"
            element={<ProtectedRoute element={<Leaves />} />}
          />
          <Route
            path="/leaves"
            element={<ProtectedRoute element={<Leaves />} />}
          />
        </Routes>
      </main>
      {/* <footer className="App-footer">
        <p>&copy; 2024 @Samyarth.org. All rights reserved.</p>
      </footer> */}
    </div>
  );
}

export default App;


