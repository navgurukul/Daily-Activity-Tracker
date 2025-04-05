import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, QueryCommand, PutCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
    try {
        if (event.body) {
            const body = JSON.parse(event.body);
            if (body.stage) {
                return {
                    statusCode: 500,
                    body: JSON.stringify({ status: true, data: "invalid key" || [] }),
                };
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
            const { email, projectName, totalHoursSpent, workDescription, entryDate } = JSON.parse(event.body);
            if (!email || !projectName || !totalHoursSpent || !workDescription || !entryDate) {
                return { statusCode: 400, body: JSON.stringify({ message: "All fields are required." }) };
            }
            
            const entryDateObj = new Date(entryDate);
            const allowedDate = new Date();
            allowedDate.setDate(allowedDate.getDate() - 3);
            
            if (entryDateObj < allowedDate || entryDateObj > now) {
                return { statusCode: 400, body: JSON.stringify({ message: "You can only add logs for the last three days, including today." }) };
            }
            
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
            const checkParams = {
                TableName: "employeeDailyActivityLogs",
                FilterExpression: "email = :email AND entryDate >= :monthStart AND entryDate < :today",
                ExpressionAttributeValues: {
                    ":email": email,
                    ":monthStart": monthStart,
                    ":today": today,
                },
            };
            
            const pastEntries = await docClient.send(new ScanCommand(checkParams));
            const backdatedEntries = pastEntries.Items.length;
            
            if (entryDate !== today && backdatedEntries >= 2) {
                return { statusCode: 400, body: JSON.stringify({ message: "You can only add backdated entries up to twice per month." }) };
            }
            
            const scanParams = {
                TableName: "employeeDailyActivityLogs",
                FilterExpression: "email = :email AND projectName = :projectName AND entryDate = :entryDate",
                ExpressionAttributeValues: {
                    ":email": email,
                    ":projectName": projectName,
                    ":entryDate": entryDate,
                },
            };
            
            const existingEntries = await docClient.send(new ScanCommand(scanParams));
            if (existingEntries.Items.length > 0) {
                return { statusCode: 400, body: JSON.stringify({ message: "Entry already exists for this date." }) };
            }
            
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
            await docClient.send(new PutCommand(putParams));
            return { statusCode: 201, body: JSON.stringify({ message: "Entry added successfully." }) };
        }

        if (event.httpMethod === "GET") {
            const email = event.pathParameters?.email;
            const query = event.queryStringParameters || {};
            const specificDate = query.date; // format: "YYYY-MM-DD"
            const month = query.month;
            const year = query.year;
        
            const scanParams = {
                TableName: "employeeDailyActivityLogs",
                FilterExpression: email ? "email = :email AND stage = :stage" : "stage = :stage",
                ExpressionAttributeValues: {
                    ":stage": stage,
                    ...(email && { ":email": email })
                },
            };
        
            const { Items } = await docClient.send(new ScanCommand(scanParams));
        
            const filteredItems = Items.filter(item => {
                if (specificDate) {
                    return item.entryDate === specificDate;
                }
        
                if (month && year) {
                    const date = new Date(item.entryDate);
                    return (
                        date.getUTCFullYear() === parseInt(year) &&
                        (date.getUTCMonth() + 1) === parseInt(month)
                    );
                }
        
                return true; // No date/month/year filtering
            });
        
            const formattedResponse = filteredItems.reduce((acc, item) => {
                if (!acc[item.email]) {
                    acc[item.email] = [];
                }
                acc[item.email].push({
                    Id: item.Id,
                    projectName: item.projectName,
                    totalHoursSpent: item.totalHoursSpent,
                    workDescription: item.workDescription,
                    entryDate: item.entryDate,
                    updatedAt: item.updatedAt
                });
                return acc;
            }, {});
        
            return {
                statusCode: 200,
                body: JSON.stringify(formattedResponse),
            };
        }
        

        if (event.httpMethod === "PUT") {
            const { Id, projectName, totalHoursSpent, workDescription } = JSON.parse(event.body);
            if (!Id) {
                return { statusCode: 400, body: JSON.stringify({ message: "Id is required for updating an entry." }) };
            }
            
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
            return { statusCode: 200, body: JSON.stringify({ message: "Entry updated successfully." }) };
        }

        if (event.httpMethod === "DELETE") {
            const { Id } = JSON.parse(event.body);
            if (!Id) {
                return { statusCode: 400, body: JSON.stringify({ message: "Id is required for deleting an entry." }) };
            }
            
            const deleteParams = {
                TableName: "employeeDailyActivityLogs",
                Key: { Id },
                ConditionExpression: "stage = :stage",
                ExpressionAttributeValues: { ":stage": stage },
            };
            await docClient.send(new DeleteCommand(deleteParams));
            return { statusCode: 200, body: JSON.stringify({ message: "Entry deleted successfully." }) };
        }
        
        return { statusCode: 405, body: JSON.stringify({ message: "Method Not Allowed" }) };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ message: "Internal Server Error", error: error.message }) };
    }
};
