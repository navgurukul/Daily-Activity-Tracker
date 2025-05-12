import { QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../services/dbClient.mjs";
import { buildResponse } from "../utils/responseBuilder.mjs";

export async function handleGet(event, stage, origin) {
  const email = event.pathParameters?.email;
  const query = event.queryStringParameters || {};

  const limit = parseInt(query.limit) || 20;
  const lastKey = query.lastKey ? JSON.parse(decodeURIComponent(query.lastKey)) : undefined;

  let items = [];

  if (email) {
    const queryParams = {
      TableName: "employeeDailyActivityLogs",
      IndexName: "email-entryDate-index",
      KeyConditionExpression: "email = :email",
      ExpressionAttributeValues: {
        ":email": email,
      },
      Limit: limit,
      ExclusiveStartKey: lastKey,
    };

    const result = await docClient.send(new QueryCommand(queryParams));
    items = result.Items || [];
    var nextKey = result.LastEvaluatedKey
      ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey))
      : null;
  } else {
    const scanParams = {
      TableName: "employeeDailyActivityLogs",
      FilterExpression: "stage = :stage",
      ExpressionAttributeValues: {
        ":stage": stage,
      },
      Limit: limit,
      ExclusiveStartKey: lastKey,
    };

    const result = await docClient.send(new ScanCommand(scanParams));
    items = result.Items || [];
    var nextKey = result.LastEvaluatedKey
      ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey))
      : null;
  }

  // Optional: In-memory filters (for non-indexed fields)
  const filteredItems = items.filter(item => {
    const entryDate = new Date(item.entryDate);

    const matchDateRange = query.dateStart && query.dateEnd
      ? (entryDate >= new Date(query.dateStart) && entryDate <= new Date(query.dateEnd))
      : true;

    const matchProject = query.projectName
      ? item.projectName === query.projectName
      : true;

    const matchSpecificDate = query.date
      ? item.entryDate === query.date
      : true;

    const matchMonthYear = query.month && query.year
      ? (entryDate.getUTCFullYear() === parseInt(query.year) &&
         entryDate.getUTCMonth() + 1 === parseInt(query.month))
      : true;

    return matchDateRange && matchProject && matchSpecificDate && matchMonthYear;
  });

  const formatted = filteredItems.reduce((acc, item) => {
    if (!acc[item.email]) acc[item.email] = [];
    acc[item.email].push({
      Id: item.Id,
      projectName: item.projectName,
      totalHoursSpent: item.totalHoursSpent,
      workDescription: item.workDescription,
      entryDate: item.entryDate,
      updatedAt: item.updatedAt,
    });
    return acc;
  }, {});

  return buildResponse(200, { data: formatted, nextKey }, origin);
}
