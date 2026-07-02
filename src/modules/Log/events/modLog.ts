import type { Guild, User } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import { LogService } from '../services/logService.js';

export async function modLogAction(
  guild: Guild,
  action: string,
  target: User,
  moderator: User,
  reason?: string,
  duration?: string,
) {
  const dur = duration || 'Kalici';
  const reasonText = reason || 'Belirtilmemis';

  await LogService.sendLog(guild, 'modAction', {
    target,
    moderator,
    reason: reasonText,
    changes: { islem: action, sure: dur },
  });

  const embed = LogService.createLogEmbed('modAction', {
    target,
    moderator,
    reason: reasonText,
    description: `${target.toString()} uyesine ${action} islemi uygulandi.`,
    changes: `Sure: ${dur}`,
  });

  await LogService.sendToChannel(guild, embed, 'modAction');
}
