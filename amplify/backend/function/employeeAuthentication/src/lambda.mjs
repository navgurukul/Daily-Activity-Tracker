// lambda.js
import { verifyToken } from './auth.js';

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
export const handler = async (event) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);

  const authHeader = event.headers?.Authorization || event.headers?.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      body: JSON.stringify({ message: 'Missing or invalid Authorization header' }),
    };
  }

  const token = authHeader.split(' ')[1];
  const { valid, decoded, error } = verifyToken(token);

  if (!valid) {
    return {
      statusCode: 403,
      body: JSON.stringify({ message: 'Invalid token', error }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Token is valid', user: decoded }),
  };
};
