import type { GuildChannel } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import { LogService } from '../services/logService.js';

export async function channelCreate(client: Client, channel: GuildChannel) {
  if (!channel.guild) return;

  await LogService.sendLog(channel.guild, 'channelCreate', {
    reason: `Kanal oluşturuldu: ${channel.name}`,
    changes: { tür: channel.type, kategori: channel.parent?.name || 'Yok' },
  });

  const embed = LogService.createLogEmbed('channelCreate', {
    changes: `📢 Kanal: ${channel.toString()}\n📁 Kategori: ${channel.parent?.name || 'Yok'}`,
  });

  await LogService.sendToChannel(channel.guild, embed);
}

export async function channelDelete(client: Client, channel: GuildChannel) {
  if (!channel.guild) return;

  await LogService.sendLog(channel.guild, 'channelDelete', {
    reason: `Kanal silindi: ${channel.name}`,
    changes: { id: channel.id, tür: channel.type },
  });

  const embed = LogService.createLogEmbed('channelDelete', {
    changes: `🗑 Silinen kanal: **${channel.name}**\n🆔 ${channel.id}`,
  });

  await LogService.sendToChannel(channel.guild, embed);
}
