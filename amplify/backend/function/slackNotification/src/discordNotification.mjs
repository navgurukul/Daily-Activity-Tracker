
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

// ✅ Fetch Discord Map: email → Discord ID
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

// ✅ Utility to mention by Discord or fallback to email
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

// ✅ Fetch logs for residential department from yesterday
const getEmployeeLogs = async () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const isoYest = yesterday.toISOString().split("T")[0];

  const command = new ScanCommand({
    TableName: "employeeDailyActivityLogs",
    FilterExpression: "#dept = :d1 AND #entryDate = :yesterday",
    ExpressionAttributeNames: {
      "#dept": "department",
      "#entryDate": "entryDate"
    },
    ExpressionAttributeValues: {
      ":d1": "Residential Program",
      ":yesterday": isoYest
    }
  });

  const result = await docClient.send(command);
  return result.Items || [];
};

// ✅ Fetch campus-wise webhook URLs and manager emails (Tags)
const getCampusWebhooks = async () => {
  const command = new ScanCommand({ TableName: "campuses" });
  const result = await docClient.send(command);
  const items = result.Items || [];

  const campusMap = {};
  items.forEach(item => {
    const normalizedCampus = item.campus?.trim().toLowerCase();
    if (normalizedCampus) {
      campusMap[normalizedCampus] = {
        webhookUrl: item.webhook_url,
        ccEmails: item.Tags || " "
      };
    }
  });

  return campusMap;
};

// ✅ Group logs by campus and project
const groupLogsByCampusAndProject = (logs) => {
  const grouped = {};
  logs.forEach((log) => {
    const originalCampus = log.campus || "Unknown Campus";
    const normalizedCampus = originalCampus.trim().toLowerCase();
    const project = log.projectName || "Unknown Project";

    if (!grouped[normalizedCampus]) {
      grouped[normalizedCampus] = {
        displayName: originalCampus,
        projects: {}
      };
    }

    if (!grouped[normalizedCampus].projects[project]) {
      grouped[normalizedCampus].projects[project] = [];
    }

    grouped[normalizedCampus].projects[project].push(log);
  });

  return grouped;
};

// ✅ Send formatted Discord embed
const sendCampusEmbed = async (campusDisplayName, projects, webhookUrl, ccEmails) => {
  if (!webhookUrl) {
    console.warn(`⚠️ Webhook URL missing for campus "${campusDisplayName}". Skipping.`);
    return;
  }

  const fields = Object.entries(projects).map(([projectName, logs]) => {
    const description = logs.map(log => {
      return [
        `👤 ${getDiscordMention(log.email)}`,
        `⏳ *${log.totalHoursSpent} hrs*`,
        `📝 ${log.workDescription}`
      ].join('\n');
    }).join('\n\n────────────────────────────\n\n');

    return {
      name: `📁 **${projectName}**`,
      value: description || "_No logs available_"
    };
  });

  const ccTags = ccEmails
    ?.split(",")
    .map(email => getDiscordMention(email.trim()))
    .join(", ");

  const ccLine = ccTags ? `  CC    :      ${ccTags}   ` : "      ";

  // const embedPayload = {
  //   embeds: [
  //     {
  //       title: `🏫 **Campus: ${campusDisplayName}**`,
  //       color: 0x3498db,
  //       fields,
  //       timestamp: new Date().toISOString(),
  //       footer: { text: `\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\nDaily Activity Logs${ccLine ? " | " + ccLine : ""}` }
  //     }
  //   ]
  // };



  const embedPayload = {
  embeds: [
    {
      title: `🏫 **Campus: ${campusDisplayName}**`,
      color: 0x3498db,
      fields: [
        ...fields,
        {
          name: '\u200B', // Invisible character to force spacing or headerless field
          value: `**Daily Activity Logs**${ccLine ? " | " + ccLine : ""}`,
          inline: false,
        }
      ],
      timestamp: new Date().toISOString(),
      footer: { text: `Generated by XYZ Bot` } // Keep this minimal
    }
  ]
};




  try {
    await axios.post(webhookUrl, embedPayload);
    console.log(`✅ Sent formatted embed for campus "${campusDisplayName}"`);
  } catch (error) {
    console.error(`❌ Failed to send embed for campus "${campusDisplayName}":`, error?.response?.data || error.message);
  }
};

// ✅ Main handler
export const handler = async () => {
  await fetchDiscordMap(); // Load Discord ID mapping

  const logs = await getEmployeeLogs();
  if (logs.length === 0) {
    console.log("No logs found for residential department.");
    return;
  }

  const grouped = groupLogsByCampusAndProject(logs);
  const campusMap = await getCampusWebhooks();

  for (const [normalizedCampus, { displayName, projects }] of Object.entries(grouped)) {
    const campusData = campusMap[normalizedCampus];
    if (!campusData || !campusData.webhookUrl) {
      console.warn(`⚠️ No webhook found for campus "${displayName}" (normalized: "${normalizedCampus}"). Skipping.`);
      continue;
    }

    await sendCampusEmbed(displayName, projects, campusData.webhookUrl, campusData.ccEmails);
  }
};

// ✅ Local run
if (process.argv[1] === new URL(import.meta.url).pathname) {
  handler()
    .then(() => console.log("🎉 All Discord notifications sent."))
    .catch((err) => console.error("❌ Error during execution:", err.message || err));
}