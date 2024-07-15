const slackToken = PropertiesService.getScriptProperties().getProperty('slackToken'); // main
const spreadsheetId = PropertiesService.getScriptProperties().getProperty('spreadsheetId');  // main

// main function
function sendNotificationsToSlack() {
  const sheetName = "activity-tracker";
  const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
  
  if (!sheet) {
    console.error(`Sheet ${sheetName} not found.`);
    return;
  }
  
  const dataRange = sheet.getDataRange();
  const data = dataRange.getValues();

  const today = new Date();
  // var yesterday = new Date(today);
  // yesterday.setDate(today.getDate() - 1);
  var formattedToday = Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy-MM-dd');

  const userMessages = {};
  const devInfo = developersInfo();
  const emailToDevInfo = devInfo.reduce((acc, dev) => {
    acc[dev.employeeEmail] = {
      slackID: dev.employeeSlackID,
      name: dev.employeeName
    };
    return acc;
  }, {});

  const projectChannels = projectsInfo().reduce((acc, project) => {
    acc[project.projectName] = project.slackChannelID;
    return acc;
  }, {});

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const rawDate = row[0];
    const dateCell = new Date(rawDate);
    const formattedDate = Utilities.formatDate(dateCell, Session.getScriptTimeZone(), "yyyy-MM-dd");

    const email = row[1];
    const blockersChallenges = row[2] || "No blockers or challenges mentioned.";
    const projectName = String(row[3]).trim();  // Trim the project name to avoid issues with spaces
    const timeSpent = row[4];
    const taskOfProject = row[5] || "No tasks mentioned.";

    if (formattedDate === formattedToday) {
      if (projectChannels.hasOwnProperty(projectName)) {
        let message = '';

        if (emailToDevInfo.hasOwnProperty(email)) {
          const dev = emailToDevInfo[email];
          message = `<@${dev.slackID}> spent ${timeSpent} hours today on *${projectName}*.\n*Tasks:* ${taskOfProject}`;
        } else {
          const emailPrefix = email.split('@')[0]; // Extract the part before the "@" symbol
          message = `*${emailPrefix}* spent ${timeSpent} hours today on *${projectName}*.\n*Tasks:* ${taskOfProject}`;
        }

        if (!userMessages[projectName]) {
          userMessages[projectName] = [];
        }
        userMessages[projectName].push(message);
      } else {
        console.log("Project name not found in projectChannels:", projectName);
      }
    } else {
      console.log("Date does not match today's date. Skipping row:", i);
    }
  }

  for (const projectName in userMessages) {
    if (userMessages.hasOwnProperty(projectName)) {
      let message = `Here's the update for *today*:\n\n`;
      message += userMessages[projectName].join("\n\n");
      const channel = projectChannels[projectName];
      if (channel) {
        sendSlackMessage(channel, message);
      } else {
        console.error("No channel found for project name:", projectName);
      }
    }
  }
}

// Data from Members Master (developers info)
function developersInfo() {
  var sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName('Members Master');
  var data = sheet.getDataRange().getValues();
  var devInfo = data.slice(1).map(function(row) {
    return {
      employeeEmail: row[0],
      employeeSlackID: row[1],
      employeeName: row[1]  // Assuming the second column is the employee name
    };
  });
  
  return devInfo;
}

// Project Master
function projectsInfo() {
  var sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName('Project Master');
  var data = sheet.getDataRange().getValues();
  var projInfo = data.slice(1).map(function(row) {
    return {
      projectName: row[0].trim(),  // Trim the project name to avoid issues with spaces
      slackChannelID: row[2]
    };
  });
  return projInfo;
}

function sendSlackMessage(channel, messageText) {
  const url = "https://slack.com/api/chat.postMessage";
  const payload = {
    channel: channel,
    text: messageText
  };

  const options = {
    method: "post",
    payload: JSON.stringify(payload),
    contentType: "application/json",
    headers: {
      "Authorization": `Bearer ${slackToken}`
    },
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseData = JSON.parse(response.getContentText());
    if (responseData.ok) {
      console.log("Message sent successfully!");
    } else {
      console.error("Error sending message: " + responseData.error);
    }
  } catch (e) {
    console.error("Error sending message: " + e);
  }
}