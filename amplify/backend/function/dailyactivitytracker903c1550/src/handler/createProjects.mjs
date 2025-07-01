
// import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
// import {
//   DynamoDBDocumentClient,
//   PutCommand,
//   ScanCommand,
// } from "@aws-sdk/lib-dynamodb";

// // Initialize DynamoDB client
// const client = new DynamoDBClient({ region: "ap-south-1" });
// const docClient = DynamoDBDocumentClient.from(client);
// const TABLE_NAME = process.env.Project_Table || "ProjectMaster";

// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Headers": "*",
//   "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE",
// };

// export const handler = async (event) => {
//   const stage = event.requestContext?.stage || "dev";

//   try {
//     if (event.httpMethod === "POST") {
//       const data = JSON.parse(event.body);

//       if (!data.projectName) {
//         return {
//           statusCode: 400,
//           headers: corsHeaders,
//           body: JSON.stringify({
//             status: false,
//             message: "Project name is required.",
//           }),
//         };
//       }

//       const department = data.department || "";
//       const campus = data.campus || "";

//       // Block duplicate project names for non-Residential Program department
//       if (department !== "Residential Program") {
//         const getParams = {
//           TableName: TABLE_NAME,
//           FilterExpression: "#nameAttr = :nameValue AND #stageAttr = :stageValue",
//           ExpressionAttributeNames: {
//             "#nameAttr": "projectName",
//             "#stageAttr": "stage",
//           },
//           ExpressionAttributeValues: {
//             ":nameValue": data.projectName,
//             ":stageValue": stage,
//           },
//         };

//         const result = await docClient.send(new ScanCommand(getParams));

//         if (result?.Items && result.Items.length > 0) {
//           return {
//             statusCode: 400,
//             headers: corsHeaders,
//             body: JSON.stringify({
//               status: false,
//               message: `Project '${data.projectName}' already exists in '${department}' department.`,
//             }),
//           };
//         }
//       }

//       // const campus = data.campus || "";

//       // Only run duplicate check if campus is present
//       if (campus !== "") {
//         const getParams = {
//           TableName: TABLE_NAME,
//           FilterExpression:
//             "#nameAttr = :nameValue AND #campusAttr = :campusValue AND #stageAttr = :stageValue",
//           ExpressionAttributeNames: {
//             "#nameAttr": "projectName",
//             "#campusAttr": "campus",
//             "#stageAttr": "stage",
//           },
//           ExpressionAttributeValues: {
//             ":nameValue": data.projectName,
//             ":campusValue": campus,
//             ":stageValue": stage,
//           },
//         };

//         const result = await docClient.send(new ScanCommand(getParams));

//         if (result?.Items && result.Items.length > 0) {
//           return {
//             statusCode: 400,
//             headers: corsHeaders,
//             body: JSON.stringify({
//               status: false,
//               message: `Project '${data.projectName}' already exists for campus '${campus}'.`,
//             }),
//           };
//         }
//       }

//       const studentId = Date.now() * 1000 + Math.floor(Math.random() * 1000);
//       const timestamp = new Date().toISOString();

//       const item = {
//         projectName: data.projectName,
//         Id: studentId.toString(),
//         status: stage,
//         channelName: data.channelName || "",
//         channelId: data.channelId || "",
//         projectMasterEmail: data.projectMasterEmail || "",
//         stage: stage,
//         clientName: data.clientName || "",
//         priorities: data.priorities || "",
//         projectBudget: data.projectBudget || "",
//         projectStatus: data.projectStatus || "",
//         department: data.department || "",
//         campus: campus,
//         poc_of_project: data.poc_of_project || false,
//         discordWebhook: data.discordWebhook || "",
//         createdAt: timestamp,
//         updatedAt: timestamp,
//       };

//       const putParams = {
//         TableName: TABLE_NAME,
//         Item: item,
//         ConditionExpression: "attribute_not_exists(Id)",
//       };

//       await docClient.send(new PutCommand(putParams));

//       return {
//         statusCode: 201,
//         headers: corsHeaders,
//         body: JSON.stringify({
//           status: true,
//           message: "Created successfully",
//           project: item,
//         }),
//       };
//     }

//     return {
//       statusCode: 405,
//       headers: corsHeaders,
//       body: JSON.stringify({ message: "Method not allowed" }),
//     };
//   } catch (err) {
//     console.error("ERROR:", err);
//     return {
//       statusCode: 500,
//       headers: corsHeaders,
//       body: JSON.stringify({ message: "Internal server error", error: err.message }),
//     };
//   }
// };

