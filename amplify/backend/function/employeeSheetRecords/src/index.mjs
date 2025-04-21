
import { fetchGoogleSheetData } from './fetchGoogleSheets.mjs';
import { insertOrUpdateEmployee } from './storeInDynamoDB.mjs';

export async function handler(event) {
    console.log("📩 Received Event:", JSON.stringify(event, null, 2));

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

        const queryParams = event.queryStringParameters || {};
        const sheetKey = (queryParams.sheet || '').toLowerCase().trim();

        // Handle GET
        if (event.httpMethod === 'GET') {
            if (sheetKey === 'employmenttypes') {
                const data = await fetchGoogleSheetData("Leave allocations");
                const types = [...new Set(data.map(row => row["Employment Type"]).filter(Boolean))];
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ success: true, employmentTypes: types }),
                };
            }

            if (sheetKey === 'leavetypes') {
                const data = await fetchGoogleSheetData("Leave allocations");
                if (data.length === 0) {
                    return {
                        statusCode: 400,
                        headers,
                        body: JSON.stringify({ success: false, message: "No data available" }),
                    };
                }

                const allHeaders = Object.keys(data[0]);
                const leaveTypes = allHeaders.filter(key => key !== "Employment Type" && key.trim() !== "");
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify({ success: true, leaveTypes }),
                };
            }

            // Sheet mapping for original cases
            const sheetMap = {
                pncdata: "PnC data for AT",
                leaveallocations: "Leave allocations",
            };

            const actualSheetName = sheetMap[sheetKey];
            if (!actualSheetName) {
                return {
                    statusCode: 400,
                    headers,
                    body: JSON.stringify({ success: false, message: "Invalid sheet name" }),
                };
            }

            const data = await fetchGoogleSheetData(actualSheetName);
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ success: true, sheet: actualSheetName, data }),
            };
        }

        // Handle POST
        if (event.httpMethod === 'POST') {
            const data = await fetchGoogleSheetData("PnC data for AT");
            if (!data || data.length === 0) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ success: false, message: "No data found in Google Sheets" }),
                };
            }

            const insertPromises = data.map(insertOrUpdateEmployee);
            await Promise.all(insertPromises);

            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, message: "Data inserted/updated successfully in DynamoDB" }),
            };
        }

        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ success: false, message: "Invalid HTTP method" }),
        };

    } catch (error) {
        console.error("❌ Error:", error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, message: error.message }),
        };
    }
}

