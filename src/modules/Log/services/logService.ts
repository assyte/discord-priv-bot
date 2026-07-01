import type { TextChannel, Guild, User, Message, VoiceChannel } from 'discord.js';
import { Database } from '../../../database/connection.js';
import { logs } from '../../../database/schema/log.js';
import { Logger } from '../../../utils/logger.js';
import { createEmbed } from '../../../utils/embeds.js';
import { formatDate } from '../../../utils/formatters.js';
import { COLORS, EMOJIS } from '../../../utils/constants.js';

const logger = new Logger('LogService');

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
        changes: options.changes ? JSON.parse(JSON.stringify(options.changes)) : null,
        oldData: options.oldData ? JSON.parse(JSON.stringify(options.oldData)) : null,
        newData: options.newData ? JSON.parse(JSON.stringify(options.newData)) : null,
      });
    } catch (error) {
      logger.error('Log kaydedilemedi:', error);
    }
  }

  static async sendToChannel(guild: Guild, embed: ReturnType<typeof createEmbed>): Promise<void> {
    try {
      const db = Database.getInstance().db;
      const guildConfig = await db.query.guilds.findFirst({
        where: (g, { eq }) => eq(g.id, guild.id),
      });

      if (!guildConfig?.logChannel) return;

      const channel = guild.channels.cache.get(guildConfig.logChannel) as TextChannel;
      if (channel) {
        await channel.send({ embeds: [embed] });
      }
    } catch (error) {
      logger.error('Log kanala gönderilemedi:', error);
    }
  }

  static createLogEmbed(
    type: string,
    options: {
      target?: User;
      moderator?: User;
      reason?: string;
      changes?: string;
    },
  ) {
    const titles: Record<string, string> = {
      messageDelete: 'Mesaj Silindi',
      messageUpdate: 'Mesaj Düzenlendi',
      memberJoin: 'Üye Katıldı',
      memberLeave: 'Üye Ayrıldı',
      memberBan: 'Üye Yasaklandı',
      memberUnban: 'Yasak Kaldırıldı',
      voiceJoin: 'Ses Odasına Katıldı',
      voiceLeave: 'Ses Odasından Ayrıldı',
      voiceMove: 'Ses Odası Taşındı',
      roleCreate: 'Rol Oluşturuldu',
      roleDelete: 'Rol Silindi',
      roleUpdate: 'Rol Güncellendi',
      channelCreate: 'Kanal Oluşturuldu',
      channelDelete: 'Kanal Silindi',
      channelUpdate: 'Kanal Güncellendi',
      modAction: 'Yetkili İşlemi',
    };

    const colors: Record<string, number> = {
      messageDelete: COLORS.danger,
      memberJoin: COLORS.success,
      memberLeave: COLORS.warning,
      memberBan: COLORS.danger,
      modAction: COLORS.primary,
    };

    const embed = createEmbed({
      title: `${EMOJIS.log} ${titles[type] || type}`,
      color: colors[type] || COLORS.info,
      timestamp: true,
      footer: `ID: ${options.target?.id || 'N/A'}`,
    });

    if (options.target) {
      embed.setAuthor({
        name: options.target.tag,
        iconURL: options.target.displayAvatarURL(),
      });
    }

    if (options.moderator) {
      embed.addFields({ name: 'Yetkili', value: options.moderator.toString(), inline: true });
    }

    if (options.reason) {
      embed.addFields({ name: 'Sebep', value: options.reason, inline: false });
    }

    if (options.changes) {
      embed.addFields({ name: 'Değişiklik', value: options.changes, inline: false });
    }

    return embed;
  }
}
