import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import AWS from 'aws-sdk'; // if using ES Modules
const docClient = new AWS.DynamoDB.DocumentClient();

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
    "endDate",
    "leaveType",
    "startDate",
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
  console.log("UUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUu",body.userEmail);
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

  if (body.halfDayStatus && (!body.durationType || body.durationType.toLowerCase() !== "half-day")) {
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        message: `durationType is required and must be 'Half-Day' when halfDayStatus is true`,
      }),
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


  const inpDay = new Date(body.startDate).getDate();
  const leaveMonth = new Date(body.startDate).getMonth();
  const aaj = new Date();
  const todayDay = aaj.getDate();
  const mont = aaj.getMonth();
  if (
    // inputMonth === todayMonth &&
    // inputYear === todayYear &&
    todayDay > 25 &&
    inpDay <= 25 && 
    mont === leaveMonth
  ) {

    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        message: `Backdated leave not allowed after the 25th of the month.`,
      }),
    };
  }


  let employmentType = "";
  let isAlumni = "";
  try {
    const response = await fetch("https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employeeSheetRecords?sheet=pncdata");
    const data = await response.json();
    const employee = data.data.find((record) => record["Team ID"] === body.userEmail);
    console.log("000000000000000000000employee");

    if (!employee) {
      return {
        statusCode: 404,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ message: "Your email is not present in PNC sheet" }),
      };
    }

    employmentType = employee["Employment Type"]?.trim();
    if(employee["Alumni"]?.trim() == "N/A"){
      isAlumni = "Non-Alumni"
    }else{
      isAlumni = employee["Alumni"]?.trim();
    }
    console.log("@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",employee["Alumni"]);
    console.log(isAlumni, 'isAlumniiiiiiiiiiiiiiiiiiiiiiiiiiiiii')
  } catch (err) {
    console.error("Error fetching employee records:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Failed to verify user email from external source" }),
    };
  }

  // half day status [first half Or second half]
  if (body.durationType) {
    if (body.durationType.toLowerCase() === "half-day") {
      if (!body.halfDayStatus) {
        return {
          statusCode: 400,
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ message: `halfDayStatus is required` }),
        };
      }
    }
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

  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  const today = new Date();
  const startDate = new Date(body.startDate);

  // Check if the startDate is in the past
  const isStartDateInPast = startDate < today;

  // Check today's values
  const currentDay = today.getDate();
  const currentMonth = today.getMonth(); // 0-indexed
  const thisYear = today.getFullYear();

  // // Rule 1: After 25th, no backdated leave at all
  // if (currentDay > 25 && isStartDateInPast) {
  //   return {
  //     statusCode: 400,
  //     headers: { "Access-Control-Allow-Origin": "*" },
  //     body: JSON.stringify({
  //       message: `Backdated leave not allowed after the 25th of the month.`,
  //     }),
  //   };
  // }

  // // Rule 2: If startDate is before 26th of previous month → disallow
  // const previousMonth = new Date(thisYear, currentMonth - 1, 26); // 26th of previous month
  // if (isStartDateInPast && startDate < previousMonth) {
  //   return {
  //     statusCode: 400,
  //     headers: { "Access-Control-Allow-Origin": "*" },
  //     body: JSON.stringify({
  //       message: `Backdated leave before 26th of last month is not allowed.`,
  //     }),
  //   };
  // }

  // ======================================================================================================================================================================================

  // // 1. Month and year must be same
  // if (inputMonth !== todayMonth || inputYear !== todayYear) {
  //   return buildResponse(400, {
  //     message: "You can only apply leave for the current month.",
  //     origin
  //   });
  // }

  // 2. Data before 25th frozen if today > 25
  


  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

  // 
  // Parse values from input
  const email = body.email;
  const beginingDate = new Date(body.startDate);  // Expected: new Date("2024-05-10")
  const endingDate = new Date(body.endDate);      // Expected: new Date("2024-05-12")

  // Collect all leave dates in the range
  const leaveDates = [];
  for (let d = new Date(beginingDate); d <= endingDate; d.setDate(d.getDate() + 1)) {
    leaveDates.push(new Date(d).toISOString().split('T')[0]);
    // Example output: ["2024-05-10", "2024-05-11", "2024-05-12"]
  }

  // Query the DynamoDB table for conflicting activity logs
  const params = {
    TableName: 'employeeDailyActivityLogs',
    IndexName: 'email-entryDate-index', // Ensure this GSI is created in DynamoDB
    KeyConditionExpression: '#email = :email AND #entryDate BETWEEN :beginingDate AND :endingDate',
    ExpressionAttributeNames: {
      '#email': 'email',       // Attribute name in your table
      '#entryDate': 'entryDate'
    },
    ExpressionAttributeValues: {
      ':email': body.userEmail,               // Expected: "ujjwal@navgurukul.org"
      ':beginingDate': body.startDate,        // Expected: "2024-05-10"
      ':endingDate': body.endDate             // Expected: "2024-05-12"
    }
  };

  const result = await docClient.query(params).promise();
  console.log("TTTTTTTTTTTTTTTTTTT",result);
  // Check if any entries already exist for the requested dates
  if (result.Items && result.Items.length > 0) {
    const conflictingDates = result.Items.map(item => item.entryDate);
    const work_type = result.Items[0].workType
    if(work_type === "full-day"){
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          message: `Leave cannot be applied. Log(s) already exist for date(s): ${conflictingDates.join(', ')}`
        })
      };
    }else if(work_type === "half-day" && body.durationType !== "half-day"){
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          message: `You have logged half-day work on this date, so you can only apply for half-day leave.`
        })
      };
      
    }
  }



  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
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

  let maxLeaveAllowed = null;
  try {
    const currentYear = new Date().getFullYear();

    // Special case for "compensentary" leave
    // if (  
    if (body.leaveType.toLowerCase().trim().split(" ").includes("compensatory")) {
      // Query the hrmsCompensatoryAlloted table
      const compScanCommand = new ScanCommand({
        TableName: "hrmsCompensatoryAlloted",
        FilterExpression:
          "#email = :email AND #status = :status",
        ExpressionAttributeNames: {
          "#email": "userEmail",
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":email": { S: body.userEmail },
          ":status": { S: "pending" },
        },
      });

      const compResult = await client.send(compScanCommand);

      // Sum all pending compensatory leave durations
      maxLeaveAllowed = compResult.Items?.reduce((sum, item) => {
        return sum + parseFloat(item.leaveDuration?.N || "0");
      }, 0) || 0;
    }
    else {
      // For all other leave types, continue with API fetch
      const res = await fetch("https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employeeSheetRecords?sheet=leaveallocations");
      const allocations = await res.json();
      console.log('Allocaions for the leave............',allocations);
      console.log('This is the employeement type....',employmentType);
      const employmentData = allocations.data.find(
        (e) => {
          console.log('EEEEEEEEEEEEEEEEEEEEEEEEEEEEEE---',employmentType, isAlumni);
          return (e["Employment Type"] === employmentType && e[""] === isAlumni);
        }
      );

      console.log("=====employmentData ", employmentData,employmentData?.[body.leaveType]);

      const allocatedLeaveStr = employmentData?.[body.leaveType];
      console.log('---------------------------------', allocatedLeaveStr);
      let testLeaveType = "Add as Leave Type in the database with 0 allocations for all. Should not be visible in the UI but can be shown in the table in the Leave Application form. In the allocation column, instead of a number, there should be a message Please contact the PnC team to avail this leave type"
      if (!allocatedLeaveStr || allocatedLeaveStr === "N/A" || allocatedLeaveStr === testLeaveType) {
        maxLeaveAllowed = 0;
      } else {
        maxLeaveAllowed = parseFloat(allocatedLeaveStr);
      }
    }

    // Fetch all previously taken leaves for this year and type
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

    const thisRequestDuration = calculateLeaveDuration(body.startDate, body.endDate, (body.durationType || "Full-Day"));

    if (totalUsed + thisRequestDuration > maxLeaveAllowed) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          message: `You have exceeded your annual quota for ${body.leaveType}. Allocated: ${maxLeaveAllowed}, Used: ${totalUsed}`,
        }),
      };
    }
  }
  catch (err) {
    console.error("Leave allocation fetch error:", err);
  }

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

  const leaveDuration = calculateLeaveDuration(body.startDate, body.endDate, (body.durationType || "Full-Day"));
  const uniqueId = await generateUniqueId();
  const leaveApplyDate = new Date().toISOString();

  const command = new PutItemCommand({
    TableName: TABLE_NAME,
    Item: {
      Id: { S: uniqueId },
      approvalDate: { S: "" },
      approverEmail: { S: "" },
      durationType: { S: body.durationType || "Full-Day" },
      endDate: { S: body.endDate },
      leaveDuration: { N: leaveDuration.toString() },
      leaveType: { S: body.leaveType },
      halfDayStatus: { S: body.halfDayStatus || "" },
      reasonForLeave: { S: body.reasonForLeave || "" },
      department : {S: body.department || ""},
      startDate: { S: body.startDate },
      status: { S: "pending" },
      userEmail: { S: body.userEmail },
      stage: { S: stage },
      leaveApplyDate: { S: leaveApplyDate || "" }
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
