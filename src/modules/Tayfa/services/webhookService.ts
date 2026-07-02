import { TextChannel, WebhookClient, Webhook } from 'discord.js';

const webhookCache = new Map<string, Webhook>();

export async function getOrCreateWebhook(channel: TextChannel): Promise<WebhookClient> {
  let webhook = webhookCache.get(channel.id);
  
  if (!webhook) {
    const webhooks = await channel.fetchWebhooks();
    webhook = webhooks.find(wh => wh.name === 'Kafadan Tayfa RP' && wh.token !== null);
    
    if (!webhook) {
      webhook = await channel.createWebhook({
        name: 'Kafadan Tayfa RP',
        reason: 'Tayfa roleplay etkileşimleri için webhook'
      });
    }
    
    webhookCache.set(channel.id, webhook);
  }
  
  return new WebhookClient({ id: webhook.id, token: webhook.token! });
}
