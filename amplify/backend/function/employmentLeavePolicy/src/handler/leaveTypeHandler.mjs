import { DynamoDBClient, GetItemCommand } from "@aws-sdk/client-dynamodb";
import pkg from "@aws-sdk/lib-dynamodb";
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = pkg;
import { OAuth2Client } from 'google-auth-library';
const CLIENT_ID = '34917283366-b806koktimo2pod1cjas8kn2lcpn7bse.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);


const ddbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(ddbClient);
const TABLE_NAME = "hrmsCompensatoryAlloted";

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }
  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  try {
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'No token provided' }),
      };
    }

    // Decode the token without verifying it
    const decodedToken = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

    // Get email from the decoded token
    const { email } = decodedToken;

    // Checking if the user is trying to raise leave for themselves
    const { leaveIsRaisingFrom,userEmail } = JSON.parse(event.body);
    if (email.toLowerCase() != leaveIsRaisingFrom.toLowerCase() || email.toLowerCase() === userEmail.toLowerCase()) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          message: "You cannot raise leave for yourself. Please consult with your reporting manager or admin.",
        }),
      };
    }

  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: 'Invalid token format',
        error: error.message,
      }),
    };
  }
  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ message: "Invalid JSON body" }),
    };
  }

  const {
    leaveType,
    startDate,
    endDate,
    durationType,
    halfDayStatus,
    reasonForLeave,
    status,
    userEmail,
    leaveIsRaisingFrom,
  } = body;

  const isCompensatory = leaveType?.toLowerCase().includes("compensatory");

  const requiredFields = [
    "leaveType",
    "startDate",
    "endDate",
    "durationType",
    "reasonForLeave",
    "status",
    "userEmail",
  ];
  if (!isCompensatory) requiredFields.push("halfDayStatus");
  if (isCompensatory) requiredFields.push("leaveIsRaisingFrom");

  const missing = requiredFields.filter((f) => !body[f]);
  if (missing.length > 0) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({
        message: `Missing required fields: ${missing.join(", ")}`,
      }),
    };
  }

  const calculateLeaveDuration = (startDate, endDate, durationType, halfDayStatus) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (durationType.toLowerCase() === "full-day") return diffDays;
    if (durationType.toLowerCase() === "half-day") return 0.5;

    if (durationType.toLowerCase() === "multiple-half-day") {
      let halfDays = 0;
      if (Array.isArray(halfDayStatus)) {
        halfDays = halfDayStatus.filter((v) => v.toLowerCase() === "yes").length * 0.5;
      }
      return halfDays;
    }

    return 0;
  };

  const leaveDuration = calculateLeaveDuration(startDate, endDate, durationType, halfDayStatus);

  try {
    // Overlap check
    const existingLeaves = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "#email = :email",
        ExpressionAttributeNames: { "#email": "userEmail" },
        ExpressionAttributeValues: { ":email": userEmail },
      })
    );

    const newStart = new Date(startDate);
    const newEnd = new Date(endDate);

    if (newStart > newEnd) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ message: "Invalid date range: startDate cannot be after endDate" }),
      };
    }

    for (const item of existingLeaves.Items || []) {
      const prevStart = new Date(item.startDate);
      const prevEnd = new Date(item.endDate);
      const isOverlap = newStart <= prevEnd && newEnd >= prevStart;

      if (isOverlap) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({
            message: `Leave dates overlap with existing leave from ${item.startDate} to ${item.endDate}`,
          }),
        };
      }
    }

    // PnC validation (skip for compensatory)
    if (!isCompensatory) {
      const res = await fetch(
        "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employeeSheetRecords?sheet=pncdata"
      );
      const json = await res.json();
      const employees = json?.data || [];
      const user = employees.find(
        (emp) => emp["Team ID"]?.toLowerCase() === userEmail.toLowerCase()
      );

      if (!user) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: "User not found in PnC sheet" }),
        };
      }
    }

    // Compensatory leave specific validation
    if (isCompensatory) {
      const res = await fetch(
        "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employeeSheetRecords?sheet=pncdata"
      );
      const json = await res.json();
      const employees = json?.data || [];
      const user = employees.find(
        (emp) => emp["Team ID"]?.toLowerCase() === userEmail.toLowerCase()
      );

      if (!user) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ message: "User not found in PnC sheet" }),
        };
      }

      const managerEmail = user["Reporting maanger email ID"];
      if (!managerEmail || managerEmail.toLowerCase() !== leaveIsRaisingFrom.toLowerCase()) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({
            message: "Only the reporting manager can raise this compensatory leave request.",
          }),
        };
      }
    }

    const generateUniqueId = async () => {
      let uniqueId;
      let isUnique = false;
      while (!isUnique) {
        uniqueId = Math.floor(100000 + Math.random() * 900000).toString();
        const command = new GetItemCommand({
          TableName: TABLE_NAME,
          Key: { Id: { S: uniqueId } },
        });
        const response = await ddbClient.send(command);
        if (!response.Item) isUnique = true;
      }
      return uniqueId;
    };

    const Id = await generateUniqueId();
    const timestamp = new Date().toISOString();

    const item = {
      Id,
      userEmail,
      leaveType,
      startDate,
      endDate,
      durationType,
      halfDayStatus: halfDayStatus || null,
      reasonForLeave,
      status,
      leaveDuration,
      leaveIsRaisingFrom: isCompensatory ? leaveIsRaisingFrom : null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "Leave request submitted", data: item }),
    };
  } catch (err) {
    console.error("ERROR:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: "Internal server error", error: err.message }),
    };
  }
};