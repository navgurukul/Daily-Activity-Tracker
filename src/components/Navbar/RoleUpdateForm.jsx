// import React, { useEffect, useState } from "react";

// const RoleUpdateForm = () => {
//   const [activeTab, setActiveTab] = useState("users");
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const [email, setEmail] = useState("");
//   const [selectedRole, setSelectedRole] = useState("admin");

//   // Fetch users on load
//   useEffect(() => {
//     const fetchUsers = async () => {
//       setLoading(true);
//       try {
//         const res = await fetch(
//           "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/accessControl"
//         );
//         const data = await res.json();
//         setUsers(data.items || []);
//       } catch (err) {
//         console.error("Failed to fetch users", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchUsers();
//   }, []);

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!email) {
//       alert("Please enter an email");
//       return;
//     }

//     const payload = {
//       email,
//       roles: [selectedRole],
//     };

//     try {
//       const res = await fetch(
//         "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/accessControl",
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json",
//             Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
//            },
//           body: JSON.stringify(payload),
//         }
//       );

//       if (res.ok) {
//         alert("Role updated successfully");
//       } else {
//         const errorData = await res.json();
//         console.error("Error:", errorData);
//         alert("Failed to update role");
//       }
//     } catch (err) {
//       console.error("Network error:", err);
//       alert("Something went wrong");
//     }
//   };

//   return (
//     <div style={{ padding: "20px", fontFamily: "sans-serif", marginLeft: "30px" }}>
//       <div style={{ marginBottom: "20px" }}>
//         <button
//           onClick={() => setActiveTab("users")}
//           style={{ marginRight: "10px" }}
//         >
//           View Users
//         </button>
//         <button onClick={() => setActiveTab("form")}>Assign Role</button>
//       </div>

//       {activeTab === "users" && (
//         <div>
//           <h2>All Users</h2>
//           {loading ? (
//             <p>Loading users...</p>
//           ) : (
//             <table
//               border="1"
//               cellPadding="8"
//               style={{ borderCollapse: "collapse", width: "100%" }}
//             >
//               <thead>
//                 <tr>
//                   <th>Email</th>
//                   <th>Role</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {users.map((user, idx) => (
//                   <tr key={idx}>
//                     <td>{user.email}</td>
//                     <td>{user.role}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>
//       )}

//       {activeTab === "form" && (
//         <div>
//           <h2>Assign Role</h2>
//           <form onSubmit={handleSubmit}>
//             <div style={{ marginBottom: "10px" }}>
//               <label>Email: </label>
//               <input
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required
//                 style={{ padding: "5px", width: "300px" }}
//               />
//             </div>

//             <div style={{ marginBottom: "10px" }}>
//               <label>Role: </label>
//               <select
//                 value={selectedRole}
//                 onChange={(e) => setSelectedRole(e.target.value)}
//                 style={{ padding: "5px", width: "200px" }}
//               >
//                 <option value="admin">Admin</option>
//                 <option value="projectManager">Project Manager</option>
//                 <option value="superAdmin">Super Admin</option>
//               </select>
//             </div>

//             <button type="submit">Assign Role</button>
//           </form>
//         </div>
//       )}
//     </div>
//   );
// };

// export default RoleUpdateForm;



import React, { useEffect, useState } from "react";

const RoleUpdateForm = () => {
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState("admin");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/accessControl"
      );
      const data = await res.json();
      setUsers(data.items || []);
    } catch (err) {
      console.error("Failed to fetch users", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAssignRole = async (e) => {
    e.preventDefault();
    if (!email) return alert("Please enter an email");

    const payload = {
      email,
      roles: [selectedRole],
    };

    try {
      const res = await fetch(
        "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/accessControl",
        {
          method: "POST",
          headers: { "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
           },
          body: JSON.stringify(payload),
        }
      );

      if (res.ok) {
        alert("Role assigned successfully");
        fetchUsers();
      } else {
        alert("Failed to assign role");
      }
    } catch (err) {
      console.error("Error assigning role:", err);
      alert("Something went wrong");
    }
  };

//   const handleDelete = async (emailToDelete) => {
//     const confirmed = window.confirm(
//       `Are you sure you want to delete all roles for ${emailToDelete}?`
//     );
//     if (!confirmed) return;

//     try {
//       const res = await fetch(
//         `https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/accessControl?email=${encodeURIComponent(
//           emailToDelete
//         )}`,
//         { method: "DELETE",
//             headers: { "Content-Type": "application/json",
//                 "Authorization": `Bearer ${localStorage.getItem("jwtToken")}`,
//             },
//          }
//       );

//       if (res.ok) {
//         alert("Role deleted successfully");
//         fetchUsers();
//       } else {
//         alert("Failed to delete role");
//       }
//     } catch (err) {
//       console.error("Error deleting role:", err);
//       alert("Something went wrong");
//     }
//   };

const handleDelete = async (emailToDelete, idToDelete) => {
  const option = window.prompt(
    `Type 'email' to delete by email or 'id' to delete by ID for user ${emailToDelete}:`
  );

  if (!option) return;

  let url = "";
  if (option.toLowerCase() === "email") {
    const confirmed = window.confirm(`Delete all roles for ${emailToDelete}?`);
    if (!confirmed) return;
    url = `https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/accessControl?email=${encodeURIComponent(
      emailToDelete
    )}`;
  } else if (option.toLowerCase() === "id") {
    const confirmed = window.confirm(`Delete user with ID ${idToDelete}?`);
    if (!confirmed) return;
    url = `https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/accessControl?Id=${idToDelete}`;
  } else {
    alert("Invalid option. Use 'email' or 'id'.");
    return;
  }

  try {
    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
      },
    });

    if (res.ok) {
      alert("Deleted successfully");
      fetchUsers();
    } else {
      alert("Failed to delete");
    }
  } catch (err) {
    console.error("Error deleting:", err);
    alert("Something went wrong");
  }
};
  

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif", marginLeft: "30px" }}>
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("users")}
          style={{ marginRight: "10px" }}
        >
          View Users
        </button>
        <button onClick={() => setActiveTab("form")}>Assign Role</button>
      </div>

      {activeTab === "users" && (
        <div>
          <h2>All Users</h2>
          {loading ? (
            <p>Loading users...</p>
          ) : (
            <table
              border="1"
              cellPadding="8"
              style={{ borderCollapse: "collapse", width: "100%" }}
            >
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>ID</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => (
                  <tr key={idx}>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user.Id}</td>
                    <td>
                      <button
                        style={{
                          background: "red",
                          color: "white",
                          border: "none",
                          padding: "5px 10px",
                          cursor: "pointer",
                        }}
                        onClick={() => handleDelete(user.email, user.Id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "form" && (
        <div>
          <h2>Assign Role</h2>
          <form onSubmit={handleAssignRole}>
            <div style={{ marginBottom: "10px" }}>
              <label>Email: </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ padding: "5px", width: "300px" }}
              />
            </div>

            <div style={{ marginBottom: "10px" }}>
              <label>Role: </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                style={{ padding: "5px", width: "200px" }}
              >
                <option value="admin">Admin</option>
                <option value="projectManager">Project Manager</option>
                <option value="superAdmin">Super Admin</option>
              </select>
            </div>

            <button type="submit">Assign Role</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default RoleUpdateForm;
