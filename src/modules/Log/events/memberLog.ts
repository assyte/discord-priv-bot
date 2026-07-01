import type { GuildMember, PartialGuildMember, User } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import { LogService } from '../services/logService.js';
import { formatDate } from '../../../utils/formatters.js';

export async function guildMemberAdd(client: Client, member: GuildMember) {
  if (!member.guild) return;

  const accountAge = Date.now() - member.user.createdTimestamp;
  const daysAgo = Math.floor(accountAge / 86400000);
  const isNewAccount = daysAgo < 7;

  await LogService.sendLog(member.guild, 'memberJoin', {
    target: member.user,
    changes: {
      hesap_yaşı: `${daysAgo} gün`,
      şüpheli: isNewAccount ? 'Evet' : 'Hayır',
    },
  });

  const embed = LogService.createLogEmbed('memberJoin', {
    target: member.user,
    changes: `📅 Hesap yaşı: ${daysAgo} gün${isNewAccount ? ' ⚠️ (yeni hesap)' : ''}\n🆔 ${member.id}`,
  });

  await LogService.sendToChannel(member.guild, embed);
}

export async function guildMemberRemove(client: Client, member: GuildMember | PartialGuildMember) {
  if (!member.guild || !member.user) return;

  const roles = member.roles?.cache.filter(r => r.name !== '@everyone').map(r => r.name).join(', ') || 'Yok';

  await LogService.sendLog(member.guild, 'memberLeave', {
    target: member.user,
    changes: { roller: roles, katılma: member.joinedAt ? formatDate(member.joinedAt) : 'Bilinmiyor' },
  });

  const embed = LogService.createLogEmbed('memberLeave', {
    target: member.user,
    changes: `📋 Roller: ${roles}\n📅 Katılma: ${member.joinedAt ? formatDate(member.joinedAt) : 'Bilinmiyor'}`,
  });

  await LogService.sendToChannel(member.guild, embed);
}

export async function guildBanAdd(client: Client, ban: { guild: { id: string }; user: User; reason?: string | null }) {
  if (!ban.guild) return;

  await LogService.sendLog(ban.guild as any, 'memberBan', {
    target: ban.user,
    reason: ban.reason || 'Sebep belirtilmemiş',
  });

  const embed = LogService.createLogEmbed('memberBan', {
    target: ban.user,
    reason: ban.reason || 'Sebep belirtilmemiş',
  });

  await LogService.sendToChannel(ban.guild as any, embed);
}
