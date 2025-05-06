// handlers/postHandler.mjs
import {
  ScanCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient } from "../services/dbClient.mjs";
import { buildResponse } from "../utils/responseBuilder.mjs";

export async function handlePost(event, stage, origin) {
  let hrmsEmail;
  const now = new Date();                 
  // let mismatchedEntriesCount = {};  // { email: count }
                   //  2025-05-03T09:47:24.944Z
  let today = now.toISOString().split("T")[0];            //   2025-05-03
  let todayDate=today
  if (now.getHours() < 7) {
    now.setDate(now.getDate() - 1);
    today = now.toISOString().split("T")[0];
  }

  const { entries } = JSON.parse(event.body);
  const year1 = now.getFullYear();
  const month1 = (now.getMonth() + 1).toString().padStart(2, "0"); // e.g., "05"
  const currentPrefix1 = `${year1}-${month1}`; // e.g., "2025-05"
  hrmsEmail = entries[0].email;
  const entryDateStr = entries[0].entryDate//entryDateObj.toISOString().split("T")[0]; // e.g., "2025-05-05"
  const currentDateStr = new Date().toISOString().split("T")[0]; // today's date
  // const currentDate = new Date();
  let logicalTodayStr = currentDateStr;
  // if (currentDate.getHours() < 7) {
  //   currentDate.setDate(currentDate.getDate() - 1);
    logicalTodayStr = todayDate.toString().split("T")[0];
  // }
  try {
  const checkParams = {
    TableName: "hrmsBackDatedCount",
    IndexName: "email-updatedAt-index", // Use the GSI
    KeyConditionExpression: "email = :email AND begins_with(updatedAt, :prefix)",
    ExpressionAttributeValues: {
      ":email": hrmsEmail,
      ":prefix": currentPrefix1, // matches updatedAt like "2025-05"
    },
  };
  const checkResult = await docClient.send(new QueryCommand(checkParams));
  console.log(entryDateStr,"     " ,logicalTodayStr,"   ",today,"   ",todayDate,'  checkResult checkResult checkResult checkResult checkResult')
  // Only apply limit if entry is not for today
  if (entryDateStr !== logicalTodayStr && checkResult.Items.length > 0) {
    return buildResponse(400, { message: "You already finished your 3 attempts" }, origin);
  }
} catch (queryError) {
  console.error("Query failed:", queryError);
}

  if (!Array.isArray(entries) || entries.length === 0) {
    return buildResponse(400, { message: "Entries should be a non-empty array." }, origin);
  }

  const results = [];
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const uniqueEmails = [...new Set(entries.map((e) => e.email))];
  const emailBackdatedCount = {};

        // Build map of total new hours from current payload: { "email|entryDate": totalHours }
  const newEntryHoursMap = {};
  for (const entry of entries) {
    const key = `${entry.email}|${entry.entryDate}`;
    newEntryHoursMap[key] = (newEntryHoursMap[key] || 0) + entry.totalHoursSpent;
  }

  // Fetch existing hours from DB per email+entryDate
  const existingEntryHoursMap = {}; // { "email|entryDate": totalHoursFromDB }

  for (const key of Object.keys(newEntryHoursMap)) {
    const [email, entryDate] = key.split("|");

    const queryParams = {
      TableName: "employeeDailyActivityLogs",
      IndexName: "email-entryDate-index",
      KeyConditionExpression: "email = :email AND entryDate = :entryDate",
      ExpressionAttributeValues: {
        ":email": email,
        ":entryDate": entryDate,
      },
    };

    const result = await docClient.send(new QueryCommand(queryParams));
    let totalHours = 0;
    for (const item of result.Items) {
      // Check if same project exists in current payload (i.e. being updated)
      const isSameEntryInPayload = entries.some(e =>
        e.email === item.email &&
        e.entryDate === item.entryDate &&
        e.projectName === item.projectName
      );

      if (!isSameEntryInPayload) {
        totalHours += item.totalHoursSpent;
      }
    }
    existingEntryHoursMap[key] = totalHours;

  }

  // Step 1: Count unique backdated dates per email

  for (const email of uniqueEmails) {
    hrmsEmail=email;
    const queryParams = {
      TableName: "employeeDailyActivityLogs",
      IndexName: "email-entryDate-index",
      KeyConditionExpression: "email = :email AND entryDate BETWEEN :start AND :end",
      FilterExpression: "stage = :stage",
      ExpressionAttributeValues: {
        ":email": email,
        ":start": monthStart,
        ":end": today,
        ":stage": stage,
      },
    };

    const result = await docClient.send(new QueryCommand(queryParams));
    const backdated = result.Items.filter(item => item.entryDate !== today);
    emailBackdatedCount[email] = new Set(backdated.map(item => item.entryDate));
  }

  // Step 2: Process each entry
  for (const entry of entries) {
    const { email, projectName, totalHoursSpent, workDescription, entryDate } = entry;
    
// === Restrict ANY submission for previous month after 8 PM of its last day ===
    const checkEntryDateObj = new Date(entryDate);
    const entryMonth = checkEntryDateObj.getMonth();
    const entryYear = checkEntryDateObj.getFullYear();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const isPreviousMonth =
      (entryYear === currentYear && entryMonth === currentMonth - 1) ||
      (currentMonth === 0 && entryYear === currentYear - 1 && entryMonth === 11);

    if (isPreviousMonth) {
      // Get the 8 PM timestamp of the last day of the previous month
      const cutoffDate = new Date(currentYear, currentMonth, 0); // Last day of previous month
      cutoffDate.setHours(14, 0, 0, 0); // Set to 2 PM

      if (now > cutoffDate) {
        results.push({
          entry,
          status: "failed",
          reason: "Cannot create or update entries for the previous month after 2 PM on its last day.",
        });
        continue;
      }
     }    


          // Validate combined total hours (DB + payload) <= 15
    const key = `${email}|${entryDate}`;
    const newTotal = (existingEntryHoursMap[key] || 0) + newEntryHoursMap[key];

    if (newTotal > 15) {
      results.push({
        entry,
        status: "failed",
        reason: `Total hours for ${entryDate} exceed 15 (existing: ${existingEntryHoursMap[key] || 0}, new: ${newEntryHoursMap[key]})`,
      });
      continue;
    }

    
    if (!email || !projectName || !totalHoursSpent || !workDescription || !entryDate) {
      results.push({ entry, status: "failed", reason: "Missing required fields." });
      continue;
    }

    // const entryDateObj = new Date(entryDate);
    // const allowedDate = new Date(now);
    // allowedDate.setDate(now.getDate() - 4);

    // if (entryDateObj < allowedDate || entryDateObj > now) {
    //   results.push({
    //     entry,
    //     status: "failed",
    //     reason: "Entry date must be within the last 3 days",
    //   });
    //   continue;
    // }



    function getDateOnly(date) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }
    
    const entryDateObj = getDateOnly(new Date(entryDate));
    const today = getDateOnly(new Date());
    const allowedDate = new Date(today);
    allowedDate.setDate(today.getDate() - 3); // last 3 days = today, yesterday, day before yesterday
    
    if (entryDateObj < allowedDate || entryDateObj > today) {
      results.push({
        entry,
        status: "failed",
        reason: "Entry date must be within the last 3 days",
      });
      continue;
    }
    





    
  // === LEAVE CHECK: Block full-day leaves and allow half-day only if <= 5 hours ===
  const leaveParams = {
    TableName: "hrmsLeaveRequest",  // Ensure this is the correct table
    IndexName: "userEmail-startDate-index",  // Ensure this index is correctly defined
    KeyConditionExpression: "userEmail = :email AND startDate <= :entryDate",  // Query to find leaves for the user on or before entryDate
    FilterExpression: "#status IN (:approved, :pending) AND endDate >= :entryDate", // Filter for active approved or pending leaves
    ExpressionAttributeNames: {
      "#status": "status",  // Alias to avoid reserved keyword conflict
    },
    ExpressionAttributeValues: {
      ":email": email,  // The email of the user whose leave requests we are checking
      ":entryDate": entryDate,  // The entry date against which we're checking leave requests
      ":approved": "approved",  // Approved status for leave
      ":pending": "pending"  // Pending status for leave
    }
  };

  // Query DynamoDB to check for leave requests
  try {
    const leaveResult = await docClient.send(new QueryCommand(leaveParams));
    console.log("Leave Query Result:", leaveResult);
    
    // Check if there is any leave matching the entry date
    const activeLeave = leaveResult.Items.find(leave => {
      const start = new Date(leave.startDate).toISOString().split("T")[0];  // Format start date (YYYY-MM-DD)
      const end = new Date(leave.endDate).toISOString().split("T")[0];  // Format end date (YYYY-MM-DD)
      return entryDate >= start && entryDate <= end;  // Check if entry date is within leave range
    });

    if (activeLeave) {  // If there is an active leave for this user
      console.log("Active leave found:", activeLeave);
      if (activeLeave.durationType === "half-day" && newTotal > 5) {
        results.push({
          entry,
          status: "failed",  // Mark as failed if total hours exceed 5 for a half-day leave
          reason: `Half-day leave on ${entryDate}: total hours must not exceed 5.`,
        });
        continue;
      } else {
        results.push({
          entry,
          status: "failed",  // Mark as failed if there's an active full-day leave
          reason: `Cannot log entry on ${entryDate} due to active leave.`,
        });
        continue;
      }
    } else {
      console.log("No active leave found.");
    }
  } catch (error) {
    console.error("Error querying leave requests:", error);
  }

  // === LEAVE CHECK: Block log if user is on leave ===
  const leaveParams1 = {
    TableName: "hrmsLeaveRequests",
    IndexName: "userEmail-startDate-index",
    KeyConditionExpression: "userEmail = :email AND startDate <= :entryDate",
    FilterExpression: "#st IN (:approved, :pending) AND endDate >= :entryDate",
    ExpressionAttributeNames: {
      "#st": "status",  // Avoid reserved keyword
    },
    ExpressionAttributeValues: {
      ":email": email,
      ":entryDate": entryDate,
      ":approved": "approved",
      ":pending": "pending",
    }
  };

  const leaveResult = await docClient.send(new QueryCommand(leaveParams1));

  // Check if entryDate falls within any leave range
  const leaveFound = leaveResult.Items.find(leave => {
    const start = leave.startDate.split("T")[0];
    const end = leave.endDate.split("T")[0];
    return entryDate >= start && entryDate <= end;
  });

  if (leaveFound) {
    results.push({
      entry,
      status: "failed",
      reason: `Cannot log entry on ${entryDate} — user is on ${leaveFound.durationType} leave (status: ${leaveFound.status}).`,
    });
    continue;
  }



// // === Count entries where entryDate !== updatedAtDate for each user ===
// let mismatchedEntriesCount = {};  // { email: count }

// for (const email of uniqueEmails) {
//   const queryParams = {
//     TableName: "employeeDailyActivityLogs",
//     IndexName: "email-entryDate-index",
//     KeyConditionExpression: "email = :email AND entryDate BETWEEN :start AND :end",
//     ExpressionAttributeValues: {
//       ":email": email,
//       ":start": "2020-01-01",  // Assuming old enough date
//       ":end": today,
//     },
//   };

//   const result = await docClient.send(new QueryCommand(queryParams));
//   const uniqueMismatchedDates = new Set();

//   for (const item of result.Items) {
//     const isMismatched = item.entryDate !== item.updatedAtDate;

//     const entryDateObj = new Date(item.entryDate);
//     const now = new Date();
//     const isThisMonth =
//       entryDateObj.getMonth() === now.getMonth() &&
//       entryDateObj.getFullYear() === now.getFullYear();

//     if (isMismatched && isThisMonth) {
//       uniqueMismatchedDates.add(item.entryDate);
//     }
//   }

//     mismatchedEntriesCount[email] = uniqueMismatchedDates.size;
//   // mismatchedEntriesCount[email] = mismatched.length;
// }



    // Step 3: Check if an entry for this date+email+projectName exists
    const checkParams = {
      TableName: "employeeDailyActivityLogs",
      IndexName: "email-entryDate-index",
      KeyConditionExpression: "email = :email AND entryDate = :entryDate",
      FilterExpression: "projectName = :projectName",
      ExpressionAttributeValues: {
        ":email": email,
        ":entryDate": entryDate,
        ":projectName": projectName,
      },
    };

    const existing = await docClient.send(new QueryCommand(checkParams));

    if (existing.Items.length > 0) {
      const existingItem = existing.Items[0];

      const updateParams = {
        TableName: "employeeDailyActivityLogs",
        Key: { Id: existingItem.Id },
        UpdateExpression: "set totalHoursSpent = :hrs, workDescription = :desc, updatedAt = :updatedAt",
        ExpressionAttributeValues: {
          ":hrs": totalHoursSpent,
          ":desc": workDescription,
          ":updatedAt": new Date().toISOString(),
        },
      };

      await docClient.send(new UpdateCommand(updateParams));
      results.push({ entry, status: "updated" });
      continue;
    }


    const updatedAtDate = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"

    // Step 5: Insert new entry
    const entryId = Date.now() * 1000 + Math.floor(Math.random() * 1000);
    const putParams = {
      TableName: "employeeDailyActivityLogs",
      Item: {
        Id: entryId.toString(),
        email,
        entryDate,
        projectName,
        totalHoursSpent,
        workDescription,
        stage,
        updatedAtDate,
        updatedAt: new Date().toISOString(),
      },
    };

    // if(mismatchedEntriesCount[email] >=1){
    //   results.push({
    //     entry,
    //     status: "failed",  // Mark as failed if there's an active full-day leave
    //     reason: `You already finished your 3 attempts`,
    //   });

    // return buildResponse(200, { message: "Entries processed." ,results,mismatchedEntriesCount}, origin);

    // }
  await docClient.send(new PutCommand(putParams));
  results.push({ entry, status: "success" });

  }


// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// === Count entries where entryDate !== updatedAtDate for each user ===
// const mismatchedEntriesCount = {};  // { email: count }
const backdatedLeft = {}
for (const email of uniqueEmails) {
const queryParams = {
  TableName: "employeeDailyActivityLogs",
  IndexName: "email-entryDate-index",
  KeyConditionExpression: "email = :email AND entryDate BETWEEN :start AND :end",
  ExpressionAttributeValues: {
    ":email": email,
    ":start": "2020-01-01",  // Assuming old enough date
    ":end": today,
  },
};

const result = await docClient.send(new QueryCommand(queryParams));
const uniqueMismatchedDates = new Set();

for (const item of result.Items) {
  const isMismatched = item.entryDate !== item.updatedAtDate;

  const entryDateObj = new Date(item.entryDate);
  const now = new Date();
  const isThisMonth =
    entryDateObj.getMonth() === now.getMonth() &&
    entryDateObj.getFullYear() === now.getFullYear();

  if (isMismatched && isThisMonth) {
    uniqueMismatchedDates.add(item.entryDate);
  }
}

backdatedLeft[email] = 3-uniqueMismatchedDates.size;

// mismatchedEntriesCount[email] = mismatched.length;
}

const IdBackDatedCount = Date.now() * 1000 + Math.floor(Math.random() * 1000);

