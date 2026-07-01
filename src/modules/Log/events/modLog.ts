import type { Guild } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import { LogService } from '../services/logService.js';

export async function modLogAction(
  guild: Guild,
  action: string,
  target: { id: string; tag: string; displayAvatarURL: () => string },
  moderator: { id: string; tag: string },
  reason?: string,
  duration?: string,
) {
  await LogService.sendLog(guild, 'modAction', {
    target: target as any,
    moderator: moderator as any,
    reason: reason || 'Belirtilmemiş',
    changes: { işlem: action, süre: duration || 'Kalıcı' },
  });

  const embed = LogService.createLogEmbed('modAction', {
    target: target as any,
    moderator: moderator as any,
    reason: reason || 'Belirtilmemiş',
    changes: `🔨 İşlem: **${action}**\n⏱ Süre: ${duration || 'Kalıcı'}`,
  });

  await LogService.sendToChannel(guild, embed);
}
