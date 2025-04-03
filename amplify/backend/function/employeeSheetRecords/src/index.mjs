
import { fetchGoogleSheetData } from './fetchGoogleSheet.mjs';

export async function handler(event) {
    try {
        const data = await fetchGoogleSheetData();
        return {
            statusCode: 200,
            body: JSON.stringify({ success: true, data }),
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: error.message }),
        };
    }
}
