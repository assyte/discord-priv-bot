import { EmbedBuilder, type TextChannel, type Guild, type User } from 'discord.js';
import { Database } from '../../../database/connection.js';
import { logs } from '../../../database/schema/log.js';
import { guilds } from '../../../database/schema/guild.js';
import { eq } from 'drizzle-orm';
import { Logger } from '../../../utils/logger.js';

const logger = new Logger('LogService');

const DARK = 0x2B2D31;

export class LogService {
  static async sendLog(
    guild: Guild,
    type: string,
    options: {
      target?: User;
      moderator?: User;
      reason?: string;
      changes?: Record<string, unknown>;
      oldData?: Record<string, unknown>;
      newData?: Record<string, unknown>;
    },
  ): Promise<void> {
    try {
      const db = Database.getInstance().db;
      await db.insert(logs).values({
        guildId: guild.id,
        type,
        targetId: options.target?.id,
        moderatorId: options.moderator?.id,
        reason: options.reason,
        changes: options.changes ? (options.changes as any) : null,
        oldData: options.oldData ? (options.oldData as any) : null,
        newData: options.newData ? (options.newData as any) : null,
      });
    } catch (error) {
      logger.error('Log kaydedilemedi:', error);
    }
  }

  static async sendToChannel(guild: Guild, embed: EmbedBuilder, logType?: string): Promise<void> {
    try {
      const db = Database.getInstance().db;
      const [guildConfig] = await db.select().from(guilds).where(eq(guilds.id, guild.id)).limit(1);

      if (!guildConfig) return;

      const channelMap: Record<string, string | undefined | null> = {
        memberJoin: guildConfig.joinLogChannel,
        memberLeave: guildConfig.joinLogChannel,
        memberBan: guildConfig.joinLogChannel,
        memberUnban: guildConfig.joinLogChannel,
        messageDelete: guildConfig.messageLogChannel,
        messageUpdate: guildConfig.messageLogChannel,
        voiceJoin: guildConfig.voiceLogChannel,
        voiceLeave: guildConfig.voiceLogChannel,
        voiceMove: guildConfig.voiceLogChannel,
        modAction: guildConfig.modLogChannel,
        roleCreate: guildConfig.modLogChannel,
        roleDelete: guildConfig.modLogChannel,
        roleUpdate: guildConfig.modLogChannel,
        channelCreate: guildConfig.modLogChannel,
        channelDelete: guildConfig.modLogChannel,
        channelUpdate: guildConfig.modLogChannel,
      };

      const channelId = logType ? channelMap[logType] || guildConfig.logChannel : guildConfig.logChannel;
      if (!channelId) return;

      const channel = guild.channels.cache.get(channelId) as TextChannel;
      if (channel) {
        await channel.send({ embeds: [embed] });
      }
    } catch (error) {
      logger.error('Log kanala gonderilemedi:', error);
    }
  }

  static createLogEmbed(
    type: string,
    options: {
      target?: User;
      moderator?: User;
      reason?: string;
      changes?: string;
      description?: string;
    },
  ) {
    const titles: Record<string, string> = {
      messageDelete: 'Mesaj Silindi',
      messageUpdate: 'Mesaj Duzenlendi',
      memberJoin: 'Uye Katildi',
      memberLeave: 'Uye Ayrildi',
      memberBan: 'Uye Yasaklandi',
      memberUnban: 'Yasak Kaldirildi',
      voiceJoin: 'Ses Odasina Katildi',
      voiceLeave: 'Ses Odasindan Ayrildi',
      voiceMove: 'Ses Odasi Tasindi',
      roleCreate: 'Rol Olusturuldu',
      roleDelete: 'Rol Silindi',
      roleUpdate: 'Rol Guncellendi',
      channelCreate: 'Kanal Olusturuldu',
      channelDelete: 'Kanal Silindi',
      channelUpdate: 'Kanal Guncellendi',
      modAction: 'Yetkili Islemi',
    };

    const embed = new EmbedBuilder()
      .setColor(DARK)
      .setTitle(titles[type] || type)
      .setFooter({ text: 'dev by assyte' })
      .setTimestamp();

    if (options.target) {
      embed.setAuthor({
        name: options.target.tag,
        iconURL: options.target.displayAvatarURL(),
      });
    }

    if (options.description) {
      embed.setDescription(options.description);
    }

    if (options.moderator) {
      embed.addFields({ name: 'Yetkili', value: options.moderator.toString(), inline: true });
    }

    if (options.reason) {
      embed.addFields({ name: 'Sebep', value: options.reason, inline: false });
    }

    if (options.changes) {
      embed.addFields({ name: 'Detay', value: options.changes, inline: false });
    }

    return embed;
  }
}
