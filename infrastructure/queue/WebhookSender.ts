/**
 * Webhook Sender
 * Sends HTTP POST notifications to webhook URLs
 */

import axios from 'axios';

interface WebhookPayload {
  taskId: string;
  status: 'COMPLETED' | 'FAILED';
  url: string;
  result?: {
    markdown?: string;
    extractedData?: object;
  };
  error?: string;
  completedAt: string;
}

/**
 * Send webhook notification
 */
export async function sendWebhook(
  webhookUrl: string,
  payload: WebhookPayload
): Promise<void> {
  console.log(`[WebhookSender] Sending webhook to ${webhookUrl}`);

  try {
    const response = await axios.post(webhookUrl, payload, {
      timeout: 10000, // 10 second timeout
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DreamBuilder-Crawl4AI/1.0',
      },
      validateStatus: (status) => status >= 200 && status < 300,
    });

    console.log(`[WebhookSender] Webhook delivered successfully to ${webhookUrl}, status: ${response.status}`);
  } catch (error: any) {
    if (error.response) {
      // Server responded with error status
      throw new Error(
        `Webhook failed with status ${error.response.status}: ${error.response.statusText}`
      );
    } else if (error.request) {
      // Request was made but no response received
      throw new Error(`Webhook failed: No response from ${webhookUrl}`);
    } else {
      // Error setting up the request
      throw new Error(`Webhook failed: ${error.message}`);
    }
  }
}

/**
 * Validate webhook URL format
 */
export function isValidWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}
