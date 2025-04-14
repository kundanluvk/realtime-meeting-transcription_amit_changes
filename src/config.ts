import * as dotenv from "dotenv";
import { resolve } from "path";

// Load environment variables from .env file
dotenv.config({ path: resolve(__dirname, "../.env") });

// Bot configuration
export const botConfig = {
  host: process.env.BOT_HOST || "0.0.0.0",
  port: parseInt(process.env.BOT_PORT || "8766"),
  audioParams: {
    sampleRate: 24000,
  },
};

// Proxy configuration
export const proxyConfig = {
  host: process.env.PROXY_HOST || "0.0.0.0",
  port: parseInt(process.env.PROXY_PORT || "4000"),
  botUrl: process.env.BOT_URL || "ws://localhost:8766",
  audioParams: {
    sampleRate: 24000,
    channels: 1,
  },
};

// API keys
export const apiKeys = {
  meetingBaas: process.env.MEETING_BAAS_API_KEY || "98b924ecd22ec6123d9fac12050b58b7a537ac7d911fb9647ad1bacb179b82fa",
  gladia: process.env.GLADIA_API_KEY || "8f43b703-deed-423b-b67e-ef7d6ac8ab07",
};

// API URLs
export const apiUrls = {
  meetingBaas:
    process.env.MEETING_BAAS_API_URL || "https://api.meetingbaas.com",
};

if (!apiKeys.meetingBaas) {
  console.error("MEETING_BAAS_API_KEY is required");
  process.exit(1);
}

if (!apiKeys.gladia) {
  console.error("GLADIA_API_KEY is required");
  process.exit(1);
}