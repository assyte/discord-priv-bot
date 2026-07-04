import { Events, ChannelType } from 'discord.js';
import type { Guild, CategoryChannel } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import { ActivityChannelManager } from '../services/activityChannelManager.js';
import { ActivityTracker } from '../services/activityTracker.js';
import { initRulesPanel } from '../services/rulesPanel.js';
import type { ClutchClient } from '../client.js';

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

  for (const [, category] of allCategories) {
    const isTarget = category.id === INTERACT_CATEGORY_ID;
    await category.permissionOverwrites.edit(joinRole, isTarget ? fullPerms : readOnlyPerms);

    const channelTypesWithPerms = [ChannelType.GuildText, ChannelType.GuildVoice, ChannelType.GuildCategory, ChannelType.GuildStageVoice, ChannelType.GuildNews, ChannelType.GuildForum, ChannelType.GuildMedia];
    for (const [, channel] of guild.channels.cache.filter(c => c.parentId === category.id && channelTypesWithPerms.includes(c.type))) {
      await (channel as import('discord.js').TextChannel).permissionOverwrites.edit(joinRole, isTarget ? fullPerms : readOnlyPerms);
    }

    count++;
  }

  logger.info(`Permission setup complete — ${count} categories + child channels configured for join role`);
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
    }
    
    await ActivityChannelManager.init();

    if (guild) {
      await initRulesPanel(guild);
    }
  }
};
