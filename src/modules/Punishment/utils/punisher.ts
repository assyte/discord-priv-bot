import { EmbedBuilder, type Guild, type User, type GuildMember } from 'discord.js';
import { Database } from '../../../database/connection.js';
import { infractions } from '../../../database/schema/infraction.js';
import { eq, and, like, sql } from 'drizzle-orm';
import { getRule, getLevel, parseDuration, formatDuration, formatDurationShort, type Rule } from './rules.js';

const DARK = 0x2B2D31;

export async function getUserCount(guildId: string, userId: string, category: string): Promise<number> {
  const db = Database.getInstance().db;
  const result = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(infractions)
    .where(and(
      eq(infractions.guildId, guildId),
      eq(infractions.userId, userId),
      like(infractions.reason, `[${category.toUpperCase()}]%`),
    ));
  return result[0]?.count ?? 0;
}

const cezaTitles: Record<string, string> = {
  mute: 'Metin Mute',
  vmute: 'Ses Mute',
  hapis: 'Hapis',
  tokat: 'Tokat',
};

function buildBaseEmbed(member: GuildMember, moderator: User, cezaType: string, extra: string) {
  return new EmbedBuilder()
    .setColor(DARK)
    .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
    .setTitle('Ceza Islemi')
    .setDescription([
      `${member.user.toString()}`,
      '',
      `${cezaTitles[cezaType] || cezaType} cezasi uygulandi.`,
      extra,
    ].filter(Boolean).join('\n'))
    .addFields(
      { name: 'Uye', value: `\`${member.user.tag}\``, inline: true },
      { name: 'ID', value: `\`${member.id}\``, inline: true },
      { name: 'Yetkili', value: moderator.toString(), inline: false },
    )
    .setFooter({ text: 'dev by assyte' })
    .setTimestamp();
}

export function buildResultEmbed(member: GuildMember, moderator: User, rule: Rule, levelIndex: number) {
  const level = rule.levels[levelIndex]!;
  const durText = level.duration === 'permanent' ? 'Kalici' : formatDuration(level.duration);
  const extra = [
    '',
    `Kategori: \`${rule.id.toUpperCase()}\` — ${rule.name}`,
    `Ceza: ${level.type.toUpperCase()} — ${durText}`,
    `Tekrar: #${levelIndex + 1}`,
  ].join('\n');
  return buildBaseEmbed(member, moderator, level.type, extra);
}

function buildManualEmbed(member: GuildMember, moderator: User, cezaType: string, reason: string, durText: string) {
  const extra = [
    '',
    `Sebep: ${reason}`,
    durText ? `Sure: ${durText}` : '',
  ].filter(Boolean).join('\n');
  return buildBaseEmbed(member, moderator, cezaType, extra);
}

export async function executePunishment(
  guild: Guild,
  targetId: string,
  moderator: User,
  category: string,
): Promise<{ embed: EmbedBuilder } | { error: string }> {
  const rule = getRule(category);
  if (!rule) return { error: `Kategori bulunamadi: \`${category}\`` };

  const member = await guild.members.fetch(targetId).catch(() => null);
  if (!member) return { error: 'Uye sunucuda bulunamadi.' };

  const mod = await guild.members.fetch(moderator.id);
  if (member.roles.highest.position >= mod.roles.highest.position) {
    return { error: 'Bu uyeyi cezalandiramazsin — rolu senden yuksek.' };
  }

  const currentCount = await getUserCount(guild.id, targetId, category);
  const levelIndex = currentCount;
  const level = getLevel(rule, currentCount + 1);
  const durationMs = parseDuration(level.duration)!;

  const embed = buildResultEmbed(member, moderator, rule, levelIndex);

  try {
    switch (level.type) {
      case 'mute': {
        await addRole(member, 'Mute');
        break;
      }
      case 'vmute': {
        await addRole(member, 'VMute');
        break;
      }
      case 'hapis': {
        const timeoutMs = level.duration === 'permanent' ? 2419200000 : durationMs;
        await member.timeout(timeoutMs, `[${category.toUpperCase()}] ${rule.name} — #${levelIndex + 1}`);
        await addRole(member, 'Hapis');
        break;
      }
    }
  } catch {
    return { error: 'Ceza uygulanirken hata olustu. Botun yetkisini kontrol et.' };
  }

  const db = Database.getInstance().db;
  await db.insert(infractions).values({
    guildId: guild.id,
    userId: targetId,
    moderatorId: moderator.id,
    type: level.type,
    reason: `[${category.toUpperCase()}] ${rule.name} — Tekrar #${levelIndex + 1}`,
    duration: durationMs === Infinity ? null : Math.floor(durationMs / 1000),
    active: level.type === 'hapis' ? true : false,
    expiresAt: durationMs === Infinity ? null : new Date(Date.now() + durationMs),
  });

  return { embed };
}