// // --------------------------------------------
// // LOCAL TEST EXECUTION
// // --------------------------------------------
// if (process.argv[1] === new URL(import.meta.url).pathname) {
//   const payload = {
//     clientName: "NG212",
//     projectStatus: "active",
//     channelId: "C05UQHACB52",
//     projectMasterEmail: "ujjwalkashyap97987@gmail.com",
//     priorities: "p1",
//     projectBudget: "4k",
//     status: "dev",
//     channelName: "investigation",
//     projectName: "New123",
//     department: "Residential Program", // optional
//     campus: "Sarjapura", // optional
//     // discordWebhook: "https://discord.com/api/...", // optional
//     // poc_of_project: true // optional
//   };

//   const fakeEvent = {
//     httpMethod: "POST",
//     body: JSON.stringify(payload),
//     requestContext: {
//       stage: "dev",
//     },
//   };

//   handler(fakeEvent).then((res) => {
//     console.log("Response:", res.statusCode);
//     console.log("Body:", JSON.stringify(JSON.parse(res.body), null, 2));
//   });
// }

























import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

// Initialize DynamoDB client
const client = new DynamoDBClient({ region: "ap-south-1" });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.Project_Table || "ProjectMaster";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE",
};

const allowedDepartments = [
  "Culture",
  "Residential Program",
  "Academics",
  "Operations",
  "LXD & ETC",
  "Campus Support Staff",
  "Campus_Security",
];

export const handler = async (event) => {
  const stage = event.requestContext?.stage || "dev";

  try {
    if (event.httpMethod === "POST") {
      const data = JSON.parse(event.body);

      // 🔒 Validate required fields
      if (!data.projectName) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({
            status: false,
            message: "Field 'projectName' is required.",
          }),
        };
      }

      const department = data.department || "";

      // ✅ Validate department-specific fields if department is in allowed list
      if (allowedDepartments.includes(department)) {
        if (!data.campus || !data.poc_of_project || !data.discordWebhook) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({
              status: false,
              message: `Missing required fields for department '${department}'. Required: campus, poc_of_project, discordWebhook.`,
            }),
          };
        }
      }

      // ✅ Generate unique ID and timestamp
      const uniqueId = randomUUID();
      const timestamp = new Date().toISOString();

      // ✅ Construct item
      const item = {
        Id: uniqueId,
        projectName: data.projectName,
        status: stage,
        stage: stage,
        department: department,
        campus: data.campus || "",
        clientName: data.clientName || "",
        projectStatus: data.projectStatus || "",
        projectBudget: data.projectBudget || "",
        priorities: data.priorities || "",
        channelName: data.channelName || "",
        channelId: data.channelId || "",
        projectMasterEmail: data.projectMasterEmail || "",
        poc_of_project: data.poc_of_project || "",
        discordWebhook: data.discordWebhook || "",
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      console.log("🚀 Inserting item:", item);

      // ✅ Ensure ID is unique
      const putParams = {
        TableName: TABLE_NAME,
        Item: item,
        ConditionExpression: "attribute_not_exists(Id)",
      };

      try {
        await docClient.send(new PutCommand(putParams));
      } catch (err) {
        if (err.name === "ConditionalCheckFailedException") {
          return {
            statusCode: 409,
            headers: corsHeaders,
            body: JSON.stringify({
              status: false,
              message: "Duplicate ID detected. Please retry.",
            }),
          };
        }
        throw err;
      }

      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({
          status: true,
          message: "Project created successfully",
          project: item,
        }),
      };
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  } catch (err) {
    console.error("❌ ERROR:", err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Internal server error",
        error: err.message,
      }),
    };
  }
};

// --------------------------------------------
// LOCAL TEST EXECUTION
// --------------------------------------------
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const payload = {
    projectName: "Credential Test",
    department: "Operations",
    campus: "Dharamshala",
    clientName: "NG212",
    projectStatus: "active",
    priorities: "p1",
    projectBudget: "4L",
    channelId: "C05UQHACB52",
    channelName: "investigation",
    projectMasterEmail: "ujjwalkashyap97987@gmail.com",
    poc_of_project: "ujjwal@navgurukul.org",
    discordWebhook: "https://discord.com/api/webhooks/test-id/test-token",
  };

  const fakeEvent = {
    httpMethod: "POST",
    body: JSON.stringify(payload),
    requestContext: {
      stage: "dev",
    },
  };

  handler(fakeEvent).then((res) => {
    console.log("🟢 Status:", res.statusCode);
    console.log("🟢 Body:", JSON.stringify(JSON.parse(res.body), null, 2));
  });
}