
//>>>>>>>>>>>>OLD ONE OLD ONE >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
  QueryCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);
// const stage = event.requestContext.stage;

// Allowed CORS Origins
const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:5500', "https://amplify-backend-activitytracker.d1bx7f0aurfjs9.amplifyapp.com/"];

function buildResponse(statusCode, body, origin) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Credentials': 'true', // Optional
    },
    body: JSON.stringify(body),
  };
}
const isSecondOrFourthSaturday = (date) => {
  const day = date.getDay(); // 6 = Saturday
  const dateOfMonth = date.getDate();
  const weekOfMonth = Math.floor((dateOfMonth - 1) / 7) + 1;
  return day === 6 && (weekOfMonth === 2 || weekOfMonth === 4);
};

export const handler = async (event) => {
  const origin = event.headers.origin || event.headers.Origin || event.headers.ORIGIN;

  if (event.httpMethod === 'OPTIONS') {
    return buildResponse(200, { message: 'CORS preflight successful' }, origin);
  }

  try {
    if (event.body) {
      const body = JSON.parse(event.body);
      if (body.stage) {
        return buildResponse(500, { status: true, data: "invalid key" }, origin);
      }
    }

    const stage = event.requestContext.stage;
    const now = new Date();
    let today = new Date().toISOString().split("T")[0];
    if (now.getHours() < 7) {
      now.setDate(now.getDate() - 1);
      today = now.toISOString().split("T")[0];
    }

    if (event.httpMethod === "POST") {
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const { entries } = JSON.parse(event.body);
    
      if (!Array.isArray(entries) || entries.length === 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: "Entries should be a non-empty array." }),
        };
      }
    
      const results = [];
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    
      // Group entries by email to limit scans
      const uniqueEmails = [...new Set(entries.map((e) => e.email))];
      const emailBackdatedCount = {};
    
      for (const email of uniqueEmails) {
        const scanParams = {
          TableName: "employeeDailyActivityLogs",
          FilterExpression: "email = :email AND entryDate >= :monthStart AND entryDate < :today AND stage = :stage",
          ExpressionAttributeValues: {
            ":email": email,
            ":monthStart": monthStart,
            ":today": today,
            ":stage": stage,
          },
        };
        const result = await docClient.send(new ScanCommand(scanParams));
        const backdated = result.Items.filter(item => item.entryDate !== today);
        // emailBackdatedCount[email] = backdated.length;
        emailBackdatedCount[email] = new Set(
          backdated
            .filter(item => item.entryDate !== today)
            .map(item => item.entryDate)
        );
      }
    
      for (const entry of entries) {
        const { email, projectName, totalHoursSpent, workDescription, entryDate } = entry;
    
        // Basic validation
        if (!email || !projectName || !totalHoursSpent || !workDescription || !entryDate) {
          results.push({ entry, status: "failed", reason: "Missing required fields." });
          continue;
        }
    
        const entryDateObj = new Date(entryDate);
        const allowedDate = new Date(now);
        allowedDate.setDate(now.getDate() - 4); // Last 3 days only
    
        if (entryDateObj < allowedDate || entryDateObj > now) {
          results.push({
            entry,
            status: "failed",
            reason: "Entry date must be within the last 3 days (inclusive).",
          });
          continue;
        }
    
        // Check if entry already exists
        const checkParams = {
          TableName: "employeeDailyActivityLogs",
          FilterExpression: "email = :email AND projectName = :projectName AND entryDate = :entryDate",
          ExpressionAttributeValues: {
            ":email": email,
            ":projectName": projectName,
            ":entryDate": entryDate,
          },
        };
        // const existing = await docClient.send(new ScanCommand(checkParams));
        // if (existing.Items.length > 0) {
        //   results.push({ entry, status: "skipped", reason: "Duplicate entry for same project and date." });
        //   continue;
        // }
        // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
        const existing = await docClient.send(new ScanCommand(checkParams));
        if (existing.Items.length > 0) {
          const existingItem = existing.Items[0];

          const updateParams = {
            TableName: "employeeDailyActivityLogs",
            Key: {
              Id: existingItem.Id,
            },
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

        // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

        if (entryDate !== today) {
          if (!emailBackdatedCount[email]) emailBackdatedCount[email] = new Set();
        
          // If this backdated date is already counted, skip adding again
          if (!emailBackdatedCount[email].has(entryDate)) {
            if (emailBackdatedCount[email].size >= 3) {
              results.push({ entry, status: "failed", reason: "Only 3 unique backdated days allowed per month." });
              continue;
            }
            emailBackdatedCount[email].add(entryDate); // Count this unique backdated date
          }
        }
        
        // All good - insert entry
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
            updatedAt: new Date().toISOString(),
          },
        };
        console.log("Inserting item:", JSON.stringify(putParams, null, 2));
        await docClient.send(new PutCommand(putParams));

        results.push({ entry, status: "success" });

      }
      const backdatedLeft = {};
        for (const email of uniqueEmails) {
          backdatedLeft[email] = 3 - (emailBackdatedCount[email]?.size || 0);
        }

        // ✅ Final response
        return buildResponse(200, { message: "Entries processed.", results, backdatedLeft }, origin);


    }
    


    // GET: Fetch logs
    if (event.httpMethod === "GET") {
      const email = event.pathParameters?.email;
      const query = event.queryStringParameters || {};
      const specificDate = query.date;
      const month = query.month;
      const year = query.year;

      const scanParams = {
        TableName: "employeeDailyActivityLogs",
        FilterExpression: email ? "email = :email AND stage = :stage" : "stage = :stage",
        ExpressionAttributeValues: {
          ":stage": stage,
          ...(email && { ":email": email }),
        },
      };

      const { Items } = await docClient.send(new ScanCommand(scanParams));
      const filteredItems = Items.filter(item => {
        const entryDate = new Date(item.entryDate);
        const matchDateRange = query.dateStart && query.dateEnd
          ? (entryDate >= new Date(query.dateStart) && entryDate <= new Date(query.dateEnd))
          : true;
      
        const matchProject = query.projectName
          ? item.projectName === query.projectName
          : true;
      
        const matchSpecificDate = query.date
          ? item.entryDate === query.date
          : true;
      
        const matchMonthYear = query.month && query.year
          ? (entryDate.getUTCFullYear() === parseInt(query.year) &&
             entryDate.getUTCMonth() + 1 === parseInt(query.month))
          : true;
      
        return matchDateRange && matchProject && matchSpecificDate && matchMonthYear;
      });
      
      const formatted = filteredItems.reduce((acc, item) => {
        if (!acc[item.email]) acc[item.email] = [];
        acc[item.email].push({
          Id: item.Id,
          projectName: item.projectName,
          totalHoursSpent: item.totalHoursSpent,
          workDescription: item.workDescription,
          entryDate: item.entryDate,
          updatedAt: item.updatedAt,
        });
        return acc;
      }, {});

      return buildResponse(200, formatted, origin);
    }

    // PUT: Update entry
    if (event.httpMethod === "PUT") {
      const { Id, projectName, totalHoursSpent, workDescription } = JSON.parse(event.body);
      if (!Id) return buildResponse(400, { message: "Id is required for updating an entry." }, origin);

      const updateParams = {
        TableName: "employeeDailyActivityLogs",
        Key: { Id },
        UpdateExpression: "SET projectName = :projectName, totalHoursSpent = :totalHoursSpent, workDescription = :workDescription, updatedAt = :updatedAt",
        ConditionExpression: "stage = :stage",
        ExpressionAttributeValues: {
          ":projectName": projectName,
          ":totalHoursSpent": totalHoursSpent,
          ":workDescription": workDescription,
          ":updatedAt": new Date().toISOString(),
          ":stage": stage,
        },
      };

      await docClient.send(new UpdateCommand(updateParams));
      return buildResponse(200, { message: "Entry updated successfully." }, origin);
    }

    // DELETE: Remove entry
    if (event.httpMethod === "DELETE") {
      const { Id } = JSON.parse(event.body);
      if (!Id) return buildResponse(400, { message: "Id is required for deleting an entry." }, origin);

      const deleteParams = {
        TableName: "employeeDailyActivityLogs",
        Key: { Id },
        ConditionExpression: "stage = :stage",
        ExpressionAttributeValues: { ":stage": stage },
      };

      await docClient.send(new DeleteCommand(deleteParams));
      return buildResponse(200, { message: "Entry deleted successfully." }, origin);
    }

    return buildResponse(405, { message: "Method Not Allowed" }, origin);
  } catch (error) {
    return buildResponse(500, { message: "Internal Server Error", error: error.message }, event.headers.origin || "");
  }
};