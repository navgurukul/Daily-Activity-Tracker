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
              stage: stage,
              clientName: data.clientName || "",
              priorities: data.priorities || "",
              projectBudget: data.projectBudget || "",
              projectStatus: data.projectStatus || "",
              department: data.department || "",
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
          
    } catch (err) {
      console.error("ERROR:", err);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ message: "Internal server error", error: err.message }),
      };
    }
  };