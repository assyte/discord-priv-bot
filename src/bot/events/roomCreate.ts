import { Events, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import type { StringSelectMenuInteraction, VoiceChannel, CategoryChannel } from 'discord.js';
import { Logger } from '../../utils/logger.js';
import { VERIFIED_ROLE_ID, CS16_ROLE_ID } from '../services/roleManager.js';

const logger = new Logger('PrivateRoomCreate');
const STEAM_VERIFIED_ROLE = process.env.ROLE_STEAM_VERIFIED || '1522986492757278810';

const ROOM_NAMES: Record<string, string> = {
  'cs2_mm': 'CS2 MM',
  'cs2_faceit': 'CS2 Faceit',
  'cs2_5v5': 'CS2 5v5',
  'cs16_public': 'CS1.6 Pub',
  'cs16_fastcup': 'CS1.6 Fastcup',
  'cs16_5v5': 'CS1.6 5v5',
};

export default {
  name: Events.InteractionCreate,
  async execute(client: any, interaction: any) {
    if (!interaction.isStringSelectMenu()) return;
    if (interaction.customId !== 'private_room_select') return;

    await interaction.deferReply({ ephemeral: true });

    try {
      const member = interaction.member as any;
      const guild = interaction.guild!;

      const hasFaceit = VERIFIED_ROLE_ID && member.roles.cache.has(VERIFIED_ROLE_ID);
      const hasFastcup = CS16_ROLE_ID && member.roles.cache.has(CS16_ROLE_ID);
      const hasSteam = STEAM_VERIFIED_ROLE && member.roles.cache.has(STEAM_VERIFIED_ROLE);

      if (!hasFaceit && !hasFastcup && !hasSteam) {
        return interaction.editReply({ 
          content: '❌ You must have **Steam Verified**, **Faceit Verified**, or **Fastcup Verified** role to create a private room!\n\nPlease use the **Verify Account** button below the menu to get verified.' 
        });
      }

      const selectedValue = interaction.values[0];
      const prefix = ROOM_NAMES[selectedValue] || 'Room';
      const channelName = `[${prefix}] ${member.user.username}`;
      const category = interaction.channel?.parent as CategoryChannel | null;

      // Create Voice Channel
      const voiceChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildVoice,
        parent: category?.id,
        permissionOverwrites: [
          {
            id: guild.id, // @everyone
            allow: [PermissionFlagsBits.ViewChannel],
            deny: [PermissionFlagsBits.Connect, PermissionFlagsBits.SendMessages],
          },
          {
            id: member.id, // Creator
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.Connect, PermissionFlagsBits.SendMessages],
          },
        ],
      }) as VoiceChannel;

      // Add verified roles to permission overwrites if they exist
      const verifiedRoles = [VERIFIED_ROLE_ID, CS16_ROLE_ID, STEAM_VERIFIED_ROLE].filter(Boolean);
      for (const roleId of verifiedRoles) {
        await voiceChannel.permissionOverwrites.create(roleId, {
          Connect: true,
          SendMessages: true,
        }).catch(() => null);
      }

      // Room Management Panel
      const embed = new EmbedBuilder()
        .setTitle('⚙️ Room Management')
        .setDescription(`Welcome to your private room, <@${member.id}>!\n\nYou can manage your room using the buttons below.\n\n🔒 **Lock / Unlock**: Toggles the room lock for everyone.\n👥 **Whitelist**: Add or remove specific users to bypass the lock.\n🗑️ **Close**: Deletes the room completely.`)
        .setColor(0x2B2D31);

      const lockBtn = new ButtonBuilder().setCustomId('pr_lock').setLabel('Lock / Unlock').setStyle(ButtonStyle.Primary).setEmoji('🔒');
      const wlBtn = new ButtonBuilder().setCustomId('pr_whitelist').setLabel('Whitelist User').setStyle(ButtonStyle.Secondary).setEmoji('👥');
      const closeBtn = new ButtonBuilder().setCustomId('pr_close').setLabel('Close Room').setStyle(ButtonStyle.Danger).setEmoji('🗑️');

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(lockBtn, wlBtn, closeBtn);

      await voiceChannel.send({ embeds: [embed], components: [row] });

      // Odayı oluşturan kişiyi odaya taşı (eğer bir seste ise)
      if (member.voice?.channelId) {
        await member.voice.setChannel(voiceChannel).catch(() => null);
      }

      await interaction.editReply({ content: `✅ Your private room has been created: <#${voiceChannel.id}>` });

    } catch (error) {
      logger.error('Failed to create private room:', error);
      await interaction.editReply({ content: '❌ An error occurred while creating the room.' });
    }
  },
};

export default event;
