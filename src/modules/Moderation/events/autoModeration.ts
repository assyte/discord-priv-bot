import type { GuildMember, PartialGuildMember, GuildChannel, Role, TextChannel, Webhook } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import { AuditLogEvent } from 'discord.js';

// --- Korumalar İçin Önbellekler (Rate Limits) ---
const joinCache = new Map<string, number[]>();
const channelDeleteCache = new Map<string, number[]>();
const roleDeleteCache = new Map<string, number[]>();

export async function guildMemberAdd(client: Client, member: GuildMember) {
  const guildId = member.guild.id;
  const now = Date.now();

  const joins = joinCache.get(guildId) || [];
  joins.push(now);

  const recentJoins = joins.filter(t => now - t < 10000);
  joinCache.set(guildId, recentJoins);

  // Gelişmiş Anti-Raid: 10 saniyede 5'ten fazla giriş varsa raid şüphesi
  if (recentJoins.length > 5) {
    const accountAgeMs = now - member.user.createdAt.getTime();
    const accountAgeDays = Math.floor(accountAgeMs / 86_400_000);

    // Eğer hesap 7 günden yeniyse ve raid şüphesi varsa doğrudan kickle
    if (accountAgeDays < 7) {
      await member.kick('Otomatik Anti-Raid: Şüpheli bot girişi engellendi').catch(() => {});
      client.logger.warn(`Anti-Raid kick: ${member.user.tag}`);
    } else {
      // Gerçek üyelerse sadece kanalları korumaya al
      const everyone = member.guild.roles.everyone;
      await member.guild.channels.cache.forEach(async channel => {
        if (channel.isTextBased?.() && 'permissionOverwrites' in channel) {
          try {
            await (channel as TextChannel).permissionOverwrites.edit(everyone, {
              SendMessages: false,
            }).catch(() => {});
          } catch {}
        }
      });

      const owner = await member.guild.fetchOwner().catch(() => null);
      if (owner && recentJoins.length === 6) { // Sadece ilk tetiklemede mesaj at
        await owner.send(`⚠️ **${member.guild.name}** sunucusunda raid tespit edildi! Kanallar geçici olarak kilitlendi.`).catch(() => {});
      }
    }
  }

  // Temizlik
  if (recentJoins.length > 20) joinCache.set(guildId, []);

  // İzinsiz Bot Ekleme Koruması
  if (member.user.bot) {
    try {
      const auditLogs = await member.guild.fetchAuditLogs({ type: AuditLogEvent.BotAdd, limit: 1 });
      const log = auditLogs.entries.first();
      
      if (log && log.target?.id === member.id && Date.now() - log.createdTimestamp < 10000) {
        const executor = log.executor;
        if (executor && executor.id !== member.guild.ownerId && executor.id !== client.client.user?.id) {
          // İzinsiz bot eklendi, botu at ve ekleyeni banla
          await member.kick('Kafadan Guard: İzinsiz bot eklenemez.').catch(() => {});
          const banMember = await member.guild.members.fetch(executor.id).catch(() => null);
          if (banMember) {
            await banMember.ban({ reason: 'Kafadan Guard: İzinsiz bot ekleme (Anti-Nuke)' }).catch(() => {});
          }
          client.logger.error(`Guard: ${executor.tag} izinsiz bot (${member.user.tag}) eklediği için uzaklaştırıldı.`);
        }
      }
    } catch {}
  }
}

