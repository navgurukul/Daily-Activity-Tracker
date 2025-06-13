
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { ScanCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "ap-south-1" });
const docClient = DynamoDBDocumentClient.from(client);

const restrictedLeaveTypes = ["Festival Leave", "Casual Leave", "Wellness Leave"];

async function paginatedScan(params) {
  console.log("+=================================================",params);
  let items = [];
  let ExclusiveStartKey;
  do {
    const command = new ScanCommand({ ...params, ExclusiveStartKey });
    const response = await docClient.send(command);
    items = items.concat(response.Items || []);
    ExclusiveStartKey = response.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
}

export async function fetchLeaveRequests() {
  return await paginatedScan({ TableName: "hrmsLeaveRequests" });
}

export async function fetchCompensatoryLeaveCounts() {
  const items = await paginatedScan({ TableName: "hrmsCompensatoryAlloted" });
  const counts = {};
  items.forEach((item) => {
    const email = item.userEmail;
    const duration = Number(item.leaveDuration) || 0;
    if (!counts[email]) counts[email] = 0;
    counts[email] += duration;
  });
  return counts;
}

export async function fetchLeaveAllocations() {
  const res = await fetch(
    "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employeeSheetRecords?sheet=leaveallocations"
  );
  const data = await res.json();
  const leaveMap = {};

  data?.data?.forEach((entry) => {
    const empType = entry["Employment Type"] || "Unknown";
    const alumniStatusRaw = entry[""] || "";
    const alumniStatus = alumniStatusRaw.trim().toLowerCase() === "alumni" ? "Alumni" : "Non-Alumni";
    const key = `${empType}|${alumniStatus}`;
    leaveMap[key] = {};

    for (const [field, value] of Object.entries(entry)) {
      if (field !== "Employment Type" && field !== "") {
        let leaveType = field.trim();
        if (leaveType.toLowerCase().includes("compensatory")) {
          leaveType = "Compensatory";
        }
        leaveMap[key][leaveType] = value === "N/A" ? 0 : Number(value) || 0;
      }
    }
  });

  return leaveMap;
}

export async function fetchUserEmploymentTypes() {
  const res = await fetch(
    "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employeeSheetRecords?sheet=pncdata"
  );
  const data = await res.json();

  const userEmploymentTypeMap = {};
  const userJoiningDates = {};
  const userAlumniStatus = {};

  data?.data?.forEach((user) => {
    const email = user["Team ID"];
    const empType = user["Employment Type"] || "Full Time Employee";
    const joinDate = user["Date of Joining"] || null;
    const alumniRaw = user["Alumni"];
    const alumni = alumniRaw?.toString().trim().toLowerCase() === "alumni" ? "Alumni" : "Non-Alumni";

    userEmploymentTypeMap[email] = empType;
    if (joinDate) userJoiningDates[email] = joinDate;
    userAlumniStatus[email] = alumni;
  });

  return { userEmploymentTypeMap, userJoiningDates, userAlumniStatus };
}

export async function handler(event, context) {
  try {
    const [
      leaveData,
      leaveAllocations,
      userInfo,
      compensatoryLeaveCounts,
    ] = await Promise.all([
      fetchLeaveRequests(),
      fetchLeaveAllocations(),
      fetchUserEmploymentTypes(),
      fetchCompensatoryLeaveCounts(),
    ]);

    let email = event.queryStringParameters?.email || null
    const limit = parseInt(event.queryStringParameters?.limit) || 10;
    const page = parseInt(event.queryStringParameters?.page) || 1;

    const userEmploymentTypes = userInfo.userEmploymentTypeMap;
    const userJoiningDates = userInfo.userJoiningDates;
    const userAlumniStatus = userInfo.userAlumniStatus;

    const groupedByUser = {};
    const currentYear = new Date().getFullYear();

    for (const user in userEmploymentTypes) {
      const empType = userEmploymentTypes[user];
      const alumni = userAlumniStatus[user] || "Non-Alumni";
      const key = `${empType}|${alumni}`;
      const leavesForEmpType = leaveAllocations[key] || {};
      groupedByUser[user] = {};

      for (const originalLeaveType in leavesForEmpType) {
        let leaveType = originalLeaveType.trim();
        if (leaveType.toLowerCase().includes("compensatory")) {
          leaveType = "Compensatory";
        }

        let totalLeavesAllotted;

        if (leaveType === "Compensatory") {
          totalLeavesAllotted = compensatoryLeaveCounts[user] || 0;
        } else {
          const fullYearLeave = leavesForEmpType[originalLeaveType] || 0;
          const joiningDateRaw = userJoiningDates[user];

          if (restrictedLeaveTypes.includes(leaveType) && joiningDateRaw) {
            const joiningDate = new Date(joiningDateRaw);
            const joiningYear = joiningDate.getFullYear();
            const joinMonth = joiningDate.getMonth();

            if (joiningYear === currentYear) {
              const remainingMonths = 12 - joinMonth;
              totalLeavesAllotted = Math.round(
                (remainingMonths / 12) * fullYearLeave
              );
            } else {
              totalLeavesAllotted = fullYearLeave;
            }
          } else {
            totalLeavesAllotted = fullYearLeave;
          }
        }

        groupedByUser[user][leaveType] = {
          leaveType,
          usedLeaves: 0,
          pendingLeaves: 0,
          totalLeavesAllotted,
          leaveLeft: totalLeavesAllotted,
        };
      }

      if (!groupedByUser[user]["Compensatory"]) {
        const total = compensatoryLeaveCounts[user] || 0;
        groupedByUser[user]["Compensatory"] = {
          leaveType: "Compensatory",
          usedLeaves: 0,
          pendingLeaves: 0,
          totalLeavesAllotted: total,
          leaveLeft: total,
        };
      }
    }

    for (const item of leaveData) {
      const user = item.userEmail;
      let leaveType = item.leaveType?.trim() || "";
      if (leaveType.toLowerCase().includes("compensatory")) {
        leaveType = "Compensatory";
      }

      const status = (item.status || "").trim().toLowerCase();
      const leaveDuration = Number(item.leaveDuration) || 0;
      const empType = userEmploymentTypes[user] || "Full Time Employee";
      const alumni = userAlumniStatus[user] || "Non-Alumni";
      const key = `${empType}|${alumni}`;
      const totalLeavesAllotted =
        leaveType === "Compensatory"
          ? compensatoryLeaveCounts[user] || 0
          : leaveAllocations?.[key]?.[leaveType] ?? 0;

      if (!groupedByUser[user]) groupedByUser[user] = {};
      if (!groupedByUser[user][leaveType]) {
        groupedByUser[user][leaveType] = {
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

    for (const user in groupedByUser) {
      for (const leaveType in groupedByUser[user]) {
        const record = groupedByUser[user][leaveType];
        record.leaveLeft =
          record.totalLeavesAllotted - (record.usedLeaves + record.pendingLeaves);
      }
    }

    let responseData = Object.entries(groupedByUser).map(([email, leaveRecords]) => ({
      userEmail: email,
      leaveRecords: Object.values(leaveRecords),
    }));

    if(email){
      responseData = responseData.filter(ele => ele.userEmail === email);
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
        body: JSON.stringify({
          success: true,
          totalUsers: responseData.length,
          data: responseData,
        }),
        // body: JSON.stringify({
        //   success: true,
        //   totalUsers: totalItems,
        //   currentPage: page,
        //   totalPages,
        //   data: paginatedData,
        // }),
      };
    }

    // Pagination logic
    const totalItems = responseData.length;
    const totalPages = Math.ceil(totalItems / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = responseData.slice(startIndex, endIndex);
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      // body: JSON.stringify({
      //   success: true,
      //   totalUsers: responseData.length,
      //   data: responseData,
      // }),
      body: JSON.stringify({
        success: true,
        totalUsers: totalItems,
        currentPage: page,
        totalPages,
        data: paginatedData,
      }),
    };
  } catch (error) {
    console.error("Error occurred:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ success: false, message: error.message }),
    };
  }
}


// Local test
if (process.env.NODE_ENV !== "lambda" && import.meta.url === `file://${process.argv[1]}`) {
  const fakeEvent = {
    queryStringParameters: {
      email: "vinit@navgurukul.org",
      leaveType: "Casual Leave"
    },
  };
  const fakeContext = {};

  handler(fakeEvent, fakeContext)
    .then((res) => console.log("Local Test Output:", JSON.stringify(JSON.parse(res.body), null, 2)))
    .catch((err) => console.error("Error during test:", err));
}
