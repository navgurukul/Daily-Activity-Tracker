import React, { createContext, useEffect, useState } from "react";

const LoginContext = createContext();

function LoginProvider({ children }) {
  const [email, setEmail] = useState(localStorage.getItem("email") || "");
  const [adminEmails, setAdminEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkIfAdminUser = async () => {
      try {
        const userEmail = localStorage.getItem("email") ?? "";
        if (!userEmail) return;
        const roleUrl = `https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/accessControl?email=${userEmail}`;
        const res = await fetch(roleUrl);
        const data = await res.json();
        const role = data?.items?.[0]?.role?.toLowerCase() || "user";
        const allowedRoles = ["admin", "super admin", "project manager"];
        if (allowedRoles.includes(role)) {
          setAdminEmails([userEmail]); // Only current user's email
        } else {
          setAdminEmails([]); // Clear it if not an admin
        }
      } catch (error) {
        console.error("Error checking user role:", error);
      } finally {
        setLoading(false);
      }
    };
    checkIfAdminUser();
  }, []);

  const isAdmin = adminEmails.includes(email);
  console.log("Admin Emails:", adminEmails);
  console.log("Is Admin:", isAdmin);
  
  return (
    <LoginContext.Provider value={{ email, setEmail, isAdmin, loading }}>
      {children}
    </LoginContext.Provider>
  );
}

export { LoginProvider, LoginContext };
