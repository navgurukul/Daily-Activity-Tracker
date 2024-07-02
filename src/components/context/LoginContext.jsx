import React, { createContext, useEffect, useState } from "react";

const LoginContext = createContext();

function LoginProvider({ children }) {
  const [email, setEmail] = useState(localStorage.getItem("email") || "");
  // This create context creates a new object with a provider and a consumer.
  useEffect(() => {
    console.log(email);
  }, [email]);
  // This is also known as Context API => This enables us to transfer data without prop drilling.
  // This is a way to share data between components without having to pass props down manually at every level.

  return (
    // Provider is used to provide the data to the child components
    <LoginContext.Provider value={{ email, setEmail }}>
      {children}
    </LoginContext.Provider>
  );
}

export { LoginProvider, LoginContext };
