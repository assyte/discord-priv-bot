import { VoiceState, ChannelType, GuildMember } from 'discord.js';
import type { ClutchClient } from '../client.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('LobbyStatusManager');

export class LobbyStatusManager {
  static async init(client: ClutchClient) {
    logger.info('Initializing Lobby Status Manager (Dynamic Voice Limits)');

    client.on('voiceStateUpdate', async (oldState: VoiceState, newState: VoiceState) => {
      try {
        // Did the user join or leave a voice channel?
        if (oldState.channelId === newState.channelId) return;

        // Process leave event
        if (oldState.channel && oldState.channel.type === ChannelType.GuildVoice) {
          await this.handleChannelUpdate(oldState.channel);
        }

        // Process join event
        if (newState.channel && newState.channel.type === ChannelType.GuildVoice && newState.member) {
          await this.handleJoin(newState.channel, newState.member);
        }

      } catch (err) {
        logger.error('Error in LobbyStatusManager:', err);
      }
    });
  }

  private static async handleJoin(channel: any, member: GuildMember) {
    const name = channel.name;
    let limit = 0;

    if (name.includes('Solo')) limit = 1;
    else if (name.includes('Duo')) limit = 2;
    else if (name.includes('5v5')) limit = 5;

    // Not a custom lobby channel
    if (limit === 0) return;

    // Check if channel is full BEFORE we count the new member?
    // channel.members.size includes the member who just joined.
    if (channel.members.size > limit) {
      logger.info(`Channel ${channel.name} is full (${limit} max). Kicking ${member.user.tag}`);
      // Kick the member out
      try {
        await member.voice.disconnect('Channel is full.');
        // Optionally send a DM or ephemeral message if needed.
      } catch (e) {
        logger.error(`Failed to disconnect ${member.user.tag}:`, e);
      }
      return;
    }

    // It wasn't over limit, so just update the name
    await this.handleChannelUpdate(channel, limit);
  }

  private static renameTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private static pendingNames: Map<string, string> = new Map();

  private static async handleChannelUpdate(channel: any, knownLimit = 0) {
    let limit = knownLimit;
    const name = channel.name;

    if (limit === 0) {
      if (name.includes('Solo')) limit = 1;
      else if (name.includes('Duo')) limit = 2;
      else if (name.includes('5v5')) limit = 5;
    }

    // Not a custom lobby channel
    if (limit === 0) return;

    const currentSize = channel.members.size;
    const isFull = currentSize >= limit;

    let suffix = '';
    if (currentSize === 0) {
      suffix = '[Empty]';
    } else if (currentSize >= limit) {
      suffix = '[Full]';
    } else {
      suffix = `[${currentSize}/${limit}]`;
    }

    const baseName = name.replace(/\s*\[.*?\]$/, '');
    const newName = `${baseName} ${suffix}`;

    if (newName !== name) {
      this.pendingNames.set(channel.id, newName);
      
      // Debounce the rename API call by 5 minutes to avoid rate limits
      // Discord allows 2 renames per 10 minutes (1 per 5 mins)
      if (!this.renameTimeouts.has(channel.id)) {
        logger.info(`Queued rename for ${name} to ${newName} (Executes in 5 mins to prevent 50024 Limit)`);
        
        const timeout = setTimeout(async () => {
          this.renameTimeouts.delete(channel.id);
          const finalName = this.pendingNames.get(channel.id);
          if (!finalName) return;
          this.pendingNames.delete(channel.id);

          try {
            logger.info(`Executing queued rename: ${channel.name} -> ${finalName}`);
            await channel.setName(finalName);
          } catch (err: any) {
            if (err.code === 50024) {
               logger.warn(`Rate limited while renaming to ${finalName}. Will try again later.`);
            } else {
               logger.error(`Failed to rename to ${finalName}:`, err);
            }
          }
        }, 5 * 60 * 1000); // 5 minutes
        
        this.renameTimeouts.set(channel.id, timeout);
      }
    }
  }
}
