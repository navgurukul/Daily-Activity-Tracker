

import { UpdateCommand, GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../services/dbClient.mjs";
import { buildResponse } from "../utils/responseBuilder.mjs";
import { extractEmailFromGoogleToken } from "../utils/verifyGoogleToken.mjs";

export const handlePut = async (event, stage, origin) => {
  try {
    const token = event.headers.Authorization?.split('Bearer ')[1];

    if (!token) {
      return buildResponse(401, { message: 'Missing Google token' }, origin);
    }

    const tokenEmail = await extractEmailFromGoogleToken(token);
    const updates = JSON.parse(event.body);

    if (!Array.isArray(updates) || updates.length === 0) {
      return buildResponse(400, { message: "Request must be a non-empty array of updates" }, origin);
    }

    const approvalItems = ["approved", "rejected", "pending"];
    const invalidItems = updates.filter(item => !item.Id || !item.logStatus || !item.approvalEmail);
    if (invalidItems.length > 0) {
      return buildResponse(400, {
        message: "Some items are missing required fields",
        invalidItems
      }, origin);
    }

    const checkApprovalItems = updates.map(item => !approvalItems.includes(item.logStatus));
    if (checkApprovalItems.includes(true)) {
      return buildResponse(400, {
        message: "logStatus must be either pending, approved or rejected",
        data: updates
      }, origin);
    }

    const apiResponse = await fetch("https://u9dz98q613.execute-api.ap-south-1.amazonaws.com/dev/employeeSheetRecords?sheet=pncdata");
    const apiJson = await apiResponse.json();

    if (!apiJson.success || !Array.isArray(apiJson.data)) {
      return buildResponse(500, { message: "Failed to fetch employee sheet data" }, origin);
    }

    const employeeSheetData = apiJson.data;
    const privilegedRoles = ["superadmin", "admin"];
    let isPrivileged = false;

    // Check if tokenEmail has privileged access
    const accessData = await docClient.send(new QueryCommand({
      TableName: "hrmsAccessControler",
      IndexName: "email-index",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: { ":email": tokenEmail.toLowerCase() },
    }));

    if (accessData.Items && accessData.Items.length > 0) {
      const roles = accessData.Items.map(item => item.role?.toLowerCase());
      isPrivileged = roles.some(role => privilegedRoles.includes(role));
    }

    // Now perform mismatch check ONLY if NOT privileged
    if (!isPrivileged) {
      const mismatched = updates.find(
        (item) => item.approvalEmail?.toLowerCase() !== tokenEmail?.toLowerCase()
      );

      if (mismatched) {
        return buildResponse(403, {
          message: `Authenticated email does not match approvalEmail (${mismatched.approvalEmail})`,
        }, origin);
      }
    }

    const updatePromises = updates.map(async (item) => {
      const { Id, logStatus, approvalEmail, workDescription, totalHoursSpent, projectName, entryDate } = item;

      const { Item: existingRecord } = await docClient.send(new GetCommand({
        TableName: "employeeDailyActivityLogs",
        Key: { Id },
      }));

      const userEmail = existingRecord?.email;
      if (!userEmail) throw new Error(`No email found for log Id: ${Id}`);

      const matchedEmployee = employeeSheetData.find(
        person => person["Team ID"]?.toLowerCase() === userEmail.toLowerCase()
      );

      const reportingManagerEmail = matchedEmployee?.["Reporting maanger email ID"];
      if (!reportingManagerEmail || reportingManagerEmail.toLowerCase() === "n/a") {
        throw new Error(`No valid Reporting Manager found for: ${userEmail}`);
      }

      const isRM = tokenEmail.toLowerCase() === reportingManagerEmail.toLowerCase();

      if (!isRM && !isPrivileged) {
        throw new Error(`You are not the RM or authorized controller/admin of ${userEmail}. RM is: ${reportingManagerEmail}`);
      }

      // Build update expression
      let updateExp = "set logStatus = :logStatus, approvalEmail = :approvalEmail";
      const expAttrVals = {
        ":logStatus": logStatus,
        ":approvalEmail": approvalEmail,
      };

      if (workDescription !== undefined) {
        updateExp += ", workDescription = :workDescription";
        expAttrVals[":workDescription"] = workDescription;
      }

      if (totalHoursSpent !== undefined) {
        updateExp += ", totalHoursSpent = :totalHoursSpent";
        expAttrVals[":totalHoursSpent"] = totalHoursSpent;
      }

      if (projectName !== undefined) {
        updateExp += ", projectName = :projectName";
        expAttrVals[":projectName"] = projectName;
      }

      if (entryDate !== undefined) {
        updateExp += ", entryDate = :entryDate";
        expAttrVals[":entryDate"] = entryDate;
      }

      const params = {
        TableName: "employeeDailyActivityLogs",
        Key: { Id },
        UpdateExpression: updateExp,
        ExpressionAttributeValues: expAttrVals,
        ReturnValues: "ALL_NEW",
      };

      const result = await docClient.send(new UpdateCommand(params));
      return result.Attributes;
    });

    const updatedItems = await Promise.all(updatePromises);

    return buildResponse(200, {
      message: "Records updated successfully",
      updatedCount: updatedItems.length,
      data: updatedItems,
    }, origin);

  } catch (error) {
    const isPermissionError = error.message.includes("You are not the RM");
    return buildResponse(isPermissionError ? 403 : 500, {
      message: error.message,
    }, origin);
  }
};
