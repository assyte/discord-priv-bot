import { Events, PermissionFlagsBits, ActionRowBuilder, UserSelectMenuBuilder } from 'discord.js';
import type { ButtonInteraction, VoiceChannel, UserSelectMenuInteraction } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import { VERIFIED_ROLE_ID, CS16_ROLE_ID } from '../services/roleManager.js';

const logger = new Logger('PrivateRoomManage');
const STEAM_VERIFIED_ROLE = process.env.ROLE_STEAM_VERIFIED || '1522986492757278810';

export default {
  name: Events.InteractionCreate,
  async execute(client: any, interaction: any) {
    if (interaction.isButton()) {
      if (!['pr_lock', 'pr_whitelist', 'pr_close'].includes(interaction.customId)) return;
      await handleButton(interaction);
    } else if (interaction.isUserSelectMenu()) {
      if (interaction.customId === 'pr_whitelist_select') {
        await handleWhitelistSelect(interaction);
      }
    }
  },
};

async function handleButton(interaction: ButtonInteraction) {
  const channel = interaction.channel as VoiceChannel;
  if (!channel || !channel.isVoiceBased()) return;

  // Only the room creator or admin can manage
  // Rooms are in "[Type] Name" format. For simplicity we check
  // if the user has explicit Connect permission on the channel.
  // Most reliable: does this user have a custom permission override?
  const memberPerms = channel.permissionOverwrites.cache.get(interaction.user.id);
  const isOwner = memberPerms && memberPerms.allow.has(PermissionFlagsBits.Connect);
  const isAdmin = (interaction.member?.permissions as any)?.has(PermissionFlagsBits.Administrator);

  if (!isOwner && !isAdmin) {
    return interaction.reply({ content: '❌ Only the room owner can manage this room!', ephemeral: true });
  }

  try {
    if (interaction.customId === 'pr_close') {
      await interaction.reply({ content: '🗑️ Closing room...', ephemeral: true });
      await channel.delete();
      return;
    }

    if (interaction.customId === 'pr_lock') {
      await interaction.deferReply({ ephemeral: true });
      const verifiedRoles = [VERIFIED_ROLE_ID, CS16_ROLE_ID, STEAM_VERIFIED_ROLE].filter(Boolean);
      
      // Check current verified role permissions on the room
      // If a role has Connect denied (locked), we'll allow it. Otherwise we'll deny it.
      let isCurrentlyLocked = false;
      if (verifiedRoles.length > 0) {
        const firstRoleId = verifiedRoles[0] as string;
        const firstRolePerms = channel.permissionOverwrites.cache.get(firstRoleId);
        if (firstRolePerms && firstRolePerms.deny.has(PermissionFlagsBits.Connect)) {
          isCurrentlyLocked = true;
        }
      }

      if (isCurrentlyLocked) {
        // Unlock
        for (const roleId of verifiedRoles) {
          await channel.permissionOverwrites.edit(roleId, { Connect: true, SendMessages: true });
        }
        await interaction.editReply({ content: '🔓 Room is now **UNLOCKED**. Verified users can join.' });
      } else {
        // Lock
        for (const roleId of verifiedRoles) {
          await channel.permissionOverwrites.edit(roleId, { Connect: false });
        }
        // Also deny @everyone explicitly (should already be denied, but ensure it)
        await channel.permissionOverwrites.edit(channel.guild.id, { Connect: false });
        await interaction.editReply({ content: '🔒 Room is now **LOCKED**. Only you and whitelisted users can join.' });
      }
      return;
    }

    if (interaction.customId === 'pr_whitelist') {
      const selectMenu = new UserSelectMenuBuilder()
        .setCustomId('pr_whitelist_select')
        .setPlaceholder('Select a user to add/remove from whitelist')
        .setMaxValues(1);

      const row = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(selectMenu);

      await interaction.reply({
        content: 'Select a user below to toggle their access to your room:',
        components: [row],
        ephemeral: true
      });
      return;
    }
  } catch (error) {
    logger.error('Room manage error:', error);
    if (interaction.deferred) await interaction.editReply({ content: '❌ An error occurred.' });
    else await interaction.reply({ content: '❌ An error occurred.', ephemeral: true }).catch(()=>null);
  }
}

async function handleWhitelistSelect(interaction: UserSelectMenuInteraction) {
  const channel = interaction.channel as VoiceChannel;
  if (!channel || !channel.isVoiceBased()) return;

  const targetUserId = interaction.values[0];
  if (!targetUserId) return;

  await interaction.deferUpdate();

  try {
    const existingPerms = channel.permissionOverwrites.cache.get(targetUserId);
    const hasAccess = existingPerms && existingPerms.allow.has(PermissionFlagsBits.Connect);

    if (hasAccess) {
      // Remove
      await channel.permissionOverwrites.delete(targetUserId);
      await interaction.editReply({ content: `✅ <@${targetUserId}> has been **removed** from the whitelist.`, components: [] });
    } else {
      // Add
      await channel.permissionOverwrites.edit(targetUserId, {
        ViewChannel: true,
        Connect: true,
        SendMessages: true
      });
      await interaction.editReply({ content: `✅ <@${targetUserId}> has been **added** to the whitelist.`, components: [] });
    }
  } catch (error) {
    logger.error('Whitelist error:', error);
    await interaction.editReply({ content: '❌ An error occurred.', components: [] });
  }
}
