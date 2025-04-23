import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "ap-south-1" });
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  console.log("Received event:", JSON.stringify(event));

  const employeeEmail = event.queryStringParameters?.employeeEmail;

  console.log("employeeEmail param:", employeeEmail);

  if (!employeeEmail) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Missing employeeEmail" }),
    };
  }

  const params = {
    TableName: "LeaveRequests",
    IndexName: "employeeEmail-index",
    KeyConditionExpression: "employeeEmail = :email",
    ExpressionAttributeValues: {
      ":email": employeeEmail,
    },
    // Optional: Sort by createdAt descending
    ScanIndexForward: false,
  };

  try {
    const result = await docClient.send(new QueryCommand(params));
    console.log("Query result:", result);
    return {
      statusCode: 200,
      body: JSON.stringify(result.Items),
    };
  } catch (err) {
    console.error("DynamoDB Query Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
