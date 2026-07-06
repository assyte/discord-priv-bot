import { 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  EmbedBuilder, 
  StringSelectMenuInteraction,
  GuildMember,
  TextChannel
} from 'discord.js';
import { Logger } from '../../utils/logger.js';
import { getClient } from '../client.js';

const logger = new Logger('RolePanelManager');

const BOOSTER_ROLE_ID = '1264200789560135691';

export async function sendRoleSelectionPanel(channelId: string) {
  const client = getClient();
  const channel = await client.channels.fetch(channelId) as TextChannel;
  if (!channel) return;

  const guild = channel.guild;
  
  // 1. Fetch Rank Roles
  const cs2Ranks = guild.roles.cache
    .filter(r => r.name.startsWith('CS 2 | '))
    .sort((a, b) => b.position - a.position) // Sort by role hierarchy
    .map(r => ({ label: r.name.replace('CS 2 | ', ''), value: r.id }));

  const cs2PremierRanks = guild.roles.cache
    .filter(r => r.name.startsWith('CS2 Premier | '))
    .sort((a, b) => b.position - a.position)
    .map(r => ({ label: r.name.replace('CS2 Premier | ', ''), value: r.id }));

  // Discord select menu max is 25 options. 18 ranks + 1 unranked = 19. It fits!
  
  // 2. Fetch Color Roles
  const colorRoles = guild.roles.cache
    .filter(r => r.name.startsWith('Color: '))
    .map(r => ({ label: r.name.replace('Color: ', ''), value: r.id }));

  const embed = new EmbedBuilder()
    .setColor(0xF47FFF)
    .setTitle('✨ PROFILE CUSTOMIZATION PANEL ✨')
    .setDescription(
      '> Welcome to the customization panel! Here you can personalize your profile and chat experience.\n\n' +
      '**🔫 CS 2 Normal Rank Selection**\n' +
      'You can manually select your current CS2 Match Making rank.\n\n' +
      '**🏆 CS 2 Premier Rank Selection**\n' +
      'Select your CS2 Premier ELO range.\n\n' +
      '**💎 Premium Chat Colors**\n' +
      'Boosters can choose from 10 exclusive premium gradient/vibrant colors for their name in chat!\n' +
      '*Note: You must be a Server Booster to use this feature.*\n\n' +
      '**🏷️ Nickname Changes**\n' +
      'Server nickname changes are restricted. Only **Boosters** can change their nickname by typing `.nick <new name>` in any chat channel.'
    )
    .setImage('https://cdn.discordapp.com/attachments/1183060249568215160/1183060250025381908/premium_banner.gif') // placeholder or remove
    .setFooter({ text: 'Clutch Premium Services', iconURL: client.user?.displayAvatarURL() });

  embed.setImage(null); // remove placeholder image if not real

  const rankSelect = new StringSelectMenuBuilder()
    .setCustomId('cs2_rank_select')
    .setPlaceholder('Select your CS2 Normal Rank...')
    .addOptions(cs2Ranks.slice(0, 25)); // Ensure max 25

  const premierSelect = new StringSelectMenuBuilder()
    .setCustomId('cs2_premier_select')
    .setPlaceholder('Select your CS2 Premier Rank...')
    .addOptions(cs2PremierRanks.slice(0, 25));

  const colorSelect = new StringSelectMenuBuilder()
    .setCustomId('chat_color_select')
    .setPlaceholder('Select a Premium Chat Color (Boosters Only)...')
    .addOptions([
      ...colorRoles.slice(0, 24),
      { label: 'Reset Color', value: 'reset_color', description: 'Remove your chat color' }
    ]);

  const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(rankSelect);
  const row2 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(premierSelect);
  const row3 = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(colorSelect);

  // Clear previous messages or edit existing
  const messages = await channel.messages.fetch({ limit: 10 });
  const botId = client.user?.id;
  let existingPanel = null;

  if (botId) {
    for (const [_, msg] of messages) {
      if (msg.author.id === botId && msg.embeds.length > 0 && msg.embeds[0].title === '✨ PROFILE CUSTOMIZATION PANEL ✨') {
        existingPanel = msg;
        break;
      }
    }
  }

  if (existingPanel) {
    await existingPanel.edit({ embeds: [embed], components: [row1, row2, row3] });
    logger.info('Role selection panel updated (not recreated)');
  } else {
    await channel.send({ embeds: [embed], components: [row1, row2, row3] });
    logger.info('Role selection panel sent to ' + channelId);
  }
}

