import { VoiceState, Message } from 'discord.js';
import type { ClutchClient } from '../client.js';
import { dbPool } from '../../database/connection.js';
import { Logger } from '../../utils/logger.js';
import { CoinLogger } from './coinLogger.js';

const logger = new Logger('ActivityLogger');

// Map to track when a user joins a voice channel
// Key: Discord ID, Value: Join timestamp (ms)
const voiceSessions = new Map<string, number>();

// Map to track message cooldowns for coins
// Key: Discord ID, Value: Last message timestamp (ms)
const messageCooldowns = new Map<string, number>();

export class ActivityLogger {
  static init(client: ClutchClient) {
    logger.info('Initializing Activity Logger for messages and voice...');

    // Message tracking
    client.on('messageCreate', async (message: Message) => {
      if (message.author.bot) return;

      try {
        const conn = await dbPool.getConnection();
        try {
          // Cooldown check for coins (30 seconds)
          const now = Date.now();
          const lastMsg = messageCooldowns.get(message.author.id) || 0;
          let coinsToGive = 0;
          
          if (now - lastMsg > 30000) {
            coinsToGive = Math.floor(Math.random() * 3) + 1; // 1 to 3 coins
            messageCooldowns.set(message.author.id, now);
          }

          // Increment message count and optionally coins
          await conn.query(`
            UPDATE users 
            SET message_count = message_count + 1,
                clutch_coins = clutch_coins + ?
            WHERE discord_id = ?
          `, [coinsToGive, message.author.id]);
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
        // Give 10 coins for every 10 minutes
        const coinsToGive = Math.floor(durationMinutes / 10) * 10;
        
        await conn.query(`
          UPDATE users 
          SET voice_minutes = voice_minutes + ?,
              clutch_coins = clutch_coins + ?
          WHERE discord_id = ?
        `, [durationMinutes, coinsToGive, discordId]);

        if (coinsToGive > 0) {
          CoinLogger.log(discordId, coinsToGive, 'Voice Activity', '🎙️');
        }
      } finally {
        conn.release();
      }
    } catch (err) {
       // Ignore
    }
  }
}
