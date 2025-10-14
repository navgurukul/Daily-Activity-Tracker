import React, { createContext, useEffect, useState } from "react";

const LoginContext = createContext();

function LoginProvider({ children }) {
  // Existing state preserved
  const [email, setEmail] = useState(localStorage.getItem("email") || "");
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // New state for enhanced role management
  const [userRole, setUserRole] = useState("user");

  // Base API URL
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Fetch user roles
  useEffect(() => {
    const checkIfAdminUser = async () => {
      try {
        const userEmail = localStorage.getItem("email") ?? "";
        if (!userEmail) return;

        const roleUrl = `${API_BASE_URL}/accessControl`;
        const res = await fetch(`${API_BASE_URL}/accessControl`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
      });

        const data = await res.json();

        const roles =
          data?.items?.map((item) =>
            item.role.toLowerCase().replace(/\s+/g, "")
          ) || [];
        setUserRoles(roles);

        const primaryRole = data?.items?.[0]?.role || "user";
        updateUserRole(primaryRole);

      } catch (error) {
        console.error("Error checking user role:", error);
      } finally {
        setLoading(false);
      }
    };

    if (email) {
      checkIfAdminUser();
    } else {
      setLoading(false);
      setUserRoles([]);
      setUserRole("user");
    }
  }, [email]);

  // New role mapping function
  const mapRoleToStandardRole = (apiRole) => {
    if (!apiRole) return "user";

    const role = apiRole.toLowerCase().replace(/\s+/g, "");

    // Map variations to standard roles
    if (role.includes("super") || role.includes("superadmin") || role === "super_admin") {
      return "super_admin";
    }
    if (role.includes("admin") && !role.includes("super")) {
      return "admin";
    }
    if (role.includes("project") || role.includes("manager") || role === "project_manager") {
      return "project_manager";
    }

    // Default fallback
    return "user";
  };

  // Permission checking functions
  const canSeeAdminPanel = () => {
    return userRole === 'super_admin' || userRole === 'admin';
  };

  const canSeeAccessControl = () => {
    return userRole === 'super_admin' || userRole === 'admin';
  };

  const canSeeProjectManagement = () => {
    return userRole === 'super_admin' || userRole === 'admin' || userRole === 'project_manager';
  };

  // Role update function
  const updateUserRole = (role) => {
    const standardRole = mapRoleToStandardRole(role);
    setUserRole(standardRole);
  };

  // Admin role check
  const allowedRoles = ["admin", "superadmin", "projectmanager"];
  const isAdmin = userRoles.some((role) => allowedRoles.includes(role));

  // Context value
  return (
    <LoginContext.Provider
      value={{
        email,
        setEmail,
        isAdmin,
        loading,
        userRole,
        userRoles,
        setUserRole,
        updateUserRole,
        mapRoleToStandardRole,
        canSeeAdminPanel,
        canSeeAccessControl,
        canSeeProjectManagement,
      }}
    >
      {children}
    </LoginContext.Provider>
  );
}

// Export context and provider
export { LoginProvider, LoginContext };