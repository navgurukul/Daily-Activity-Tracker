import React, { createContext, useEffect, useState } from "react";
const LoginContext = createContext();
function LoginProvider({ children }) {
  // const [email, setEmail] = useState(localStorage.getItem("email") || "");
  const [email, setEmail] = useState(sessionStorage.getItem("email") || "");
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const checkIfAdminUser = async () => {
      try {
        // const userEmail = localStorage.getItem("email") ?? "";
        const userEmail = sessionStorage.getItem("email") ?? "";
        if (!userEmail) return;
        const roleUrl = `https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/accessControl?email=${userEmail}`;
        const res = await fetch(roleUrl);
        const data = await res.json();
        const roles =
          data?.items?.map((item) =>
            item.role.toLowerCase().replace(/\s+/g, "")
          ) || [];
        console.log("User Roles:", roles);
        setUserRoles(roles); // store all user roles
      } catch (error) {
        console.error("Error checking user role:", error);
      } finally {
        setLoading(false);
      }
    };
    // checkIfAdminUser();
    if (email) {
    checkIfAdminUser();
  } else {
    setLoading(false);
  }
  }, [email]);
  const allowedRoles = ["admin", "superadmin", "projectmanager"];
  const isAdmin = userRoles.some((role) => allowedRoles.includes(role));
  console.log("Is Admin:", isAdmin);
  return (
    <LoginContext.Provider value={{ email, setEmail, isAdmin, loading }}>
      {children}
    </LoginContext.Provider>
  );
}
export { LoginProvider, LoginContext };
