import React, { createContext, useState, useContext } from "react";

// Create context for global loading state
export const LoadingContext = createContext();

// Provider to wrap the app and manage loading state
export const LoadingProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);

  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

// Custom hook for easy access to loading context
export const useLoader = () => {
  return useContext(
    LoadingContext
  )
}