
// import axios from "axios";
// import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
// import {
//   DynamoDBDocumentClient,
//   ScanCommand
// } from "@aws-sdk/lib-dynamodb";

// // Setup DynamoDB Client
// const client = new DynamoDBClient({});
// const docClient = DynamoDBDocumentClient.from(client);

// // Global Discord ID map
// let discordMap = {};

// // ✅ Fetch Discord Map: email → Discord ID
// const fetchDiscordMap = async () => {
//   try {
//     const response = await axios.get(
//       "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employeeSheetRecords?sheet=pncdata"
//     );
//     const records = response.data.data;

//     discordMap = records.reduce((acc, record) => {
//       const email = record["Team ID"]?.trim().toLowerCase();
//       const discordId = record["Discord ID"]?.trim();
//       if (email && discordId && discordId !== "N/A") {
//         acc[email] = discordId;
//       }
//       return acc;
//     }, {});
//   } catch (err) {
//     console.error("❌ Failed to fetch Discord IDs:", err.message);
//   }
// };

// // ✅ Utility to mention by Discord or fallback to email
// const getDiscordMention = (email) => {
//   const normalizedEmail = email?.trim().toLowerCase();
//   const discordId = discordMap[normalizedEmail];
//   if (discordId) {
//     return `<@${discordId}>`;
//   } else {
//     console.warn(`⚠️ No Discord ID found for email: ${normalizedEmail}`);
//     return `**${email}**`;
//   }
// };

// // ✅ Fetch logs for residential workingDepartment from yesterday
// const getEmployeeLogs = async () => {
//   const yesterday = new Date();
//   yesterday.setDate(yesterday.getDate() - 1);
//   const isoYest = yesterday.toISOString().split("T")[0];

//   const command = new ScanCommand({
//     TableName: "employeeDailyActivityLogs",
//     FilterExpression: "#dept = :d1 AND #entryDate = :yesterday",
//     ExpressionAttributeNames: {
//       "#dept": "workingDepartment",
//       "#entryDate": "entryDate"
//     },
//     ExpressionAttributeValues: {
//       ":d1": "Residential Program",
//       ":yesterday": isoYest
//     }
//   });

//   const result = await docClient.send(command);
//   return result.Items || [];
// };

// // ✅ Fetch campus-wise webhook URLs and manager emails (Tags)
// const getCampusWebhooks = async () => {
//   const command = new ScanCommand({ TableName: "campuses" });
//   const result = await docClient.send(command);
//   const items = result.Items || [];

//   const campusMap = {};
//   items.forEach(item => {
//     const normalizedCampus = item.campus?.trim().toLowerCase();
//     if (normalizedCampus) {
//       campusMap[normalizedCampus] = {
//         webhookUrl: item.webhook_url,
//         ccEmails: item.Tags || " "
//       };
//     }
//   });

//   return campusMap;
// };

// // ✅ Group logs by campus and project
// const groupLogsByCampusAndProject = (logs) => {
//   const grouped = {};
//   logs.forEach((log) => {
//     const originalCampus = log.campus || "Unknown Campus";
//     const normalizedCampus = originalCampus.trim().toLowerCase();
//     const project = log.projectName || "Unknown Project";

//     if (!grouped[normalizedCampus]) {
//       grouped[normalizedCampus] = {
//         displayName: originalCampus,
//         projects: {}
//       };
//     }

//     if (!grouped[normalizedCampus].projects[project]) {
//       grouped[normalizedCampus].projects[project] = [];
//     }

//     grouped[normalizedCampus].projects[project].push(log);
//   });

//   return grouped;
// };

// // ✅ Send formatted Discord embed
// const sendCampusEmbed = async (campusDisplayName, projects, webhookUrl, ccEmails) => {
//   if (!webhookUrl) {
//     console.warn(`⚠️ Webhook URL missing for campus "${campusDisplayName}". Skipping.`);
//     return;
//   }

//   const fields = Object.entries(projects).map(([projectName, logs]) => {
//     const description = logs.map(log => {
//       return [
//         `👤 ${getDiscordMention(log.email)}`,
//         `⏳ *${log.totalHoursSpent} hrs*`,
//         `📝 ${log.workDescription}`
//       ].join('\n');
//     }).join('\n\n────────────────────────────\n\n');

//     return {
//       name: `📁 **${projectName}**`,
//       value: description || "_No logs available_"
//     };
//   });

//   const ccTags = ccEmails
//     ?.split(",")
//     .map(email => getDiscordMention(email.trim()))
//     .join(", ");

