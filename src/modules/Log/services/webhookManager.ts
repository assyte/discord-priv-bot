import { WebhookClient, type MessagePayload, type WebhookMessageCreateOptions } from 'discord.js';
import { Logger } from '../../../utils/logger.js';

const logger = new Logger('WebhookManager');

export class WebhookManager {
  private webhooks: Map<string, WebhookClient> = new Map();

  async getOrCreate(guildId: string, url: string): Promise<WebhookClient | null> {
    const existing = this.webhooks.get(guildId);
    if (existing) return existing;

    try {
      const webhook = new WebhookClient({ url });
      this.webhooks.set(guildId, webhook);
      return webhook;
    } catch (error) {
      logger.error(`Webhook oluşturulamadı (${guildId}):`, error);
      return null;
    }
  }

  async send(guildId: string, url: string, options: string | MessagePayload | WebhookMessageCreateOptions): Promise<void> {
    const webhook = await this.getOrCreate(guildId, url);
    if (!webhook) return;

    try {
      await webhook.send(options);
    } catch (error) {
      logger.error(`Webhook mesajı gönderilemedi (${guildId}):`, error);
    }
  }

  remove(guildId: string): void {
    this.webhooks.delete(guildId);
  }
}