import { STEAM_VERIFIED_ROLE_ID } from './roleManager.js';

export async function handleCS2RankSelect(interaction: StringSelectMenuInteraction) {
  await interaction.deferReply({ flags: ['Ephemeral'] });
  
  const member = interaction.member as GuildMember;
  const selectedRoleId = interaction.values[0];
  if (!selectedRoleId) return interaction.editReply('❌ No role selected.');

  // Check if Steam Verified
  if (!member.roles.cache.has(STEAM_VERIFIED_ROLE_ID)) {
    return interaction.editReply('❌ **Access Denied!** You must connect and verify your Steam account first before you can select a CS2 Rank. Please go to the verification channel.');
  }
  
  // Find all CS2 rank roles
  const allCs2Roles = interaction.guild!.roles.cache
    .filter(r => r.name.startsWith('CS 2 | '))
    .map(r => r.id);

  // Remove existing CS2 roles
  const rolesToRemove = member.roles.cache.filter(r => allCs2Roles.includes(r.id)).map(r => r.id);
  
  try {
    if (rolesToRemove.length > 0) {
      await member.roles.remove(rolesToRemove);
    }
    await member.roles.add(selectedRoleId);
    const roleName = interaction.guild!.roles.cache.get(selectedRoleId)?.name;
    
    await interaction.editReply(`✅ Successfully updated your rank to **${roleName}**!`);
  } catch (error) {
    logger.error('Error in handleCS2RankSelect:', error);
    await interaction.editReply('❌ An error occurred while updating your roles.');
  }
}

export async function handleCS2PremierSelect(interaction: StringSelectMenuInteraction) {
  await interaction.deferReply({ flags: ['Ephemeral'] });
  
  const member = interaction.member as GuildMember;
  const selectedRoleId = interaction.values[0];
  if (!selectedRoleId) return interaction.editReply('❌ No role selected.');

  if (!member.roles.cache.has(STEAM_VERIFIED_ROLE_ID)) {
    return interaction.editReply('❌ **Access Denied!** You must connect and verify your Steam account first before you can select a CS2 Premier Rank. Please go to the verification channel.');
  }
  
  const allPremierRoles = interaction.guild!.roles.cache
    .filter(r => r.name.startsWith('CS2 Premier | '))
    .map(r => r.id);

  const rolesToRemove = member.roles.cache.filter(r => allPremierRoles.includes(r.id)).map(r => r.id);
  
  try {
    if (rolesToRemove.length > 0) {
      await member.roles.remove(rolesToRemove);
    }
    await member.roles.add(selectedRoleId);
    const roleName = interaction.guild!.roles.cache.get(selectedRoleId)?.name;
    
    await interaction.editReply(`✅ Successfully updated your Premier rank to **${roleName}**!`);
  } catch (error) {
    logger.error('Error in handleCS2PremierSelect:', error);
    await interaction.editReply('❌ An error occurred while updating your roles.');
  }
}

export async function handleChatColorSelect(interaction: StringSelectMenuInteraction) {
  await interaction.deferReply({ flags: ['Ephemeral'] });
  
  const member = interaction.member as GuildMember;
  const selectedRoleId = interaction.values[0];
  if (!selectedRoleId) return interaction.editReply('❌ No role selected.');

  // Check if booster
  const isBooster = member.roles.cache.has(BOOSTER_ROLE_ID) || member.premiumSince !== null;
  
  if (!isBooster) {
    return interaction.editReply('❌ **Access Denied!** You must be a Server Booster to select a premium chat color. Boost the server to unlock this feature!');
  }

  // Find all color roles
  const allColorRoles = interaction.guild!.roles.cache
    .filter(r => r.name.startsWith('Color: '))
    .map(r => r.id);

  // Remove existing color roles
  const rolesToRemove = member.roles.cache.filter(r => allColorRoles.includes(r.id)).map(r => r.id);
  
  try {
    if (rolesToRemove.length > 0) {
      await member.roles.remove(rolesToRemove);
    }

    if (selectedRoleId === 'reset_color') {
      await interaction.editReply('✅ Successfully removed your premium chat color!');
    } else {
      await member.roles.add(selectedRoleId);
      const roleName = interaction.guild!.roles.cache.get(selectedRoleId)?.name;
      await interaction.editReply(`✅ Successfully updated your chat color to **${roleName?.replace('Color: ', '')}**!`);
    }
  } catch (error) {
    logger.error('Error in handleChatColorSelect:', error);
    await interaction.editReply('❌ An error occurred while updating your roles.');
  }
}
