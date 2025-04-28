import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "ap-south-1" });
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  console.log("Received event:", JSON.stringify(event));

  const employeeEmail = event.queryStringParameters?.employeeEmail;

  console.log("employeeEmail param:", employeeEmail);

  if (!employeeEmail) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing employeeEmail" }),
      headers: {
        "Access-Control-Allow-Origin": "*", // Allow all origins
        "Access-Control-Allow-Methods": "OPTIONS,GET", // Allow GET and OPTIONS methods
        "Access-Control-Allow-Headers": "Content-Type,Authorization", // Allow headers
      },
    };
  }

  const params = {
    TableName: "hrmsLeaveRequests",
    IndexName: "userEmail-index", // GSI Name
    KeyConditionExpression: "userEmail = :email", // Query by userEmail
    ExpressionAttributeValues: {
      ":email": employeeEmail, // Employee email as parameter
    },
    ScanIndexForward: false, // Optional: false to sort in descending order (latest records first)
  };

  try {
    const result = await docClient.send(new QueryCommand(params));
    console.log("Query result:", result);

    // Group by status: approved, pending, rejected
    const leaveHistory = {
      approved: [],
      pending: [],
      rejected: [],
    };

    result.Items.forEach((item) => {
      // Determine the sort key based on approvalDate, startDate or endDate
      const sortDate = item.approvalDate || item.startDate || item.endDate;
      
      // Add the item to the appropriate group based on status
      if (item.status === 'approved') {
        leaveHistory.approved.push({
          leaveType: item.leaveType,
          approvalDate: item.approvalDate,
          approvalEmail: item.approverEmail,
          startDate: item.startDate,
          endDate: item.endDate,
          leaveDuration: item.leaveDuration,
          reasonForLeave: item.reasonForLeave,

        });
      } else if (item.status === 'pending') {
        leaveHistory.pending.push({
          leaveType: item.leaveType,
          status: item.status,
          startDate: item.startDate,
          endDate: item.endDate,
          leaveDuration: item.leaveDuration,
          reasonForLeave: item.reasonForLeave,

        });
      } else if (item.status === 'rejected') {
        leaveHistory.rejected.push({
          leaveType: item.leaveType,
          status: item.status,
          startDate: item.startDate,
          endDate: item.endDate,
          leaveDuration: item.leaveDuration,
          reasonForLeave: item.reasonForLeave,

        });
      }
    });

    // Sort each category by the `sortDate` (latest first)
    const sortByDate = (a, b) => new Date(b.sortDate) - new Date(a.sortDate);
    
    leaveHistory.approved.sort(sortByDate);
    leaveHistory.pending.sort(sortByDate);
    leaveHistory.rejected.sort(sortByDate);

    return {
      statusCode: 200,
      body: JSON.stringify({
        [employeeEmail]: leaveHistory,
      }),
      headers: {
        "Access-Control-Allow-Origin": "*", // Allow all origins
        "Access-Control-Allow-Methods": "OPTIONS,GET", // Allow GET and OPTIONS methods
        "Access-Control-Allow-Headers": "Content-Type,Authorization", // Allow headers
      },
    };
  } catch (err) {
    console.error("DynamoDB Query Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
      headers: {
        "Access-Control-Allow-Origin": "*", // Allow all origins
        "Access-Control-Allow-Methods": "OPTIONS,GET", // Allow GET and OPTIONS methods
        "Access-Control-Allow-Headers": "Content-Type,Authorization", // Allow headers
      },
    };
  }
};
