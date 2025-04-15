import { fetchGoogleSheetData } from './fetchGoogleSheets.mjs';
import { insertOrUpdateEmployee } from './storeInDynamoDB.mjs';

export async function handler(event) {
    console.log("📩 Received Event:", JSON.stringify(event, null, 2)); // Log entire event
    const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:5500'];
    const origin = event.headers.origin || event.headers.Origin;

    const headers = {
        'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : '',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    };
    try {

        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ message: 'CORS preflight successful' }),
            };
        }
    
    
        if (event.httpMethod === 'GET') {
            const data = await fetchGoogleSheetData(); // Your custom function
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, data }),
            };
        }
    
        if (event.httpMethod === 'POST') {
            console.log("✅ Handling POST request");
            const data = await fetchGoogleSheetData();
            
            if (!data || data.length === 0) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ success: false, message: "No data found in Google Sheets" }),
                };
            }

            const insertPromises = data.map(insertOrUpdateEmployee);
            await Promise.all(insertPromises);
            console.log("🚀 Starting batch insert into DynamoDB");
            console.log("✅ Batch insert completed");

            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, message: "Data inserted/updated successfully in DynamoDB" }),
            };
        }

        console.log("❌ Unsupported HTTP Method:", event.httpMethod);
        return {
            statusCode: 400,
            body: JSON.stringify({ success: false, message: "Invalid HTTP method" }),
        };
        
    } catch (error) {
        console.error("❌ Error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: error.message }),
        };
    }
}
