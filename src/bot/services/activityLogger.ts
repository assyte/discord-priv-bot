import { VoiceState, Message } from 'discord.js';
import type { ClutchClient } from '../client.js';
import { dbPool } from '../../database/connection.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('ActivityLogger');

// Map to track when a user joins a voice channel
// Key: Discord ID, Value: Join timestamp (ms)
const voiceSessions = new Map<string, number>();

export class ActivityLogger {
  static init(client: ClutchClient) {
    logger.info('Initializing Activity Logger for messages and voice...');

    // Message tracking
    client.on('messageCreate', async (message: Message) => {
      if (message.author.bot) return;

      try {
        const conn = await dbPool.getConnection();
        try {
          // Increment message count. 
          // We only track verified users or those in the DB.
          await conn.query(`
            UPDATE users 
            SET message_count = message_count + 1 
            WHERE discord_id = ?
          `, [message.author.id]);
        } finally {
          conn.release();
        }
      } catch (err) {
        // Silently ignore errors for unregistered users
      }
    });

    // Voice tracking
    client.on('voiceStateUpdate', async (oldState: VoiceState, newState: VoiceState) => {
      const member = newState.member || oldState.member;
      if (!member || member.user.bot) return;

      const userId = member.id;
      const joinedChannel = !oldState.channelId && newState.channelId;
      const leftChannel = oldState.channelId && !newState.channelId;
      const movedChannel = oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId;

      if (joinedChannel) {
        // User joined voice
        voiceSessions.set(userId, Date.now());
      } else if (leftChannel) {
        // User left voice
        await this.handleVoiceLeave(userId);
      } else if (movedChannel) {
        // User moved between channels, we can keep the timer running
        // Or if we want channel-specific tracking we would restart, but we just track total voice minutes.
        if (!voiceSessions.has(userId)) {
          voiceSessions.set(userId, Date.now());
        }
      }
    });
  }

  private static async handleVoiceLeave(discordId: string) {
    const joinTime = voiceSessions.get(discordId);
    if (!joinTime) return;

    voiceSessions.delete(discordId);

    const durationMs = Date.now() - joinTime;
    const durationMinutes = Math.floor(durationMs / 60000);

    if (durationMinutes < 1) return; // Ignore less than a minute

    try {
      const conn = await dbPool.getConnection();
      try {
        await conn.query(`
          UPDATE users 
          SET voice_minutes = voice_minutes + ? 
          WHERE discord_id = ?
        `, [durationMinutes, discordId]);
      } finally {
        conn.release();
      }
    } catch (err) {
       // Ignore
    }
  }
}
