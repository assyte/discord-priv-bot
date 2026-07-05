import { Events, ChannelType } from 'discord.js';
import type { Guild, CategoryChannel } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import { ActivityChannelManager } from '../services/activityChannelManager.js';
import { ActivityTracker } from '../services/activityTracker.js';
import { initRulesPanel } from '../services/rulesPanel.js';
import { TeammatePanelManager } from '../services/teammatePanelManager.js';
import { sendRoleSelectionPanel } from '../services/rolePanelManager.js';
import { CS2PatchNotesService } from '../services/cs2PatchNotesService.js';
import { LobbyStatusManager } from '../services/lobbyStatusManager.js';
import { ActivityLogger } from '../services/activityLogger.js';
import { ClutchOfTheWeekService } from '../services/clutchOfTheWeekService.js';
import { WeeklyLeaderboardService } from '../services/weeklyLeaderboardService.js';
import { GlobalLeaderboardPanel } from '../services/globalLeaderboardPanel.js';
import { RoleHierarchyManager } from '../services/roleHierarchyManager.js';
import type { ClutchClient } from '../client.js';
import { dbPool } from '../../database/connection.js';
import { assignVerifiedRoles, assignSteamVerifiedRole, assignFastcupRoles, VERIFIED_ROLE_ID } from '../services/roleManager.js';

const logger = new Logger('ReadyEvent');

const JOIN_ROLE_ID = '1522961867025416202';
const INTERACT_CATEGORY_ID = '1523019444102893725';

async function setupJoinRolePermissions(guild: Guild) {
  const joinRole = guild.roles.cache.get(JOIN_ROLE_ID);
  if (!joinRole) {
    logger.warn(`Join role ${JOIN_ROLE_ID} not found`);
    return;
  }

  const allCategories = guild.channels.cache.filter((c): c is CategoryChannel => c.type === ChannelType.GuildCategory);
  let count = 0;

  const readOnlyPerms: Record<string, boolean | null> = {
    ViewChannel: true,
    ReadMessageHistory: true,
    SendMessages: false,
    SendMessagesInThreads: false,
    CreatePublicThreads: false,
    CreatePrivateThreads: false,
    Connect: false,
    Speak: false,
    Stream: false,
    UseVAD: false,
    AttachFiles: false,
    AddReactions: false,
    UseExternalEmojis: false,
    UseExternalStickers: false,
    UseExternalSounds: false,
    UseEmbeddedActivities: false,
    SendTTSMessages: false,
    ManageMessages: false,
    ManageThreads: false,
    MentionEveryone: false,
    MuteMembers: false,
    DeafenMembers: false,
    MoveMembers: false,
    PrioritySpeaker: false
  };

  const fullPerms: Record<string, boolean | null> = {
    ...readOnlyPerms,
    SendMessages: true,
    SendMessagesInThreads: true,
    CreatePublicThreads: true,
    CreatePrivateThreads: true,
    Connect: true,
    Speak: true,
    Stream: true,
    UseVAD: true,
    AttachFiles: true,
    AddReactions: true,
    UseExternalEmojis: true,
    UseExternalStickers: true,
    UseExternalSounds: true,
    UseEmbeddedActivities: true
  };

  const verifiedRole = VERIFIED_ROLE_ID ? guild.roles.cache.get(VERIFIED_ROLE_ID) : null;

  for (const [, category] of allCategories) {
    const isTarget = category.id === INTERACT_CATEGORY_ID;
    await category.permissionOverwrites.edit(joinRole, isTarget ? fullPerms : readOnlyPerms);
    if (verifiedRole) await category.permissionOverwrites.edit(verifiedRole, fullPerms);

    const channelTypesWithPerms = [ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildCategory, ChannelType.GuildStageVoice, ChannelType.GuildNews, ChannelType.GuildForum, ChannelType.GuildMedia];
    for (const [, channel] of guild.channels.cache.filter(c => c.parentId === category.id && channelTypesWithPerms.includes(c.type))) {
      await (channel as import('discord.js').TextChannel).permissionOverwrites.edit(joinRole, isTarget ? fullPerms : readOnlyPerms);
      if (verifiedRole) await (channel as import('discord.js').TextChannel).permissionOverwrites.edit(verifiedRole, fullPerms);
    }

    count++;
  }

  logger.info(`Permission setup complete — ${count} categories + child channels configured for join role`);
}

