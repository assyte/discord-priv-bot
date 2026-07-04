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

export const FASTCUP_ROLE_MAP: Record<string, string> = {
  'S': process.env.ROLE_FASTCUP_S || '',
  'A': process.env.ROLE_FASTCUP_A || '',
  'B': process.env.ROLE_FASTCUP_B || '',
  'C': process.env.ROLE_FASTCUP_C || '',
  'D': process.env.ROLE_FASTCUP_D || '',
  'E': process.env.ROLE_FASTCUP_E || '',
  'F': process.env.ROLE_FASTCUP_F || '',
  'G': process.env.ROLE_FASTCUP_G || ''
};

export const CS16_ROLE_ID = process.env.ROLE_CS16 || '';

export async function assignFastcupRoles(discordId: string, fastcupLevel: string) {
  const client = getClient();
  const guild = client.guilds.cache.get(process.env.GUILD_ID!);
  if (!guild) return;

  try {
    const member = await guild.members.fetch(discordId).catch(() => null);
    if (!member) return;

    const rolesToAdd: string[] = [];
    const rolesToRemove: string[] = [];

    // Önceki seviye rollerini temizle
    for (const [levelChar, roleId] of Object.entries(FASTCUP_ROLE_MAP)) {
      if (!roleId) continue;
      if (levelChar === fastcupLevel.toUpperCase()) {
        if (!member.roles.cache.has(roleId)) rolesToAdd.push(roleId);
      } else {
        if (member.roles.cache.has(roleId)) rolesToRemove.push(roleId);
      }
    }

    if (CS16_ROLE_ID && !member.roles.cache.has(CS16_ROLE_ID)) {
      rolesToAdd.push(CS16_ROLE_ID);
    }

    if (rolesToRemove.length > 0) {
      await member.roles.remove(rolesToRemove);
      logger.debug(`${member.user.tag} kullanıcısından eski Fastcup rolleri alındı.`);
    }

    if (rolesToAdd.length > 0) {
      await member.roles.add(rolesToAdd);
      logger.info(`${member.user.tag} kullanıcısına Fastcup Rank ${fastcupLevel} ve CS16 Player rolü verildi.`);
    }

  } catch (error) {
    logger.error(`assignFastcupRoles hatası: ${discordId}`, error);
  }
}
