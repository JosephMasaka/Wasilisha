import { Queue } from "bullmq";
import Redis from "ioredis";

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export const messageQueue = new Queue("messages", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: {
      count: 100,
      age: 24 * 3600,
    },
    removeOnFail: {
      age: 7 * 24 * 3600,
    },
  },
});

export interface MessageJobData {
  messageId: string;
  campaignId: string;
  companyId: string;
  contactId: string;
  channel: "sms" | "email" | "whatsapp";
  to: string;
  content: string;
  costKes: number;
}
