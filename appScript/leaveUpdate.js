function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Refresh')
    .addItem('Update Leaves', 'updateLeaves')
    .addItem('Sync Slack Channels', 'createSlackChannel')
    .addToUi();
  ui.createMenu('Action')
  .addToUi();

}

function onEdit(e) {
  Logger.log("onEdit triggered");

  if (!e || !e.range) {
    Logger.log("Event object or range is undefined");
    return;
  }

  var sheet = e.source.getActiveSheet();
  if (!sheet) {
    Logger.log("Active sheet is undefined");
    return;
  }

  Logger.log("Active sheet: " + sheet.getName());

  var range = e.range;
  Logger.log("Edited range: Row " + range.getRow() + ", Column " + range.getColumn());
  Logger.log("Edited value: " + range.getValue());

  if (sheet.getName() === 'leaves-tracker' && [1, 2, 4].includes(range.getColumn())) {  
    Logger.log("Editing relevant column");
    var row = range.getRow();
    var leaveType = sheet.getRange(row, 2).getValue();
    var email = sheet.getRange(row, 1).getValue();
    var leaveDays = parseFloat(sheet.getRange(row, 4).getValue()); 

    Logger.log("Leave Type: " + leaveType + ", Email: " + email + ", Leave Days: " + leaveDays);

    if (email && leaveType && !isNaN(leaveDays)) {
      handleLeaveUpdate(email, leaveType, leaveDays);
    } else {
      Logger.log("One of the values (email, leaveType, leaveDays) is undefined or invalid");
    }
  } else {
    Logger.log("Edit not in the expected range");
  }
}

function doPost(e) {
  Logger.log("doPost triggered");

  var params = e.parameter;
  var email = params['email'];
  var leaveType = params['leaveType'];
  var leaveDays = parseFloat(params['leaveDays']);
  var reason = params['reason'];
  var fromDate = params['fromDate'];
  var toDate = params['toDate'];

  Logger.log("Leave Type: " + leaveType + ", Email: " + email + ", Leave Days: " + leaveDays);

  if (email && leaveType && !isNaN(leaveDays)) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var leaveTrackerSheet = ss.getSheetByName('leaves-tracker');

    leaveTrackerSheet.appendRow([email, leaveType, reason, leaveDays, fromDate, toDate]);
    
    handleLeaveUpdate(email, leaveType, leaveDays);
  } else {
    Logger.log("One of the values (email, leaveType, leaveDays) is undefined or invalid");
  }

  return ContentService.createTextOutput("Success");
}

function handleLeaveUpdate(email, leaveType, leaveDays) {
  Logger.log("handleLeaveUpdate called with Email: " + email + ", Leave Type: " + leaveType + ", Leave Days: " + leaveDays);

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var leaveBalanceSheet = ss.getSheetByName('Leave-Balance-31st may');

  var leaveTypesColumn = { 
    "Adoption Leave": {booked: 4, balance: 5},
    "Bereavement Leave": {booked: 6, balance: 7},
    "Casual Leave": {booked: 8, balance: 9},
    "Exam Leave": {booked: 10, balance: 11},
    "Festival Leave": {booked: 12, balance: 13},
    "Maternity Leave": {booked: 14, balance: 15},
    "Miscarriage Leave": {booked: 16, balance: 17},
    "Parental Leave": {booked: 18, balance: 19},
    "Sexual Reassignment Surgery Leave": {booked: 20, balance: 21},
    "Vipassana Leave": {booked: 22, balance: 23},
    "Wedding Leave": {booked: 24, balance: 25},
    "Wellness Leave": {booked: 26, balance: 27},
  };

  var leaveInfo = leaveTypesColumn[leaveType];

  if (leaveInfo) {
    var leaveBalanceRange = leaveBalanceSheet.getDataRange().getValues();
    Logger.log("Leave Balance Range: " + JSON.stringify(leaveBalanceRange));

    for (var i = 1; i < leaveBalanceRange.length; i++) {
      Logger.log("Checking row " + (i + 1) + ": " + leaveBalanceRange[i][3]);
      if (leaveBalanceRange[i][3] === email) { 
        Logger.log("Matching row found for Email: " + email);

        var currentBooked = parseFloat(leaveBalanceRange[i][leaveInfo.booked]) || 0;
        var currentBalance = parseFloat(leaveBalanceRange[i][leaveInfo.balance]) || 0;

        Logger.log("Current Booked: " + currentBooked + ", Current Balance: " + currentBalance);

        leaveBalanceSheet.getRange(i + 1, leaveInfo.booked + 1).setValue(currentBooked + leaveDays);
        leaveBalanceSheet.getRange(i + 1, leaveInfo.balance + 1).setValue(currentBalance - leaveDays);

        Logger.log("Updated row " + (i + 1) + " with new Booked and Balance values");
        break;
      } else {
        Logger.log("No matching email found in row " + (i + 1));
      }
    }
  } else {
    Logger.log("Leave Type not found in mapping");
  }
}

function updateLeaves() {
  Logger.log("updateLeaves manually triggered");

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var leaveTrackerSheet = ss.getSheetByName('leaves-tracker');
  var configSheet = ss.getSheetByName('Config');
  
  var lastUpdatedRow = parseInt(configSheet.getRange("E2").getValue()) || 1; 
  
  var data = leaveTrackerSheet.getDataRange().getValues();
  var startRow = lastUpdatedRow + 1; 

  for (var i = startRow; i < data.length; i++) { 
    var email = data[i][0];
    var leaveType = data[i][1];
    var leaveDays = parseFloat(data[i][3]);

    Logger.log("Processing row " + (i + 1) + " with Email: " + email + ", Leave Type: " + leaveType + ", Leave Days: " + leaveDays);

    if (email && leaveType && !isNaN(leaveDays)) {
      handleLeaveUpdate(email, leaveType, leaveDays);
    } else {
      Logger.log("Skipping row " + (i + 1) + " due to invalid data");
    }
  }

  configSheet.getRange("E2").setValue(data.length - 1); 
}