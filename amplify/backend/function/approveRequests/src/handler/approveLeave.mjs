
import { DynamoDBClient, UpdateItemCommand,GetItemCommand } from "@aws-sdk/client-dynamodb";
import { OAuth2Client } from 'google-auth-library'; // Import Google Auth library

const CLIENT_ID = '34917283366-b806koktimo2pod1cjas8kn2lcpn7bse.apps.googleusercontent.com';

const client = new DynamoDBClient({ region: "ap-south-1" });

// Initialize the OAuth2Client with your Google Client ID
const oauth2Client = new OAuth2Client(CLIENT_ID);

export const handler = async (event, context) => {
  try {
    // Handle CORS preflight request
    if (event.requestContext?.http?.method === "OPTIONS" || event.httpMethod === "OPTIONS") {
      return corsResponse();
    }

    // Extract Authorization header
    const authHeader = event.headers?.Authorization || event.headers?.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(401, "Missing or invalid Authorization header");
    }

    // Extract token from Authorization header
    const token = authHeader.split(" ")[1];

    // Verify Google Token
    // const decodedToken = await verifyGoogleToken(token);  // Using verifyGoogleToken to validate the token
    const body = safeJsonParse(event.body);
    if (!body) {
      return errorResponse(400, "Invalid JSON body");
    }
    const decodedToken= { email: "testuser@example.com" }; 

    if (!decodedToken || !decodedToken.email) {
      return errorResponse(400, "Invalid token: Email not found in token");
    }

    const approverEmail = body.approverEmail;

    // Parse the body to extract request data

    const { Id, status } = body;  // No need for approverEmail in the body anymore

    // Check if required fields are provided
    if (!Id || !status) {
      return errorResponse(400, "Missing required fields: Id, status");
    }

    // Validate the status value
    const allowedStatus = ["approved", "rejected", "pending"];
    if (!allowedStatus.includes(status)) {
      return errorResponse(400, "Invalid status. Must be one of: approved, rejected, pending");
    }
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>ReportingManager/Admin>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

     // Step 1: Get userEmail from DynamoDB
     const getUserEmailCommand = new GetItemCommand({
      TableName: "hrmsLeaveRequests",
      Key: { Id: { S: Id } },
      ProjectionExpression: "userEmail"
    });
    const userEmailResult = await client.send(getUserEmailCommand);

    if (!userEmailResult.Item || !userEmailResult.Item.userEmail?.S) {
      return errorResponse(404, "Leave request not found or missing userEmail");
    }

    const userEmail = userEmailResult.Item.userEmail.S.toLowerCase();

    // Step 2: Fetch employee records from API
    const apiResponse = await fetch("https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employeeSheetRecords?sheet=pncdata");
    const apiJson = await apiResponse.json();

    if (!apiJson.success || !Array.isArray(apiJson.data)) {
      return errorResponse(500, "Failed to fetch employee data");
    }

    const employeeRecord = apiJson.data.find(emp => emp["Team ID"]?.toLowerCase() === userEmail);
    if (!employeeRecord) {
      return errorResponse(403, "User not found in employee records");
    }

    const reportingManagerEmail = employeeRecord["Reporting maanger email ID"]?.toLowerCase();

    // if (reportingManagerEmail !== approverEmail) {
    //   return errorResponse(403, "Only the Reporting Manager can approve this request");
    // }
    if (reportingManagerEmail.toLowerCase() !== approverEmail.toLowerCase()) {
      // Check if approver is an admin
      const accessControlParams = {
        TableName: "hrmsAccessControler",
        FilterExpression: "email = :emailVal AND #r = :adminRole",
        ExpressionAttributeNames: {
          "#r": "role"
        },
        ExpressionAttributeValues: {
          ":emailVal": { S: approverEmail.toLowerCase() },
          ":adminRole": { S: "admin" },
        }
      };
    
      const { ScanCommand } = await import("@aws-sdk/client-dynamodb");
      const accessScanCommand = new ScanCommand(accessControlParams);
      const accessResult = await client.send(accessScanCommand);
    
      const isAdmin = (accessResult.Items || []).length > 0;
    
      if (!isAdmin) {
        return errorResponse(403, "Only the Reporting Manager or an Admin can approve this request");
      }
    }
    

    // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>ReportingManager/Admin>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
    // Get the current timestamp for the approval date
    const approvalDate = new Date().toISOString();

    // Set up parameters for DynamoDB update request
    const params = {
      TableName: "hrmsLeaveRequests",
      Key: { Id: { S: Id } },
      UpdateExpression: "SET approverEmail = :approverEmail, approvalDate = :approvalDate, #s = :status",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: {
        ":approverEmail": { S: approverEmail },
        ":approvalDate": { S: approvalDate },
        ":status": { S: status },
      },
      ReturnValues: "ALL_NEW",  // Return the updated item
      ConditionExpression: "attribute_exists(Id)",  // Ensure that the leave request exists
    };

    // Execute DynamoDB Update command
    const command = new UpdateItemCommand(params);
    const result = await client.send(command);

    // Clean the returned DynamoDB item for response
    const cleanedData = cleanDynamoDBItem(result.Attributes);

    // Return success response
    return successResponse(200, {
      message: "Leave request updated successfully",
      data: cleanedData,
    });

  } catch (error) {
    console.error("Error updating leave request:", error);

    // Handle specific errors
    if (error.name === "ConditionalCheckFailedException") {
      return errorResponse(404, "Leave request not found with the given Id.");
    }

    if (error.name === "ValidationException") {
      return errorResponse(400, "Invalid request parameters");
    }

    // Default internal server error response
    return errorResponse(500, "Internal Server Error", error.message);
  }
};

// CORS Headers for preflight and normal responses
const corsHeaders = () => ({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
});

// CORS response for OPTIONS method (preflight request)
const corsResponse = () => ({
  statusCode: 200,
  headers: corsHeaders(),
  body: JSON.stringify({ message: "CORS preflight OK" }),
});

// Success response format
const successResponse = (statusCode, bodyObj) => ({
  statusCode,
  headers: corsHeaders(),
  body: JSON.stringify(bodyObj),
});

// Error response format
const errorResponse = (statusCode, message, debug = undefined) => ({
  statusCode,
  headers: corsHeaders(),
  body: JSON.stringify({ message, debug }),
});

// Safe JSON parsing utility function
const safeJsonParse = (jsonString) => {
  try {
    return JSON.parse(jsonString || "{}");
  } catch {
    return null;
  }
};

// Function to verify Google ID token
const verifyGoogleToken = async (token) => {
  try {
    const ticket = await oauth2Client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,  // Ensure audience matches Google Client ID
    });

    const payload = ticket.getPayload();
    return payload;  // Contains email, name, etc.
  } catch (error) {
    console.error("Error verifying token:", error);
    return null;
  }
};

// Clean DynamoDB item attributes to return only primitive values
const cleanDynamoDBItem = (item) => {
  const cleaned = {};
  for (const key in item) {
    const value = item[key];
    if (value?.S !== undefined) cleaned[key] = value.S;
    else if (value?.N !== undefined) cleaned[key] = Number(value.N);
    else if (value?.BOOL !== undefined) cleaned[key] = value.BOOL;
  }
  return cleaned;
};
