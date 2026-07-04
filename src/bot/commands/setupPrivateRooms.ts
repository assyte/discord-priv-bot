import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import type { ChatInputCommandInteraction, TextChannel } from 'discord.js';
import type { BotCommand } from '../../types/index.js';
import type { ClutchClient } from '../client.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('SetupPrivateRooms');

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('setup-private-rooms')
    .setDescription('Creates the Private Rooms category and setup panel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  guildOnly: true,
  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    await interaction.deferReply({ ephemeral: true });

    try {
      const guild = interaction.guild!;
      
      const category = await guild.channels.create({
        name: 'PRIVATE ROOMS',
        type: ChannelType.GuildCategory,
      });

      const textChannel = await guild.channels.create({
        name: 'room-creation',
        type: ChannelType.GuildText,
        parent: category.id,
      });

      const embed = new EmbedBuilder()
        .setTitle('🎙️ Private Room Creation')
        .setDescription('Select the type of room you want to create from the menu below.\n\n**Requirements:**\nYou must have at least one of the following verified roles:\n• Steam Verified\n• Faceit Verified\n• Fastcup Verified\n\nIf you haven\'t verified your account yet, please use the button below to start the verification process.')
        .setColor(0x2B2D31);

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('private_room_select')
        .setPlaceholder('Select a room type...')
        .addOptions([
          { label: 'CS 2 Match Making', value: 'cs2_mm', emoji: '🔫' },
          { label: 'CS 2 Faceit', value: 'cs2_faceit', emoji: '🏆' },
          { label: 'CS 2 5v5', value: 'cs2_5v5', emoji: '⚔️' },
          { label: 'CS 1.6 Public', value: 'cs16_public', emoji: '🕹️' },
          { label: 'CS 1.6 Fastcup', value: 'cs16_fastcup', emoji: '⚡' },
          { label: 'CS 1.6 5v5', value: 'cs16_5v5', emoji: '🛡️' },
        ]);

      const verifyBtn = new ButtonBuilder()
        .setLabel('Verify Account')
        .setEmoji('🔗')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.com/channels/' + guild.id + '/1522961876139376640');
        
      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
      const btnRow = new ActionRowBuilder<ButtonBuilder>().addComponents(verifyBtn);

      await textChannel.send({ embeds: [embed], components: [row, btnRow] });

      await interaction.editReply({ content: `✅ Private rooms setup completed successfully! Panel created in <#${textChannel.id}>.` });

    } catch (error) {
      logger.error('Failed to setup private rooms:', error);
      await interaction.editReply({ content: '❌ An error occurred during setup.' });
    }
  },
};

export default command;
