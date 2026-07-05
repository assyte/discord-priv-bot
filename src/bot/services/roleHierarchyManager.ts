import { Guild } from 'discord.js';
import cron from 'node-cron';
import type { ClutchClient } from '../client.js';
import { Logger } from '../../utils/logger.js';
import { ROLE_MAP, FASTCUP_ROLE_MAP, VERIFIED_ROLE_ID, UNVERIFIED_ROLE_ID } from './roleManager.js';

const logger = new Logger('RoleHierarchyManager');

export class RoleHierarchyManager {
  static init(client: ClutchClient) {
    logger.info('Initializing Role Hierarchy Manager...');
    
    // Run after 30 seconds on startup to not block other events
    setTimeout(() => {
      this.syncHierarchy(client).catch(e => logger.error('Startup hierarchy sync failed:', e));
    }, 30000);

    // Run every day at 02:00 AM
    cron.schedule('0 2 * * *', async () => {
      logger.info('Running daily Role Hierarchy Sync...');
      await this.syncHierarchy(client);
    });
  }

  static async syncHierarchy(client: ClutchClient) {
    const guild = client.guilds.cache.get(process.env.GUILD_ID!);
    if (!guild) return;

    await guild.roles.fetch();

    const premierOrder = [
      'CS2 Premier | 30,000+',
      'CS2 Premier | 25,000 - 29,999',
      'CS2 Premier | 20,000 - 24,999',
      'CS2 Premier | 15,000 - 19,999',
      'CS2 Premier | 10,000 - 14,999',
      'CS2 Premier | 5,000 - 9,999',
      'CS2 Premier | 0 - 4,999'
    ];

    const mmOrder = [
      'CS 2 | Global Elite',
      'CS 2 | Supreme Master First Class',
      'CS 2 | Legendary Eagle Master',
      'CS 2 | Legendary Eeagle', // Keeping typo exactly as it is in the server
      'CS 2 | Distinguished Master Guardian',
      'CS 2 | Master Guardian Elite',
      'CS 2 | Master Guardian II',
      'CS 2 | Master Guardian I',
      'CS 2 | Gold Nova Master',
      'CS 2 | Gold Nova III',
      'CS 2 | Gold Nova II',
      'CS 2 | Gold Nova I',
      'CS 2 | Silver Elite Master',
      'CS 2 | Silver Elite',
      'CS 2 | Silver IV',
      'CS 2 | Silver III',
      'CS 2 | Silver II',
      'CS 2 | Silver I',
      'CS 2 | Unranked'
    ];

    const faceitIds = [
      ROLE_MAP[10], ROLE_MAP[9], ROLE_MAP[8], ROLE_MAP[7], ROLE_MAP[6],
      ROLE_MAP[5], ROLE_MAP[4], ROLE_MAP[3], ROLE_MAP[2], ROLE_MAP[1], ROLE_MAP[0]
    ].filter((id): id is string => !!id && guild.roles.cache.has(id));

    const fastcupIds = [
      FASTCUP_ROLE_MAP['S'], FASTCUP_ROLE_MAP['A'], FASTCUP_ROLE_MAP['B'], FASTCUP_ROLE_MAP['C'],
      FASTCUP_ROLE_MAP['D'], FASTCUP_ROLE_MAP['E'], FASTCUP_ROLE_MAP['F'], FASTCUP_ROLE_MAP['G']
    ].filter((id): id is string => !!id && guild.roles.cache.has(id));

    const premierIds = premierOrder.map(name => guild.roles.cache.find(r => r.name === name)?.id).filter((id): id is string => !!id);
    const mmIds = mmOrder.map(name => guild.roles.cache.find(r => r.name === name)?.id).filter((id): id is string => !!id);

    const verifiedIds = [VERIFIED_ROLE_ID].filter((id): id is string => !!id && guild.roles.cache.has(id));
    const unverifiedIds = [UNVERIFIED_ROLE_ID].filter((id): id is string => !!id && guild.roles.cache.has(id));

    // Desired Order from Highest to Lowest
    const desiredHierarchyIds: string[] = [
      ...faceitIds,
      ...premierIds,
      ...mmIds,
      ...fastcupIds,
      ...verifiedIds,
      ...unverifiedIds
    ];

    if (desiredHierarchyIds.length === 0) return;

    // Enable hoist: true for all these roles
    for (const roleId of desiredHierarchyIds) {
      const role = guild.roles.cache.get(roleId);
      if (role && !role.hoist) {
        try {
          await role.setHoist(true);
          // Simple delay to prevent rate limits
          await new Promise(r => setTimeout(r, 500));
        } catch (e) {
          logger.warn(`Could not set hoist for ${role.name}`);
        }
      }
    }

    // Now re-order
    const allRoles = Array.from(guild.roles.cache.values()).sort((a, b) => a.position - b.position);
    
    // Find highest possible position among target roles
    let highestPos = -1;
    for (const id of desiredHierarchyIds) {
      const r = guild.roles.cache.get(id);
      if (r && r.position > highestPos) highestPos = r.position;
    }
    
    // Make sure we don't exceed bot's highest role
    const botHighest = guild.members.me?.roles.highest.position || 0;
    if (highestPos >= botHighest) {
      highestPos = botHighest - 1;
    }

    if (highestPos < 1) highestPos = 1;

    // Remove target roles from allRoles
    const nonTargetRoles = allRoles.filter(r => !desiredHierarchyIds.includes(r.id));
    
    // Insert target roles back in order (lowest desired first, so it ends up below highest desired)
    // desiredHierarchyIds is [Highest, SecondHighest, ..., Lowest]
    // So we reverse it to [Lowest, ..., Highest] and insert at highestPos
    const reversedTargets = desiredHierarchyIds.slice().reverse().map(id => guild.roles.cache.get(id)!);

    let insertIndex = nonTargetRoles.findIndex(r => r.position > highestPos);
    if (insertIndex === -1) insertIndex = nonTargetRoles.length;

    nonTargetRoles.splice(insertIndex, 0, ...reversedTargets);

    // Now map them to new positions
    const updatePayload = nonTargetRoles.map((role, index) => ({
      role: role.id,
      position: index
    }));

    try {
      await guild.roles.setPositions(updatePayload);
      logger.info('Successfully synced and organized role hierarchy.');
    } catch (err) {
      logger.error('Failed to sync role hierarchy:', err);
    }
  }
}
