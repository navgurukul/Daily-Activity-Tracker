import AWS from 'aws-sdk';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const slackToken = process.env.SLACK_BOT_TOKEN;
AWS.config.update({ region: 'ap-south-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

let slackUserCacheByEmail = {};

// Load Slack users to resolve IDs
const fetchSlackUsers = async () => {
  const response = await axios.get('https://slack.com/api/users.list', {
    headers: {
      Authorization: `Bearer ${slackToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.data.ok) throw new Error(response.data.error);

  for (const member of response.data.members) {
    const email = member.profile?.email?.toLowerCase();
    if (email) slackUserCacheByEmail[email] = member.id;
  }
};

const resolveSlackId = (email) => {
    if (!email) return null;  // Check if the email is undefined or null
    return slackUserCacheByEmail[email.toLowerCase()] || null;
  };
  

const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0]; // Formats the date as YYYY-MM-DD
};

// Fetch leave records from your leave table for today's date
const getLeavesForToday = async () => {
  const params = {
    TableName: process.env.leaveTable,
    FilterExpression: '#d = :y',
    ExpressionAttributeNames: { '#d': 'startDate' },
    ExpressionAttributeValues: { ':y': getTodayDate() }, // Fetch today's leaves
  };

  const result = await dynamodb.scan(params).promise();
  return result.Items || [];
};

const formatLeaveMessage = (leaveEntries) => {
    let message = `📅 *Leave Summary for ${getTodayDate()}*\n\n`;
  
    if (leaveEntries.length === 0) {
      return message + `No leaves recorded for today.`;
    }
  
    message += `Here’s the leave summary for today:\n\n`;
  
    for (const leave of leaveEntries) {
      const email = leave.userEmail || leave.email;
      const slackId = resolveSlackId(email);
      const tag = slackId ? `<@${slackId}>` : leave.employeeName || email;
      const leaveType = leave.leaveType || 'Unknown Leave Type';
      const reason = leave.reasonForLeave || 'No reason specified';
      const startDate = leave.startDate || 'N/A';
      const endDate = leave.endDate || 'N/A';
  
      message += `*${tag}* is on *${leaveType}* leave from ${startDate} to ${endDate}. Reason: ${reason}\n`;
    }
  
    message += `\n*End of Summary*`;
  
    return message;
  };
  

// const formatLeaveMessage = (leaveEntries) => {
//   let message = `📅 *Leave Summary for ${getTodayDate()}*:\n`;

//   if (leaveEntries.length === 0) {
//     return message + `\nNo leaves recorded.`;
//   }

//   for (const leave of leaveEntries) {
//     const email = leave.userEmail || leave.email;  // Ensure email is used correctly
//     const slackId = resolveSlackId(email);  // Resolve Slack ID using the email
//     const tag = slackId ? `<@${slackId}>` : leave.employeeName || email;
//     const reason = leave.reasonForLeave || 'No reason specified';

//     message += `• ${tag} - *${leave.leaveType}* - ${reason}\n`;
//   }

//   return message;
// };

export const sendDailyLeaveLogs = async () => {
  try {
    await fetchSlackUsers();
    const leaves = await getLeavesForToday(); // Fetch today's leave entries
    const message = formatLeaveMessage(leaves);

    const channelId = process.env.leaveSlackChannel;
    if (!channelId) throw new Error('Missing Slack channel ID for leaves');

    await axios.post(
      'https://slack.com/api/chat.postMessage',
      { channel: channelId, text: message },
      {
        headers: {
          Authorization: `Bearer ${slackToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ Leave summary sent to Slack!');
  } catch (err) {
    console.error('❌ Error sending leave summary:', err.message);
  }
};