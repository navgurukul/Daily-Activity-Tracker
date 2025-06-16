// index.mjs
import { handleGet } from "./handlers/getHandler.mjs";
import { handlePost } from "./handlers/postHandler.mjs";
import { handlePut } from "./handlers/putHandler.mjs"; // 👈 
import { buildResponse } from "./utils/responseBuilder.mjs";

export const handler = async (event) => {
  const origin = event.headers.origin || event.headers.Origin || event.headers.ORIGIN;

  if (event.httpMethod === 'OPTIONS') {
    return buildResponse(200, { message: 'CORS preflight successful' }, origin);
  }

  try {
    if (event.body) {
      const body = JSON.parse(event.body);
      if (body.stage) {
        return buildResponse(500, { status: true, data: "invalid key" }, origin);
      }
    }

    const stage = event.requestContext.stage;

    if (event.httpMethod === "GET") {
      return await handleGet(event, stage, origin);
    }

    if (event.httpMethod === "POST") {
      return await handlePost(event, stage, origin);
    }
    
    if (event.httpMethod === "PUT") {
      return await handlePut(event, stage, origin);
      // const result = await handlePut(event, stage, origin);
      // return buildResponse(result.statusCode, JSON.parse(result.body), origin);
    }

    return buildResponse(405, { message: "Method Not Allowed" }, origin);
  } catch (error) {
    return buildResponse(500, { message: "Internal Server Error", error: error.message }, origin);
  }
};
