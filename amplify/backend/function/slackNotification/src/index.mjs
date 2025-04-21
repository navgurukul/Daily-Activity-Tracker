import { sendDailyProjectLogs } from './sendProjectLogsToSlack.mjs';

export const handler = async (event) => {
  try {
    console.log("⏳ Starting daily log sending process...");
    await sendDailyProjectLogs();
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "✅ Logs sent successfully!" }),
    };
  } catch (error) {
    console.error("❌ Error in Lambda handler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "❌ Failed to send logs", error: error.message }),
    };
  }
};
