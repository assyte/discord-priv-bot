import type { GuildMember } from 'discord.js';
import type { Client } from '../../../client/Client.js';

const JOIN_ROLE_NAME = 'Kayitsiz';

export async function guildMemberAdd(client: Client, member: GuildMember) {
  if (!member.guild || member.user.bot) return;

  const kayitsiz = member.guild.roles.cache.find(r => r.name === JOIN_ROLE_NAME);
  if (kayitsiz) {
    await member.roles.add(kayitsiz, 'Yeni uye').catch(() => {});
  }
}

