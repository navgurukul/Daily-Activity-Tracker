import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
} from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB client
const client = new DynamoDBClient({ region: "ap-south-1" });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.Project_Table || "ProjectMaster";

import {
  handler as getProjects
} from './handler/getProjects.mjs';

import {
  handler as createProject
} from './handler/createProjects.mjs';

import {
  handler as updateProject
} from './handler/updateProjects.mjs';

import {
  handler as deleteProject
} from './handler/deleteProjects.mjs';

// Define CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE",
};

export const handler = async (event, context) => {
  try {

    const rawPath = event.path || "";
    const method = event.httpMethod;
  
    // Remove stage prefix like "/dev" if present
    const path = rawPath.replace(/^\/dev/, "");
  
    const url = new URL(path + (event.rawQueryString ? "?" + event.rawQueryString : ""), "http://localhost");
    const queryParams = Object.fromEntries(url.searchParams.entries());
  
    console.log("Cleaned path:", path);
    console.log("Query params:", queryParams);
  
    // Handle /employmentLeavePolicy
    if (path === "/employees") {
      if (method === "GET") {
        return await getProjects(event, context);
      }
      else if(method === "POST"){
        return await createProject(event, context);
      }
      else if(method === "PUT"){
        return await updateProject(event, context);
      }
      else if(method === "DELETE"){
        return await deleteProject(event, context);
      }
    }
    // Handle preflight request for CORS
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ status: true, message: "CORS preflight handled" }),
      };
    }

    if (event.body !== null && event.body !== undefined) {
      if (JSON.parse(event.body).stage) {
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ status: true, data: "invalid key" }),
        };
      }
    }

    
  } catch (error) {
    console.error("Error:", error);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        status: false,
        message: "Error processing request",
        error: error.message,
      }),
    };
  }
};


