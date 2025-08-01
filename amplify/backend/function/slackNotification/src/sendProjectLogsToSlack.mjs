// // import AWS from 'aws-sdk';
// // import axios from 'axios';
// // import dotenv from 'dotenv';
// // dotenv.config();

// // const slackToken = process.env.SLACK_BOT_TOKEN;
// // AWS.config.update({ region: 'ap-south-1' });
// // const dynamodb = new AWS.DynamoDB.DocumentClient();

// // let slackUserCacheByEmail = {};
// // let slackUserCacheByName = {};

// // // Get yesterday’s date in YYYY-MM-DD format
// // const getYesterdayDate = () => {
// //   const yesterday = new Date();
// //   yesterday.setDate(yesterday.getDate() - 1);
// //   return yesterday.toISOString().split('T')[0];
// // };

// // // Fetch all projects from ProjectMaster table
// // const getProjectMaster = async () => {
// //   const params = { TableName: "ProjectMaster" };
// //   const result = await dynamodb.scan(params).promise();
// //   return result.Items || [];
// // };

// // // Fetch all daily logs from DailyLogsTable
// // const getDailyLogs = async () => {
// //   const params = { TableName: "employeeDailyActivityLogs"};
// //   const result = await dynamodb.scan(params).promise();
// //   return result.Items || [];
// // };

// // // Load all Slack users and cache them for email/name resolution
// // const fetchSlackUsers = async () => {
// //   try {
// //     const response = await axios.get('https://slack.com/api/users.list', {
// //       headers: {
// //         Authorization: `Bearer ${slackToken}`,
// //         'Content-Type': 'application/json',
// //       },
// //     });

// //     if (!response.data.ok) throw new Error(response.data.error);

// //     const members = response.data.members;
// //     for (const member of members) {
// //       const email = member.profile?.email?.toLowerCase();
// //       const name = member.real_name?.toLowerCase();
// //       if (email) slackUserCacheByEmail[email] = member.id;
// //       if (name) slackUserCacheByName[name] = member.id;
// //     }
// //     console.log('✅ Slack users loaded');
// //   } catch (error) {
// //     console.error('❌ Error fetching Slack users:', error.message);
// //   }
// // };

// // // Resolve Slack user ID by email or name
// // const resolveSlackId = (identifier) => {
// //   if (!identifier) return null;
// //   const normalized = identifier.toLowerCase().trim();
// //   return (
// //     slackUserCacheByEmail[normalized] ||
// //     slackUserCacheByName[normalized] || null
// //   );
// // };

// // // Format the message in the desired structure for each project
// // const formatMessage = (projectName, logs, projectManagerEmail) => {
// //   const managerSlackId = resolveSlackId(projectManagerEmail);
// //   const cc = managerSlackId ? `<@${managerSlackId}>` : projectManagerEmail;

// //   let message = `👋 ${cc}\n`;
// //   message += `Here's the update for the project: *${projectName}* (Previous Day)\n\n`;
// //   message += `━━━━━━━━━━━━━━━━━━━━━━━\n`;

// //   const logsByUser = {};

// //   logs.forEach((log) => {
// //     const identifier = log.userEmail || log.email || log.userName;
// //     if (!identifier) return;

// //     if (!logsByUser[identifier]) logsByUser[identifier] = [];
// //     logsByUser[identifier].push(log);
// //   });

// //   for (const [identifier, userLogs] of Object.entries(logsByUser)) {
// //     const slackId = resolveSlackId(identifier);
// //     const tag = slackId ? `<@${slackId}>` : `:bust_in_silhouette: ${identifier}`;
// //     const totalHours = userLogs.reduce(
// //       (acc, curr) => acc + (parseFloat(curr.totalHoursSpent) || 0),
// //       0
// //     );

// //     message += `\n👤 ${tag}\n`;
// //     message += `🕒 Hours Spent: *${totalHours}*\n`;
// //     message += `📝 Tasks:\n`;

// //     userLogs.forEach((log) => {
// //       let desc = log.workDescription || 'No description';

// //       // Normalize inconsistent spacing
// //       desc = desc.replace(/\r\n|\r|\n/g, '\n').trim();

// //       // If there are no line breaks, try breaking by punctuation or just wrap as one point
// //       if (!desc.includes('\n')) {
// //         // Attempt splitting by punctuation if possible
// //         const points = desc.split(/[-•*•.,;]/).map(pt => pt.trim()).filter(Boolean);

