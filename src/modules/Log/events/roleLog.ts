import type { Role } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import { LogService } from '../services/logService.js';

export async function roleCreate(client: Client, role: Role) {
  if (!role.guild) return;

  const permissions = role.permissions.toArray().join(', ') || 'Yok';

  await LogService.sendLog(role.guild, 'roleCreate', {
    reason: `Rol olusturuldu: ${role.name}`,
    changes: { renk: role.hexColor, izinler: permissions, ayri_gosterim: role.hoist },
  });

  const embed = LogService.createLogEmbed('roleCreate', {
    description: `${role.toString()} rolu olusturuldu.`,
    changes: [
      `Renk: ${role.hexColor}`,
      `Ayri gosterim: ${role.hoist ? 'Evet' : 'Hayir'}`,
    ].join('\n'),
  });

  await LogService.sendToChannel(role.guild, embed, 'roleCreate');
}

export async function roleDelete(client: Client, role: Role) {
  if (!role.guild) return;

  await LogService.sendLog(role.guild, 'roleDelete', {
    reason: `Rol silindi: ${role.name}`,
    changes: { id: role.id, renk: role.hexColor },
  });

  const embed = LogService.createLogEmbed('roleDelete', {
    description: `${role.name} rolu silindi.`,
    changes: [
      `ID: ${role.id}`,
      `Renk: ${role.hexColor}`,
    ].join('\n'),
  });

  await LogService.sendToChannel(role.guild, embed, 'roleDelete');
}
