function doGet() {
  var sheetUrl = PropertiesService.getScriptProperties().getProperty('Project_Masters');
  var sheet = SpreadsheetApp.openByUrl(sheetUrl);
  var sheetName = sheet.getSheetByName("Project Master");
  var data = sheetName.getRange("A2:A29").getValues();
  var status = sheetName.getRange("F2:F29").getValues();

  var projects = [];

  // Loop through the data and combine status and project name
  for (var i = 0; i < data.length; i++) {
    var projectName = data[i][0];
    var projectStatus = status[i][0];

    // Define status based on projectStatus value
    if (!projectStatus || projectStatus === "Inactive") {
      projectStatus = ""; // Set to empty string if undefined or "Inactive"
    }

    // Only add to projects array if projectName is not empty
    if (projectName) {
      projects.push({
        projectName: projectName,
        status: projectStatus
      });
    }
  }

  // Create an object to return as JSON
  var responseData = {
    projects: projects
  };

  // Log responseData for debugging (optional)
  Logger.log(responseData);

  // Return JSON response
  return ContentService.createTextOutput(JSON.stringify(responseData)).setMimeType(ContentService.MimeType.JSON);
}
