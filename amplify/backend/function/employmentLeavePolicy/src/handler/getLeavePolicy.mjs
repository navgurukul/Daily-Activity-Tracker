import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
export const handler = async (event) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);

  const client = new DynamoDBClient({ region: "ap-south-1" });
  
  const command = new ScanCommand({
    TableName: "EmploymentLeavePolicy",
  });

  try {
    const response = await client.send(command);
    const cleanData = response.Items.map(item => unmarshall(item));

    if (cleanData.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "No policies found",
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
      },
      body: JSON.stringify({
        message: "All leave policies fetched successfully",
        data: cleanData,
      }),
    };
  } catch (error) {
    console.error("DynamoDB error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Error fetching leave policy",
        error: error.message,
      }),
    };
  }
};