// //         if (points.length > 1) {
// //           points.forEach((point) => {
// //             message += `- ${point}\n`;
// //           });
// //         } else {
// //           message += `- ${desc}\n`;
// //         }
// //       } else {
// //         // Already formatted with new lines
// //         const points = desc.split('\n').map(pt => pt.trim()).filter(Boolean);
// //         points.forEach((point) => {
// //           message += `- ${point}\n`;
// //         });
// //       }
// //     });

// //   }

// //   message += `\n━━━━━━━━━━━━━━━━━━━━━━━\n`;
// //   // message += `📌 cc: ${cc}`;
// //   // console.log(message,'>>>>>>>>>>>>>>>>>>>>>>>>');
// //   return message.trim();
// // };


// // // Send formatted message to the specified Slack channel
// // const sendToSlack = async (channelId, text) => {
// //   try {
// //     const response = await axios.post(
// //       'https://slack.com/api/chat.postMessage',
// //       { channel: channelId, text: text },
// //       {
// //         headers: {
// //           Authorization: `Bearer ${slackToken}`,
// //           'Content-Type': 'application/json',
// //         },
// //       }
// //     );

// //     if (!response.data.ok) throw new Error(response.data.error);

// //     console.log(`✅ Sent to Slack channel: ${channelId}`);
// //   } catch (error) {
// //     console.error(`❌ Failed to send to ${channelId}:`, error.message);
// //   }
// // };

// // // Main handler function
// // export const sendDailyProjectLogs = async () => {
// //   try {
// //     await fetchSlackUsers();
// //     const yesterday = getYesterdayDate();
// //     const projects = await getProjectMaster();
// //     const logs = await getDailyLogs();

// //     const logsByProject = {};

// //     // Group logs by projectName
// //     logs.forEach((log) => {
// //       if (log.entryDate !== yesterday) return;
// //       const { projectName } = log;
// //       if (!projectName) return;

// //       if (!logsByProject[projectName]) logsByProject[projectName] = [];
// //       logsByProject[projectName].push(log);
// //     });

// //     for (const project of projects) {
// //       const { projectName, channelId, projectMasterEmail } = project;
// //       if (!projectName || !channelId) continue;

// //       const projectLogs = logsByProject[projectName] || [];
// //       if (projectLogs.length === 0) continue;

// //       const formattedMessage = formatMessage(
// //         projectName,
// //         projectLogs,
// //         projectMasterEmail
// //       );

// //       await sendToSlack(channelId, formattedMessage);
// //     }

// //     console.log('✅ All yesterday’s messages sent!');
// //   } catch (err) {
// //     console.error('❌ Error in sendDailyProjectLogs:', err.message);
// //   }
// // };

// // // Run script directly
// // if (process.argv[1] === new URL(import.meta.url).pathname) {
// //   sendDailyProjectLogs();
// // }

// import AWS from 'aws-sdk';
// import axios from 'axios';
// import dotenv from 'dotenv';
// dotenv.config();

// const slackToken = process.env.SLACK_BOT_TOKEN;
// AWS.config.update({ region: 'ap-south-1' });
// const dynamodb = new AWS.DynamoDB.DocumentClient();

// let slackUserCacheByEmail = {};
// let slackUserCacheByName = {};

// const getDateOnly = (date) => {
//   return date.toISOString().split('T')[0]; // e.g. 2025-06-11
// };

// const getProjectMaster = async () => {
//   const params = { TableName: "ProjectMaster" };
//   const result = await dynamodb.scan(params).promise();
//   return result.Items || [];
// };

// const getDailyLogs = async () => {
//   const params = { TableName: "employeeDailyActivityLogs" };
//   const result = await dynamodb.scan(params).promise();
//   return result.Items || [];
// };

// const fetchSlackUsers = async () => {
//   try {
//     const response = await axios.get('https://slack.com/api/users.list', {
//       headers: {
//         Authorization: `Bearer ${slackToken}`,
//         'Content-Type': 'application/json',
//       },
//     });

//     if (!response.data.ok) throw new Error(response.data.error);

