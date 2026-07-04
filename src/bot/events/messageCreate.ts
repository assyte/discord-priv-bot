import { Events, Message } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import type { ClutchClient } from '../client.js';

const logger = new Logger('MessageCreate');
const BOOSTER_ROLE_ID = '1264200789560135691';

export default {
  name: Events.MessageCreate,
  once: false,
  async execute(client: ClutchClient, message: Message) {
    if (message.author.bot) return;

    if (message.content.startsWith('.nick ')) {
      const newNick = message.content.replace('.nick ', '').trim();
      
      if (!newNick) {
        return message.reply('❌ Please provide a new nickname. Usage: `.nick <name>`');
      }

      if (newNick.length > 32) {
        return message.reply('❌ Nickname cannot be longer than 32 characters.');
      }

      const isBooster = message.member?.roles.cache.has(BOOSTER_ROLE_ID) || message.member?.premiumSince !== null;

      if (!isBooster) {
        return message.reply('❌ **Access Denied!** Only Server Boosters can change their nicknames. Please boost the server to use this feature.');
      }

      try {
        await message.member?.setNickname(newNick);
        await message.reply(`✅ Your nickname has been successfully changed to **${newNick}**!`);
      } catch (error) {
        logger.error('Failed to change nickname:', error);
        await message.reply('❌ I do not have permission to change your nickname (you might have a higher role than me).');
      }
    }
  }
};
