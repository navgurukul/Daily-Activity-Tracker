import React from "react";
import Form from "./components/Form/Form";
import "./App.css";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Daily Tracker Form</h1>
        <p>Fill out the form below to record your daily Tasks.</p>
      </header>
      <main>
        <Form />
      </main>
      <footer className="App-footer">
        <p>&copy; 2024 @Samyarth.org. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
