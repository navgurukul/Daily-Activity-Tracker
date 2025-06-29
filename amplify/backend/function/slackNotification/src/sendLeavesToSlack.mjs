// import AWS from 'aws-sdk';
// import axios from 'axios';
// import dotenv from 'dotenv';
// dotenv.config();

// const slackToken = process.env.SLACK_BOT_TOKEN;
// AWS.config.update({ region: 'ap-south-1' });
// const dynamodb = new AWS.DynamoDB.DocumentClient();

// let slackUserCacheByEmail = {};

// // Load Slack users to resolve IDs
// const fetchSlackUsers = async () => {
//   const response = await axios.get('https://slack.com/api/users.list', {
//     headers: {
//       Authorization: `Bearer ${slackToken}`,
//       'Content-Type': 'application/json',
//     },
//   });

//   if (!response.data.ok) throw new Error(response.data.error);

//   for (const member of response.data.members) {
//     const email = member.profile?.email?.toLowerCase();
//     if (email) slackUserCacheByEmail[email] = member.id;
//   }
// };

// const resolveSlackId = (email) => {
//     if (!email) return null;  // Check if the email is undefined or null
//     return slackUserCacheByEmail[email.toLowerCase()] || null;
//   };
  

// const getTodayDate = () => {
//   const today = new Date();
//   return today.toISOString().split('T')[0]; // Formats the date as YYYY-MM-DD
// };

// // Fetch leave records from your leave table for today's date
// const getLeavesForToday = async () => {
//   const params = {
//     TableName: "hrmsLeaveRequests",
//     FilterExpression: '#d = :y',
//     ExpressionAttributeNames: { '#d': 'startDate' },
//     ExpressionAttributeValues: { ':y': getTodayDate() }, // Fetch today's leaves
//   };

//   const result = await dynamodb.scan(params).promise();
//   return result.Items || [];
// };

// const formatLeaveMessage = (leaveEntries) => {
//     let message = `📅 *Leave Summary for ${getTodayDate()}*\n\n`;
  
//     if (leaveEntries.length === 0) {
//       return message + `No leaves recorded for today.`;
//     }
  
//     message += `Here’s the leave summary for today:\n\n`;
  
//     for (const leave of leaveEntries) {
//       const email = leave.userEmail || leave.email;
//       const slackId = resolveSlackId(email);
//       const tag = slackId ? `<@${slackId}>` : leave.employeeName || email;
//       const leaveType = leave.leaveType || 'Unknown Leave Type';
//       const reason = leave.reasonForLeave || 'No reason specified';
//       const startDate = leave.startDate || 'N/A';
//       const endDate = leave.endDate || 'N/A';
  
//       message += `*${tag}* is on *${leaveType}* leave from ${startDate} to ${endDate}. Reason: ${reason}\n`;
//     }
  
//     message += `\n*End of Summary*`;
  
//     return message;
//   };
  

// // const formatLeaveMessage = (leaveEntries) => {
// //   let message = `📅 *Leave Summary for ${getTodayDate()}*:\n`;

// //   if (leaveEntries.length === 0) {
// //     return message + `\nNo leaves recorded.`;
// //   }

// //   for (const leave of leaveEntries) {
// //     const email = leave.userEmail || leave.email;  // Ensure email is used correctly
// //     const slackId = resolveSlackId(email);  // Resolve Slack ID using the email
// //     const tag = slackId ? `<@${slackId}>` : leave.employeeName || email;
// //     const reason = leave.reasonForLeave || 'No reason specified';

// //     message += `• ${tag} - *${leave.leaveType}* - ${reason}\n`;
// //   }

// //   return message;
// // };

// export const sendDailyLeaveLogs = async () => {
//   try {
//     await fetchSlackUsers();
//     const leaves = await getLeavesForToday(); // Fetch today's leave entries
//     const message = formatLeaveMessage(leaves);

//     const channelId = process.env.leaveSlackChannel;
//     if (!channelId) throw new Error('Missing Slack channel ID for leaves');

//     await axios.post(
//       'https://slack.com/api/chat.postMessage',
//       { channel: channelId, text: message },
//       {
//         headers: {
//           Authorization: `Bearer ${slackToken}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     console.log('✅ Leave summary sent to Slack!');
//   } catch (err) {
//     console.error('❌ Error sending leave summary:', err.message);
//   }
// };











