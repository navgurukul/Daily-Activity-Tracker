import React, { createContext, useEffect, useState } from "react";

const LoginContext = createContext();

function LoginProvider({ children }) {
  const [email, setEmail] = useState(localStorage.getItem("email") || "");
  // const [email, setEmail] = useState("amruta@navgurukul.org");
  useEffect(() => {
  }, [email]);
  return (
    <LoginContext.Provider value={{ email, setEmail }}>
      {children}
    </LoginContext.Provider>
  );
}

export { LoginProvider, LoginContext };
