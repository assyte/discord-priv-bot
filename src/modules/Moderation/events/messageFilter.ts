import type { Message, TextChannel } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import { Database } from '../../../database/connection.js';
import { infractions } from '../../../database/schema/infraction.js';
import { and, eq } from 'drizzle-orm';
import { Logger } from '../../../utils/logger.js';

const logger = new Logger('MessageFilter');

interface FilterRule {
  enabled: boolean;
  action: 'warn' | 'delete' | 'mute';
  threshold?: number;
}

interface ModerationConfig {
  spam: FilterRule & { window: number; limit: number };
  caps: FilterRule & { percentage: number };
  mention: FilterRule & { limit: number };
  link: FilterRule & { whitelist: string[] };
  swear: FilterRule & { words: string[] };
}

const DEFAULT_CONFIG: ModerationConfig = {
  spam: { enabled: true, action: 'mute', window: 5000, limit: 5 },
  caps: { enabled: false, action: 'warn', percentage: 70 },
  mention: { enabled: true, action: 'warn', limit: 5 },
  link: { enabled: true, action: 'delete', whitelist: ['discord.com/channels', 'youtube.com', 'youtu.be', 'spotify.com', 'tenor.com', 'giphy.com', 'twitch.tv'] },
  swear: { enabled: false, action: 'delete', words: ['amk', 'aq', 'sik', 'orospu', 'piç', 'göt', 'yarrak', 'puşt', 'ananı', 'babanı'] },
};

const messageCache = new Map<string, { count: number; firstMessage: number; warned: boolean }>();

export async function messageCreate(client: Client, message: Message) {
  if (!message.guild || message.author.bot) return;
  if (!message.member) return;

  const config = DEFAULT_CONFIG;

  const content = message.content;

  // Spam kontrolü
  if (config.spam.enabled) {
    const key = `${message.guild.id}:${message.author.id}`;
    const now = Date.now();
    const cached = messageCache.get(key);

    if (cached && now - cached.firstMessage < config.spam.window) {
      cached.count++;

      if (cached.count >= config.spam.limit && !cached.warned) {
        cached.warned = true;
        await (message.channel as TextChannel).send(`${message.author}, spam yapmayı kes!`).catch(() => {});

        if (config.spam.action === 'mute') {
          await message.member.timeout(60000, 'Spam - otomatik moderasyon').catch(() => {});
          logger.warn(`Spam mute: ${message.author.tag} in ${message.guild.name}`);
        }
      }
    } else {
      messageCache.set(key, { count: 1, firstMessage: now, warned: false });
    }
  }

  // Büyük harf kontrolü
  if (config.caps.enabled && content.length > 10) {
    const letters = content.replace(/[^a-zA-ZÇĞİÖŞÜçğıöşü]/g, '');
    if (letters.length > 0) {
      const upperCount = letters.split('').filter(c => c === c.toUpperCase()).length;
      const upperPercent = (upperCount / letters.length) * 100;

      if (upperPercent >= config.caps.percentage) {
        await message.delete().catch(() => {});
        const reply = await (message.channel as TextChannel).send(`${message.author}, çok fazla büyük harf kullanma!`).catch(() => {});
        setTimeout(() => reply?.delete().catch(() => {}), 3000);
        return;
      }
    }
  }

  // Mention kontrolü
  if (config.mention.enabled && message.mentions.members) {
    const mentionCount = message.mentions.members.size + message.mentions.roles.size;
    if (mentionCount >= config.mention.limit) {
      if (config.mention.action === 'delete') {
        await message.delete().catch(() => {});
      }
      await message.member.timeout(300000, 'Mass mention - otomatik moderasyon').catch(() => {});
      logger.warn(`Mass mention mute: ${message.author.tag} (${mentionCount} mentions)`);
      return;
    }
  }

  // Küfür kontrolü
  if (config.swear.enabled) {
    const lowerContent = content.toLowerCase();
    const hasSwear = config.swear.words.some(word => lowerContent.includes(word));

    if (hasSwear) {
      if (config.swear.action === 'delete') {
        await message.delete().catch(() => {});
      }
      const reply = await (message.channel as TextChannel).send(`${message.author}, küfürlü dil kullanma!`).catch(() => {});
      setTimeout(() => reply?.delete().catch(() => {}), 3000);

      const warnCount = await Database.getInstance().db.select()
        .from(infractions)
        .where(and(
          eq(infractions.guildId, message.guild!.id),
          eq(infractions.userId, message.author.id),
          eq(infractions.type, 'uyarı'),
        ));

      if (warnCount.length >= 3) {
        await message.member.timeout(3600000, 'Küfür - otomatik moderasyon').catch(() => {});
      }
    }
  }

  // Discord Invite (Reklam) Kontrolü
  const inviteRegex = /(?:https?:\/\/)?(?:www\.)?(?:discord\.gg|discordapp\.com\/invite|discord\.com\/invite)\/([a-zA-Z0-9-]+)/gi;
  if (inviteRegex.test(content)) {
    await message.delete().catch(() => {});
    const reply = await (message.channel as TextChannel).send(`${message.author}, sunucu daveti (reklam) paylaşmak yasaktır!`).catch(() => {});
    setTimeout(() => reply?.delete().catch(() => {}), 3000);
    return;
  }

  // Link kontrolü
  if (config.link.enabled) {
    const urlRegex = /https?:\/\/([^\s/]+)/gi;
    const urls = content.match(urlRegex);
    if (urls) {
      for (const url of urls) {
        const domain = new URL(url).hostname.replace('www.', '');
        const isWhitelisted = config.link.whitelist.some(w => domain.includes(w));

        if (!isWhitelisted) {
          await message.delete().catch(() => {});
          const reply = await (message.channel as TextChannel).send(`${message.author}, bu kanalda link paylaşımına izin verilmiyor.`).catch(() => {});
          setTimeout(() => reply?.delete().catch(() => {}), 3000);
          return;
        }
      }
    }
  }
}
