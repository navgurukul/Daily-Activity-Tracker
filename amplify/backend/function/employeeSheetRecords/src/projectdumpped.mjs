
import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import { fetchGoogleSheetData } from "./fetchGoogleSheets.mjs"; // ⬅️ Adjust the path if needed

dotenv.config();

const docClient = new AWS.DynamoDB.DocumentClient({
  region: "ap-south-1",
});

const TABLE_NAME = "ProjectMaster";

// 1. Get existing project names from DynamoDB
async function getExistingProjectNames() {
  const existingNames = new Set();
  let ExclusiveStartKey = null;

  try {
    do {
      const params = {
        TableName: TABLE_NAME,
        ProjectionExpression: "projectName",
        ExclusiveStartKey,
      };

      const result = await docClient.scan(params).promise();
      result.Items.forEach(item => {
        if (item.projectName) {
          existingNames.add(item.projectName.trim());
        }
      });

      ExclusiveStartKey = result.LastEvaluatedKey;
    } while (ExclusiveStartKey);
  } catch (err) {
    console.error("❌ Error scanning DynamoDB:", err.message);
  }

  return existingNames;
}

// 2. Insert only new records
async function insertNewProjects(sheetData, existingProjectNames) {
  for (const project of sheetData) {
    const projectName = project["Project Name"];
    if (!projectName || existingProjectNames.has(projectName.trim())) {
      console.log(`⏩ Skipping duplicate project: ${projectName}`);
      continue;
    }

    const item = {
      Id: uuidv4(),
      projectName,
      department: project["Department"] || "",
      channelName: project["Slack Channel Name"] || "",
      channelId: project["Slack Channel ID"] || "",
      projectMasterEmail: project["PM Email"] || "",
      clientName: project["Client Name"] || "",
      priorities: project["Priority"] || "",
      projectBudget: project["Project Budget"] || "",
      projectStatus: project["Status"] || "",
      campus: project["Campus"] || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "dev",
      stage: "dev",
      discordWebhook: "",
      poc_of_project: project["Approver Email"] || "",
    };

    try {
      await docClient.put({ TableName: TABLE_NAME, Item: item }).promise();
      console.log(`✅ Inserted: ${projectName}`);
    } catch (err) {
      console.error(`❌ Failed inserting ${projectName}:`, err.message);
    }
  }
}

// 3. Main function
async function main() {
  console.log("🚀 Starting Project Sync...");

  const sheetData = await fetchGoogleSheetData("Sheet1"); // Or your actual sheet tab name
  if (!sheetData.length) {
    console.log("📭 No data found in sheet. Exiting.");
    return;
  }

  const existingProjects = await getExistingProjectNames();
  await insertNewProjects(sheetData, existingProjects);

  console.log("🎉 Sync complete!");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
