import { joinVoiceChannel, VoiceConnectionStatus, entersState } from '@discordjs/voice';
import type { Client as DiscordClient } from 'discord.js';
import type { Logger } from '../../../utils/logger.js';

const TARGET_VOICE_CHANNEL_ID = '1522167331051274241';

export class VoiceConnectionService {
  static async connect(client: DiscordClient, logger: Logger) {
    try {
      const channel = client.channels.cache.get(TARGET_VOICE_CHANNEL_ID);
      if (!channel || !channel.isVoiceBased()) {
        logger.warn(`Hedef ses kanalı bulunamadı veya ses kanalı değil: ${TARGET_VOICE_CHANNEL_ID}`);
        return;
      }

      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator as any,
      });

      connection.on(VoiceConnectionStatus.Ready, () => {
        logger.info(`Ses kanalına başarıyla bağlanıldı: ${channel.name}`);
      });

      connection.on(VoiceConnectionStatus.Disconnected, async () => {
        logger.warn('Ses kanalından kopuldu, tekrar bağlanılmaya çalışılıyor...');
        try {
          await Promise.race([
            entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
            entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
          ]);
          // Yeniden bağlanıyorsa sorun yok
        } catch (error) {
          // Bağlanamadıysa bağlantıyı tamamen yok et ve baştan bağlan
          connection.destroy();
          setTimeout(() => {
            this.connect(client, logger);
          }, 5000);
        }
      });
    } catch (err) {
      logger.error('Ses kanalına bağlanırken hata oluştu:', err);
    }
  }
}
