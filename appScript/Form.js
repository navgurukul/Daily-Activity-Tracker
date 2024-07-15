// Replace with your Google Sheet URLs
var SPREADSHEET_URL_1 = PropertiesService.getScriptProperties().getProperty('leaves-trackerURL');
var SPREADSHEET_URL_2 = PropertiesService.getScriptProperties().getProperty('activity-trackerURL')

// Replace with your sheet names
var SHEET_NAME_1 = 'activity-tracker';
var SHEET_NAME_2 = 'leaves-tracker';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (data.type === 'contribution') {
      handleContribution(data);
    } else if (data.type === 'leave') {
      handleLeave(data);
    } else {
      throw new Error('Invalid data type');
    }

    var response = {
      status: 'SUCCESS',
      message: 'Data added successfully to Google Sheet.'
    };

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    var response = {
      status: 'ERROR',
      message: 'Error adding data to Google Sheet.'
    };

    console.error('Error:', error);
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function handleContribution(data) {
  var email = data.email;
  var challenges = data.challenges;
  var description = data.description;
  var contributions = data.contributions;
  var timestamp = data.selectedDate;

  var sheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL_1).getSheetByName(SHEET_NAME_1);

  if (!sheet) {
    throw new Error('Sheet not found');
  }

  contributions.forEach(function (contribution) {
    var newRow = [
      timestamp,
      email,
      challenges,
      contribution.project,
      contribution.hours,
      contribution.task
    ];
    sheet.appendRow(newRow);
  });
}

function handleLeave(data) {
  var leaveType = data.leaveType;
  var reason = data.reason;
  var fromDate = data.fromDate;
  var toDate = data.toDate;
  var email = data.email;
  var numberOfDays = data.numberOfDays

  var sheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL_2).getSheetByName(SHEET_NAME_2);

  if (!sheet) {
    throw new Error('Sheet not found');
  }


  var newRow = [
    email,
    leaveType,
    reason,
    numberOfDays,
    fromDate,
    toDate,

  ];
  sheet.appendRow(newRow);
}