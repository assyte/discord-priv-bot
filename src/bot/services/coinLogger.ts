import { EmbedBuilder, TextChannel, ChannelType } from 'discord.js';
import type { ClutchClient } from '../client.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('CoinLogger');
const COMMUNITY_CATEGORY_ID = '1523019444102893725';
const GUILD_ID = process.env.GUILD_ID || '1264110767641464844';

export class CoinLogger {
  private static client: ClutchClient;
  private static logChannel: TextChannel | null = null;

  static async init(client: ClutchClient) {
    this.client = client;
    const guild = await client.guilds.fetch(GUILD_ID).catch(() => null);
    if (!guild) return;

    // Find the channel
    let channel = guild.channels.cache.find(c => c.name.includes('coin-notifications') && c.type === ChannelType.GuildText) as TextChannel;
    
    // Create if missing
    if (!channel) {
      try {
        channel = await guild.channels.create({
          name: '🪙・coin-notifications',
          type: ChannelType.GuildText,
          parent: COMMUNITY_CATEGORY_ID,
          topic: 'Live updates of Clutch Coin earnings!',
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              allow: ['ViewChannel', 'ReadMessageHistory'],
              deny: ['SendMessages']
            }
          ]
        });
        logger.info('Created #coin-notifications channel.');
      } catch (err) {
        logger.error('Failed to create #coin-notifications channel:', err);
      }
    }

    this.logChannel = channel;
  }

  /**
   * Logs a coin earning event to the notifications channel.
   * @param discordId The user who earned the coins
   * @param amount The amount of coins earned
   * @param source The reason/source (e.g., 'Voice Activity', 'Inviting a Friend', '+Rep Received')
   * @param icon Optional emoji/icon for the source
   */
  static async log(discordId: string, amount: number, source: string, icon: string = '🪙') {
    if (!this.logChannel) return;

    const embed = new EmbedBuilder()
      .setColor(0xF1C40F) // Gold color
      .setDescription(`**<@${discordId}>** earned **${amount} Clutch Coins!**\n\n**Source:** ${icon} ${source}`)
      .setTimestamp();

    try {
      await this.logChannel.send({ embeds: [embed] });
    } catch (err) {
      logger.error('Failed to send coin log:', err);
    }
  }
}
