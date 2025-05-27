import React, { createContext, useEffect, useState } from "react";

const LoginContext = createContext();

function LoginProvider({ children }) {
  const [email, setEmail] = useState(localStorage.getItem("email") || "");
  const [adminEmails, setAdminEmails] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAdminUsers = async () => {
      try {
        const response = await fetch(
          "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/accessControl"
        );

        if (!response.ok) {
          throw new Error("Failed to fetch admin users");
        }

        const result = await response.json();
        const adminList = result.items.map((item) => item.email);

        // Remove duplicates, if any
        const uniqueAdmins = [...new Set(adminList)];
        setAdminEmails(uniqueAdmins);
      } catch (error) {
        console.error("Error fetching admin users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAdminUsers();
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
