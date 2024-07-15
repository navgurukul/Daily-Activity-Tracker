// const SLACK_API_TOKEN = ""; // 
// const SHEET_ID = "";  // 


// function fetchSlackMembers() {
//   const url = "https://slack.com/api/users.list";
  
//   const options = {
//     method: "get",
//     headers: {
//       "Authorization": `Bearer ${SLACK_API_TOKEN}`,
//       "Content-Type": "application/x-www-form-urlencoded"
//     },
//     muteHttpExceptions: true
//   };

//   try {
//     const response = UrlFetchApp.fetch(url, options);
//     const responseData = JSON.parse(response.getContentText());

//     if (responseData.ok) {
//       const members = responseData.members;
//       console.log(members.length, '&&&&')
//       const slackMembers = members.map(member => {
//         if(member.profile.email && member) {
//           return {
//             email: member.profile.email,
//             id: member.id
//           };
//         }
//       });

//       // Get emails from the Leave-Balance sheet and match with Slack members
//       const leaveBalanceEmails = getLeaveBalanceEmails();
//       // console.log(leaveBalanceEmails, '&&&&&')
//       // console.log(slackMembers, '&&&&&')

//       // var matchedMembers;
//       // slackMembers.forEach(member => {
//       //   if(member && leaveBalanceEmails.includes(member.email)) {
//       //     console.log(member, '88888')
//       //     // leaveBalanceEmails.includes(member.email)
//       //     matchedMembers.push(member)
//       //   }
//       // });

//       // console.log(matchedMembers, '&&&&');  // Log matched members to console

//       // Save matched members to a sheet
//       saveToSheet(slackMembers);

//     } else {
//       console.error("Error fetching members: " + responseData.error);
//     }
//   } catch (e) {
//     console.error("Error fetching members: " + e);
//   }
// }

// function getLeaveBalanceEmails() {
//   const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
//   const sheets = spreadsheet.getSheets();
//   let leaveBalanceSheet;

//   // Find the "Leave-Balance" sheet
//   for (let i = 0; i < sheets.length; i++) {
//     if (sheets[i].getName().includes("Leave-Balance")) {
//       leaveBalanceSheet = sheets[i];
//       break;
//     }
//   }

//   if (!leaveBalanceSheet) {
//     console.error("Leave-Balance sheet not found.");
//     return [];
//   }

//   // Read emails from column D, starting from row 3
//   const emailRange = leaveBalanceSheet.getRange("D3:D" + leaveBalanceSheet.getLastRow());
//   const emailValues = emailRange.getValues().flat().filter(email => email);

//   return emailValues;
// }

// function saveToSheet(members) {
//   const sheetName = "Members Master";
//   const ss = SpreadsheetApp.openById(SHEET_ID);
//   let sheet = ss.getSheetByName(sheetName);

//   if (!sheet) {
//     sheet = ss.insertSheet(sheetName);
//     sheet.appendRow(["User Email", "Slack Member ID"]);
//   } else {
//     sheet.clear(); // Clear existing data
//     sheet.appendRow(["User Email", "Slack Member ID"]);
//   }

//   members.forEach(member => {
//     if(member){
//       sheet.appendRow([member.email, member.id]);

//     }
//   });
// }

// // Run the function to fetch Slack members
// fetchSlackMembers();
