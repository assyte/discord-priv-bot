import { getClient } from '../client.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('RoleManager');

// Bu objeyi doldurmak için kullanıcıdan ID'ler beklenecek
export const ROLE_MAP: Record<number, string> = {
  1: process.env.ROLE_LEVEL_1 || '',
  2: process.env.ROLE_LEVEL_2 || '',
  3: process.env.ROLE_LEVEL_3 || '',
  4: process.env.ROLE_LEVEL_4 || '',
  5: process.env.ROLE_LEVEL_5 || '',
  6: process.env.ROLE_LEVEL_6 || '',
  7: process.env.ROLE_LEVEL_7 || '',
  8: process.env.ROLE_LEVEL_8 || '',
  9: process.env.ROLE_LEVEL_9 || '',
  10: process.env.ROLE_LEVEL_10 || '',
};

export const VERIFIED_ROLE_ID = process.env.ROLE_VERIFIED || '';

export async function assignVerifiedRoles(discordId: string, faceitLevel: number) {
  const client = getClient();
  const guild = client.guilds.cache.get(process.env.GUILD_ID!);
  if (!guild) return;

  try {
    const member = await guild.members.fetch(discordId).catch(() => null);
    if (!member) return;

    const rolesToAdd: string[] = [];
    const rolesToRemove: string[] = [];

    // Önceki seviye rollerini temizlemek için tespit et
    for (const [levelStr, roleId] of Object.entries(ROLE_MAP)) {
      if (!roleId) continue;
      const level = parseInt(levelStr);
      if (level === faceitLevel) {
        if (!member.roles.cache.has(roleId)) rolesToAdd.push(roleId);
      } else {
        if (member.roles.cache.has(roleId)) rolesToRemove.push(roleId);
      }
    }

    if (VERIFIED_ROLE_ID && !member.roles.cache.has(VERIFIED_ROLE_ID)) {
      rolesToAdd.push(VERIFIED_ROLE_ID);
    }

    if (rolesToRemove.length > 0) {
      await member.roles.remove(rolesToRemove);
      logger.debug(`${member.user.tag} kullanıcısından eski seviye rolleri alındı.`);
    }

    if (rolesToAdd.length > 0) {
      await member.roles.add(rolesToAdd);
      logger.info(`${member.user.tag} kullanıcısına Level ${faceitLevel} ve Verified rolü verildi.`);
    }

  } catch (error) {
    logger.error(`assignVerifiedRoles hatası: ${discordId}`, error);
  }
}
