import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { LoginProvider } from './components/context/LoginContext.jsx'

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LoginProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </LoginProvider>
  </React.StrictMode>
);
