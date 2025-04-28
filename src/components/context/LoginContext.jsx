import React, { createContext, useEffect, useState } from "react";

const LoginContext = createContext();

function LoginProvider({ children }) {
  const [email, setEmail] = useState(localStorage.getItem("email") || "");
  // const [email, setEmail] = useState("amruta@navgurukul.org");

  const adminEmails = [
    "amitkumar@navgurukul.org",
    "puran@navgurukul.org",
    "amruta@navgurukul.org",
    "ujjwal@navgurukul.org",
  ];
  const userEmail = localStorage.getItem("email");
  const isAdmin = adminEmails.includes(userEmail);

  useEffect(() => {
  }, [email]);
  return (
    <LoginContext.Provider value={{ email, setEmail, isAdmin}}>
      {children}
    </LoginContext.Provider>
  );
}

export { LoginProvider, LoginContext };
