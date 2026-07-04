import { Events } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import type { ClutchClient } from '../client.js';

const logger = new Logger('ReadyEvent');

export default {
  name: Events.ClientReady,
  once: true,
  execute(client: ClutchClient) {
    logger.info(`Discord Bot Giriş Yaptı: ${client.user?.tag}`);
    client.user?.setActivity('Clutch.gg - FACEIT ELO');
  }
};
