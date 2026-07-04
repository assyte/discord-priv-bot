import { CategoryChannel, TextChannel, Message, EmbedBuilder, ChannelType, PermissionFlagsBits } from 'discord.js';
import { getClient } from '../client.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('ActivityChannelManager');

const CATEGORY_NAME = 'Game Activity';
const CHANNELS: Record<string, string> = {
  cs2: 'cs-2-activity',
  faceit: 'faceit-activity',
  cs16: 'cs-1-6-activity',
  fastcup: 'fastcup-activity'
};

const PANEL_MESSAGES: Record<string, Message | null> = {
  cs2: null,
  faceit: null,
  cs16: null,
  fastcup: null
};

interface PanelConfig {
  accent: number;
  title: string;
  footerTag: string;
  emptyMessage: string;
}

const PANEL_CONFIG: Record<string, PanelConfig> = {
  cs2: {
    accent: 0xF09A2E,
    title: 'COUNTER-STRIKE 2',
    footerTag: 'CS2 Tracker',
    emptyMessage: 'No CS2 players currently in-game.'
  },
  faceit: {
    accent: 0xFF5500,
    title: 'FACEIT',
    footerTag: 'FACEIT Tracker',
    emptyMessage: 'No registered players yet.'
  },
  cs16: {
    accent: 0x4A6B82,
    title: 'COUNTER-STRIKE 1.6',
    footerTag: 'CS 1.6 Tracker',
    emptyMessage: 'No CS 1.6 players currently in-game.'
  },
  fastcup: {
    accent: 0x00C853,
    title: 'FASTCUP',
    footerTag: 'Fastcup Tracker',
    emptyMessage: 'No Fastcup players registered yet.'
  }
};

const MEDALS = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];
const SEPARATOR = '\u2500';

export class ActivityChannelManager {
  static async init() {
    const client = getClient();
    const guild = client.guilds.cache.get(process.env.GUILD_ID!);
    if (!guild) return;

    try {
      let category = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === CATEGORY_NAME) as CategoryChannel;

      if (!category) {
        category = await guild.channels.create({
          name: CATEGORY_NAME,
          type: ChannelType.GuildCategory,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              deny: [PermissionFlagsBits.SendMessages],
              allow: [PermissionFlagsBits.ViewChannel]
            }
          ]
        });
        logger.info(`Created category: ${CATEGORY_NAME}`);
      }

      for (const [key, name] of Object.entries(CHANNELS)) {
        let channel = guild.channels.cache.find(c => c.parentId === category.id && c.name === name) as TextChannel;

        if (!channel) {
          channel = await guild.channels.create({
            name: name,
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: [
              {
                id: guild.roles.everyone.id,
                deny: [PermissionFlagsBits.SendMessages],
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory]
              },
              {
                id: client.user!.id,
                allow: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.ViewChannel, PermissionFlagsBits.EmbedLinks]
              }
            ]
          });
          logger.info(`Created channel: ${name}`);
        }

        const messages = await channel.messages.fetch({ limit: 10 });
        const existingPanel = messages.find(m => m.author.id === client.user!.id && m.embeds.length > 0);

        const embed = this.buildEmbed(key, []);

        if (existingPanel) {
          await existingPanel.edit({ embeds: [embed] });
          PANEL_MESSAGES[key] = existingPanel;
          for (const [msgId, msg] of messages) {
            if (msgId !== existingPanel.id) {
              await msg.delete().catch(() => {});
            }
          }
        } else {
          for (const [_, msg] of messages) {
            await msg.delete().catch(() => {});
          }
          PANEL_MESSAGES[key] = await channel.send({ embeds: [embed] });
        }
      }

      logger.info('All activity panels initialized.');
    } catch (error) {
      logger.error('ActivityChannelManager init error:', error);
    }
  }

  static async updatePanel(type: 'cs2' | 'faceit' | 'cs16' | 'fastcup', activeUsers: { id: string; username: string; extraInfo?: string }[]) {
    const msg = PANEL_MESSAGES[type];
    if (!msg) return;

    try {
      const embed = this.buildEmbed(type, activeUsers);
      await msg.edit({ embeds: [embed] });
    } catch (error) {
      logger.error(`Error updating panel (${type}):`, error);
    }
  }

  private static buildEmbed(type: string, activeUsers: { id: string; username: string; extraInfo?: string }[]) {
    const cfg = PANEL_CONFIG[type];
    if (!cfg) return new EmbedBuilder();

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const count = activeUsers.length;

    const embed = new EmbedBuilder()
      .setColor(cfg.accent)
      .setTitle(cfg.title)
      .setFooter({ text: `${cfg.footerTag} \u2022 Updated ${timeStr} UTC` });

    if (count === 0) {
      embed.setDescription(`> ${cfg.emptyMessage}`);
      return embed;
    }

    embed.setDescription(`**${count}** player${count !== 1 ? 's' : ''} currently tracked\n${SEPARATOR.repeat(24)}`);

    const displayLimit = 50;
    const players = activeUsers.slice(0, displayLimit);

    for (let i = 0; i < players.length; i += 10) {
      const chunk = players.slice(i, i + 10);
      let value = '';

      for (const [offset, user] of chunk.entries()) {
        const rank = i + offset + 1;
        const badge = rank <= 3 ? MEDALS[rank - 1] : `\`#${rank.toString().padStart(2, '0')}\``;
        const info = user.extraInfo ? ` \u2022 *${user.extraInfo}*` : '';
        value += `${badge} <@${user.id}>${info}\n`;
      }

      embed.addFields({ name: '\u200B', value: value, inline: false });
    }

    if (count > displayLimit) {
      embed.addFields({ name: '\u200B', value: `> *...and ${count - displayLimit} more*`, inline: false });
    }

    return embed;
  }
}
