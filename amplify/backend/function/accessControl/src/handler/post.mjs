import { ddb } from '../db/dynamoClient.mjs';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const allowedRoles = ["superAdmin", "admin", "projectManager", "FinanceTeam"];
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

export const handler = async (event) => {
  try {
    // 1. Extract token from header
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    const requesterEmail = extractEmailFromGoogleToken(authHeader);

    if (!requesterEmail) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: 'Unauthorized: Invalid or missing token' }),
      };
    }

    // 2. Check requester's roles from DB
    const requesterData = await ddb.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: GSI_NAME,
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': requesterEmail },
    }));

    const requesterRoles = new Set((requesterData.Items || []).map(item => item.role));

    if (requesterRoles.size === 0) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: 'Unauthorized: You have no access to assign roles' }),
      };
    }

    const isSuperAdmin = requesterRoles.has('superAdmin');
    const isAdmin = requesterRoles.has('admin');

    // 3. Get request body
    const body = JSON.parse(event.body);
    const { email: targetEmail, roles } = body;

    if (!targetEmail || !Array.isArray(roles)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid input. Provide target email and roles array.' }),
      };
    }

    // 4. Validate roles based on permissions
    const validRoles = roles.filter(role => allowedRoles.includes(role));
    const unauthorizedRoles = validRoles.filter(role =>
      (!isSuperAdmin && role === 'superAdmin') || (!isAdmin && !isSuperAdmin)
    );

    if (!isSuperAdmin && !isAdmin) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: 'You do not have permission to assign roles.' }),
      };
    }

    if (unauthorizedRoles.length > 0) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: `You cannot assign these roles: ${unauthorizedRoles.join(', ')}` }),
      };
    }

    // 5. Check existing roles of target email
    const existingItems = await ddb.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: GSI_NAME,
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': targetEmail },
    }));

    const existingRoles = new Set((existingItems.Items || []).map(item => item.role));

    const newItems = validRoles
      .filter(role => !existingRoles.has(role))
      .map(role => ({
        Id: uuidv4(),
        email: targetEmail,
        role,
      }));

    for (const item of newItems) {
      await ddb.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      }));
    }

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'Roles assigned successfully',
        addedCount: newItems.length,
        items: newItems,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error processing request', error: error.message }),
    };
  }
};