//     const members = response.data.members;
//     for (const member of members) {
//       const email = member.profile?.email?.toLowerCase();
//       const name = member.real_name?.toLowerCase();
//       if (email) slackUserCacheByEmail[email] = member.id;
//       if (name) slackUserCacheByName[name] = member.id;
//     }
//     console.log('✅ Slack users loaded');
//   } catch (error) {
//     console.error('❌ Error fetching Slack users:', error.message);
//   }
// };

// const resolveSlackId = (identifier) => {
//   if (!identifier) return null;
//   const normalized = identifier.toLowerCase().trim();
//   return (
//     slackUserCacheByEmail[normalized] ||
//     slackUserCacheByName[normalized] || null
//   );
// };

// const sendDirectMessage = async (userId, text) => {
//   try {
//     const imResponse = await axios.post(
//       'https://slack.com/api/conversations.open',
//       { users: userId },
//       {
//         headers: {
//           Authorization: `Bearer ${slackToken}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     const dmChannelId = imResponse.data.channel.id;

//     await axios.post(
//       'https://slack.com/api/chat.postMessage',
//       { channel: dmChannelId, text },
//       {
//         headers: {
//           Authorization: `Bearer ${slackToken}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     console.log(`✅ Sent DM to <@${userId}>`);
//   } catch (err) {
//     console.error(`❌ Failed to send DM to <@${userId}>:`, err.message);
//   }
// };

// const inviteUserToChannel = async (channelId, slackUserId, managerEmail) => {
//   try {
//     const response = await axios.post(
//       'https://slack.com/api/conversations.invite',
//       { channel: channelId, users: slackUserId },
//       {
//         headers: {
//           Authorization: `Bearer ${slackToken}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     if (!response.data.ok && response.data.error !== 'already_in_channel') {
//       console.error(`❌ Invite failed: ${response.data.error}`);
//       await sendDirectMessage(slackUserId, `Hi <@${slackUserId}>, you're not in the *${channelId}* channel. Please join manually or ask the admin.`);
//     } else {
//       console.log(`✅ Invited <@${slackUserId}> to ${channelId}`);
//     }
//   } catch (error) {
//     console.error(`❌ Error inviting user to channel:`, error.message);
//     await sendDirectMessage(slackUserId, `Hi <@${slackUserId}>, I couldn't add you to the Slack channel *${channelId}*. Please join manually or contact admin. [Manager email: ${managerEmail}]`);
//   }
// };

// const formatMessage = (projectName, logs, projectManagerEmail, channelId) => {
//   const managerSlackId = resolveSlackId(projectManagerEmail);
//   let managerTag = managerSlackId ? `<@${managerSlackId}>` : `${projectManagerEmail} (not found in workspace)`;

//   if (managerSlackId) inviteUserToChannel(channelId, managerSlackId, projectManagerEmail);

//   let message = `:wave: ${managerTag}\n`;
//   message += `Here's the update for the project: *${projectName}* (Late submissions included)\n\n`;
//   message += `━━━━━━━━━━━━━━━━━━━━━━━\n`;

//   const logsByUser = {};
//   logs.forEach((log) => {
//     const identifier = log.userEmail || log.email || log.userName;
//     if (!identifier) return;
//     if (!logsByUser[identifier]) logsByUser[identifier] = [];
//     logsByUser[identifier].push(log);
//   });

//   for (const [identifier, userLogs] of Object.entries(logsByUser)) {
//     const slackId = resolveSlackId(identifier);
//     const tag = slackId ? `<@${slackId}>` : `:bust_in_silhouette: ${identifier}`;
//     const totalHours = userLogs.reduce(
//       (acc, curr) => acc + (parseFloat(curr.totalHoursSpent) || 0),
//       0
//     );

//     message += `\n:bust_in_silhouette: ${tag}\n`;
//     message += `:calendar: Dates: ${userLogs.map(l => l.entryDate).join(', ')}\n`;
//     message += `:clock3: Total Hours: *${totalHours}*\n`;
//     message += `:memo: Tasks:\n`;

//     userLogs.forEach((log) => {
//       let desc = log.workDescription || 'No description';
//       desc = desc.replace(/\r\n|\r|\n/g, '\n').trim();
//       const points = desc.includes('\n') ? desc.split('\n') : desc.split(/[-•*•.,;]/);
//       points.map(p => p.trim()).filter(Boolean).forEach((point) => {
//         message += `- ${point}\n`;
//       });
//     });
//   }

//   message += `\n━━━━━━━━━━━━━━━━━━━━━━━\n`;
//   return message.trim();
// };