export async function guildMemberRemove(client: Client, member: GuildMember | PartialGuildMember) {
  if (!member.guild) return;

  try {
    // Audit logs çek
    const auditLogs = await member.guild.fetchAuditLogs({ limit: 5 });
    
    // Toplu Ban Koruması
    const banLogs = auditLogs.entries.filter(e => e.action === AuditLogEvent.MemberBanAdd && Date.now() - e.createdTimestamp < 60000);
    if (banLogs.size >= 3) {
      const executor = banLogs.first()?.executor;
      if (executor && executor.id !== member.guild.ownerId && executor.id !== client.client.user?.id) {
        const banMember = await member.guild.members.fetch(executor.id).catch(() => null);
        if (banMember) {
          await banMember.ban({ reason: 'Kafadan Guard: Toplu Ban atma girişimi (Anti-Nuke)' }).catch(() => {});
          client.logger.error(`Guard: ${executor.tag} toplu ban sebebiyle uzaklaştırıldı.`);
        }
      }
    }

    // Toplu Kick Koruması
    const kickLogs = auditLogs.entries.filter(e => e.action === AuditLogEvent.MemberKick && Date.now() - e.createdTimestamp < 60000);
    if (kickLogs.size >= 3) {
      const executor = kickLogs.first()?.executor;
      if (executor && executor.id !== member.guild.ownerId && executor.id !== client.client.user?.id) {
        const banMember = await member.guild.members.fetch(executor.id).catch(() => null);
        if (banMember) {
          await banMember.ban({ reason: 'Kafadan Guard: Toplu Kick atma girişimi (Anti-Nuke)' }).catch(() => {});
          client.logger.error(`Guard: ${executor.tag} toplu kick sebebiyle uzaklaştırıldı.`);
        }
      }
    }
  } catch {}
}

export async function channelDelete(client: Client, channel: GuildChannel) {
  const guildId = channel.guild.id;
  const now = Date.now();

  const deletes = channelDeleteCache.get(guildId) || [];
  deletes.push(now);

  const recentDeletes = deletes.filter(t => now - t < 60000); // 1 dk
  channelDeleteCache.set(guildId, recentDeletes);

  if (recentDeletes.length >= 3) {
    try {
      const auditLogs = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete, limit: 1 });
      const executor = auditLogs.entries.first()?.executor;

      if (executor && executor.id !== channel.guild.ownerId && executor.id !== client.client.user?.id) {
        const banMember = await channel.guild.members.fetch(executor.id).catch(() => null);
        if (banMember) {
          await banMember.ban({ reason: 'Kafadan Guard: Toplu Kanal Silme (Anti-Nuke)' }).catch(() => {});
          client.logger.error(`Guard: ${executor.tag} toplu kanal silme sebebiyle uzaklaştırıldı.`);
        }
      }
    } catch {}
    channelDeleteCache.set(guildId, []);
  }
}

export async function roleDelete(client: Client, role: Role) {
  const guildId = role.guild.id;
  const now = Date.now();

  const deletes = roleDeleteCache.get(guildId) || [];
  deletes.push(now);

  const recentDeletes = deletes.filter(t => now - t < 60000); // 1 dk
  roleDeleteCache.set(guildId, recentDeletes);

  if (recentDeletes.length >= 3) {
    try {
      const auditLogs = await role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleDelete, limit: 1 });
      const executor = auditLogs.entries.first()?.executor;

      if (executor && executor.id !== role.guild.ownerId && executor.id !== client.client.user?.id) {
        const banMember = await role.guild.members.fetch(executor.id).catch(() => null);
        if (banMember) {
          await banMember.ban({ reason: 'Kafadan Guard: Toplu Rol Silme (Anti-Nuke)' }).catch(() => {});
          client.logger.error(`Guard: ${executor.tag} toplu rol silme sebebiyle uzaklaştırıldı.`);
        }
      }
    } catch {}
    roleDeleteCache.set(guildId, []);
  }
}

export async function webhookUpdate(client: Client, channel: TextChannel) {
  // Webhook koruması: Biri yeni webhook açarsa sil
  try {
    const auditLogs = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.WebhookCreate, limit: 1 });
    const log = auditLogs.entries.first();

    if (log && Date.now() - log.createdTimestamp < 10000) {
      const executor = log.executor;
      // Kurucu veya bot değilse webhook oluşturamaz
      if (executor && executor.id !== channel.guild.ownerId && executor.id !== client.client.user?.id) {
        const targetWebhook = log.target as unknown as Webhook;
        if (targetWebhook) {
          const webhooks = await channel.fetchWebhooks();
          const webhookToDelete = webhooks.find(w => w.id === targetWebhook.id);
          if (webhookToDelete) {
            await webhookToDelete.delete('Kafadan Guard: İzinsiz Webhook Oluşturma').catch(() => {});
            client.logger.warn(`Guard: ${executor.tag} tarafından oluşturulan izinsiz webhook anında silindi.`);
          }
        }
      }
    }
  } catch (err) {
    client.logger.error('Webhook koruma hatası:', err);
  }
}
