// import { QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
// import { docClient } from "../services/dbClient.mjs";
// import { buildResponse } from "../utils/responseBuilder.mjs";

// export async function handleGet(event, stage, origin) {
//   const email = event.pathParameters?.email;
//   const query = event.queryStringParameters || {};

//   const limit = parseInt(query.limit) || 20;
//   const lastKey = query.lastKey ? JSON.parse(decodeURIComponent(query.lastKey)) : undefined;

//   let items = [];

//   if (email) {
//     const queryParams = {
//       TableName: "employeeDailyActivityLogs",
//       IndexName: "email-entryDate-index",
//       KeyConditionExpression: "email = :email",
//       ExpressionAttributeValues: {
//         ":email": email,
//       },
//       Limit: limit,
//       ExclusiveStartKey: lastKey,
//     };

//     const result = await docClient.send(new QueryCommand(queryParams));
//     items = result.Items || [];
//     var nextKey = result.LastEvaluatedKey
//       ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey))
//       : null;
//   } else {
//     const scanParams = {
//       TableName: "employeeDailyActivityLogs",
//       FilterExpression: "stage = :stage",
//       ExpressionAttributeValues: {
//         ":stage": stage,
//       },
//       Limit: limit,
//       ExclusiveStartKey: lastKey,
//     };

//     const result = await docClient.send(new ScanCommand(scanParams));
//     items = result.Items || [];
//     var nextKey = result.LastEvaluatedKey
//       ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey))
//       : null;
//   }

//   // Optional: In-memory filters (for non-indexed fields)
//   const filteredItems = items.filter(item => {
//     const entryDate = new Date(item.entryDate);

//     const matchDateRange = query.dateStart && query.dateEnd
//       ? (entryDate >= new Date(query.dateStart) && entryDate <= new Date(query.dateEnd))
//       : true;

//     const matchProject = query.projectName
//       ? item.projectName === query.projectName
//       : true;

//     const matchSpecificDate = query.date
//       ? item.entryDate === query.date
//       : true;

//     const matchMonthYear = query.month && query.year
//       ? (entryDate.getUTCFullYear() === parseInt(query.year) &&
//          entryDate.getUTCMonth() + 1 === parseInt(query.month))
//       : true;

//     return matchDateRange && matchProject && matchSpecificDate && matchMonthYear;
//   });

//   const formatted = filteredItems.reduce((acc, item) => {
//     if (!acc[item.email]) acc[item.email] = [];
//     acc[item.email].push({
//       Id: item.Id,
//       projectName: item.projectName,
//       totalHoursSpent: item.totalHoursSpent,
//       workDescription: item.workDescription,
//       department: item.department,
//       campus: item.campus,
//       entryDate: item.entryDate,
//       updatedAt: item.updatedAt,
//     });
//     return acc;
//   }, {});

//   return buildResponse(200, { data: formatted, nextKey }, origin);
// }


















import { QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "../services/dbClient.mjs";
import { buildResponse } from "../utils/responseBuilder.mjs";

// Helper to paginate to desired page
async function paginate(commandInput, CommandClass, page = 1, limit = 20) {
  let lastEvaluatedKey;
  let result;

  for (let i = 0; i < page; i++) {
    const command = new CommandClass({
      ...commandInput,
      Limit: limit,
      ExclusiveStartKey: lastEvaluatedKey,
    });

    result = await docClient.send(command);
    lastEvaluatedKey = result.LastEvaluatedKey;

    if (!lastEvaluatedKey) break; // No more pages
  }

  return {
    items: result.Items || [],
    nextKey: lastEvaluatedKey
      ? encodeURIComponent(JSON.stringify(lastEvaluatedKey))
      : null,
    hasMore: !!lastEvaluatedKey,
  };
}

export async function handleGet(event, stage, origin) {
  const email = event.pathParameters?.email;
  const query = event.queryStringParameters || {};

  const limit = parseInt(query.limit) || 20;
  const page = parseInt(query.page) || 1;

  const baseInput = email
    ? {
        TableName: "employeeDailyActivityLogs",
        IndexName: "email-entryDate-index",
        KeyConditionExpression: "email = :email",
        ExpressionAttributeValues: {
          ":email": email,
        },
      }
    : {
        TableName: "employeeDailyActivityLogs",
        FilterExpression: "stage = :stage",
        ExpressionAttributeValues: {
          ":stage": stage,
        },
      };

  const commandClass = email ? QueryCommand : ScanCommand;

  const { items, nextKey, hasMore } = await paginate(baseInput, commandClass, page, limit);

  // Optional in-memory filters
  // const filteredItems = items.filter(item => {
  //   const entryDate = new Date(item.entryDate);

  //   const matchDateRange = query.dateStart && query.dateEnd
  //     ? (entryDate >= new Date(query.dateStart) && entryDate <= new Date(query.dateEnd))
  //     : true;

  //   const matchProject = query.projectName
  //     ? item.projectName === query.projectName
  //     : true;

  //   const matchSpecificDate = query.date
  //     ? item.entryDate === query.date
  //     : true;

  //   const matchMonthYear = query.month && query.year
  //     ? (entryDate.getUTCFullYear() === parseInt(query.year) &&
  //        entryDate.getUTCMonth() + 1 === parseInt(query.month))
  //     : true;

  //   return matchDateRange && matchProject && matchSpecificDate && matchMonthYear;
  // }); 

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
const filteredItems = items
.filter(item => {
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
})
.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)); // 🔥 Sort latest first

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>


  console.log("WWWWWWWWWWWWWWWWWWWWWWWWWWWWWW",filteredItems);

  const formatted = filteredItems.reduce((acc, item) => {
    if (!acc[item.email]) acc[item.email] = [];
    acc[item.email].push({
      Id: item.Id,
      projectName: item.projectName,
      totalHoursSpent: item.totalHoursSpent,
      workDescription: item.workDescription,
      department: item.department,
      campus: item.campus,
      entryDate: item.entryDate,
      updatedAt: item.updatedAt,
      logStatus: item.logStatus,
    });
    return acc;
  }, {});

  return buildResponse(200, {
    data: formatted,
    page,
    nextPage: hasMore ? page + 1 : null,
    nextKey,
  }, origin);
}
