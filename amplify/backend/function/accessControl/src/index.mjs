import { handler as getHandler } from './handler/get.mjs';
import { handler as postHandler } from './handler/post.mjs';
import { handler as DeleteHandler } from './handler/delete.mjs';
import { withCORS } from './utils/cors.mjs';

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */
export const handler = async (event) => {
  console.log(`EVENT: ${JSON.stringify(event)}`);
  const method = event.httpMethod;

  let response;

  switch (method) {
    case 'GET':
      response = await getHandler(event);
      break;
    case 'POST':
      response = await postHandler(event);
      break;
    case 'DELETE':
      response = await DeleteHandler(event);
      break;
    default:
      response = {
        statusCode: 405,
        body: JSON.stringify({ message: 'Method Not Allowed' }),
      };
  }

  return withCORS(response);
};
