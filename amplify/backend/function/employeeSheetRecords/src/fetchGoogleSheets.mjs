// import { GoogleSpreadsheet } from 'google-spreadsheet';
// import { JWT } from 'google-auth-library';
// import dotenv from 'dotenv';

// dotenv.config();

// const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
// if (!privateKey || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.Sheet_ID_TeamDetails) {
//     console.error("❌ Missing environment variables.");
//     process.exit(1);
// }

// const serviceAccountAuth = new JWT({
//     email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
//     key: privateKey,
//     scopes: ['https://www.googleapis.com/auth/spreadsheets'],
// });

// const SHEET_ID = process.env.Sheet_ID_TeamDetails;

// async function fetchGoogleSheetData(sheetTitle = "PnC data for AT") {
//     try {
//         console.log(`🔍 Connecting to Google Sheet tab: ${sheetTitle}`);
//         const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
//         await doc.loadInfo();

//         const sheet = doc.sheetsByTitle[sheetTitle];
//         if (!sheet) {
//             console.error(`❌ Sheet '${sheetTitle}' not found.`);
//             return [];
//         }

//         const rows = await sheet.getRows();

//         if (rows.length === 0) {
//             console.warn("⚠️ No data found in the sheet.");
//             return [];
//         }

//         const data = rows.map(row => {
//             let rowData = {};
//             sheet.headerValues.forEach((header, index) => {
//                 rowData[header] = row._rawData[index]?.trim() || "N/A";
//             });
//             return rowData;
//         });

//         return data;

//     } catch (error) {
//         console.error("❌ Error fetching Google Sheet data:", error);
//         return [];
//     }
// }

// export { fetchGoogleSheetData };


import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

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

let SHEET_ID = process.env.Sheet_ID_TeamDetails;

async function fetchGoogleSheetData(sheetTitle = "PnC data for AT") {
    try {
        console.log(`🔗 Fetching data from Google Sheet: ${sheetTitle}`);
        if(sheetTitle.trim() === "Sheet1") {
            SHEET_ID = process.env.ProjectManagement_Sheet_ID;
        }
        console.log(`🔍 Connecting to Google Sheet tab: ${sheetTitle}`);
        const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
        await doc.loadInfo();

        const sheet = doc.sheetsByTitle[sheetTitle];
        if (!sheet) {
            console.error(`❌ Sheet '${sheetTitle}' not found.`);
            return [];
        }

        const rows = await sheet.getRows();

        if (rows.length === 0) {
            console.warn("⚠️ No data found in the sheet.");
            return [];
        }

        const data = rows.map(row => {
            let rowData = {};
            sheet.headerValues.forEach((header, index) => {
                rowData[header] = row._rawData[index]?.trim() || "N/A";
            });
            return rowData;
        });

        return data;

    } catch (error) {
        console.error("❌ Error fetching Google Sheet data:", error);
        return [];
    }
}

export { fetchGoogleSheetData };