export async function executeDirectPunishment(
  guild: Guild,
  targetId: string,
  moderator: User,
  type: 'vmute' | 'mute' | 'hapis' | 'tokat',
  reason: string,
  duration?: string,
): Promise<{ embed: EmbedBuilder } | { error: string }> {
  const member = await guild.members.fetch(targetId).catch(() => null);
  if (!member) return { error: 'Uye sunucuda bulunamadi.' };

  const mod = await guild.members.fetch(moderator.id);
  if (member.roles.highest.position >= mod.roles.highest.position) {
    return { error: 'Bu uyeyi cezalandiramazsin — rolu senden yuksek.' };
  }

  const durMs = duration ? parseDuration(duration) : null;
  const durText = !durMs ? '' : durMs === Infinity ? 'Kalici' : formatDurationShort(durMs);
  const embed = buildManualEmbed(member, moderator, type, reason, durText);

  try {
    if (type === 'tokat') {
      await guild.members.ban(targetId, { reason: `TOKAT — ${reason}` });
    } else if (type === 'hapis') {
      const maxMs = durMs && durMs !== Infinity ? Math.min(durMs, 2419200000) : 2419200000;
      await member.timeout(maxMs, reason);
      await addRole(member, 'Hapis');
    } else if (type === 'vmute') {
      await addRole(member, 'VMute');
    } else if (type === 'mute') {
      await addRole(member, 'Mute');
    }
  } catch {
    return { error: 'Ceza uygulanirken hata olustu. Botun yetkisini kontrol et.' };
  }

  const db = Database.getInstance().db;
  await db.insert(infractions).values({
    guildId: guild.id,
    userId: targetId,
    moderatorId: moderator.id,
    type,
    reason,
    duration: durMs && durMs !== Infinity ? Math.floor(durMs / 1000) : null,
    active: true,
    expiresAt: durMs && durMs !== Infinity ? new Date(Date.now() + durMs) : null,
  });

  return { embed };
}

const PERM_DENY: Record<string, { permName: string; chType: number }[]> = {
  Mute: [
    { permName: 'SendMessages', chType: 0 },
    { permName: 'SendMessages', chType: 5 },
    { permName: 'SendMessages', chType: 15 },
  ],
  VMute: [
    { permName: 'Speak', chType: 2 },
    { permName: 'Speak', chType: 13 },
  ],
  Hapis: [
    { permName: 'ViewChannel', chType: -1 },
  ],
};

const HAPIS_CHANNEL_NAME = 'hapis';

async function setupChannelPerms(role: import('discord.js').Role): Promise<void> {
  const guild = role.guild;
  const configs = PERM_DENY[role.name as keyof typeof PERM_DENY];
  if (!configs) return;

  for (const ch of guild.channels.cache.values()) {
    if (!('permissionOverwrites' in ch)) continue;

    // Hapis: deny ViewChannel in every channel except the jail channel
    if (role.name === 'Hapis') {
      if (ch.name === HAPIS_CHANNEL_NAME) {
        await ch.permissionOverwrites.create(role, {
          ViewChannel: true,
          SendMessages: true,
          ReadMessageHistory: true,
        }).catch(() => {});
      } else {
        await ch.permissionOverwrites.create(role, { ViewChannel: false }).catch(() => {});
      }
      continue;
    }

    // Mute/VMute: deny specific perm in matching channel types
    for (const cfg of configs) {
      if (cfg.chType === -1 || ch.type === cfg.chType) {
        await ch.permissionOverwrites.create(role, { [cfg.permName]: false }).catch(() => {});
      }
    }
  }
}