// const sendToSlack = async (channelId, text) => {
//   try {
//     const response = await axios.post(
//       'https://slack.com/api/chat.postMessage',
//       { channel: channelId, text: text },
//       {
//         headers: {
//           Authorization: `Bearer ${slackToken}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     if (!response.data.ok) throw new Error(response.data.error);
//     console.log(`✅ Sent to Slack channel: ${channelId}`);
//   } catch (error) {
//     console.error(`❌ Failed to send to ${channelId}:`, error.message);
//   }
// };

// export const sendDailyProjectLogs = async () => {
//   try {
//     await fetchSlackUsers();

//     const now = new Date();
//     const todayDateStr = getDateOnly(now);
//     const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
//     const yesterdayDateStr = getDateOnly(yesterday);

//     const projects = await getProjectMaster();
//     const logs = await getDailyLogs();

//     const filteredLogs = logs.filter(log => {
//       if (!log.updatedAt || !log.entryDate || log.logStatus === 'approved') return false;

//       const updated = new Date(log.updatedAt);
//       const updatedDateStr = getDateOnly(updated);

//       // ✅ Was updated yesterday
//       if (updatedDateStr === yesterdayDateStr) return true;

//       // ✅ Was updated today before 7am
//       if (updatedDateStr === todayDateStr && updated.getHours() < 7) return true;

//       return false;
//     });

//     const logsByProject = {};
//     filteredLogs.forEach((log) => {
//       const { projectName } = log;
//       if (!projectName) return;
//       if (!logsByProject[projectName]) logsByProject[projectName] = [];
//       logsByProject[projectName].push(log);
//     });

//     for (const project of projects) {
//       const { projectName, channelId, projectMasterEmail } = project;
//       if (!projectName || !channelId) continue;

//       const projectLogs = logsByProject[projectName] || [];
//       if (projectLogs.length === 0) continue;

//       const formattedMessage = formatMessage(
//         projectName,
//         projectLogs,
//         projectMasterEmail,
//         channelId
//       );

//       await sendToSlack(channelId, formattedMessage);
//     }

//     console.log('✅ Logs with late submission check sent to Slack');
//   } catch (err) {
//     console.error('❌ Error in sendDailyProjectLogs:', err.message);
//   }
// };

// if (process.argv[1] === new URL(import.meta.url).pathname) {
//   sendDailyProjectLogs();
// }






































































import AWS from 'aws-sdk';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const slackToken = process.env.SLACK_BOT_TOKEN;
AWS.config.update({ region: 'ap-south-1' });
const dynamodb = new AWS.DynamoDB.DocumentClient();

let slackUserCacheByEmail = {};
let slackUserCacheByName = {};

const getDateOnly = (date) => {
  return date.toISOString().split('T')[0]; // e.g. 2025-06-11
};

const getProjectMaster = async () => {
  const params = { TableName: "ProjectMaster" };
  const result = await dynamodb.scan(params).promise();
  return result.Items || [];
};

const getDailyLogs = async () => {
  const params = { TableName: "employeeDailyActivityLogs" };
  const result = await dynamodb.scan(params).promise();
  return result.Items || [];
};

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

const resolveSlackId = (identifier) => {
  if (!identifier) return null;
  const normalized = identifier.toLowerCase().trim();
  return (
    slackUserCacheByEmail[normalized] ||
    slackUserCacheByName[normalized] || null
  );
};

