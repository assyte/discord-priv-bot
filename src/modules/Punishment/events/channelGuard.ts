import type { GuildChannel } from 'discord.js';
import type { Client } from '../../../client/Client.js';

const PERM_DENY: Record<string, { permName: string; chTypes: number[] }[]> = {
  Mute: [
    { permName: 'SendMessages', chTypes: [0, 5, 15] },
  ],
  VMute: [
    { permName: 'Speak', chTypes: [2, 13] },
  ],
  Hapis: [],
};

export async function channelCreate(client: Client, channel: GuildChannel) {
  if (!channel.guild || !('permissionOverwrites' in channel)) return;
  if (channel.name === 'hapis') return;

  const guild = channel.guild;

  for (const [roleName, configs] of Object.entries(PERM_DENY)) {
    const role = guild.roles.cache.find(r => r.name === roleName);
    if (!role) continue;

    const matched = configs.find(c => c.chTypes.includes(channel.type));
    if (!matched) continue;

    await channel.permissionOverwrites.create(role, { [matched.permName]: false }).catch(() => {});
  }

  // Hapis role: deny ViewChannel in all new channels
  const hapisRole = guild.roles.cache.find(r => r.name === 'Hapis');
  if (hapisRole) {
    await channel.permissionOverwrites.create(hapisRole, { ViewChannel: false }).catch(() => {});
  }
}
