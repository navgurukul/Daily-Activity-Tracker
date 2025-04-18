import { handler as getLeavePolicyHandler } from './handler/getLeavePolicy.mjs';
import { handler as leaveRequestHandler } from './handler/leaveRequest.mjs';

export const handler = async (event, context) => {
  const path = event.path || "";
  const method = event.httpMethod;

  // Handle GET and POST methods for the /employmentLeavePolicy endpoint
  if (path.startsWith("/employmentLeavePolicy")) {
    if (method === "GET") {
      return await getLeavePolicyHandler(event, context); // Fetch all data
    } else if (method === "POST") {
      return await leaveRequestHandler(event, context); // Insert data
    }
  }

  return {
    statusCode: 404,
    body: JSON.stringify({ message: "Endpoint not found" }),
  };
};
