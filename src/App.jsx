import React, { useContext } from "react";
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

function App() {
  const dataContext = useContext(LoginContext);
  const { email } = dataContext;

  return (
    <div className="App">
      <header className="App-header">
        {email && email !== "" ? <Navbar /> : <NoTabNavBar />}

        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <br />
        <div id="img-container">
          <img
            src={brainImg}
            style={{
              height: "100px",
            }}
            alt=""
          />
          <br />
          <p>Discipline &gt; Motivation</p>
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/form" element={<ProtectedRoute element={<Form />} />} />
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
