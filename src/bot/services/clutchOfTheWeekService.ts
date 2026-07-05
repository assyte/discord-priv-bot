import { Message, TextChannel } from 'discord.js';
import type { ClutchClient } from '../client.js';
import { dbPool } from '../../database/connection.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('ClutchOfTheWeekService');

export class ClutchOfTheWeekService {
  static init(client: ClutchClient) {
    logger.info('Initializing Clutch Of The Week Service...');

    client.on('messageCreate', async (message: Message) => {
      if (message.author.bot) return;

      const channel = message.channel;
      // Is it a TextChannel and is it named clutch-of-week?
      if (channel.isTextBased() && (channel as any).name === 'clutch-of-week') {
        // Is there a video attachment or link?
        const hasAttachment = message.attachments.size > 0;
        const hasLink = message.content.includes('http');

        if (hasAttachment || hasLink) {
          try {
            await message.react('🔥');
            await message.react('🤯');
          } catch (err) {
            logger.error('Failed to react to clutch video:', err);
          }
        }
      }
    });

    // We also need a way to listen for reactions and increment clutch_score
    // Alternatively, we just count the reactions at the end of the week, but since they want /profile to show clutch score,
    // we will listen to reactionAdd and reactionRemove to update DB live!

    client.on('messageReactionAdd', async (reaction, user) => {
      if (user.bot) return;
      if (reaction.partial) await reaction.fetch();
      
      const message = reaction.message;
      if (message.author?.bot) return;

      const channel = message.channel;
      if (channel.isTextBased() && (channel as any).name === 'clutch-of-week') {
        // Increment clutch_score for the message author
        if (!message.author) return;
        try {
          const conn = await dbPool.getConnection();
          try {
            await conn.query(`
              UPDATE users 
              SET clutch_score = clutch_score + 1 
              WHERE discord_id = ?
            `, [message.author.id]);
          } finally {
            conn.release();
          }
        } catch (err) {
          // ignore
        }
      }
    });

    client.on('messageReactionRemove', async (reaction, user) => {
      if (user.bot) return;
      if (reaction.partial) await reaction.fetch();

      const message = reaction.message;
      if (message.author?.bot) return;

      const channel = message.channel;
      if (channel.isTextBased() && (channel as any).name === 'clutch-of-week') {
        if (!message.author) return;
        try {
          const conn = await dbPool.getConnection();
          try {
            await conn.query(`
              UPDATE users 
              SET clutch_score = GREATEST(0, clutch_score - 1) 
              WHERE discord_id = ?
            `, [message.author.id]);
          } finally {
            conn.release();
          }
        } catch (err) {
          // ignore
        }
      }
    });
  }
}
