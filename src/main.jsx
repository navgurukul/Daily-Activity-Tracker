import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { BrowserRouter } from 'react-router-dom'
import { LoginProvider } from './components/Context/LoginContext.jsx'
import { LoadingProvider } from './components/Context/LoadingContext.jsx'

ReactDOM.createRoot(document.getElementById("root")).render(
  <LoadingProvider>
    <LoginProvider>
      <BrowserRouter>
        {/* <App /> */}
        <div
          style={{
            marginTop: "100px",
            display: "flex",
            justifyContent: "start",
            alignItems: "center",
            height: "100vh",
            textAlign: "center",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          <h1>
            Going forward, please use STUB. The new link will be shared here, on Slack, and via email shortly.
          </h1>

          <a
            href="https://stub-client.navgurukul.org/auth/login"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "18px",
              padding: "10px 20px",
              backgroundColor: "#007bff",
              color: "white",
              textDecoration: "none",
              borderRadius: "5px",
            }}
          >
            Redirect to STUB
          </a>
        </div>
      </BrowserRouter>
    </LoginProvider>
  </LoadingProvider>
);