import AWS from 'aws-sdk';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const slackToken = process.env.SLACK_BOT_TOKEN;
AWS.config.update({ region: 'ap-south-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

let slackUserCacheByEmail = {};

// Load Slack users to resolve Slack IDs
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
  if (!email) return null;
  return slackUserCacheByEmail[email.toLowerCase()] || null;
};

const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

// Get all pending leaves starting today or later
const getPendingLeavesFromToday = async () => {
  const today = getTodayDate();

  const params = {
    TableName: 'hrmsLeaveRequests',
    FilterExpression: '#status = :pending AND #startDate >= :today',
    ExpressionAttributeNames: {
      '#status': 'status',
      '#startDate': 'startDate'
    },
    ExpressionAttributeValues: {
      ':pending': 'pending',
      ':today': today
    }
  };

  const result = await dynamodb.scan(params).promise();
  return result.Items || [];
};

const calculateLeaveDays = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate - startDate);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
};


const employeeRpMangager = async (email) => {
  const baseUrl = 'https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employeeSheetRecords';
  const queryParams = new URLSearchParams({
    sheet: 'pncdata',
    employee_email: email
  });

  const url = `${baseUrl}?${queryParams.toString()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    // console.log(`#########################------------------------------Response for ${email}:`, data);
    const rpManagerEmail = data?.data[0]["Reporting maanger email ID"]

    const baseUrl2 = 'https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employeeSheetRecords';
    const queryParams2 = new URLSearchParams({
      sheet: 'pncdata',
      employee_email: rpManagerEmail
    });

    const url2 = `${baseUrl2}?${queryParams2.toString()}`;
    const response2 = await fetch(url2);
    const data2 = await response2.json();


    // console.log("BBBBBBBBBBBBBBBBBBBBBB",data2);
    let rpSlackID;
    if(data2.data.length === 0){
      rpSlackID = rpManagerEmail
    }else{
      rpSlackID = data2?.data[0]["NG Slack ID (Active member)"]
    }
    return rpSlackID
  } catch (error) {
    console.error(`Error fetching data for ${email}:`, error);
  }
};


const formatLeaveMessage = async (leaveEntries) => {
  const today = getTodayDate();
  let message = `*🗓️ Pending Leave Report*  _(from ${today} onward)_\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

  const samyarthLeaves = leaveEntries.filter(
    (entry) => entry.department === 'Samyarth'
  );

  if (samyarthLeaves.length === 0) {
    return message + `✅ No pending leave requests.\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  }

  for (let index = 0; index < samyarthLeaves.length; index++) {
    const leave = samyarthLeaves[index];
    const email = leave.userEmail || leave.email;

    // ✅ Await the async call
    const reportManagerSlackIdOrEmail  = await employeeRpMangager(email);
    // console.log('>>>>>>>>>>>>>>>>>>>>>>>✅ ReportreportingManagerDataing Manager Data:', m,email);

    const isHalfDay = leave.durationType === 'half-day';

    const slackId = resolveSlackId(email);
    const tag = slackId ? `<@${slackId}>` : leave.employeeName || email;
    const leaveType = leave.leaveType || 'N/A';
    const reason = leave.reasonForLeave || 'Not provided';
    const startDate = leave.startDate || 'N/A';
    const endDate = leave.endDate || 'N/A';
    // const duration = calculateLeaveDays(startDate, endDate);
    const duration = isHalfDay ? 0.5 : calculateLeaveDays(startDate, endDate);
    const dayType = leave.durationType === 'half-day' ? '🕒 Half Day' : '🕘 Full Day';


    message += `*${index + 1}. ${tag}*\n`;
    message += `• ✉️ Email: ${email}\n`;
    message += `• 📅 Dates: ${startDate} → ${endDate}  _(Total: ${duration} day${duration > 1 ? 's' : ''})_\n`;
    message += `• 🏷️ Leave Type: *${leaveType}*\n`;
    message += `• 🕒 Leave Duration: ${dayType}\n`;
    message += `• 📝 Reason: ${reason}\n`;
    message += `• 👥 cc: <@${reportManagerSlackIdOrEmail}>\n`;   // ✅ CC reporting manager `<@${slackId}>` 
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  }

  message += `*End of Report* ✅`;

  return message;
};


// Send message to Slack
export const sendDailyLeaveLogs = async () => {
  try {
    await fetchSlackUsers();
    const pendingLeaves = await getPendingLeavesFromToday();
    const message = await formatLeaveMessage(pendingLeaves);

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

    console.log('✅ Pending leave summary sent to Slack!');
  } catch (err) {
    console.error('❌ Error sending leave summary:', err.message);
  }
};
