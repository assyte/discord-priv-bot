import { Events } from 'discord.js';
import type { VoiceState, VoiceChannel } from 'discord.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('PrivateRoomVoiceUpdate');

// Private room name pattern (e.g. "[CS2 MM] assyte")
const ROOM_NAME_REGEX = /^\[CS(?:2|1\.6) (?:MM|Faceit|5v5|Pub|Fastcup)\]/;

export default {
  name: Events.VoiceStateUpdate,
  async execute(client: any, oldState: VoiceState, newState: VoiceState) {
    // Only check old channel on leave or channel switch
    if (!oldState.channelId) return; // User wasn't in a channel before
    if (oldState.channelId === newState.channelId) return; // Mute/Deafen etc.

    const oldChannel = oldState.channel as VoiceChannel;
    if (!oldChannel) return;

    try {
      // If channel is empty and matches room name pattern, delete it
      if (oldChannel.members.size === 0 && ROOM_NAME_REGEX.test(oldChannel.name)) {
        await oldChannel.delete().catch(() => null);
        logger.info(`Empty private room deleted: ${oldChannel.name}`);
      }
    } catch (error) {
      logger.error(`Failed to delete empty room: ${oldChannel.name}`, error);
    }
  },
};
