import type { Role, GuildChannel } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import { LogService } from '../services/logService.js';

export async function roleCreate(client: Client, role: Role) {
  if (!role.guild) return;

  const permissions = role.permissions.toArray().join(', ') || 'Yok';

  await LogService.sendLog(role.guild, 'roleCreate', {
    reason: `Rol oluşturuldu: ${role.name}`,
    changes: { renk: role.hexColor, izinler: permissions, ayrı_gösterim: role.hoist },
  });

  const embed = LogService.createLogEmbed('roleCreate', {
    target: role.guild.ownerId ? { id: role.guild.ownerId, tag: role.name, displayAvatarURL: () => '' } as any : undefined,
    changes: `🎨 Rol: ${role.toString()}\n🏷 Renk: ${role.hexColor}\n🔒 İzinler: ${permissions}`,
  });

  await LogService.sendToChannel(role.guild, embed);
}

export async function roleDelete(client: Client, role: Role) {
  if (!role.guild) return;

  await LogService.sendLog(role.guild, 'roleDelete', {
    reason: `Rol silindi: ${role.name}`,
    changes: { id: role.id, renk: role.hexColor },
  });

  const embed = LogService.createLogEmbed('roleDelete', {
    changes: `🗑 Silinen rol: **${role.name}**\n🆔 ${role.id}`,
  });

  await LogService.sendToChannel(role.guild, embed);
}
