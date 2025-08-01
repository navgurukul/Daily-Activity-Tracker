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
                Id: String(data.Id),
                status: data.status,
              },
              // ConditionExpression: "attribute_exists(Id) AND attribute_exists(#status)",
              // ExpressionAttributeNames: {
              //   "#status": "status",
              // },
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
          
    } catch (err) {
      console.error("======================ERROR:", err);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Internal server error", error: err.message }),
      };
    }
  };