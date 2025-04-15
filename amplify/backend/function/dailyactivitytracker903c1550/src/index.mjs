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

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE",
};

export const handler = async (event) => {
  try {
    // Handle preflight request for CORS
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ status: true, message: "CORS preflight handled" }),
      };
    }

    if (event.body !== null && event.body !== undefined) {
      if (JSON.parse(event.body).stage) {
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ status: true, data: "invalid key" }),
        };
      }
    }

    const stage = event.requestContext.stage;

    // GET method - fetch all records
   
    if (event.httpMethod === "GET") {
      const getParams = {
        TableName: TABLE_NAME,
        FilterExpression: "#stageAttr = :stageValue",
        ExpressionAttributeNames: { "#stageAttr": "stage" },
        ExpressionAttributeValues: { ":stageValue": stage },
      };

      const result = await docClient.send(new ScanCommand(getParams));

      // Remove 'stage' key from each item before sending
      const sanitizedItems = (result.Items || []).map(item => {
        const { stage, ...rest } = item;
        return rest;
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          status: true,
          data: sanitizedItems,
        }),
      };
    }


    // POST method - insert new record
    if (event.httpMethod === "POST") {
      const data = JSON.parse(event.body);

      if (!data.projectName) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ status: false, message: "Project name is required." }),
        };
      }

      const studentId = Date.now() * 1000 + Math.floor(Math.random() * 1000);

      const getParams = {
        TableName: TABLE_NAME,
        FilterExpression: "#nameAttr = :nameValue AND #stageAttr = :stageValue",
        ExpressionAttributeNames: {
          "#nameAttr": "projectName",
          "#stageAttr": "stage",
        },
        ExpressionAttributeValues: {
          ":nameValue": data.projectName,
          ":stageValue": stage,
        },
      };
      const result = await docClient.send(new ScanCommand(getParams));

      if (result?.Items && result.Items.length > 0) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            status: false,
            message: "Project Name already exists for this stage.",
          }),
        };
      }

      const item = {
        projectName: data.projectName,
        Id: studentId.toString(),
        status: stage,
        channelName: data.channelName || "",
        channelId: data.channelId || "",
        projectMasterEmail: data.projectMasterEmail || "",
        clientName: data.clientName || "",
        priorities: data.priorities || "",
        projectBudget: data.projectBudget || "",
        stage: stage,
      };

      const putParams = {
        TableName: TABLE_NAME,
        Item: item,
        ConditionExpression: "attribute_not_exists(projectName)",
      };

      await docClient.send(new PutCommand(putParams));

      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({
          status: true,
          message: "Created successfully",
          project: item,
        }),
      };
    }

   // PUT method - update project
    if (event.httpMethod === "PUT") {
      const data = JSON.parse(event.body);

      if (!data.projectName || !data.Id || !data.status) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            status: false,
            message: "Project name, Id, and status are required.",
          }),
        };
      }

      const updateParams = {
        TableName: TABLE_NAME,
        Key: {
          Id: data.Id,
          status: data.status, // still used here, just quoted string
        },
        UpdateExpression: `
          SET 
            projectMasterEmail = :projectMasterEmail, 
            clientName = :clientName, 
            priorities = :priorities, 
            projectBudget = :projectBudget, 
            channelName = :channelName, 
            channelId = :channelId, 
            projectStatus = :projectStatus, 
            projectName = :projectName
        `,
        ExpressionAttributeValues: {
          ":clientName": data.clientName || "",
          ":priorities": data.priorities || "",
          ":projectBudget": data.projectBudget || "",
          ":projectMasterEmail": data.projectMasterEmail || "",
          ":channelName": data.channelName || "",
          ":channelId": data.channelId || "",
          ":projectStatus": data.projectStatus || "",
          ":projectName": data.projectName || "",
        },
        ExpressionAttributeNames: {
          "#status": "status", // handling reserved keyword
        },
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



    // DELETE method - delete project
    if (event.httpMethod === "DELETE") {
      const data = JSON.parse(event.body);

      if (!data.Id || !data.status) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ status: false, message: "Id and status are required for deletion." }),
        };
      }

      const deleteParams = {
        TableName: TABLE_NAME,
        Key: {
          Id: data.Id,
          status: data.status,
        },
        ConditionExpression: "attribute_exists(Id) AND attribute_exists(#status)",
        ExpressionAttributeNames: {
          "#status": "status",
        },
      };

      await docClient.send(new DeleteCommand(deleteParams));

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          status: true,
          message: "Deleted successfully",
          deletedItem: data,
        }),
      };
    }

    // Method not allowed
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ status: false, message: "Method Not Allowed" }),
    };
  } catch (error) {
    console.error("Error:", error);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        status: false,
        message: "Error processing request",
        error: error.message,
      }),
    };
  }
};
