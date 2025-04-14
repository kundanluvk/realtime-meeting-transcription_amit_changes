import { MeetingBaasClient } from "./meetingbaas";
import { TranscriptionProxy } from "./proxy";
import { createLogger } from "./utils";

const logger = createLogger("Main");

// Keep references to all our clients for cleanup
let meetingBaasClient: MeetingBaasClient | null = null;
let proxy: TranscriptionProxy | null = null;

// Graceful shutdown handler
function setupGracefulShutdown() {
  process.on("SIGINT", async () => {
    logger.info("Shutting down gracefully...");

    // Disconnect from MeetingBaas (remove the bot from the meeting)
    if (meetingBaasClient) {
      logger.info("Telling bot to leave the meeting...");
      meetingBaasClient.disconnect();
    }

    // Close Gladia connections (via proxy)
    if (proxy) {
      logger.info("Closing transcription services...");
      await proxy.shutdown();
    }

    logger.info("Cleanup complete, exiting...");
    process.exit(0);
  });
}

async function main() {
  try {
    logger.info("Starting transcription system...");
    const args = process.argv.slice(2);
    // Create instances
    const mode = args[3];
    if (mode === "proxy-only") {
      proxy = new TranscriptionProxy();
      
      return;
    }
    meetingBaasClient = new MeetingBaasClient();

    // Setup graceful shutdown
    setupGracefulShutdown();

    const meetingUrl = args[0] || "https://meet.google.com/your-meeting-id";
    const botName = args[1] || "Transcription Bot";
    const webhookUrl = args[2] || ""; // Your proxy URL

    // Connect the bot to the meeting
    const connected = await meetingBaasClient.connect(
      meetingUrl,
      botName,
      webhookUrl
    );

    if (!connected) {
      logger.error("Failed to connect to meeting");
      process.exit(1);
    }

    logger.info("System initialized successfully");
  } catch (error) {
    logger.error("Error initializing system:", error);
    process.exit(1);
  }
}

main();