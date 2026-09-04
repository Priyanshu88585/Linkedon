import { Queue } from "bullmq";
import { config } from "../config";

// Shared Redis connection for BullMQ
const connection = {
  host: new URL(config.redisUrl).hostname,
  port: parseInt(new URL(config.redisUrl).port ?? "6379", 10),
};

export const enrichmentQueue = new Queue("enrichment", { connection });
export const csvImportQueue = new Queue("csv-import", { connection });
export const csvExportQueue = new Queue("csv-export", { connection });
export const emailQueue = new Queue("emails", { connection });
export const notificationQueue = new Queue("notifications", { connection });
