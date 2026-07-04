import { Events, GuildMember } from 'discord.js';
import type { ClutchClient } from '../client.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('GuildMemberAdd');

const JOIN_ROLE_ID = '1522961867025416202';

export default {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(_client: ClutchClient, member: GuildMember) {
    try {
      await member.roles.add(JOIN_ROLE_ID);
      logger.info(`Assigned join role to ${member.user.tag} (${member.id})`);
    } catch (error) {
      logger.error(`Failed to assign join role to ${member.user.tag}:`, error);
    }
  }
};
