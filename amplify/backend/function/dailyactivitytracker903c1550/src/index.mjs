import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, ScanCommand, UpdateCommand,DeleteCommand } from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB client
const client = new DynamoDBClient({ region: "ap-south-1" });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.Project_Table || "ProjectMaster";

export const handler = async (event) => {
  try {
    if(event.body!=null || event.body!=undefined) {
      if (JSON.parse(event.body).stage){
        return {
          statusCode: 500,
          body: JSON.stringify({ status: true, data: "invalid key" || [] }),
        };
      }
    }
    const stage =  event.requestContext.stage;
    // Handle GET request to fetch all records from the "ProjectMaster" table
    if (event.httpMethod === "GET") {
      // const getParams = {
      //   TableName: TABLE_NAME,
      // };
      console.log("I am insdie index.js")
      const getParams = {
        TableName: TABLE_NAME,
        FilterExpression: "#stageAttr = :stageValue",
        ExpressionAttributeNames: { "#stageAttr": "stage" },
        ExpressionAttributeValues: { ":stageValue": stage },
      };
      const result = await docClient.send(new ScanCommand(getParams));

      return {
        statusCode: 200,
        body: JSON.stringify({ status: true, data: {rs:result.Items,stages:event.requestContext.stage} || [] }),
      };
    }

    // Handle POST request to insert a new project record
    if (event.httpMethod === "POST") {
      const data = JSON.parse(event.body);

      // Validate required field: projectName must be provided
      if (!data.projectName) {
        return {
          statusCode: 400,
          body: JSON.stringify({ status: false, message: "Project name is required." }),
        };
      }

      // Generate a unique ID based on timestamp (potentially high collision risk under heavy load)
      const studentId = Date.now() * 1000 + Math.floor(Math.random() * 1000);

      // Check if the project name already exists in the table

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

      // If projectName exists, return an error
      if (result?.Items && result.Items.length > 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({ status: false, message: "Project Name already exists for this stage." }),
        };
      }

      // Construct the new project record
      const item = {
        projectName: data.projectName,
        Id: studentId.toString(), // Convert studentId to string to maintain consistency
        status: "active",
        channelName: data.channelName || "", // Default empty string if not provided
        channelId: data.channelId || "",
        projectMasterEmail: data.projectMasterEmail || "",
        clientName: data.clientName || "",
        priorities: data.priorities || "",
        projectBudget: data.projectBudget || "",
        stage:stage
      };

      // Insert new record into the "ProjectMaster" table with condition to avoid duplicates
      const putParams = {
        TableName: TABLE_NAME,
        Item: item,
        ConditionExpression: "attribute_not_exists(projectName)", // Ensures projectName is unique
      };

      await docClient.send(new PutCommand(putParams));

      return {
        statusCode: 201,
        body: JSON.stringify({ status: true, message: "Created successfully", project: item }),
      };
    }

    // Handle PUT request to update an existing record based on projectName
    if (event.httpMethod === "PUT") {
      const data = JSON.parse(event.body);

      // Validate required field
      if (!data.projectName) {
        return {
          statusCode: 400,
          body: JSON.stringify({ status: false, message: "Project name is required." }),
        };
      }

      // Define the update parameters
      const updateParams = {
        TableName: TABLE_NAME,
        Key: { 
          Id: data.Id,   // Use correct partition key name
          status: data.status  // Use correct sort key name
        },
        UpdateExpression:
          "SET projectMasterEmail = :projectMasterEmail, clientName = :clientName, priorities = :priorities, projectBudget = :projectBudget",
        ExpressionAttributeValues: {
          ":clientName": data.clientName || null,
          ":priorities": data.priorities || null,
          ":projectBudget": data.projectBudget || null,
          ":projectMasterEmail":data.projectMasterEmail || null,
          
        },
        ExpressionAttributeNames: {
          "#status": "status" // Alias reserved keyword
        },
        ConditionExpression: "attribute_exists(Id) AND attribute_exists(#status)", // Ensure item exists
        ReturnValues: "ALL_NEW",
      };
      
      const result = await docClient.send(new UpdateCommand(updateParams));
      
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          status: true,
          message: "Updated successfully",
          updatedItem: updateParams, // Return updated record
        }),
      };
    }

    if (event.httpMethod === "DELETE") {
      const data = JSON.parse(event.body);

      if (!data.Id || !data.status) {
        return {
          statusCode: 400,
          body: JSON.stringify({ status: false, message: "Id and status are required for deletion." }),
        };
      }

      const deleteParams = {
        TableName: TABLE_NAME,
        Key: {
          Id: data.Id,
          status: data.status,
        },
        ConditionExpression: "attribute_exists(Id) AND attribute_exists(#status)", // Fix reserved keyword issue
        ExpressionAttributeNames: {
          "#status": "status", // Alias for status
        },
      };

      await docClient.send(new DeleteCommand(deleteParams));

      return {
        statusCode: 200,
        body: JSON.stringify({ status: true, message: "Deleted successfully", deletedItem: data }),
      };
    }
    

    // Handle unsupported HTTP methods
    return {
      statusCode: 405,
      body: JSON.stringify({ status: false, message: "Method Not Allowed" }),
    };
  } catch (error) {
    console.error("Error:", error);

    // Return error response
    return {
      statusCode: 500,
      body: JSON.stringify({ status: false, message: "Error processing request", error: error.message }),
    };
  }
  
};