const sendDirectMessage = async (userId, text) => {
  try {
    const imResponse = await axios.post(
      'https://slack.com/api/conversations.open',
      { users: userId },
      {
        headers: {
          Authorization: `Bearer ${slackToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const dmChannelId = imResponse.data.channel.id;

    await axios.post(
      'https://slack.com/api/chat.postMessage',
      { channel: dmChannelId, text },
      {
        headers: {
          Authorization: `Bearer ${slackToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`✅ Sent DM to <@${userId}>`);
  } catch (err) {
    console.error(`❌ Failed to send DM to <@${userId}>:`, err.message);
  }
};

const inviteUserToChannel = async (channelId, slackUserId, managerEmail) => {
  try {
    const response = await axios.post(
      'https://slack.com/api/conversations.invite',
      { channel: channelId, users: slackUserId },
      {
        headers: {
          Authorization: `Bearer ${slackToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.data.ok && response.data.error !== 'already_in_channel') {
      console.error(`❌ Invite failed: ${response.data.error}`);
      await sendDirectMessage(slackUserId, `Hi <@${slackUserId}>, you're not in the *${channelId}* channel. Please join manually or ask the admin.`);
    } else {
      console.log(`✅ Invited <@${slackUserId}> to ${channelId}`);
    }
  } catch (error) {
    console.error(`❌ Error inviting user to channel:`, error.message);
    await sendDirectMessage(slackUserId, `Hi <@${slackUserId}>, I couldn't add you to the Slack channel *${channelId}*. Please join manually or contact admin. [Manager email: ${managerEmail}]`);
  }
};

const formatMessage = (projectName, logs, projectManagerEmail, channelId) => {
  const managerSlackId = resolveSlackId(projectManagerEmail);
  let managerTag = managerSlackId ? `<@${managerSlackId}>` : `${projectManagerEmail} (not found in workspace)`;

  if (managerSlackId) inviteUserToChannel(channelId, managerSlackId, projectManagerEmail);

  let message = `:wave: ${managerTag}\n`;
  message += `Here's the update for the project: *${projectName}* (Late submissions included)\n\n`;
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

    message += `\n:bust_in_silhouette: ${tag}`;

    // Group logs by date
    const logsByDate = {};
    userLogs.forEach(log => {
      const date = log.entryDate || "Unknown Date";
      if (!logsByDate[date]) logsByDate[date] = [];
      logsByDate[date].push(log);
    });

    for (const [date, logsOnDate] of Object.entries(logsByDate)) {
      const totalHours = logsOnDate.reduce(
        (acc, curr) => acc + (parseFloat(curr.totalHoursSpent) || 0),
        0
      );
      message += `\n📅 ${date}`;
      message += `\n⏱️ ${totalHours} hour${totalHours !== 1 ? 's' : ''}`;
      message += `\n📝 Tasks:`;

      logsOnDate.forEach((log) => {
        let desc = log.workDescription || 'No description';
        desc = desc.replace(/\r\n|\r|\n/g, '\n').trim();
        const points = desc.includes('\n') ? desc.split('\n') : desc.split(/[-•*•.,;]/);
        points.map(p => p.trim()).filter(Boolean).forEach((point) => {
          message += `\n- ${point}`;
        });
      });
      message += `\n`; // space between dates
    }

    message += `\n`; // space between users
  }

  message += `━━━━━━━━━━━━━━━━━━━━━━━\n`;
  return message.trim();
};


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

export const sendDailyProjectLogs = async () => {
  try {
    await fetchSlackUsers();

    const now = new Date();
    const todayDateStr = getDateOnly(now);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayDateStr = getDateOnly(yesterday);

    const projects = await getProjectMaster();
    const logs = await getDailyLogs();

    const filteredLogs = logs.filter(log => {
      if (!log.updatedAt || !log.entryDate || log.logStatus === 'approved') return false;

      const updated = new Date(log.updatedAt);
      const updatedDateStr = getDateOnly(updated);

      return (
        updatedDateStr === yesterdayDateStr ||
        (updatedDateStr === todayDateStr && updated.getHours() < 7)
      );
    });

    // ✅ Group logs by projectId
    const logsByProjectId = {};
    filteredLogs.forEach((log) => {
      const { projectId } = log;
      if (!projectId) return;
      if (!logsByProjectId[projectId]) logsByProjectId[projectId] = [];
      logsByProjectId[projectId].push(log);
    });

    for (const project of projects) {
      const { Id: projectId, projectName, channelId, projectMasterEmail } = project;
      if (!projectId || !projectName || !channelId) continue;

      const projectLogs = logsByProjectId[projectId] || [];
      if (projectLogs.length === 0) continue;

      const formattedMessage = formatMessage(
        projectName,
        projectLogs,
        projectMasterEmail,
        channelId
      );
      console.log(formattedMessage, '>>>>>>>>>>>>>>>>>>>>>>>>');
      await sendToSlack(channelId, formattedMessage); // 🛠 fixed hardcoded "channelId"
    }
    

    console.log('✅ Logs with late submission check sent to Slack');
  } catch (err) {
    console.error('❌ Error in sendDailyProjectLogs:', err.message);
  }
};


if (process.argv[1] === new URL(import.meta.url).pathname) {
  sendDailyProjectLogs();
}