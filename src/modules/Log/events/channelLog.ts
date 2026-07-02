import type { GuildChannel } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import { LogService } from '../services/logService.js';

export async function channelCreate(client: Client, channel: GuildChannel) {
  if (!channel.guild) return;

  const parentName = channel.parent?.name || 'Yok';
  const channelType = channel.type === 0 ? 'Metin' : channel.type === 2 ? 'Ses' : 'Dig er';

  await LogService.sendLog(channel.guild, 'channelCreate', {
    reason: `Kanal olusturuldu: ${channel.name}`,
    changes: { tur: channelType, kategori: parentName },
  });

  const embed = LogService.createLogEmbed('channelCreate', {
    description: `${channel.toString()} kanali olusturuldu.`,
    changes: [
      `Kategori: ${parentName}`,
      `Tur: ${channelType}`,
    ].join('\n'),
  });

  await LogService.sendToChannel(channel.guild, embed, 'channelCreate');
}

export async function channelDelete(client: Client, channel: GuildChannel) {
  if (!channel.guild) return;

  await LogService.sendLog(channel.guild, 'channelDelete', {
    reason: `Kanal silindi: ${channel.name}`,
    changes: { id: channel.id, tur: channel.type },
  });

  const embed = LogService.createLogEmbed('channelDelete', {
    description: `${channel.name} kanali silindi.`,
    changes: [
      `ID: ${channel.id}`,
      `Tur: ${channel.type === 0 ? 'Metin' : channel.type === 2 ? 'Ses' : 'Diger'}`,
    ].join('\n'),
  });

  await LogService.sendToChannel(channel.guild, embed, 'channelDelete');
}
