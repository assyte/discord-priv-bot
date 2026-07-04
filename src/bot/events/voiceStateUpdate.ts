import { Events } from 'discord.js';
import type { VoiceState, VoiceChannel } from 'discord.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('PrivateRoomVoiceUpdate');

// Özel oda isim pattern'i (Örn: "[CS2 MM] assyte")
const ROOM_NAME_REGEX = /^\[CS(?:2|1\.6) (?:MM|Faceit|5v5|Pub|Fastcup)\]/;

export default {
  name: Events.VoiceStateUpdate,
  async execute(client: any, oldState: VoiceState, newState: VoiceState) {
    // Sadece kanaldan ayrılma veya kanal değiştirme işlemlerinde eski kanalı kontrol et
    if (!oldState.channelId) return; // Kullanıcı önceden bir kanalda değilse çık
    if (oldState.channelId === newState.channelId) return; // Mute/Deafen gibi durumlar

    const oldChannel = oldState.channel as VoiceChannel;
    if (!oldChannel) return;

    try {
      // Eğer oda boşaldıysa ve adı bizim pattern'e uyuyorsa sil
      if (oldChannel.members.size === 0 && ROOM_NAME_REGEX.test(oldChannel.name)) {
        await oldChannel.delete().catch(() => null);
        logger.info(`Empty private room deleted: ${oldChannel.name}`);
      }
    } catch (error) {
      logger.error(`Failed to delete empty room: ${oldChannel.name}`, error);
    }
  },
};
