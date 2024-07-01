import React from "react";
import Form from "./components/Form/Form";
import "./App.css";
import { Route, Routes } from "react-router-dom";
import Leaves from "./components/Leaves/Leaves";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Daily Tracker Form</h1>
        <p>Fill out the form below to record your daily Tasks.</p>
        <a href="/leaves">Leaves</a>
      </header>
      <main>
        
        <Routes>
          <Route path="/" element={<Form />} />
          <Route path="/leaves" element={<Leaves/>} />
           </Routes>
      </main>
      <footer className="App-footer">
        <p>&copy; 2024 @Samyarth.org. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
