
// import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
// import {
//   DynamoDBDocumentClient,
//   PutCommand,
//   ScanCommand,
//   UpdateCommand,
//   DeleteCommand,
// } from "@aws-sdk/lib-dynamodb";

// // Initialize DynamoDB client
// const client = new DynamoDBClient({ region: "ap-south-1" });
// const docClient = DynamoDBDocumentClient.from(client);
// const TABLE_NAME = process.env.Project_Table || "ProjectMaster";

// const corsHeaders = {
//     "Access-Control-Allow-Origin": "*",
//     "Access-Control-Allow-Headers": "*",
//     "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE",
//   };

// export const handler = async (event) => {
//     const stage = event.requestContext.stage;
//     try {
//       if (event.httpMethod === "PUT") {
//         const data = JSON.parse(event.body);
      
//         if (!data.Id || !data.status) {
//           return {
//             statusCode: 400,
//             headers: corsHeaders,
//             body: JSON.stringify({
//               status: false,
//               message: "Id and status are required.",
//             }),
//           };
//         }
      
//         const updatableFields = [
//           "projectMasterEmail",
//           "clientName",
//           "priorities",
//           "projectBudget",
//           "channelName",
//           "channelId",
//           "projectStatus",
//           "projectName",
//         ];
      
//         let updateExpressions = [];
//         let expressionAttributeValues = {};
//         let expressionAttributeNames = {};
      
//         updatableFields.forEach((field) => {
//           if (field in data) {
//             const placeholder = `:${field}`;
//             const nameKey = `#${field}`;
      
//             updateExpressions.push(`${nameKey} = ${placeholder}`);
//             expressionAttributeNames[nameKey] = field;
//             expressionAttributeValues[placeholder] = data[field];
//           }
//         });
      
//         if (updateExpressions.length === 0) {
//           return {
//             statusCode: 400,
//             headers: corsHeaders,
//             body: JSON.stringify({
//               status: false,
//               message: "No fields provided for update.",
//             }),
//           };
//         }
      
//         const updateParams = {
//           TableName: TABLE_NAME,
//           Key: {
//             Id: data.Id,
//             status: data.status,
//           },
//           UpdateExpression: `SET ${updateExpressions.join(", ")}`,
//           ExpressionAttributeNames: {
//             ...expressionAttributeNames,
//             "#status": "status", // for ConditionExpression
//           },
//           ExpressionAttributeValues: expressionAttributeValues,
//           ConditionExpression: "attribute_exists(Id) AND attribute_exists(#status)",
//           ReturnValues: "ALL_NEW",
//         };
      
//         const result = await docClient.send(new UpdateCommand(updateParams));
      
//         return {
//           statusCode: 200,
//           headers: corsHeaders,
//           body: JSON.stringify({
//             status: true,
//             message: "Updated successfully",
//             updatedItem: result.Attributes,
//           }),
//         };
//       }      
//     } catch (err) {
//       console.error("ERROR:", err);
//       return {
//         statusCode: 500,
//         headers:corsHeaders,
//         body: JSON.stringify({ message: "Internal server error", error: err.message }),
//       };
//     }
//   };


































import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB client
const client = new DynamoDBClient({ region: "ap-south-1" });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.Project_Table || "ProjectMaster";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE",
};

export const handler = async (event) => {
  const stage = event.requestContext?.stage || "dev";

  try {
    if (event.httpMethod === "PUT") {
      const data = JSON.parse(event.body);

      if (!data.Id || !data.status) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            status: false,
            message: "Id and status are required.",
          }),
        };
      }

      const updatableFields = [
        "projectMasterEmail",
        "clientName",
        "priorities",
        "projectBudget",
        "channelName",
        "channelId",
        "projectStatus",
        "projectName",
        "department",
        "campus",
        "poc_of_project",
        "discordWebhook",
      ];

      const updateExpressions = [];
      const expressionAttributeValues = {
        ":updatedAt": new Date().toISOString(),
      };
      const expressionAttributeNames = {
        "#updatedAt": "updatedAt",
      };

      updatableFields.forEach((field) => {
        if (field in data) {
          const placeholder = `:${field}`;
          const nameKey = `#${field}`;
          updateExpressions.push(`${nameKey} = ${placeholder}`);
          expressionAttributeNames[nameKey] = field;
          expressionAttributeValues[placeholder] = data[field];
        }
      });

      updateExpressions.push("#updatedAt = :updatedAt");

      if (updateExpressions.length === 1) {
        // Only updatedAt is present
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            status: false,
            message: "No updatable fields provided.",
          }),
        };
      }

      const updateParams = {
        TableName: TABLE_NAME,
        Key: {
          Id: data.Id,
          status: data.status,
        },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: {
          ...expressionAttributeNames,
          "#status": "status",
        },
        ExpressionAttributeValues: expressionAttributeValues,
        ConditionExpression: "attribute_exists(Id) AND attribute_exists(#status)",
        ReturnValues: "ALL_NEW",
      };

      const result = await docClient.send(new UpdateCommand(updateParams));

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          status: true,
          message: "Updated successfully",
          updatedItem: result.Attributes,
        }),
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  } catch (err) {
    console.error("ERROR:", err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Internal server error",
        error: err.message,
      }),
    };
  }
};

// --------------------------------------------
// LOCAL TEST EXECUTION don't remove below codes
// --------------------------------------------
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const payload = {
    Id: "1750230308457124",
    status: "dev",
    clientName: "NG",
    department: "Communication",
    projectStatus: "Active",
    channelId: "C090D95QMEF",
    projectMasterEmail: "test@gmail.com",
    priorities: "P2",
    projectBudget: "101",
    channelName: "testing",
    projectName: "testing",
    // campus: "Sarjapura", // optional
    // poc_of_project: "ujjwal@navgurukul.org,puran@navgurukul.org", // optional
    // discordWebhook: "https://discord.com/api/webhooks/..." // optional
  };

  const fakeEvent = {
    httpMethod: "PUT",
    body: JSON.stringify(payload),
    requestContext: {
      stage: "dev",
    },
  };

  handler(fakeEvent).then((res) => {
    console.log("Response:", res.statusCode);
    console.log("Body:", JSON.stringify(JSON.parse(res.body), null, 2));
  });
}
