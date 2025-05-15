import { ddb } from '../db/dynamoClient.mjs';
import {
  QueryCommand,
  DeleteItemCommand,
  BatchWriteItemCommand,
  GetItemCommand,
} from '@aws-sdk/client-dynamodb';
import { withCORS } from '../utils/cors.mjs';

const TABLE_NAME = 'hrmsAccessControler';
const GSI_NAME = 'email-role-index';

function extractEmailFromGoogleToken(authHeader) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  const base64Payload = token.split('.')[1];
  try {
    const decoded = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf8'));
    return decoded.email || null;
  } catch {
    return null;
  }
}

function canDelete(requesterRolesRaw, targetRolesRaw) {
  const requesterRoles = requesterRolesRaw.map(r => r.toLowerCase());
  const targetRoles = targetRolesRaw.map(r => r.toLowerCase());

  if (requesterRoles.includes('superadmin')) return true;
  if (requesterRoles.includes('admin')) {
    return targetRoles.every(role =>
      role === 'admin' || role === 'projectmanager'
    );
  }
  return false; // projectManager or unknown role
}


export const handler = async (event) => {
  try {
    const queryParams = event.queryStringParameters || {};
    const { email, Id } = queryParams;

    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    const requesterEmail = extractEmailFromGoogleToken(authHeader);

    if (!requesterEmail) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: 'Unauthorized: Invalid or missing token' }),
      };
    }

    // Fetch requester roles
    const requesterRes = await ddb.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: GSI_NAME,
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': { S: requesterEmail },
      },
    }));

    const requesterRoles = (requesterRes.Items || []).map(item => item.role?.S).filter(Boolean);

    if (requesterRoles.length === 0) {
      return withCORS({
        statusCode: 403,
        body: JSON.stringify({ message: 'Access denied: No role assigned to your email' }),
      });
    }

    if (!email && !Id) {
      return withCORS({
        statusCode: 400,
        body: JSON.stringify({ message: 'Either email or Id must be provided' }),
      });
    }

    // ✅ CASE 1: Delete by Id
    if (Id) {
      const recordRes = await ddb.send(new GetItemCommand({
        TableName: TABLE_NAME,
        Key: { Id: { S: Id } },
      }));

      const targetRole = recordRes.Item?.role?.S || null;
      const targetEmail = recordRes.Item?.email?.S || null;

      if (!targetRole || !targetEmail) {
        return withCORS({
          statusCode: 404,
          body: JSON.stringify({ message: `Record with Id ${Id} not found` }),
        });
      }

      if (!canDelete(requesterRoles, [targetRole])) {
        return withCORS({
          statusCode: 403,
          body: JSON.stringify({ message: `Access denied: You can't delete a user with role '${targetRole}'` }),
        });
      }

      await ddb.send(new DeleteItemCommand({
        TableName: TABLE_NAME,
        Key: { Id: { S: Id } },
      }));

      return withCORS({
        statusCode: 200,
        body: JSON.stringify({ message: `Deleted access with Id ${Id}` }),
      });
    }

    // ✅ CASE 2: Delete by Email (could be multiple roles)
    const targetRes = await ddb.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: GSI_NAME,
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': { S: email },
      },
    }));

    const items = targetRes.Items || [];
    const targetRoles = items.map(item => item.role?.S).filter(Boolean);

    if (items.length === 0) {
      return withCORS({
        statusCode: 404,
        body: JSON.stringify({ message: `No access entries found for ${email}` }),
      });
    }

    if (!canDelete(requesterRoles, targetRoles)) {
      return withCORS({
        statusCode: 403,
        body: JSON.stringify({ message: `Access denied: You can't delete user(s) with roles: ${targetRoles.join(', ')}` }),
      });
    }

    const deleteRequests = items.map(item => ({
      DeleteRequest: {
        Key: { Id: item.Id },
      },
    }));

    const batches = [];
    while (deleteRequests.length) {
      batches.push(deleteRequests.splice(0, 25));
    }

    for (const batch of batches) {
      await ddb.send(new BatchWriteItemCommand({
        RequestItems: { [TABLE_NAME]: batch },
      }));
    }

    return withCORS({
      statusCode: 200,
      body: JSON.stringify({ message: `Deleted all access entries for ${email}` }),
    });

  } catch (error) {
    return withCORS({
      statusCode: 500,
      body: JSON.stringify({ message: 'Error deleting access', error: error.message }),
    });
  }
};
