import React from "react";
import Form from "./components/Form/Form";
import "./App.css";
import { Route, Routes, Link } from "react-router-dom";
import Leaves from "./components/Leaves/Leaves";
import Navbar from "./components/Navbar/Navbar";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Navbar />
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
        <div>
          <img
            src="/public/brain.png"
            style={{
              height: "100px",
            }}
            alt=""
          />
          <br />
          <p>Decipline &gt; Motivation</p>
        </div>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Form />} />
          <Route path="/leaves" element={<Leaves />} />
        </Routes>
      </main>
      {/* <footer className="App-footer">
        <p>&copy; 2024 @Samyarth.org. All rights reserved.</p>
      </footer> */}
    </div>
  );
}

export default App;
