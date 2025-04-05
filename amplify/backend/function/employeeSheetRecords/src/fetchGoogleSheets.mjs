// This script fetches data from a Google Sheet using the Google Sheets API.
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

console.log("✅ Starting script...");

const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
if (!privateKey || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.Sheet_ID_TeamDetails) {
    console.error("❌ Missing environment variables.");
    process.exit(1);
}

const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SHEET_ID = process.env.Sheet_ID_TeamDetails;

async function fetchGoogleSheetData() {
    try {
        console.log("🔍 Connecting to Google Sheets...");
        const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
        await doc.loadInfo();
        console.log("📄 Sheet title:", doc.title);

        const sheet = doc.sheetsByTitle["Team Details"];
        if (!sheet) {
            console.error("❌ 'Team Details' sheet not found!");
            return;
        }
        
        console.log("📊 Sheet name:", sheet.title);

        const rows = await sheet.getRows();
        if (rows.length === 0) {
            console.warn("⚠️ No data found in the sheet.");
            return [];
        }

        // ✅ Print headers detected from API
        console.log("📝 Detected Headers:", sheet.headerValues);

        // ✅ Print first row keys (to see how Google API returns them)
        console.log("🧐 Google Sheets Keys:", Object.keys(rows[0]));

        const data = rows.map(row => {
            let rowData = {};
            sheet.headerValues.forEach((header, index) => {
                rowData[header] = row._rawData[index]?.trim() || "N/A"; // Use index-based mapping
            });
            return rowData;
        });

        console.log('📌 Fetched data:', JSON.stringify(data, null, 2));
        return data;
    } catch (error) {
        console.error('❌ Error fetching Google Sheet data:', error);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    fetchGoogleSheetData();
}

export { fetchGoogleSheetData };
