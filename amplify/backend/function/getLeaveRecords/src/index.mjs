
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import https from "https";

const client = new DynamoDBClient({ region: "ap-south-1" });
const docClient = DynamoDBDocumentClient.from(client);

const fetchSheetData = () => {
  const url =
    "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employeeSheetRecords?sheet=pncdata";

  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.success) {
              resolve(parsed.data);
            } else {
              reject("Invalid response from external API");
            }
          } catch (err) {
            reject(err);
          }
        });
      })
      .on("error", (err) => reject(err));
  });
};

export const handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "OPTIONS,GET",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  };

  try {
    // 1. Fetch employee list from external sheet
    const externalData = await fetchSheetData();
    const teamIdToEmployee = {};
    externalData.forEach((emp) => {
      const email = emp["Team ID"];
      if (email) {
        teamIdToEmployee[email] = emp;
      }
    });

    const employeeEmail = event.queryStringParameters?.employeeEmail;

    let emailsToReturn;
    if (employeeEmail) {
      if (teamIdToEmployee[employeeEmail]) {
        emailsToReturn = [employeeEmail];
      } else {
        // Email not found in sheet — return empty
        return {
          statusCode: 200,
          body: JSON.stringify({}),
          headers,
        };
      }
    } else {
      emailsToReturn = Object.keys(teamIdToEmployee);
    }

    // 2. Fetch all leave requests from DynamoDB
    const scanParams = {
      TableName: "hrmsLeaveRequests",
    };
    const scanResult = await docClient.send(new ScanCommand(scanParams));
    const allLeaveItems = scanResult.Items || [];

    // 3. Group leave data by user
    const groupedLeaves = {};
    allLeaveItems.forEach((item) => {
      const email = item.userEmail;
      if (!groupedLeaves[email]) {
        groupedLeaves[email] = {
          approved: [],
          pending: [],
          rejected: [],
        };
      }

      const sortDate = item.approvalDate || item.startDate || item.endDate;

      const record = {
        Id: item.Id,
        leaveType: item.leaveType,
        status: item.status,
        approvalDate: item.approvalDate,
        approvalEmail: item.approverEmail,
        startDate: item.startDate,
        endDate: item.endDate,
        leaveDuration: item.leaveDuration,
        durationType: item.durationType,
        reasonForLeave: item.reasonForLeave,
        halfDayStatus: item.halfDayStatus || "",
        sortDate,
      };

      if (item.status === "approved") {
        groupedLeaves[email].approved.push(record);
      } else if (item.status === "pending") {
        groupedLeaves[email].pending.push(record);
      } else if (item.status === "rejected") {
        groupedLeaves[email].rejected.push(record);
      }
    });

    // 4. Create final response for requested employees
    const response = {};
    emailsToReturn.forEach((email) => {
      const leaves = groupedLeaves[email] || {
        approved: [],
        pending: [],
        rejected: [],
      };

      const sortByDate = (a, b) =>
        new Date(b.sortDate) - new Date(a.sortDate);

      ["approved", "pending", "rejected"].forEach((status) => {
        leaves[status].sort(sortByDate);
        leaves[status] = leaves[status].map(({ sortDate, ...rest }) => rest);
      });

      response[email] = leaves;
    });

    return {
      statusCode: 200,
      body: JSON.stringify(response),
      headers,
    };
  } catch (err) {
    console.error("Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || "Server Error" }),
      headers,
    };
  }
};









// <<<<<>old one <>>>>>>>>>>><<<<<</></>
// import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
// import { DynamoDBDocumentClient, QueryCommand } from "@aws-sdk/lib-dynamodb";

// const client = new DynamoDBClient({ region: "ap-south-1" });
// const docClient = DynamoDBDocumentClient.from(client);

// export const handler = async (event) => {
//   console.log("Received event:", JSON.stringify(event));

//   const employeeEmail = event.queryStringParameters?.employeeEmail;

//   console.log("employeeEmail param:", employeeEmail);

