import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: "ap-south-1" });
const TABLE_NAME = "hrmsLeaveRequests";
const ALLOWED_STATUS = ["pending"];
const Allowed_Status_Half_Day = ["first-half", "second-half"];
const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

const generateUniqueId = async () => {
  let uniqueId;
  let isUnique = false;
  while (!isUnique) {
    uniqueId = Math.floor(100000 + Math.random() * 900000).toString();
    const command = new GetItemCommand({
      TableName: TABLE_NAME,
      Key: { Id: { S: uniqueId } },
    });
    const response = await client.send(command);
    if (!response.Item) isUnique = true;
  }
  return uniqueId;
};
// validating the correct dates 
const isValidDate = (dateStr) => {
  const date = new Date(dateStr);
  const [year, month, day] = dateStr.split("-").map(Number);
  return (
    date instanceof Date &&
    !isNaN(date) &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
};


const calculateLeaveDuration = (startDate, endDate, durationType) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return durationType.toLowerCase() === "half-day" ? diffDays * 0.5 : diffDays;
};

const generateDatesInRange = (start, end) => {
  const dates = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

export const handler = async (event) => {
  console.log("EVENT:", JSON.stringify(event));
  const stage = event.requestContext.stage;
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Method Not Allowed" }),
    };
  }

  const body = JSON.parse(event.body || "{}");

  const requiredFields = [
    "durationType",
    "endDate",
    "leaveType",
    "halfDayStatus",
    "startDate",
    "status",
    "userEmail",
  ];

  const missingFields = requiredFields.filter((field) => !body[field]);
  if (missingFields.length > 0) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: `Missing fields: ${missingFields.join(", ")}` }),
    };
  }
  const optionalReasonTypes = ["casual", "festival", "wellness"];
  const leaveType = body.leaveType?.toLowerCase().trim();

  // Check if the leaveType contains any of the optional types as a word
  const isOptionalReasonType = optionalReasonTypes.some((type) =>
    leaveType.includes(type)
  );

  if (!isOptionalReasonType) {
    const reason = body.reasonForLeave?.trim();
    if (!reason || reason.length < 25) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          message: `reasonForLeave is required and must be at least 25 characters for leave type "${body.leaveType}"`,
        }),
      };
    }
  }


  const allowedDurationTypes = ["Half-Day", "Full-Day"];
  if (!allowedDurationTypes.includes(body.durationType)) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: `Invalid durationType. Allowed values: ${allowedDurationTypes.join(", ")}` }),
    };
  }

  const isApproverEmailValid = body.approverEmail ? emailRegex.test(body.approverEmail) : true;
  const isUserEmailValid = emailRegex.test(body.userEmail);
  if (!isApproverEmailValid || !isUserEmailValid) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Invalid email format" }),
    };
  }
  // validating the correct dates
  if (!isValidDate(body.startDate) || !isValidDate(body.endDate)) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Invalid startDate or endDate format" }),
    };
  }
  

  let employmentType = "";
  try {
    const response = await fetch("https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employeeSheetRecords?sheet=pncdata");
    const data = await response.json();
    const employee = data.data.find((record) => record["Team ID"] === body.userEmail);

    if (!employee) {
      return {
        statusCode: 404,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ message: "Your email is not present in PNC sheet" }),
      };
    }

    employmentType = employee["Employment Type"]?.trim();
  } catch (err) {
    console.error("Error fetching employee records:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Failed to verify user email from external source" }),
    };
  }

  const status = body.status.toLowerCase();
  // status [pending]
  if (!ALLOWED_STATUS.includes(status)) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: `Invalid status. Allowed: ${ALLOWED_STATUS.join(", ")}` }),
    };
  }
  // half day status [first half Or second half]
  const halfDayStatus = body.halfDayStatus.toLowerCase();
  if (!Allowed_Status_Half_Day.includes(halfDayStatus)) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: `Invalid status. Allowed: ${Allowed_Status_Half_Day.join(", ")}` }),
    };
  }


  // ✅ Check leaveType from API now (not DynamoDB)
  try {
    const response = await fetch("https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employeeSheetRecords?sheet=leaveTypes");
    const data = await response.json();
    const validLeaveTypes = data.leaveTypes || [];

    if (!validLeaveTypes.includes(body.leaveType)) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          message: `Invalid leaveType. Allowed types: ${validLeaveTypes.join(", ")}`,
        }),
      };
    }
  } catch (error) {
    console.error("Error fetching leave types:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Failed to fetch leave types" }),
    };
  }

  const start = new Date(body.startDate);
  const end = new Date(body.endDate);
  if (start > end) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Invalid date range: startDate cannot be after endDate" }),
    };
  }
  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  // validating Leaves dates can not be overlapped
  const scanExistingLeaves = new ScanCommand({
    TableName: TABLE_NAME,
    FilterExpression: "#email = :email",
    ExpressionAttributeNames: { "#email": "userEmail" },
    ExpressionAttributeValues: { ":email": { S: body.userEmail } },
  });
  const existingLeaves = await client.send(scanExistingLeaves);
  
  if (existingLeaves.Items && existingLeaves.Items.length > 0) {
    const newStart = new Date(body.startDate);
    const newEnd = new Date(body.endDate);
  
    for (const item of existingLeaves.Items) {
      const prevStart = new Date(item.startDate.S);
      const prevEnd = new Date(item.endDate.S);
  
      const isOverlap = newStart <= prevEnd && newEnd >= prevStart;
  
      if (isOverlap) {
        return {
          statusCode: 409,
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({
            message: `Leave dates overlap with an existing leave from ${item.startDate.S} to ${item.endDate.S}`,
          }),
        };
      }
    }
  }
  
  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  // checking which employment types have how many leaves alloted
  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  let maxLeaveAllowed = null;
  try {
    const res = await fetch("https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employeeSheetRecords?sheet=leaveallocations");
    const allocations = await res.json();

    const currentYear = new Date().getFullYear();
    const employmentData = allocations.data.find(
      (e) => e["Employment Type"] === employmentType
    );

    const allocatedLeaveStr = employmentData?.[body.leaveType];
    if (!allocatedLeaveStr || allocatedLeaveStr === "N/A") {
      maxLeaveAllowed = 0;
    } else {
      maxLeaveAllowed = parseFloat(allocatedLeaveStr);
    }

    // Sum existing leave durations for this type and this year
    const scanCommand = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression:
        "#email = :email AND #type = :type AND begins_with(#start, :year)",
      ExpressionAttributeNames: {
        "#email": "userEmail",
        "#type": "leaveType",
        "#start": "startDate",
      },
      ExpressionAttributeValues: {
        ":email": { S: body.userEmail },
        ":type": { S: body.leaveType },
        ":year": { S: `${currentYear}-` },
      },
    });

    const result = await client.send(scanCommand);

    let totalUsed = result.Items?.reduce((sum, item) => {
      const status = item.status?.S?.toLowerCase();
      const isRejected = status === "rejected";
    
      if (!isRejected) {
        return sum + parseFloat(item.leaveDuration?.N || "0");
      }
      return sum;
    }, 0) || 0;

    const thisRequestDuration = calculateLeaveDuration(body.startDate, body.endDate, body.durationType);

    if (totalUsed + thisRequestDuration > maxLeaveAllowed) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          message: `You have exceeded your annual quota for ${body.leaveType}. Allocated: ${maxLeaveAllowed}, Used: ${totalUsed}`,
        }),
      };
    }
  } catch (err) {
    console.error("Leave allocation fetch error:", err);
  }

  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

  const allDates = generateDatesInRange(start, end);

  for (const date of allDates) {
    const scanCommand = new ScanCommand({
      TableName: TABLE_NAME,
      FilterExpression: "#email = :email AND #start = :start AND #type = :type",
      ExpressionAttributeNames: {
        "#email": "userEmail",
        "#start": "startDate",
        "#type": "leaveType",
      },
      ExpressionAttributeValues: {
        ":email": { S: body.userEmail },
        ":start": { S: date },
        ":type": { S: body.leaveType },
      },
    });
    const result = await client.send(scanCommand);
    if (result.Items && result.Items.length > 0) {
      return {
        statusCode: 409,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          message: `Leave already exists on ${date} for user ${body.userEmail} and type ${body.leaveType}`,
        }),
      };
    }
  }

  const leaveDuration = calculateLeaveDuration(body.startDate, body.endDate, body.durationType);
  const uniqueId = await generateUniqueId();

  const command = new PutItemCommand({
    TableName: TABLE_NAME,
    Item: {
      Id: { S: uniqueId },
      approvalDate: { S: "" },
      approverEmail: { S: "" },
      durationType: { S: body.durationType },
      endDate: { S: body.endDate },
      leaveDuration: { N: leaveDuration.toString() },
      leaveType: { S: body.leaveType },
      halfDayStatus: { S: body.halfDayStatus },
      reasonForLeave: { S: body.reasonForLeave || "" },
      startDate: { S: body.startDate },
      status: { S: status },
      userEmail: { S: body.userEmail },
      stage:{S:stage}
    },
  });

  try {
    await client.send(command);
    return {
      statusCode: 201,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        message: "Leave request submitted successfully",
        leaveId: uniqueId,
      }),
    };
  } catch (error) {
    console.error("DynamoDB Error:", error);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        message: "Error inserting leave request",
        error: error.message,
      }),
    };
  }
};
