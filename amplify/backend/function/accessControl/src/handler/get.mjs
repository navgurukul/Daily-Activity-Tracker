// import { ddb } from '../db/dynamoClient.mjs';
// import { ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
// import { withCORS } from '../utils/cors.mjs';

// const TABLE_NAME = 'hrmsAccessControler';
// const GSI_NAME = 'email-role-index';

// export const handler = async (event) => {
//   try {
//     const queryParams = event.queryStringParameters || {};
//     const { email, role, limit, lastKey } = queryParams;

//     const parsedLimit = limit ? parseInt(limit) : 10;

//     const ExclusiveStartKey = lastKey
//       ? JSON.parse(Buffer.from(lastKey, 'base64').toString())
//       : undefined;

//     // Case 1: No filter – full scan with pagination
//     if (!email && !role) {
//       const data = await ddb.send(new ScanCommand({
//         TableName: TABLE_NAME,
//         Limit: parsedLimit,
//         ExclusiveStartKey,
//       }));

//       return withCORS({
//         statusCode: 200,
//         body: JSON.stringify({
//           items: data.Items,
//           nextPageToken: data.LastEvaluatedKey
//             ? Buffer.from(JSON.stringify(data.LastEvaluatedKey)).toString('base64')
//             : null,
//         }),
//       });
//     }

//     // Case 2: Filter by email (and optionally role)
//     if (email) {
//       let KeyConditionExpression = 'email = :email';
//       const ExpressionAttributeValues = { ':email': email };
//       const ExpressionAttributeNames = {};

//       if (role) {
//         KeyConditionExpression += ' AND #role = :role';
//         ExpressionAttributeValues[':role'] = role;
//         ExpressionAttributeNames['#role'] = 'role'; // Reserved keyword handling
//       }

//       const queryParams = {
//         TableName: TABLE_NAME,
//         IndexName: GSI_NAME,
//         KeyConditionExpression,
//         ExpressionAttributeValues,
//         Limit: parsedLimit,
//         ExclusiveStartKey,
//       };

//       if (role) queryParams.ExpressionAttributeNames = ExpressionAttributeNames;

//       const data = await ddb.send(new QueryCommand(queryParams));

//       return withCORS({
//         statusCode: 200,
//         body: JSON.stringify({
//           items: data.Items,
//           nextPageToken: data.LastEvaluatedKey
//             ? Buffer.from(JSON.stringify(data.LastEvaluatedKey)).toString('base64')
//             : null,
//         }),
//       });
//     }

//     // Case 3: Only role is filtered – fallback to Scan with filter
//     const data = await ddb.send(new ScanCommand({
//       TableName: TABLE_NAME,
//       Limit: parsedLimit,
//       FilterExpression: '#role = :role',
//       ExpressionAttributeNames: { '#role': 'role' },
//       ExpressionAttributeValues: { ':role': role },
//       ExclusiveStartKey,
//     }));

//     return withCORS({
//       statusCode: 200,
//       body: JSON.stringify({
//         items: data.Items,
//         nextPageToken: data.LastEvaluatedKey
//           ? Buffer.from(JSON.stringify(data.LastEvaluatedKey)).toString('base64')
//           : null,
//       }),
//     });
//   } catch (error) {
//     return withCORS({
//       statusCode: 500,
//       body: JSON.stringify({ message: 'Error fetching data', error: error.message }),
//     });
//   }
// };






import { ddb } from '../db/dynamoClient.mjs';
import { ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { withCORS } from '../utils/cors.mjs';

const TABLE_NAME = 'hrmsAccessControler';
const GSI_NAME = 'email-role-index';

export const handler = async (event) => {
  try {
    const queryParams = event.queryStringParameters || {};
    const { email, role, limit, page = '1' } = queryParams;

    const parsedLimit = parseInt(limit) || 10;
    const parsedPage = parseInt(page);

    // Helper function to paginate
    const paginate = async (baseCommand, CommandClass, startKey = undefined, steps = 1) => {
      let lastEvaluatedKey = startKey;
      let data;
    
      for (let i = 0; i < steps; i++) {
        const command = new CommandClass({
          ...baseCommand.input,
          ExclusiveStartKey: lastEvaluatedKey,
        });
        data = await ddb.send(command);
        lastEvaluatedKey = data.LastEvaluatedKey;
    
        if (!lastEvaluatedKey) break;
      }
    
      return { items: data.Items, nextPageToken: lastEvaluatedKey };
    };
    let command;
    if (email) {
      // Use Query
      let KeyConditionExpression = 'email = :email';
      const ExpressionAttributeValues = { ':email': email };
      const ExpressionAttributeNames = {};

      if (role) {
        KeyConditionExpression += ' AND #role = :role';
        ExpressionAttributeValues[':role'] = role;
        ExpressionAttributeNames['#role'] = 'role';
      }

      command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: GSI_NAME,
        KeyConditionExpression,
        ExpressionAttributeValues,
        ExpressionAttributeNames: role ? ExpressionAttributeNames : undefined,
        Limit: parsedLimit,
      });
    } else if (role) {
      // Use Scan with role filter
      command = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: '#role = :role',
        ExpressionAttributeNames: { '#role': 'role' },
        ExpressionAttributeValues: { ':role': role },
        Limit: parsedLimit,
      });
    } else {
      // Full Scan
      command = new ScanCommand({
        TableName: TABLE_NAME,
        Limit: parsedLimit,
      });
    }

    // const { items, nextPageToken } = await paginate(command, undefined, parsedPage);
    const { items, nextPageToken } = await paginate(command, command.constructor, undefined, parsedPage);


    return withCORS({
      statusCode: 200,
      body: JSON.stringify({
        items,
        nextPage: nextPageToken ? parsedPage + 1 : null,
        nextPageToken: nextPageToken
          ? Buffer.from(JSON.stringify(nextPageToken)).toString('base64')
          : null,
      }),
    });
  } catch (error) {
    return withCORS({
      statusCode: 500,
      body: JSON.stringify({ message: 'Error fetching data', error: error.message }),
    });
  }
};
