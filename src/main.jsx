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
        <App />
      </BrowserRouter>
    </LoginProvider>
  </LoadingProvider>
);