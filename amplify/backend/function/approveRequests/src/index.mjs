
// ✅ NEW: Import approveLeaveHandler
import { handler as approveLeaveHandler } from './handler/approveLeave.mjs';

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
  // const leaveTypeMatch = path.match(/^\/employmentLeavePolicy\/([^\/]+)$/);
  // if (leaveTypeMatch && method === "POST") {
  //   event.pathParameters = {
  //     leaveType: leaveTypeMatch[1],
  //   };
  //   return await leaveTypeHandler(event, context);
  // }

  // Handle /employmentLeavePolicy
  if (path === "/employmentLeavePolicy") {
     if (method === "PUT") {
      return await approveLeaveHandler(event, context);
    }
  }

  return {
    statusCode: 404,
    body: JSON.stringify({ message: "Endpoint not found" }),
  };
};