async function ensureHapisChannel(guild: import('discord.js').Guild): Promise<void> {
  const existing = guild.channels.cache.find(c => c.name === HAPIS_CHANNEL_NAME);
  if (existing) return;
  try {
    await guild.channels.create({
      name: HAPIS_CHANNEL_NAME,
      type: 0,
      reason: 'Hapis cezasi icin ozel kanal',
      permissionOverwrites: [
        { id: guild.id, deny: 0x00000400n }, // @everyone ViewChannel deny
      ],
    });
  } catch {}
}

async function ensureRole(guild: import('discord.js').Guild, name: string): Promise<import('discord.js').Role | null> {
  let role = guild.roles.cache.find(r => r.name === name);
  if (!role) {
    try {
      const colors: Record<string, number> = { Mute: 0xED4245, VMute: 0xFEE75C, Hapis: 0x2B2D31 };
      role = await guild.roles.create({
        name,
        color: colors[name] || 0x2B2D31,
        reason: 'Otomatik ceza rolu',
      });
      if (name === 'Hapis') {
        await ensureHapisChannel(guild);
      }
      await setupChannelPerms(role);
    } catch {
      return null;
    }
  }
  return role;
}

async function addRole(member: GuildMember, roleName: string): Promise<void> {
  const role = await ensureRole(member.guild, roleName);
  if (!role) return;
  if (member.roles.cache.has(role.id)) return;
  await member.roles.add(role, 'Ceza rolu').catch(() => {});
}

async function removeRole(member: GuildMember, roleName: string): Promise<void> {
  const role = member.guild.roles.cache.find(r => r.name === roleName);
  if (role && member.roles.cache.has(role.id)) {
    await member.roles.remove(role, 'Ceza kaldirildi').catch(() => {});
  }
}

export async function removePunishment(
  guild: Guild,
  targetId: string,
  moderator: User,
  type: 'mute' | 'vmute' | 'hapis' | 'tokat',
): Promise<{ embed: EmbedBuilder } | { error: string }> {
  const member = await guild.members.fetch(targetId).catch(() => null);
  const memberForEmbed = member?.user || { tag: 'Bilinmiyor', toString: () => `<@${targetId}>` };

  try {
    if (type === 'mute') {
      if (!member) return { error: 'Uye sunucuda bulunamadi.' };
      await removeRole(member, 'Mute');
    } else if (type === 'vmute') {
      if (!member) return { error: 'Uye sunucuda bulunamadi.' };
      await removeRole(member, 'VMute');
    } else if (type === 'hapis') {
      if (member) {
        await member.timeout(null);
        await removeRole(member, 'Hapis');
      } else {
        await guild.members.unban(targetId).catch(() => {});
      }
    } else if (type === 'tokat') {
      await guild.members.unban(targetId).catch(() => {});
    }
  } catch {
    return { error: 'Ceza kaldirilirken hata olustu.' };
  }

  const db = Database.getInstance().db;
  const existing = await db
    .select()
    .from(infractions)
    .where(and(
      eq(infractions.guildId, guild.id),
      eq(infractions.userId, targetId),
      eq(infractions.type, type),
      eq(infractions.active, true),
    ))
    .limit(1);
  if (existing.length > 0) {
    await db.update(infractions).set({ active: false }).where(eq(infractions.id, existing[0]!.id));
  }

  const embed = new EmbedBuilder()
    .setColor(DARK)
    .setAuthor({ name: (member?.user?.tag || targetId), iconURL: member?.user?.displayAvatarURL() })
    .setTitle('Ceza Kaldirildi')
    .setDescription([
      `${member?.user?.toString() || `<@${targetId}>`}`,
      '',
      `${cezaTitles[type] || type} cezasi kaldirildi.`,
      `Yetkili: ${moderator.toString()}`,
    ].join('\n'))
    .setFooter({ text: 'dev by assyte' })
    .setTimestamp();

  return { embed };
}