//   const ccLine = ccTags ? `  CC    :      ${ccTags}   ` : "      ";

//   // const embedPayload = {
//   //   embeds: [
//   //     {
//   //       title: `🏫 **Campus: ${campusDisplayName}**`,
//   //       color: 0x3498db,
//   //       fields,
//   //       timestamp: new Date().toISOString(),
//   //       footer: { text: `\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\nDaily Activity Logs${ccLine ? " | " + ccLine : ""}` }
//   //     }
//   //   ]
//   // };



//   const embedPayload = {
//   embeds: [
//     {
//       title: `🏫 **Campus: ${campusDisplayName}**`,
//       color: 0x3498db,
//       fields: [
//         ...fields,
//         {
//           name: '\u200B', // Invisible character to force spacing or headerless field
//           value: `**Daily Activity Logs**${ccLine ? " | " + ccLine : ""}`,
//           inline: false,
//         }
//       ],
//       timestamp: new Date().toISOString(),
//       footer: { text: `Generated by XYZ Bot` } // Keep this minimal
//     }
//   ]
// };




//   try {
//     await axios.post(webhookUrl, embedPayload);
//     console.log(`✅ Sent formatted embed for campus "${campusDisplayName}"`);
//   } catch (error) {
//     console.error(`❌ Failed to send embed for campus "${campusDisplayName}":`, error?.response?.data || error.message);
//   }
// };

// // ✅ Main handler
// export const handler = async () => {
//   await fetchDiscordMap(); // Load Discord ID mapping

//   const logs = await getEmployeeLogs();
//   if (logs.length === 0) {
//     console.log("No logs found for residential workingDepartment.");
//     return;
//   }

//   const grouped = groupLogsByCampusAndProject(logs);
//   const campusMap = await getCampusWebhooks();

//   for (const [normalizedCampus, { displayName, projects }] of Object.entries(grouped)) {
//     const campusData = campusMap[normalizedCampus];
//     if (!campusData || !campusData.webhookUrl) {
//       console.warn(`⚠️ No webhook found for campus "${displayName}" (normalized: "${normalizedCampus}"). Skipping.`);
//       continue;
//     }

//     await sendCampusEmbed(displayName, projects, campusData.webhookUrl, campusData.ccEmails);
//   }
// };

// // ✅ Local run
// if (process.argv[1] === new URL(import.meta.url).pathname) {
//   handler()
//     .then(() => console.log("🎉 All Discord notifications sent."))
//     .catch((err) => console.error("❌ Error during execution:", err.message || err));
// }































import axios from "axios";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand
} from "@aws-sdk/lib-dynamodb";

// Setup DynamoDB Client
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

// Global Discord ID map
let discordMap = {};

const fetchDiscordMap = async () => {
  try {
    const response = await axios.get(
      "https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employeeSheetRecords?sheet=pncdata"
    );
    const records = response.data.data;

    discordMap = records.reduce((acc, record) => {
      const email = record["Team ID"]?.trim().toLowerCase();
      const discordId = record["Discord ID"]?.trim();
      if (email && discordId && discordId !== "N/A") {
        acc[email] = discordId;
      }
      return acc;
    }, {});
  } catch (err) {
    console.error("❌ Failed to fetch Discord IDs:", err.message);
  }
};

const getDiscordMention = (email) => {
  const normalizedEmail = email?.trim().toLowerCase();
  const discordId = discordMap[normalizedEmail];
  if (discordId) {
    return `<@${discordId}>`;
  } else {
    console.warn(`⚠️ No Discord ID found for email: ${normalizedEmail}`);
    return `**${email}**`;
  }
};

// const getEmployeeLogs = async () => {
//   const yesterday = new Date();
//   yesterday.setDate(yesterday.getDate() - 1);
//   const isoYest = yesterday.toISOString().split("T")[0];

//   const command = new ScanCommand({
//     TableName: "employeeDailyActivityLogs",
//     FilterExpression: "#dept = :d1 AND #entryDate = :yesterday",
//     ExpressionAttributeNames: {
//       "#dept": "workingDepartment",
//       "#entryDate": "entryDate"
//     },
//     ExpressionAttributeValues: {
//       ":d1": "Residential Program",
//       ":yesterday": isoYest
//     }
//   });

//   const result = await docClient.send(command);
//   return result.Items || [];
// };