//   if (!employeeEmail) {
//     return {
//       statusCode: 400,
//       body: JSON.stringify({ message: "Missing employeeEmail" }),
//       headers: {
//         "Access-Control-Allow-Origin": "*", // Allow all origins
//         "Access-Control-Allow-Methods": "OPTIONS,GET", // Allow GET and OPTIONS methods
//         "Access-Control-Allow-Headers": "Content-Type,Authorization", // Allow headers
//       },
//     };
//   }

//   const params = {
//     TableName: "hrmsLeaveRequests",
//     IndexName: "userEmail-index", // GSI Name
//     KeyConditionExpression: "userEmail = :email", // Query by userEmail
//     ExpressionAttributeValues: {
//       ":email": employeeEmail, // Employee email as parameter
//     },
//     ScanIndexForward: false, // Optional: false to sort in descending order (latest records first)
//   };

//   try {
//     const result = await docClient.send(new QueryCommand(params));
//     console.log("Query result:", result);

//     // Group by status: approved, pending, rejected
//     const leaveHistory = {
//       approved: [],
//       pending: [],
//       rejected: [],
//     };

//     result.Items.forEach((item) => {
//       // Determine the sort key based on approvalDate, startDate or endDate
//       const sortDate = item.approvalDate || item.startDate || item.endDate;
      
//       // Add the item to the appropriate group based on status
//       if (item.status === 'approved') {
//         leaveHistory.approved.push({
//           Id:item.Id,
//           leaveType: item.leaveType,
//           approvalDate: item.approvalDate,
//           approvalEmail: item.approverEmail,
//           startDate: item.startDate,
//           endDate: item.endDate,
//           leaveDuration: item.leaveDuration,
//           durationType: item.durationType,
//           reasonForLeave: item.reasonForLeave,
//           halfDayStatus:item.halfDayStatus || ""
//         });
//       } else if (item.status === 'pending') {
//         leaveHistory.pending.push({
//           Id:item.Id,
//           leaveType: item.leaveType,
//           status: item.status,
//           startDate: item.startDate,
//           endDate: item.endDate,
//           leaveDuration: item.leaveDuration,
//           durationType: item.durationType,
//           reasonForLeave: item.reasonForLeave,
//           halfDayStatus:item.halfDayStatus || ""
//         });
//       } else if (item.status === 'rejected') {
//         leaveHistory.rejected.push({
//           Id:item.Id,
//           leaveType: item.leaveType,
//           status: item.status,
//           startDate: item.startDate,
//           endDate: item.endDate,
//           leaveDuration: item.leaveDuration,
//           durationType: item.durationType,
//           reasonForLeave: item.reasonForLeave,
//           halfDayStatus:item.halfDayStatus || ""
//         });
//       }
//     });

//     // Sort each category by the `sortDate` (latest first)
//     const sortByDate = (a, b) => new Date(b.sortDate) - new Date(a.sortDate);
    
//     leaveHistory.approved.sort(sortByDate);
//     leaveHistory.pending.sort(sortByDate);
//     leaveHistory.rejected.sort(sortByDate);

//     return {
//       statusCode: 200,
//       body: JSON.stringify({
//         [employeeEmail]: leaveHistory,
//       }),
//       headers: {
//         "Access-Control-Allow-Origin": "*", // Allow all origins
//         "Access-Control-Allow-Methods": "OPTIONS,GET", // Allow GET and OPTIONS methods
//         "Access-Control-Allow-Headers": "Content-Type,Authorization", // Allow headers
//       },
//     };
//   } catch (err) {
//     console.error("DynamoDB Query Error:", err);
//     return {
//       statusCode: 500,
//       body: JSON.stringify({ error: err.message }),
//       headers: {
//         "Access-Control-Allow-Origin": "*", // Allow all origins
//         "Access-Control-Allow-Methods": "OPTIONS,GET", // Allow GET and OPTIONS methods
//         "Access-Control-Allow-Headers": "Content-Type,Authorization", // Allow headers
//       },
//     };
//   }
// };
