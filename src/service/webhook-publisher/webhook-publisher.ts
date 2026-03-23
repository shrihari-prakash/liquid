import { Logger } from "../../singleton/logger.js";
const log = Logger.getLogger().child({ from: "webhook-publisher" });

import { Configuration } from "../../singleton/configuration.js";
import crypto from "crypto";

export default class WebhookPublisher {
  url: string;
  secret: string;
  canUseWebhookPusher: boolean | undefined;

  constructor() {
    this.url = Configuration.get("pusher.webhook.url") as string;
    this.secret = Configuration.get("pusher.webhook.secret") as string;
    this.canUseWebhookPusher = Configuration.get("privilege.can-use-webhook-pusher");
    this.connect();
  }

  async connect() {
    if (!this.canUseWebhookPusher) return log.info("Usage of Webhook Pusher is disabled.");
    
    if (!this.url || !this.secret) {
      log.warn("Webhook Pusher is enabled but url or secret is missing. Events will not be successfully pushed.");
    } else {
      log.info("Webhook Publisher initialized.");
    }
  }

  async publish(data: any) {
    if (!this.canUseWebhookPusher) return;

    if (!this.url || !this.secret) {
      log.error("Webhook pusher requires URL and Secret to be configured.");
      return;
    }

    const payloadString = JSON.stringify(data);
    const signature = crypto.createHmac("sha256", this.secret).update(payloadString).digest("hex");

    const maxRetries = 3;
    let attempt = 0;

    while (attempt <= maxRetries) {
      const abortController = new AbortController();
      const timeout = (Configuration.get("webhook.timeout") as number) || 5000;
      const timeoutId = setTimeout(() => abortController.abort(), timeout);

      try {
        const response = await fetch(this.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Webhook-Signature": signature,
          },
          body: payloadString,
          signal: abortController.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Webhook pusher received non-ok response: ${response.status} ${response.statusText}`);
        } else {
          log.debug("Published event to Webhook. %o", data);
          return;
        }
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (attempt >= maxRetries) {
          log.error("Failed to publish event via Webhook after %d retries.", maxRetries);
          log.error(error);
          return;
        }

        const delay = Math.pow(2, attempt) * 1000;
        log.warn("Error publishing event via Webhook, retrying in %dms... (Attempt %d/%d)", delay, attempt + 1, maxRetries);
        log.warn(error);
        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      }
    }
  }
}
