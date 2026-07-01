import type { GuildMember, PartialGuildMember, TextChannel, VoiceChannel } from 'discord.js';
import type { Client } from '../../../client/Client.js';

const joinCache = new Map<string, number[]>();

export async function guildMemberAdd(client: Client, member: GuildMember) {
  const guildId = member.guild.id;
  const now = Date.now();

  const joins = joinCache.get(guildId) || [];
  joins.push(now);

  const recentJoins = joins.filter(t => now - t < 10000);
  joinCache.set(guildId, recentJoins);

  if (recentJoins.length > 10) {
    const everyone = member.guild.roles.everyone;
    await member.guild.channels.cache.forEach(async channel => {
      if (channel.isTextBased?.() && 'permissionOverwrites' in channel) {
        try {
          await (channel as TextChannel | VoiceChannel).permissionOverwrites.edit(everyone, {
            SendMessages: false,
          }).catch(() => {});
        } catch {}
      }
    });

    const owner = await member.guild.fetchOwner().catch(() => null);
    if (owner) {
      await owner.send(`⚠️ **${member.guild.name}** sunucusunda raid tespit edildi! ${recentJoins.length} kullanıcı son 10 saniyede katıldı. Kanal kilitleri aktifleştirildi.`).catch(() => {});
    }

    setTimeout(async () => {
      await member.guild.channels.cache.forEach(async channel => {
        if (channel.isTextBased?.() && 'permissionOverwrites' in channel) {
          try {
            await (channel as TextChannel | VoiceChannel).permissionOverwrites.edit(everyone, {
              SendMessages: null,
            }).catch(() => {});
          } catch {}
        }
      });
    }, 300000);
  }

  if (recentJoins.length > 10) {
    joinCache.set(guildId, []);
  }
}

export async function guildMemberRemove(client: Client, member: GuildMember | PartialGuildMember) {
  if (!member.guild || !member.user) return;

  try {
    const bans = await member.guild.bans.fetch();
    const isBanned = bans.has(member.id);

    if (isBanned) {
      const auditLogs = await member.guild.fetchAuditLogs({
        type: 22,
        limit: 1,
      });

      const banLog = auditLogs.entries.first();
      if (banLog && banLog.target?.id === member.id) {
        const executor = banLog.executor;
        if (executor && executor.id !== member.guild.ownerId) {
          const recentBans = await member.guild.fetchAuditLogs({
            type: 22,
            limit: 5,
          });

          const recentBanEntries = recentBans.entries.filter(
            e => e.target?.id !== member.guild.ownerId && Date.now() - e.createdTimestamp < 60000,
          );

          if (recentBanEntries.size >= 3) {
            const banExecutor = recentBanEntries.first()?.executor;
            if (banExecutor) {
              const banMember = await member.guild.members.fetch(banExecutor.id).catch(() => null);
              if (banMember && banMember.id !== member.guild.ownerId) {
                await member.guild.bans.create(banMember, { reason: 'Anti-nuke: Toplu ban koruması' }).catch(() => {});
              }
            }
          }
        }
      }
    }
  } catch {}
}
