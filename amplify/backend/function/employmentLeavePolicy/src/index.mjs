// // Import all handlers
// import {
//   handler as getLeavePolicyHandler,
//   fetchLeaveRequests
// } from './handler/getLeavePolicy.mjs';

// import { handler as leaveRequestHandler } from './handler/leaveRequest.mjs';
// // import { handler as getUserLeaveSummary } from "./handler/getUserLeaveSummary.mjs";

// export const handler = async (event, context) => {
//   const rawPath = event.path || "";
//   const method = event.httpMethod;

//   // Remove stage prefix like "/dev" if present
//   const path = rawPath.replace(/^\/dev/, "");

//   const url = new URL(path + (event.rawQueryString ? "?" + event.rawQueryString : ""), "http://localhost");
//   const queryParams = Object.fromEntries(url.searchParams.entries());

//   console.log("Cleaned path:", path);
//   console.log("Query params:", queryParams);

//   // Handle /employmentLeavePolicy endpoint
//   if (path.startsWith("/employmentLeavePolicy")) {
//     if (method === "GET") {
//       return await getLeavePolicyHandler(); // GET request to fetch policy
//     } else if (method === "POST") {
//       return await leaveRequestHandler(event, context); // POST to apply leave
//     }
//   }

//   // Example: internal fetch test (if needed in future)
//   if (path === "/rawLeaveData") {
//     const data = await fetchLeaveRequests();
//     return {
//       statusCode: 200,
//       body: JSON.stringify({ success: true, data }),
//     };
//   }

//   return {
//     statusCode: 404,
//     body: JSON.stringify({ message: "Endpoint not found" }),
//   };
// };



// index.mjs

// Import all handlers
import {
  handler as getLeavePolicyHandler,
  fetchLeaveRequests
} from './handler/getLeavePolicy.mjs';

import { handler as leaveRequestHandler } from './handler/leaveRequest.mjs';
import { handler as leaveTypeHandler } from './handler/leaveTypeHandler.mjs';

export const handler = async (event, context) => {
  const rawPath = event.path || "";
  const method = event.httpMethod;

  // Remove stage prefix like "/dev" if present
  const path = rawPath.replace(/^\/dev/, "");

  const url = new URL(path + (event.rawQueryString ? "?" + event.rawQueryString : ""), "http://localhost");
  const queryParams = Object.fromEntries(url.searchParams.entries());

  console.log("Cleaned path:", path);
  console.log("Query params:", queryParams);

  // Handle specific leaveType POST: /employmentLeavePolicy/{leaveType}
  const leaveTypeMatch = path.match(/^\/employmentLeavePolicy\/([^\/]+)$/);
  if (leaveTypeMatch && method === "POST") {
    event.pathParameters = {
      leaveType: leaveTypeMatch[1],
    };
    return await leaveTypeHandler(event, context);
  }

  // Handle /employmentLeavePolicy
  if (path === "/employmentLeavePolicy") {
    if (method === "GET") {
      return await getLeavePolicyHandler(event, context);
    } else if (method === "POST") {
      return await leaveRequestHandler(event, context);
    }
  }

  // Example: internal fetch test (if needed in future)
  if (path === "/rawLeaveData") {
    const data = await fetchLeaveRequests();
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data }),
    };
  }

  return {
    statusCode: 404,
    body: JSON.stringify({ message: "Endpoint not found" }),
  };
};