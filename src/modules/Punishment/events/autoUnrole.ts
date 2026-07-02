import type { GuildMember, PartialGuildMember } from 'discord.js';
import type { Client } from '../../../client/Client.js';

export async function guildMemberUpdate(client: Client, oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) {
  if (!newMember.guild) return;

  const oldTimeout = oldMember.communicationDisabledUntil;
  const newTimeout = newMember.communicationDisabledUntil;

  const timeoutEnded = oldTimeout && !newTimeout;

  if (!timeoutEnded) return;

  const role = newMember.guild.roles.cache.find(r => r.name === 'Hapis');
  if (role && newMember.roles.cache.has(role.id)) {
    await newMember.roles.remove(role, 'Hapis suresi doldu').catch(() => {});
  }
}
