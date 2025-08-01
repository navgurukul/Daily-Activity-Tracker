import { sendDailyProjectLogs } from './sendProjectLogsToSlack.mjs';
import { sendDailyLeaveLogs } from './sendLeavesToSlack.mjs';
import { sendDiscordLeaveNotification} from "./sendLeavesToDiscord.mjs";
import { handler as sendDiscordNotification } from './discordNotification.mjs';  // ✅ Rename it here

export const handler = async (event) => {
  try {
    // console.log("⏳ Starting daily log sending process...");
    await sendDailyProjectLogs();

    console.log("⏳ Sending leave summary to discord...");
    await sendDiscordLeaveNotification() 

    console.log("⏳ Sending leave summary...");
    await sendDailyLeaveLogs(); 

    console.log("⏳ Sending discord notification...");
    await sendDiscordNotification();
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "✅ Logs and Leaves sent successfully!" }),
    };
  } catch (error) {
    console.error("❌ Error in Lambda handler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "❌ Failed to send logs", error: error.message }),
    };
  }
};
