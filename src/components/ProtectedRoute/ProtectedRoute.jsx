import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ element }) => {
  const email = localStorage.getItem("email");
  return email ? element : <Navigate to="/" />;
};

export default ProtectedRoute;
