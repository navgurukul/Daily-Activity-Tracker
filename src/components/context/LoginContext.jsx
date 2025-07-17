


import React, { createContext, useEffect, useState } from "react";

const LoginContext = createContext();

function LoginProvider({ children }) {
  // ============== EXISTING STATE PRESERVED (EXACTLY AS YOUR CODE) ==============
  const [email, setEmail] = useState(sessionStorage.getItem("email") || "");
  const [userRoles, setUserRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // ============== NEW STATE FOR ENHANCED ROLE MANAGEMENT ==============
  const [userRole, setUserRole] = useState("user"); // Single standardized role

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // ============== NEW ROLE MAPPING FUNCTION ==============
  /**
   * Map API role to standardized role format
   * This helps us handle different role naming conventions
   */
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
    
    return "user"; // Default fallback
  };

  // ============== NEW PERMISSION CHECKING FUNCTIONS ==============
  /**
   * Check if user can see Admin Panel (Super Admin and Admin only)
   */
const canSeeAdminPanel = () => {
  return userRole === 'super_admin' || userRole === 'admin' || userRole === 'project_manager';
};

  /**
   * Check if user can see Access Control (Super Admin and Admin only)
   */
  const canSeeAccessControl = () => {
    return userRole === 'super_admin' || userRole === 'admin';
  };

  /**
   * Check if user can see Project Management (Project Manager and above)
   */
const canSeeProjectManagement = () => {
  return userRole === 'super_admin' || userRole === 'admin';
};
  // ============== ROLE UPDATE FUNCTION ==============
  /**
   * Update user role and maintain all existing functionality
   */
  const updateUserRole = (role) => {
    const standardRole = mapRoleToStandardRole(role);
    setUserRole(standardRole);
    
    console.log("Role updated:", { 
      original: role, 
      standardized: standardRole 
    });
  };

  // ============== EXISTING useEffect PRESERVED WITH ENHANCEMENTS ==============
  useEffect(() => {
    const checkIfAdminUser = async () => {
      try {
        // ============== YOUR EXISTING LOGIC EXACTLY PRESERVED ==============
        const userEmail = sessionStorage.getItem("email") ?? "";
        if (!userEmail) return;
        const roleUrl = `${API_BASE_URL}/accessControl?email=${userEmail}`;
        const res = await fetch(roleUrl);
        const data = await res.json();
        const roles =
          data?.items?.map((item) =>
            item.role.toLowerCase().replace(/\s+/g, "")
          ) || [];
        console.log("User Roles:", roles);
        setUserRoles(roles); // store all user roles (YOUR EXISTING LOGIC)

        // ============== NEW ENHANCEMENT: STANDARDIZED ROLE ==============
        // Get the primary role for standardized role management
        const primaryRole = data?.items?.[0]?.role || "user";
        updateUserRole(primaryRole);
        
      } catch (error) {
        console.error("Error checking user role:", error);
      } finally {
        setLoading(false);
      }
    };

    // ============== YOUR EXISTING CONDITION LOGIC PRESERVED ==============
    if (email) {
      checkIfAdminUser();
    } else {
      setLoading(false);
      // Reset states when no email (enhancement)
      setUserRoles([]);
      setUserRole("user");
    }
  }, [email]);

  // ============== YOUR EXISTING ADMIN CHECK EXACTLY PRESERVED ==============
  const allowedRoles = ["admin", "superadmin", "projectmanager"];
  const isAdmin = userRoles.some((role) => allowedRoles.includes(role));
  console.log("Is Admin:", isAdmin);

  // ============== ENHANCED CONTEXT VALUE ==============
  return (
    <LoginContext.Provider 
      value={{ 
        // ============== ALL YOUR EXISTING VALUES PRESERVED ==============
        email, 
        setEmail, 
        isAdmin,  // Your existing isAdmin logic preserved
        loading,
        
        // ============== NEW ENHANCED VALUES ADDED ==============
        userRole, // Standardized single role
        userRoles, // Your existing roles array
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

export { LoginProvider, LoginContext };
