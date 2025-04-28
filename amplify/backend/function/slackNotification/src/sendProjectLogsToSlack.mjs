import AWS from 'aws-sdk';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const slackToken = process.env.SLACK_BOT_TOKEN;
AWS.config.update({ region: 'ap-south-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

let slackUserCacheByEmail = {};
let slackUserCacheByName = {};

// Get yesterday’s date in YYYY-MM-DD format
const getYesterdayDate = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

// Fetch all projects from ProjectMaster table
const getProjectMaster = async () => {
  const params = { TableName: process.env.ProjectTable };
  const result = await dynamodb.scan(params).promise();
  return result.Items || [];
};

// Fetch all daily logs from DailyLogsTable
const getDailyLogs = async () => {
  const params = { TableName: process.env.employeeLogsTable };
  const result = await dynamodb.scan(params).promise();
  return result.Items || [];
};

// Load all Slack users and cache them for email/name resolution
const fetchSlackUsers = async () => {
  try {
    const response = await axios.get('https://slack.com/api/users.list', {
      headers: {
        Authorization: `Bearer ${slackToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.data.ok) throw new Error(response.data.error);

    const members = response.data.members;
    for (const member of members) {
      const email = member.profile?.email?.toLowerCase();
      const name = member.real_name?.toLowerCase();
      if (email) slackUserCacheByEmail[email] = member.id;
      if (name) slackUserCacheByName[name] = member.id;
    }
    console.log('✅ Slack users loaded');
  } catch (error) {
    console.error('❌ Error fetching Slack users:', error.message);
  }
};

// Resolve Slack user ID by email or name
const resolveSlackId = (identifier) => {
  if (!identifier) return null;
  const normalized = identifier.toLowerCase().trim();
  return (
    slackUserCacheByEmail[normalized] ||
    slackUserCacheByName[normalized] || null
  );
};

// Format the message in the desired structure for each project
const formatMessage = (projectName, logs, projectManagerEmail) => {
  const managerSlackId = resolveSlackId(projectManagerEmail);
  const cc = managerSlackId ? `<@${managerSlackId}>` : projectManagerEmail;

  let message = `👋 ${cc}\n`;
  message += `Here's the update for the project: *${projectName}* (Previous Day)\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━\n`;

  const logsByUser = {};

  logs.forEach((log) => {
    const identifier = log.userEmail || log.email || log.userName;
    if (!identifier) return;

    if (!logsByUser[identifier]) logsByUser[identifier] = [];
    logsByUser[identifier].push(log);
  });

  for (const [identifier, userLogs] of Object.entries(logsByUser)) {
    const slackId = resolveSlackId(identifier);
    const tag = slackId ? `<@${slackId}>` : `:bust_in_silhouette: ${identifier}`;
    const totalHours = userLogs.reduce(
      (acc, curr) => acc + (parseFloat(curr.totalHoursSpent) || 0),
      0
    );

    message += `\n👤 ${tag}\n`;
    message += `🕒 Hours Spent: *${totalHours}*\n`;
    message += `📝 Tasks:\n`;

    userLogs.forEach((log) => {
      let desc = log.workDescription || 'No description';

      // Normalize inconsistent spacing
      desc = desc.replace(/\r\n|\r|\n/g, '\n').trim();

      // If there are no line breaks, try breaking by punctuation or just wrap as one point
      if (!desc.includes('\n')) {
        // Attempt splitting by punctuation if possible
        const points = desc.split(/[-•*•.,;]/).map(pt => pt.trim()).filter(Boolean);

        if (points.length > 1) {
          points.forEach((point) => {
            message += `- ${point}\n`;
          });
        } else {
          message += `- ${desc}\n`;
        }
      } else {
        // Already formatted with new lines
        const points = desc.split('\n').map(pt => pt.trim()).filter(Boolean);
        points.forEach((point) => {
          message += `- ${point}\n`;
        });
      }
    });

  }

  message += `\n━━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `📌 cc: ${cc}`;
  console.log(message,'>>>>>>>>>>>>>>>>>>>>>>>>');
  return message.trim();
};


// Send formatted message to the specified Slack channel
const sendToSlack = async (channelId, text) => {
  try {
    const response = await axios.post(
      'https://slack.com/api/chat.postMessage',
      { channel: channelId, text: text },
      {
        headers: {
          Authorization: `Bearer ${slackToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.data.ok) throw new Error(response.data.error);

    console.log(`✅ Sent to Slack channel: ${channelId}`);
  } catch (error) {
    console.error(`❌ Failed to send to ${channelId}:`, error.message);
  }
};

// Main handler function
export const sendDailyProjectLogs = async () => {
  try {
    await fetchSlackUsers();
    const yesterday = getYesterdayDate();
    const projects = await getProjectMaster();
    const logs = await getDailyLogs();

    const logsByProject = {};

    // Group logs by projectName
    logs.forEach((log) => {
      if (log.entryDate !== yesterday) return;
      const { projectName } = log;
      if (!projectName) return;

      if (!logsByProject[projectName]) logsByProject[projectName] = [];
      logsByProject[projectName].push(log);
    });

    for (const project of projects) {
      const { projectName, channelId, projectMasterEmail } = project;
      if (!projectName || !channelId) continue;

      const projectLogs = logsByProject[projectName] || [];
      if (projectLogs.length === 0) continue;

      const formattedMessage = formatMessage(
        projectName,
        projectLogs,
        projectMasterEmail
      );

      await sendToSlack(channelId, formattedMessage);
    }

    console.log('✅ All yesterday’s messages sent!');
  } catch (err) {
    console.error('❌ Error in sendDailyProjectLogs:', err.message);
  }
};

// Run script directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  sendDailyProjectLogs();
}