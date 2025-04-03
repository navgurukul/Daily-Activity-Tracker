import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

console.log("✅ Starting script...");

// Ensure newlines are properly formatted in the private key
const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!privateKey || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.SHEET_ID) {
    console.error("❌ Missing environment variables.");
    process.exit(1);
}

// Google Auth
const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Google Sheet ID
const SHEET_ID = process.env.SHEET_ID;

async function fetchGoogleSheetData() {
    try {
        console.log("🔍 Connecting to Google Sheets...");
        const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
        await doc.loadInfo(); // Load spreadsheet details
        console.log("📄 Sheet title:", doc.title);

        const sheet = doc.sheetsByIndex[0]; // First sheet
        console.log("📊 Sheet name:", sheet.title);

        const rows = await sheet.getRows(); // Get all rows
        console.log("✅ Number of rows fetched:", rows.length);

        // Extract necessary data
        const data = rows.map(row => ({
            email: row._rawData[0] ? row._rawData[0].trim() : "No Email",
            userId: row._rawData[1] ? row._rawData[1].toString().trim() : "No UserID",
            name: row._rawData[2] ? row._rawData[2].trim() : "No Name"
        }));

        console.log('📌 Fetched data:', JSON.stringify(data, null, 2));
        return data;
    } catch (error) {
        console.error('❌ Error fetching Google Sheet data:', error);
    }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    fetchGoogleSheetData();
}

// ✅ Export the function properly
export { fetchGoogleSheetData };