async function restoreVerifiedRoles(guild: Guild) {
  logger.info('Starting full verification sync loop for persistent verification...');
  try {
    const conn = await dbPool.getConnection();
    let verifiedUsers: any[] = [];
    try {
      verifiedUsers = await conn.query('SELECT * FROM users WHERE is_verified = 1');
    } finally {
      conn.release();
    }

    if (!verifiedUsers || verifiedUsers.length === 0) return;
    
    await guild.members.fetch(); // Ensure all members are cached
    
    for (const u of verifiedUsers) {
      const member = guild.members.cache.get(u.discord_id);
      if (!member) continue;
      
      // If member lacks Verified Role but is in DB, restore everything
      if (VERIFIED_ROLE_ID && !member.roles.cache.has(VERIFIED_ROLE_ID)) {
         logger.info(`Restoring verified roles for persistent user: ${member.user.tag}`);
         if (u.faceit_level) await assignVerifiedRoles(member.id, u.faceit_level);
         if (u.steam_id_64) await assignSteamVerifiedRole(member.id);
         if (u.fastcup_level) await assignFastcupRoles(member.id, u.fastcup_level);
      }
    }
    logger.info('Verification sync loop completed.');
  } catch (err) {
    logger.error('Error during full verification sync:', err);
  }
}

export default {
  name: Events.ClientReady,
  once: true,
  async execute(client: ClutchClient) {
    logger.info(`Discord Bot Logged In: ${client.user?.tag}`);
    client.user?.setActivity('Clutch.gg - FACEIT ELO');

    const guild = client.guilds.cache.get(process.env.GUILD_ID!);
    if (guild) {
      await setupJoinRolePermissions(guild);
      await restoreVerifiedRoles(guild);
    }
    
    await ActivityChannelManager.init();

    if (guild) {
      await initRulesPanel(guild);
      await TeammatePanelManager.initPanels(client);
      await sendRoleSelectionPanel('1523030630584025098');
      
      // Initialize CS2 Patch Notes Service
      CS2PatchNotesService.init();

      // Initialize Dynamic Lobby Limits
      LobbyStatusManager.init(client);

      // Initialize Advanced Systems
      try {
        ActivityLogger.init(client);
        ClutchOfTheWeekService.init(client);
        WeeklyLeaderboardService.init();
        GlobalLeaderboardPanel.init(client);
        RoleHierarchyManager.init(client);
      } catch (err) {
        logger.error('Failed to initialize advanced systems:', err);
      }

      // Premium Rich Presence — click the bot to see full profile
      const botStartTime = Date.now();
      client.user?.setPresence({
        activities: [{
          name: 'Clutch.gg',
          type: 5, // Competing in
          state: 'discord.gg/clutchgg',
          details: '/stats • /lastmatch • /leaderboard',
          assets: {
            largeImage: 'clutch_logo',
            largeText: 'Clutch.gg — Premium CS2 Community',
            smallImage: 'cs2_icon',
            smallText: 'FACEIT • CS2 • CS 1.6'
          },
          timestamps: {
            start: botStartTime
          }
        } as import('discord.js').ActivityOptions & Record<string, any>],
        status: 'dnd',
      });

      // Fallback: Scan every 5 minutes for members with no roles and assign Unverified
      setInterval(async () => {
        try {
          const members = await guild.members.fetch();
          const unverifiedRole = guild.roles.cache.get(JOIN_ROLE_ID);
          if (!unverifiedRole) return;

          let assignedCount = 0;
          for (const [, member] of members) {
            // A member with no roles only has the @everyone role (which is the guild ID)
            if (!member.user.bot && member.roles.cache.size <= 1) {
              await member.roles.add(unverifiedRole).catch(() => {});
              assignedCount++;
            }
          }
          if (assignedCount > 0) {
            logger.info(`[Fallback] Automatically assigned Unverified role to ${assignedCount} members.`);
          }
        } catch (error) {
          logger.error('Error in fallback role assignment:', error);
        }
      }, 5 * 60 * 1000); // Every 5 minutes
    }
  }
};
