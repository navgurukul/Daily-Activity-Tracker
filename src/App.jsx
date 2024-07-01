import React from "react";
import Form from "./components/Form/Form";
import "./App.css";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Daily Achievements Form</h1>
        <p>Fill out the form below to record your daily achievements.</p>
      </header>
      <main>
        <Form />
      </main>
      <footer className="App-footer">
        <p>&copy; 2024 Your Company. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
