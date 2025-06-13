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
//         if (event.httpMethod === "PUT") {
//             const data = JSON.parse(event.body);
      
//             if (!data.projectName || !data.Id || !data.status) {
//               return {
//                 statusCode: 400,
//                 headers: corsHeaders,
//                 body: JSON.stringify({
//                   status: false,
//                   message: "Project name, Id, and status are required.",
//                 }),
//               };
//             }
      
//             const updateParams = {
//               TableName: TABLE_NAME,
//               Key: {
//                 Id: data.Id,
//                 status: data.status, // still used here, just quoted string
//               },
//               UpdateExpression: `
//                 SET 
//                   projectMasterEmail = :projectMasterEmail, 
//                   clientName = :clientName, 
//                   priorities = :priorities, 
//                   projectBudget = :projectBudget, 
//                   channelName = :channelName, 
//                   channelId = :channelId, 
//                   projectStatus = :projectStatus, 
//                   projectName = :projectName
//               `,
//               ExpressionAttributeValues: {
//                 ":clientName": data.clientName || "",
//                 ":priorities": data.priorities || "",
//                 ":projectBudget": data.projectBudget || "",
//                 ":projectMasterEmail": data.projectMasterEmail || "",
//                 ":channelName": data.channelName || "",
//                 ":channelId": data.channelId || "",
//                 ":projectStatus": data.projectStatus || "",
//                 ":projectName": data.projectName || "",
//               },
//               ExpressionAttributeNames: {
//                 "#status": "status", // handling reserved keyword
//               },
//               ConditionExpression: "attribute_exists(Id) AND attribute_exists(#status)",
//               ReturnValues: "ALL_NEW",
//             };
      
//             const result = await docClient.send(new UpdateCommand(updateParams));
      
//             return {
//               statusCode: 200,
//               headers: corsHeaders,
//               body: JSON.stringify({
//                 status: true,
//                 message: "Updated successfully",
//                 updatedItem: result.Attributes,
//               }),
//             };
//           }
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
  PutCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
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
    const stage = event.requestContext.stage;
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
        ];
      
        let updateExpressions = [];
        let expressionAttributeValues = {};
        let expressionAttributeNames = {};
      
        updatableFields.forEach((field) => {
          if (field in data) {
            const placeholder = `:${field}`;
            const nameKey = `#${field}`;
      
            updateExpressions.push(`${nameKey} = ${placeholder}`);
            expressionAttributeNames[nameKey] = field;
            expressionAttributeValues[placeholder] = data[field];
          }
        });
      
        if (updateExpressions.length === 0) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({
              status: false,
              message: "No fields provided for update.",
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
            "#status": "status", // for ConditionExpression
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
    } catch (err) {
      console.error("ERROR:", err);
      return {
        statusCode: 500,
        headers:corsHeaders,
        body: JSON.stringify({ message: "Internal server error", error: err.message }),
      };
    }
  };

