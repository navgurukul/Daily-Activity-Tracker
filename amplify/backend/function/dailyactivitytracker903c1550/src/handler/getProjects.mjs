// import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
// import {
//   DynamoDBDocumentClient,
//   ScanCommand,
// } from "@aws-sdk/lib-dynamodb";

// // Initialize DynamoDB client
// const client = new DynamoDBClient({ region: "ap-south-1" });
// const docClient = DynamoDBDocumentClient.from(client);
// const TABLE_NAME = process.env.Project_Table || "ProjectMaster";

// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Headers": "*",
//   "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE",
// };

// export const handler = async (event) => {
//   const stage = event.requestContext.stage;

//   try {
//     if (event.httpMethod === "GET") {
//       console.log('77777777777777777777777777777');
//       const queryParams = event.queryStringParameters || {};
//       const ResidentialNonFilter = queryParams.ResidentialNonResi

//       delete queryParams.ResidentialNonResi
//       const filters = { ...queryParams };
//       const limit = queryParams.limit ? parseInt(queryParams.limit) : 10;
//       const lastKey = queryParams.lastKey
//         ? JSON.parse(decodeURIComponent(queryParams.lastKey))
//         : undefined;

//       delete filters.limit;
//       delete filters.lastKey;

//       const filterKeys = Object.keys(filters);
//       const hasFilters = filterKeys.length > 0;

//       const params = {
//         TableName: TABLE_NAME,
//         // Limit: limit,
//         ExclusiveStartKey: lastKey,
//       };

//       if (hasFilters) {
//         const filterExpressions = [];
//         const expressionAttributeNames = {};
//         const expressionAttributeValues = {};

//         filterKeys.forEach((key, index) => {
//           const placeholderName = `#key${index}`;
//           const placeholderValue = `:val${index}`;

//           filterExpressions.push(`${placeholderName} = ${placeholderValue}`);
//           expressionAttributeNames[placeholderName] = key;
//           expressionAttributeValues[placeholderValue] = filters[key];
//         });

//         params.FilterExpression = filterExpressions.join(" AND ");
//         params.ExpressionAttributeNames = expressionAttributeNames;
//         params.ExpressionAttributeValues = expressionAttributeValues;
//       }

//       const result = await docClient.send(new ScanCommand(params));
      
//       console.log("RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR",result);
//       const sanitizedItems = (result.Items || []).map((item) => {
//         const { stage, ...rest } = item;
//         return rest;
//       });

//       // if(map)
//       console.log("&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&&",sanitizedItems.length);
//       if(ResidentialNonFilter === "Non-Residential"){
//         // const finalData = sanitizedItems.filter(elem => elem.department !== "Residential Program")
//         const filteredData = sanitizedItems.filter(item => item.department !== "Residential Program");

//         console.log("#####################################",sanitizedItems.length);
//         return {
//           statusCode: 200,
//           headers: corsHeaders,
//           body: JSON.stringify({
//             status: true,
//             data: filteredData,
//             // lastKey: result.LastEvaluatedKey
//             //   ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey))
//             //   : null,
//           }),
//         };
//       }

//       if(ResidentialNonFilter === "Residential-Program"){
//         // const finalData = sanitizedItems.filter(elem => elem.department !== "Residential Program")
//         const filteredData = sanitizedItems.filter(item => item.department === "Residential Program");

//         console.log("#####################################",sanitizedItems.length);
//         return {
//           statusCode: 200,
//           headers: corsHeaders,
//           body: JSON.stringify({
//             status: true,
//             data: filteredData,
//             // lastKey: result.LastEvaluatedKey
//             //   ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey))
//             //   : null,
//           }),
//         };
//       }


//       return {
//         statusCode: 200,
//         headers: corsHeaders,
//         body: JSON.stringify({
//           status: true,
//           data: sanitizedItems,
//           // lastKey: result.LastEvaluatedKey
//           //   ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey))
//           //   : null,
//         }),
//       };
//     }
//   } catch (err) {
//     console.error("ERROR:", err);
//     return {
//       statusCode: 500,
//       headers: corsHeaders,
//       body: JSON.stringify({
//         message: "Internal server error",
//         error: err.message,
//       }),
//     };
//   }
// };


















import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB client
const client = new DynamoDBClient({ region: "ap-south-1" });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.Project_Table || "ProjectMaster";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE",
};

// ✅ Define allowed departments for Residential Program
const allowedDepartments = [
  "Culture",
  "Residential Program",
  "Academics",
  "Operations",
  "LXD & ETC",
  "Campus Support Staff",
  "Campus_Security"
];

export const handler = async (event) => {
  const stage = event.requestContext.stage;

  try {
    if (event.httpMethod === "GET") {
      console.log('Fetching projects...');

      const queryParams = event.queryStringParameters || {};
      const ResidentialNonFilter = queryParams.ResidentialNonResi;

      delete queryParams.ResidentialNonResi;
      const filters = { ...queryParams };
      const limit = queryParams.limit ? parseInt(queryParams.limit) : 10;
      const lastKey = queryParams.lastKey
        ? JSON.parse(decodeURIComponent(queryParams.lastKey))
        : undefined;

      delete filters.limit;
      delete filters.lastKey;

      const filterKeys = Object.keys(filters);
      const hasFilters = filterKeys.length > 0;

      const params = {
        TableName: TABLE_NAME,
        ExclusiveStartKey: lastKey,
      };

      if (hasFilters) {
        const filterExpressions = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};

        filterKeys.forEach((key, index) => {
          const placeholderName = `#key${index}`;
          const placeholderValue = `:val${index}`;

          filterExpressions.push(`${placeholderName} = ${placeholderValue}`);
          expressionAttributeNames[placeholderName] = key;
          expressionAttributeValues[placeholderValue] = filters[key];
        });

        params.FilterExpression = filterExpressions.join(" AND ");
        params.ExpressionAttributeNames = expressionAttributeNames;
        params.ExpressionAttributeValues = expressionAttributeValues;
      }

      const result = await docClient.send(new ScanCommand(params));
      const sanitizedItems = (result.Items || []).map((item) => {
        const { stage, ...rest } = item;
        return rest;
      });

      if (ResidentialNonFilter === "Non-Residential") {
        const filteredData = sanitizedItems.filter(
          item => item.department !== "Residential Program"
        );
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            status: true,
            data: filteredData,
          }),
        };
      }

      if (ResidentialNonFilter === "Residential-Program") {
        const filteredData = sanitizedItems.filter(
          item => allowedDepartments.includes(item.department)
        );
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            status: true,
            data: filteredData,
          }),
        };
      }

      // Return all if no ResidentialNonResi filter
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          status: true,
          data: sanitizedItems,
        }),
      };
    }
  } catch (err) {
    console.error("ERROR:", err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Internal server error",
        error: err.message,
      }),
    };
  }
};
