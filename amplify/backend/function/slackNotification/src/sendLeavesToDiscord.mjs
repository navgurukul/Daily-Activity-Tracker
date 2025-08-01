import AWS from 'aws-sdk';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

AWS.config.update({ region: 'ap-south-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1385219616543866890/6qYRRh7xs1UwF0NK4LMk4M72VV8NNcK2XKww7GPMAQu21lFVwMblygSFJMcy2W1jFgfc';

const getTodayDate = () => new Date().toISOString().split('T')[0];

const calculateLeaveDays = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate - startDate);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

const getPendingLeavesFromToday = async () => {
  const today = getTodayDate();

  const params = {
    TableName: 'hrmsLeaveRequests',
    FilterExpression: '#status = :pending AND #startDate >= :today',
    ExpressionAttributeNames: {
      '#status': 'status',
      '#startDate': 'startDate',
    },
    ExpressionAttributeValues: {
      ':pending': 'pending',
      ':today': today,
    },
  };

  const result = await dynamodb.scan(params).promise();
  return result.Items || [];
};

const fetchReportingManagerDiscordId = async (email) => {
  const apiUrl = 'https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employeeSheetRecords';
  try {
    const res1 = await axios.get(`${apiUrl}?sheet=pncdata&employee_email=${email}`);
    const managerEmail = res1.data?.data?.[0]?.['Reporting maanger email ID'];
    if (!managerEmail) return '';

    const res2 = await axios.get(`${apiUrl}?sheet=pncdata&employee_email=${managerEmail}`);
    const discordId = res2.data?.data?.[0]?.['Discord ID'] || managerEmail;
    return discordId;
  } catch (err) {
    console.error(`Error fetching Discord ID for ${email}`, err.message);
    return '';
  }
};

const formatDiscordMessage = async (leaveEntries) => {
  const today = getTodayDate();
  let message = `🗓️ **Pending Leave Report** _(from ${today} onward)_\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;


    // 🔥 Filter out Samyarth department
  const filteredLeaves = leaveEntries.filter(
    (entry) => entry.department !== 'Samyarth'
  );

    
    
  if (filteredLeaves.length === 0) {
    return message + `✅ No pending leave requests.\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  }

  for (let i = 0; i < filteredLeaves.length; i++) {
    const leave = filteredLeaves[i];
    const email = leave.userEmail || leave.email;
    const discordId = leave['Discord ID'];
    const tag = discordId ? `<@${discordId}>` : leave.employeeName || email;

    const ccDiscordId = await fetchReportingManagerDiscordId(email);
    const ccTag = ccDiscordId ? `<@${ccDiscordId}>` : '';

    const leaveType = leave.leaveType || 'N/A';
    const reason = leave.reasonForLeave || 'Not provided';
    const startDate = leave.startDate || 'N/A';
    const endDate = leave.endDate || 'N/A';
    const isHalfDay = leave.durationType === 'half-day';
    const duration = isHalfDay ? 0.5 : calculateLeaveDays(startDate, endDate);
    const dayType = isHalfDay ? '🕒 Half Day' : '🕘 Full Day';

    message += `**${i + 1}. ${tag}**\n`;
    message += `• ✉️ Email: ${email}\n`;
    message += `• 📅 Dates: ${startDate} → ${endDate} _(Total: ${duration} day${duration > 1 ? 's' : ''})_\n`;
    message += `• 🏷️ Leave Type: **${leaveType}**\n`;
    message += `• 🕒 Leave Duration: ${dayType}\n`;
    message += `• 📝 Reason: ${reason}\n`;
    message += `• 👥 cc: ${ccTag}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  }

  message += `**End of Report** ✅`;
  return message;
};

const sendToDiscord = async (content) => {
  try {
    await axios.post(DISCORD_WEBHOOK_URL, { content });
    console.log('✅ Message sent to Discord!');
  } catch (err) {
    console.error('❌ Error sending to Discord:', err.message);
  }
};

// ✅ Lambda Handler
export const sendDiscordLeaveNotification = async () => {

// exports.handler = async () => {
  try {
    const leaves = await getPendingLeavesFromToday();
    const discordMessage = await formatDiscordMessage(leaves);
    await sendToDiscord(discordMessage);
  } catch (err) {
    console.error('Lambda Error:', err.message);
  }
};