const getEmployeeLogs = async () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isoYest = yesterday.toISOString().split("T")[0];

  // ✅ Allowed departments list
  const allowedDepartments = [
    "Culture",
    "Residential Program",
    "Academics",
    "Operations",
    "LXD & ETC",
    "Campus Support Staff",
    "Campus_Security"
  ];

  // Build FilterExpression like: #dept = :d1 OR #dept = :d2 ...
  const filterExpressionParts = allowedDepartments.map((_, index) => `#dept = :d${index + 1}`);
  const expressionAttributeValues = allowedDepartments.reduce((acc, dept, index) => {
    acc[`:d${index + 1}`] = dept;
    return acc;
  }, { ":yesterday": isoYest });

  const command = new ScanCommand({
    TableName: "employeeDailyActivityLogs",
    FilterExpression: `(${filterExpressionParts.join(" OR ")}) AND #entryDate = :yesterday`,
    ExpressionAttributeNames: {
      "#dept": "workingDepartment",
      "#entryDate": "entryDate"
    },
    ExpressionAttributeValues: expressionAttributeValues
  });

  const result = await docClient.send(command);
  return result.Items || [];
};


const getProjectMap = async () => {
  const command = new ScanCommand({ TableName: "ProjectMaster" });
  const result = await docClient.send(command);
  const items = result.Items || [];

  const projectMap = {};

  items.forEach(item => {
    if (!item.Id || !item.projectName) return;

    projectMap[item.Id] = {
      projectName: item.projectName || "Unnamed Project",
      webhookUrl: item.discordWebhook?.trim() || null,
      pocEmails: item.poc_of_project || "",
      logs: []
    };
  });

  return projectMap;
};

// const groupLogsByProject = (logs, projectMap) => {
//   logs.forEach(log => {
//     const projectId = log.projectId;
//     if (projectId && projectMap[projectId]) {
//       projectMap[projectId].logs.push(log);
//     }
//   });
// };
const groupLogsByProject = (logs, projectMap) => {
  logs.forEach(log => {
    const projectId = log.projectId?.trim();
    if (!projectId) return;

    if (projectMap[projectId] && projectMap[projectId].webhookUrl) {
      projectMap[projectId].logs.push(log);
    }
  });
};

const sendProjectEmbed = async (projectName, logs, webhookUrl, pocEmails) => {
  console.log(projectName)
  if (!webhookUrl || !webhookUrl.startsWith("https://discord.com/api/webhooks")) {
    console.warn(`⚠️ Invalid or missing webhook URL for project "${projectName}". Skipping.`);
    // return;
  }

  const description = logs.map(log => {
    return [
      `👤 ${getDiscordMention(log.email)}`,
      `⏳ *${log.totalHoursSpent} hrs*`,
      `📝 ${log.workDescription}`
    ].join("\n");
  }).join("\n\n────────────────────────────\n\n");

  const ccTags = typeof pocEmails === "string"
  ? pocEmails.split(",").map(email => getDiscordMention(email.trim())).join(", ")
  : "";

  const ccLine = ccTags ? `  CC    :      ${ccTags}   ` : "";

  const embedPayload = {
    embeds: [
      {
        title: `📁 **Project: ${projectName}**`,
        color: 0x3498db,
        fields: [
          {
            name: "Logs",
            value: description || "_No logs available_"
          },
          {
            name: '\u200B',
            value: `**Daily Activity Logs**${ccLine ? " | " + ccLine : ""}`,
            inline: false
          }
        ],
        timestamp: new Date().toISOString(),
        footer: { text: `Generated by XYZ Bot` }
      }
    ]
  };

  try {
    await axios.post(webhookUrl, embedPayload);
    console.log(`✅ Sent embed for project "${projectName}"`);
  } catch (error) {
    console.error(`❌ Failed to send embed for project "${projectName}":`, error?.response?.data || error.message);
  }
};

export const handler = async () => {
  await fetchDiscordMap();

  const logs = await getEmployeeLogs();
  if (logs.length === 0) {
    console.log("No logs found for residential workingDepartment.");
    return;
  }

  const projectMap = await getProjectMap();
  groupLogsByProject(logs, projectMap);
  console.log(logs,'>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>')
  console.log("📊 Projects with logs:");
  for (const [projectId, { projectName, logs, webhookUrl, pocEmails }] of Object.entries(projectMap)) {
    if (logs.length > 0) {
      console.log(`🟢 ${projectName} (${projectId}) → ${logs.length} logs`);
      await sendProjectEmbed(projectName, logs, webhookUrl, pocEmails);
    }
  }
};

if (process.argv[1] === new URL(import.meta.url).pathname) {
  handler()
    .then(() => console.log("🎉 All Discord notifications sent."))
    .catch((err) => console.error("❌ Error during execution:", err.message || err));
}
