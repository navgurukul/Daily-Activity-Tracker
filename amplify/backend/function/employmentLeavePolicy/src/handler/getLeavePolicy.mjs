// // handler/getLeavePolicy.mjs

// import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
// import { ScanCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// const client = new DynamoDBClient({ region: "ap-south-1" });
// const docClient = DynamoDBDocumentClient.from(client);

// // Fetch all leave requests from DynamoDB
// export async function fetchLeaveRequests() {
//   const params = {
//     TableName: "hrmsLeaveRequests",
//   };
//   const command = new ScanCommand(params);
//   const result = await docClient.send(command);
//   return result.Items || [];
// }

// // Fetch leave allocations for all employment types
// export async function fetchLeaveAllocations() {
//   const res = await fetch("https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employeeSheetRecords?sheet=leaveallocations");
//   const data = await res.json();

//   const leaveMap = {};
//   data?.data?.forEach((entry) => {
//     const empType = entry["Employment Type"];
//     leaveMap[empType] = {};

//     for (const [key, value] of Object.entries(entry)) {
//       if (key !== "Employment Type" && key !== "") {
//         leaveMap[empType][key.trim()] = value === "N/A" ? 0 : Number(value) || 0;
//       }
//     }
//   });

//   return leaveMap;
// }

// // Fetch employment types of all users
// export async function fetchUserEmploymentTypes() {
//   const res = await fetch("https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employeeSheetRecords?sheet=pncdata");
//   const data = await res.json();

//   const userEmploymentTypeMap = {};
//   data?.data?.forEach((user) => {
//     const email = user["Team ID"];
//     const empType = user["Employment Type"] || "Full Time Employee"; // fallback
//     userEmploymentTypeMap[email] = empType;
//   });

//   return userEmploymentTypeMap;
// }

// export async function handler(event, context) {
//   try {
//     const [leaveData, leaveAllocations, userEmploymentTypes] = await Promise.all([
//       fetchLeaveRequests(),
//       fetchLeaveAllocations(),
//       fetchUserEmploymentTypes()
//     ]);

//     const groupedByUser = {};

//     for (const item of leaveData) {
//       const user = item.userEmail;
//       const leaveType = item.leaveType;
//       const status = (item.status || "").trim().toLowerCase();
//       const leaveDuration = Number(item.leaveDuration) || 0;

//       const empType = userEmploymentTypes[user] || "Full Time Employee";
//       const totalLeavesAllotted = (leaveAllocations?.[empType]?.[leaveType] ?? 0);

//       if (!groupedByUser[user]) {
//         groupedByUser[user] = {};
//       }

//       if (!groupedByUser[user][leaveType]) {
//         groupedByUser[user][leaveType] = {
//           id: item.Id,
//           leaveType,
//           usedLeaves: 0,
//           pendingLeaves: 0,
//           totalLeavesAllotted,
//           leaveLeft: totalLeavesAllotted,
//         };
//       }

//       if (status === "pending") {
//         groupedByUser[user][leaveType].pendingLeaves += leaveDuration;
//       } else if (status !== "rejected") {
//         groupedByUser[user][leaveType].usedLeaves += leaveDuration;
//       }
//     }

//     // Final adjustment for leaveLeft
//     for (const user in groupedByUser) {
//       for (const leaveType in groupedByUser[user]) {
//         const record = groupedByUser[user][leaveType];
//         record.leaveLeft = record.totalLeavesAllotted - (record.usedLeaves + record.pendingLeaves);
//       }
//     }

//     const finalOutput = {};
//     for (const user in groupedByUser) {
//       finalOutput[user] = Object.values(groupedByUser[user]);
//     }

//     return {
//       statusCode: 200,
//       body: JSON.stringify({ success: true, data: finalOutput }),
//     };
//   } catch (error) {
//     console.error("Error occurred:", error);
//     return {
//       statusCode: 500,
//       body: JSON.stringify({ success: false, message: error.message }),
//     };
//   }
// }




