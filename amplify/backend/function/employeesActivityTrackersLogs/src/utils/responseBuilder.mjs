// utils/responseBuilder.mjs
const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:5500', "https://amplify-backend-activitytracker.d1bx7f0aurfjs9.amplifyapp.com/"];

export function buildResponse(statusCode, body, origin) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Credentials': 'true',
    },
    body: JSON.stringify(body),
  };
}
