import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, QueryCommand, PutCommand,UpdateCommand, DeleteCommand  } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

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

        if (event.httpMethod === "POST") {
            const { email, projectName, totalHoursSpent, workDescription } = JSON.parse(event.body);

            if (!email || !projectName || !totalHoursSpent || !workDescription) {
                return { statusCode: 400, body: JSON.stringify({ message: "All fields are required." }) };
            }

            const today = new Date().toISOString().split("T")[0];

            const scanParams = {
                TableName: "employeeDailyActivityLogs",
                FilterExpression: "email = :email AND projectName = :projectName AND entryDate = :entryDate",
                ExpressionAttributeValues: {
                    ":email": email,
                    ":projectName": projectName,
                    ":entryDate": today,
                },
            };

            const existingEntries = await docClient.send(new ScanCommand(scanParams));

            if (existingEntries.Items.length > 0) {
                return { statusCode: 400, body: JSON.stringify({ message: "Entry already exists for today." }) };
            }

            const studentId = Date.now() * 1000 + Math.floor(Math.random() * 1000);

            const putParams = {
                TableName: "employeeDailyActivityLogs",
                Item: {
                    Id: studentId.toString(),
                    email,
                    entryDate: today,
                    projectName,
                    totalHoursSpent,
                    workDescription,
                    stage:stage,
                    updatedAt: new Date().toISOString(),
                },
            };

            await docClient.send(new PutCommand(putParams));
            return { statusCode: 201, body: JSON.stringify({ message: "Entry added successfully." }) };
        }

        if (event.httpMethod === "GET") {
            const email = event.pathParameters?.email;

            if (email) {
                const scanParams = {
                    TableName: "employeeDailyActivityLogs",
                    FilterExpression: "email = :email",
                    ExpressionAttributeValues: {
                        ":email": email,
                    },
                };
            
                const { Items } = await docClient.send(new ScanCommand(scanParams));
                
                const formattedResponse = {
                    [email]: Items.map(item => ({
                        Id: item.Id,
                        projectName: item.projectName,
                        Time: item.totalHoursSpent,
                        WorkDescription: item.workDescription,
                        Entrydate: item.entryDate,
                        UpdatedAt: item.updatedAt
                    }))
                };

                return { statusCode: 200, body: JSON.stringify(formattedResponse) };
            } else {
                // Retrieve all users if no email is provided
                const scanParams = {
                    TableName: "employeeDailyActivityLogs",
                };

                const { Items } = await docClient.send(new ScanCommand(scanParams));
                
                const formattedResponse = Items.reduce((acc, item) => {
                    if (!acc[item.email]) {
                        acc[item.email] = [];
                    }
                    acc[item.email].push({
                        Id: item.Id,
                        projectName: item.projectName,
                        Time: item.totalHoursSpent,
                        Description: item.workDescription,
                        Entrydate: item.entryDate,
                        UpdatedAt: item.updatedAt
                    });
                    return acc;
                }, {});

                return { statusCode: 200, body: JSON.stringify(formattedResponse) };
            }
        }
        if (event.httpMethod === "PUT") {
            const { Id, projectName, totalHoursSpent, workDescription } = JSON.parse(event.body);
            const email = event.pathParameters?.email;
            
            if (!Id || !email) {
                return { statusCode: 400, body: JSON.stringify({ message: "Id and email are required for updating an entry." }) };
            }
            
            const updateParams = {
                TableName: "employeeDailyActivityLogs",
                Key: { Id },
                UpdateExpression: "SET projectName = :projectName, totalHoursSpent = :totalHoursSpent, workDescription = :workDescription, updatedAt = :updatedAt",
                ExpressionAttributeValues: {
                    ":projectName": projectName,
                    ":totalHoursSpent": totalHoursSpent,
                    ":workDescription": workDescription,
                    ":updatedAt": new Date().toISOString()
                },
            };
            
            await docClient.send(new UpdateCommand(updateParams));
            return { statusCode: 200, body: JSON.stringify({ message: "Entry updated successfully." }) };
        }
        if (event.httpMethod === "DELETE") {
            const { Id } = JSON.parse(event.body);
            const email = event.pathParameters?.email;
            
            if (!Id || !email) {
                return { statusCode: 400, body: JSON.stringify({ message: "Id and email are required for deleting an entry." }) };
            }
            
            const deleteParams = {
                TableName: "employeeDailyActivityLogs",
                Key: { Id },
            };
            
            await docClient.send(new DeleteCommand(deleteParams));
            return { statusCode: 200, body: JSON.stringify({ message: "Entry deleted successfully." }) };
        }

        return { statusCode: 405, body: JSON.stringify({ message: "Method Not Allowed" }) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ message: "Internal Server Error", error: error.message }) };
    }
};