if (Number(backdatedLeft[hrmsEmail]) < 1) {

const year = now.getFullYear();
const month = (now.getMonth() + 1).toString().padStart(2, "0"); // e.g., "05"
const currentPrefix = `${year}-${month}`; // e.g., "2025-05"

try {
  const checkParams = {
    TableName: "hrmsBackDatedCount",
    IndexName: "email-updatedAt-index", // Use the GSI
    KeyConditionExpression: "email = :email AND begins_with(updatedAt, :prefix)",
    ExpressionAttributeValues: {
      ":email": hrmsEmail,
      ":prefix": currentPrefix, // matches updatedAt like "2025-05"
    },
  };

  const checkResult = await docClient.send(new QueryCommand(checkParams));

  if (checkResult.Count === 0) {
    // No record for this email in this month – insert new one
    const insertParams = {
      TableName: "hrmsBackDatedCount",
      Item: {
        Id: IdBackDatedCount.toString(),
        email: hrmsEmail,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        // other fields if needed
      },
    };

    try {
      await docClient.send(new PutCommand(insertParams));
      console.log(`Inserted new record for ${hrmsEmail}`);
    } catch (insertError) {
      console.error("Insert failed:", insertError);
    }
  } else {
    console.log(`Record already exists for ${hrmsEmail} in ${currentPrefix}`);
  }
} catch (queryError) {
  console.error("Query failed:", queryError);
}


// const insertParams = {
//   TableName: "hrmsBackDatedCount",
//   Item: {
//     Id: IdBackDatedCount.toString(),  // Unique ID for the entry
//     email: hrmsEmail,
//     year: now.getFullYear(),
//     month: now.getMonth() + 1,  // +1 since getMonth() returns 0-indexed value
//     timestamp: new Date().toISOString(),  // Optional: to track when it was inserted
//   },
// };

// try {
//   await docClient.send(new PutCommand(insertParams));
//   console.log(`Inserted backdated allotment for ${hrmsEmail}`);
// } catch (err) {
//   console.error(`Failed to insert into hrmsBackDatedCount for ${hrmsEmail}:`, err);
// }
}


  return buildResponse(200, { message: "Entries processed.", results,backdatedLeft }, origin);
}

















// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