import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ScanCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "ap-south-1" });
const docClient = DynamoDBDocumentClient.from(client);

// Fetch all leave requests from DynamoDB
export async function fetchLeaveRequests() {
  const params = {
    TableName: "hrmsLeaveRequests",
  };
  const command = new ScanCommand(params);
  const result = await docClient.send(command);
  return result.Items || [];
}

// Fetch leave allocations for all employment types
export async function fetchLeaveAllocations() {
  const res = await fetch("https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employeeSheetRecords?sheet=leaveallocations");
  const data = await res.json();

  const leaveMap = {};
  data?.data?.forEach((entry) => {
    const empType = entry["Employment Type"];
    leaveMap[empType] = {};

    for (const [key, value] of Object.entries(entry)) {
      if (key !== "Employment Type" && key !== "") {
        leaveMap[empType][key.trim()] = value === "N/A" ? 0 : Number(value) || 0;
      }
    }
  });

  return leaveMap;
}

// Fetch employment types of all users
export async function fetchUserEmploymentTypes() {
  const res = await fetch("https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employeeSheetRecords?sheet=pncdata");
  const data = await res.json();

  const userEmploymentTypeMap = {};
  data?.data?.forEach((user) => {
    const email = user["Team ID"];
    const empType = user["Employment Type"] || "Full Time Employee"; // fallback
    userEmploymentTypeMap[email] = empType;
  });

  return userEmploymentTypeMap;
}

export async function handler(event, context) {
  try {
    const [leaveData, leaveAllocations, userEmploymentTypes] = await Promise.all([
      fetchLeaveRequests(),
      fetchLeaveAllocations(),
      fetchUserEmploymentTypes()
    ]);

    const groupedByUser = {};

    // Step 1: Initialize all users with all leave types
    for (const user in userEmploymentTypes) {
      const empType = userEmploymentTypes[user] || "Full Time Employee";
      const leavesForEmpType = leaveAllocations[empType] || {};

      groupedByUser[user] = {};

      for (const leaveType in leavesForEmpType) {
        const totalLeavesAllotted = leavesForEmpType[leaveType];
        groupedByUser[user][leaveType] = {
          id: null,
          leaveType,
          usedLeaves: 0,
          pendingLeaves: 0,
          totalLeavesAllotted,
          leaveLeft: totalLeavesAllotted,
        };
      }
    }

    // Step 2: Process existing leave requests
    for (const item of leaveData) {
      const user = item.userEmail;
      const leaveType = item.leaveType;
      const status = (item.status || "").trim().toLowerCase();
      const leaveDuration = Number(item.leaveDuration) || 0;

      const empType = userEmploymentTypes[user] || "Full Time Employee";
      const totalLeavesAllotted = (leaveAllocations?.[empType]?.[leaveType] ?? 0);

      // Make sure user and leaveType are initialized
      if (!groupedByUser[user]) {
        groupedByUser[user] = {};
      }

      if (!groupedByUser[user][leaveType]) {
        groupedByUser[user][leaveType] = {
          id: item.Id,
          leaveType,
          usedLeaves: 0,
          pendingLeaves: 0,
          totalLeavesAllotted,
          leaveLeft: totalLeavesAllotted,
        };
      }

      if (status === "pending") {
        groupedByUser[user][leaveType].pendingLeaves += leaveDuration;
      } else if (status !== "rejected") {
        groupedByUser[user][leaveType].usedLeaves += leaveDuration;
      }
    }

    // Step 3: Final adjustment for leaveLeft
    for (const user in groupedByUser) {
      for (const leaveType in groupedByUser[user]) {
        const record = groupedByUser[user][leaveType];
        record.leaveLeft = record.totalLeavesAllotted - (record.usedLeaves + record.pendingLeaves);
      }
    }

    // Step 4: Format final output
    const finalOutput = {};
    for (const user in groupedByUser) {
      finalOutput[user] = Object.values(groupedByUser[user]);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data: finalOutput }),
    };
  } catch (error) {
    console.error("Error occurred:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: error.message }),
    };
  }
}
