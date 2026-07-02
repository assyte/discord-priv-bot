import type { Client } from '../../../client/Client.js';

const PANEL_CHANNEL_ID = '1521954113582268482';

export async function ready(client: Client) {
  for (const [, guild] of client.client.guilds.cache) {
    const panel = guild.channels.cache.get(PANEL_CHANNEL_ID);
    if (panel?.parentId) {
      const { scanExistingChannels } = await import('../utils/odaManager.js');
      scanExistingChannels(guild, panel.parentId);
    }
  }
}
