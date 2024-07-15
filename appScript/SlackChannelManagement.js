// main function
function createSlackChannel() {

  // showPopupMessage('contact the developer');
  // return;

  // wanna test it in dev env (uncomment this line)
  // var slackToken = PropertiesService.getScriptProperties().getProperty('devSlackToken');  // dev
  // var spreadsheetId = PropertiesService.getScriptProperties().getProperty('testSpreadsheetId');  // dev

  // the main target
  var slackToken = PropertiesService.getScriptProperties().getProperty('slackToken');  // main
  var spreadsheetId = PropertiesService.getScriptProperties().getProperty('spreadsheetId');  // main

  var sheetName = 'Project Master';
  const channelPrefix = 'tracker';

  const customMessageTemplate = `🤖 Hello team! I'm NavG, a bot created by NavGurukul.
I'm here to help us efficiently track the progress of our *${'[project_name]'}* project.
👨‍💼 @project_manager, please add the respective members to this channel.
Thank you for your cooperation! 🚀`;

  // Project Master
  function projectsInfo() {
    var sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
    var data = sheet.getDataRange().getValues();
    var projInfo = data.slice(1).map(function(row) {
      return {
        projectName: row[0], // project name
        channelID: row[2], // project channel ID
        managerEmail: row[3], // project manager email
      };
    });
    return projInfo;
  }
  // Function to check if a channel exists
  function doesChannelExist(channelName) {
    var url = 'https://slack.com/api/conversations.list';
    var options = {
      method: 'get',
      headers: {
        'Authorization': 'Bearer ' + slackToken
      }
    };

    var response = UrlFetchApp.fetch(url, options);
    var responseText = response.getContentText();
    var responseJson = JSON.parse(responseText);
    if (responseJson.ok) {
      var channels = responseJson.channels;
      for (var i = 0; i < channels.length; i++) {
        if (channels[i].name === channelName) {
          return true;
        }
      }
    } else {
      Logger.log('Error fetching channels: ' + responseJson.error);
    }
    return false;
  }

  // Function to get user ID by email
  function getUserIdByEmail(email) {
    var url = 'https://slack.com/api/users.lookupByEmail';
    var options = {
      method: 'post',
      headers: {
        'Authorization': 'Bearer ' + slackToken
      },
      payload: {
        email: email
      }
    };

    var response = UrlFetchApp.fetch(url, options);
    var responseText = response.getContentText();
    var responseJson = JSON.parse(responseText);

    if (responseJson.ok) {
      return responseJson.user.id;
    } else {
      Logger.log('Error fetching user ID: ' + responseJson.error);
      return null;
    }
  }

  // Function to invite a user to a channel
  function inviteUserToChannel(channelId, userId) {
    var url = 'https://slack.com/api/conversations.invite';
    var payload = {
      channel: channelId,
      users: userId
    };

    var options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Bearer ' + slackToken
      },
      payload: JSON.stringify(payload)
    };

    var response = UrlFetchApp.fetch(url, options);
    var responseText = response.getContentText();
    var responseJson = JSON.parse(responseText);

    if (responseJson.ok) {
      Logger.log('User invited to channel: ' + responseJson.channel.id);
    } else {
      Logger.log('Error inviting user to channel: ' + responseJson.error);
    }
  }

  // Function to post a message to a channel
  function postMessageToChannel(channelId, message) {
    var url = 'https://slack.com/api/chat.postMessage';
    var payload = {
      channel: channelId,
      text: message
    };

    var options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'Bearer ' + slackToken
      },
      payload: JSON.stringify(payload)
    };

    var response = UrlFetchApp.fetch(url, options);
    var responseText = response.getContentText();
    var responseJson = JSON.parse(responseText);

    if (responseJson.ok) {
      Logger.log('Message posted to channel: ' + responseJson.ts);
    } else {
      Logger.log('Error posting message: ' + responseJson.error);
    }
  }

  var projectInfo = projectsInfo();

  for (var i = 0; i < projectInfo.length; i++) {
    var projectName = projectInfo[i].projectName;
    var managerEmail = projectInfo[i].managerEmail;
    var channelId = projectInfo[i].channelID;

    // Check if the project has an existing channel ID
    if (channelId) {
      Logger.log('Project already has a channel ID: ' + channelId);
      continue;
    }

    // Check if the project name is empty
    if (!projectName) {
      Logger.log('Skipping project with empty name');
      continue;
    }

    var channelName = `${projectName.toString().toLowerCase().replace(/\s/g, '-')}-${channelPrefix}`;

    // Check if the channel exists
    if (doesChannelExist(channelName)) {
      Logger.log('Channel already exists: ' + channelName);
    } else {
      // Create the channel if it does not exist
      var createUrl = 'https://slack.com/api/conversations.create';
      var payload = {
        name: channelName
      };

      var createOptions = {
        method: 'post',
        contentType: 'application/json',
        headers: {
          'Authorization': 'Bearer ' + slackToken
        },
        payload: JSON.stringify(payload)
      };
      var createResponse = UrlFetchApp.fetch(createUrl, createOptions);
      var createResponseText = createResponse.getContentText();
      var createResponseJson = JSON.parse(createResponseText);
      if (createResponseJson.ok) {
        channelId = createResponseJson.channel.id;
        Logger.log('Channel created: ' + channelId);

        // Get user ID by email
        var userId = getUserIdByEmail(managerEmail);
        if (userId) {
          // Invite the user to the channel
          inviteUserToChannel(channelId, userId);
        }

        // Post a custom message to the channel
        var customMessage = customMessageTemplate.replace('[project_name]', projectName).replace('@project_manager', '<@' + userId + '>');
        postMessageToChannel(channelId, customMessage);

        // Update the channel ID in the spreadsheet
        var sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
        sheet.getRange(i + 2, 2).setValue(channelName); // adding channel to sheet column B
        sheet.getRange(i + 2, 3).setValue(channelId); // adding channelID to sheet column C
        showPopupMessage('🤖 sync done');
      } else {
        Logger.log('Error creating channel: ' + createResponseJson.error);
      }
    }
  }
}

function showPopupMessage(msg) {
  var ui = SpreadsheetApp.getUi();
  ui.alert(msg);
}
