import axios from "axios";
import WebSocket from "ws";
import { apiKeys, apiUrls } from "./config";
import { createLogger } from "./utils";

const logger = createLogger("MeetingBaas");

interface MeetingBaasResponse {
  bot_id: string;
  status?: string;
  message?: string;
}

class MeetingBaasClient {
  private apiUrl: string;
  private apiKey: string;
  private botId: string | null = null;

  constructor() {
    this.apiUrl = apiUrls.meetingBaas;
    this.apiKey = apiKeys.meetingBaas || "";

    logger.info(`Initialized with API URL: ${this.apiUrl}`);
  }

  /**
   * Connect to a meeting via MeetingBaas
   * @param meetingUrl URL of the meeting to join
   * @param botName Name of the bot
   * @param webhookUrl URL where MeetingBaas will send events and audio streams
   * @returns Promise that resolves when connected
   */
  async connect(
    meetingUrl: string,
    botName: string,
    webhookUrl?: string
  ): Promise<boolean> {
    try {
      logger.info(`Connecting to meeting: ${meetingUrl}`);

      // Step 1: Register bot with MeetingBaas
      const response = await axios.post(
        `${this.apiUrl}/bots`,
        {
          bot_name: botName,
          meeting_url: meetingUrl,
          reserved: false,
          deduplication_key: botName,
          webhook_url: webhookUrl,
          streaming: {
            output: webhookUrl,
          },
        },
        {
          headers: {
            "x-meeting-baas-api-key": this.apiKey,
            "Content-Type": "application/json",
          },
        }
      );

      logger.info(`API Response: ${JSON.stringify(response.data)}`);

      const data = response.data as MeetingBaasResponse;
      if (!data.bot_id) {
        logger.error("No bot_id in response");
        return false;
      }

      this.botId = data.bot_id;
      logger.info(`Bot created with ID: ${this.botId}`);

      // Step 2: Notify proxy via WebSocket with meetingUrl in query string
      const meetingUrlEncoded = encodeURIComponent(meetingUrl);
      const ws = new WebSocket(`ws://localhost:4000?client=meetingbaas&meetingUrl=${meetingUrlEncoded}`);

      ws.on("open", () => {
        logger.info(`🛰️ Proxy WebSocket opened with meeting URL: ${meetingUrl}`);
        
        // Optional: close after short delay since we're not streaming audio
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            //ws.close();
            logger.info("🛑 Proxy registration WebSocket closed.");
          }
        }, 1000);
      });

      ws.on("error", (err) => {
        logger.warn("Proxy WebSocket connection failed:", err.message);
      });

      return true;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        logger.error(
          `API Error: ${error.response.status} - ${JSON.stringify(
            error.response.data
          )}`
        );
      } else {
        logger.error("Error connecting to meeting:", error);
      }
      return false;
    }
  }

  public disconnect() {
    if (this.botId) {
      axios
        .delete(`${this.apiUrl}/bots/${this.botId}`, {
          headers: {
            "x-meeting-baas-api-key": this.apiKey,
          },
        })
        .then(() => {
          logger.info(`Bot ${this.botId} successfully removed`);
        })
        .catch((error) => {
          logger.error("Error removing bot:", error);
        });

      this.botId = null;
    }
  }
}

export { MeetingBaasClient };
