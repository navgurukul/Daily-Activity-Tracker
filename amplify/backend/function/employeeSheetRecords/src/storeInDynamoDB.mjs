import AWS from "aws-sdk";
import fetch from "node-fetch";
import { v4 as uuidv4 } from "uuid";

const dynamoDB = new AWS.DynamoDB.DocumentClient({
    region: "ap-south-1",
    endpoint: process.env.AWS_SAM_LOCAL ? "http://localhost:8000" : undefined,
});

const TABLE_NAME = "employeeRecords_PNC_Sheet";

// 🟢 1. Fetch Data from Google Sheets
async function fetchGoogleSheetData() {
    const SHEET_API_URL = "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employeeSheetRecords";
    try {
        console.log("🚀 Fetching data from Google Sheets API...");
        const response = await fetch(SHEET_API_URL);

        if (!response.ok) throw new Error(`HTTP Error: ${response.statusText}`);

        const jsonData = await response.json();
        if (!jsonData.success || !jsonData.data) throw new Error("Invalid response from API");

        console.log(`✅ Fetched ${jsonData.data.length} records from Google Sheets`);
        return jsonData.data;
    } catch (error) {
        console.error("❌ Error fetching data:", error);
        return [];
    }
}

// 🔍 2. Check for existing employee using SCAN (no index)
async function getEmployeeByEmail(email) {
    const params = {
        TableName: TABLE_NAME,
        FilterExpression: "#email = :email",
        ExpressionAttributeNames: { "#email": "Active email address for work" },
        ExpressionAttributeValues: { ":email": email }
    };

    try {
        const result = await dynamoDB.scan(params).promise();
        return result.Items.length > 0 ? result.Items[0] : null;
    } catch (error) {
        console.error(`❌ Error checking email ${email}:`, error);
        return null;
    }
}

// 🔁 3. Insert or Update
async function insertOrUpdateEmployee(employee) {
    const email = employee["Active email address for work"];
    if (!email) {
        console.warn(`⚠️ Skipping entry with missing email: ${JSON.stringify(employee)}`);
        return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingEmployee = await getEmployeeByEmail(normalizedEmail);
    const employeeId = existingEmployee ? existingEmployee.Id : uuidv4();
    const timestamp = new Date().toISOString();

    let updateExpression = "SET ";
    let expressionAttributeNames = {};
    let expressionAttributeValues = {};

    let index = 0;

    for (const key in employee) {
        const attrName = `#key${index}`;
        const attrValue = `:val${index}`;
        updateExpression += `${index > 0 ? ", " : ""}${attrName} = ${attrValue}`;
        expressionAttributeNames[attrName] = key;
        expressionAttributeValues[attrValue] = employee[key] || "Unknown";
        index++;
    }

    // createdAt or updatedAt
    if (existingEmployee) {
        updateExpression += `, #updatedAt = :updatedAt`;
        expressionAttributeNames["#updatedAt"] = "updatedAt";
        expressionAttributeValues[":updatedAt"] = timestamp;
    } else {
        updateExpression += `, #createdAt = :createdAt`;
        expressionAttributeNames["#createdAt"] = "createdAt";
        expressionAttributeValues[":createdAt"] = timestamp;
    }

    // stage = dev
    updateExpression += `, #stage = :stage`;
    expressionAttributeNames["#stage"] = "stage";
    expressionAttributeValues[":stage"] = "dev";

    const params = {
        TableName: TABLE_NAME,
        Key: { Id: employeeId },
        UpdateExpression: updateExpression,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
    };

    try {
        await dynamoDB.update(params).promise();
        console.log(`✅ ${existingEmployee ? "Updated" : "Inserted"}: ${employee.Name} (Email: ${normalizedEmail})`);
    } catch (error) {
        console.error(`❌ Error processing ${employee.Name}:`, error);
    }
}


// 🚀 4. Main Runner
async function main() {
    console.log("🏁 Running Daily Employee Sync...");

    const employees = await fetchGoogleSheetData();
    if (employees.length === 0) {
        console.error("❌ No employees fetched. Exiting...");
        return;
    }

    console.log(`🔄 Processing ${employees.length} employees...`);

    await Promise.all(employees.map(insertOrUpdateEmployee));

    console.log("🎉 All employees processed in DynamoDB!");
}


if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { insertOrUpdateEmployee };
