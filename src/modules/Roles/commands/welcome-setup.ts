import { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import type { BotCommand } from '../../../types/index.js';
import { createEmbed } from '../../../utils/embeds.js';
import { COLORS } from '../../../utils/constants.js';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('welcome-setup')
    .setDescription('Karşılama mesajını ve rol buton panelini gönder')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  guildOnly: true,

  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    await interaction.deferReply({ ephemeral: true });
    const guild = interaction.guild!;

    // #welcome mesajı
    const welcomeCh = guild.channels.cache.find(c => c.name === 'welcome');
    if (welcomeCh?.isTextBased()) {
      const welcomeEmbed = createEmbed({
        title: '✦ 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 ✦',
        color: COLORS.success,
        description: [
          '> *18+ Private Community — No Drama, No Toxicity*',
          '',
          'We\'re glad to have you here!',
          '',
          '📍 Before you start:',
          '• Read <#rules>',
          '• Click the button below to select your roles',
          '',
          'Have fun and be respectful!',
        ].join('\n'),
        footer: { text: 'ᴅᴇᴠ ʙʏ ᴀꜱꜱʏᴛᴇ • premium bot' },
      });

      const redirectRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('redirect_roles')
          .setLabel('🎭 Select Your Roles')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🎭'),
      );

      await welcomeCh.send({ embeds: [welcomeEmbed], components: [redirectRow] });
    }

    // #role-select mesajı
    const roleCh = guild.channels.cache.find(c => c.name === 'role-select');
    if (roleCh?.isTextBased()) {
      // Önce eski bot mesajlarını temizle
      const oldMessages = await roleCh.messages.fetch({ limit: 20 });
      const botMessages = oldMessages.filter(m => m.author.id === client.client.user!.id);
      for (const [, m] of botMessages) await m.delete().catch(() => {});

      const panelEmbed = createEmbed({
        title: '✦ 𝐏𝐑𝐄𝐌𝐈𝐔𝐌 𝐑𝐎𝐋𝐄 𝐏𝐀𝐍𝐄𝐋 ✦',
        color: COLORS.primary,
        description: [
          'Click the buttons below to get your roles!',
          '',
          '**🎮 Roles you can get:**',
          '',
          '🌍 **Global** — See English channels',
          '🎮 **Oyun** — Access gaming voice channels',
          '🎵 **Müzik** — Access music rooms',
          '🔞 **+18** — View adult content',
          '📷 **Camera** — Use video in voice',
          '🎥 **Streamer** — Go live / stream',
          '',
          'Click a button to toggle the role on/off.',
        ].join('\n'),
        footer: { text: 'ᴅᴇᴠ ʙʏ ᴀꜱꜱʏᴛᴇ • premium bot' },
      });

      const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('role_global').setLabel('Global').setEmoji('🌍').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('role_oyun').setLabel('Oyun').setEmoji('🎮').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('role_muzik').setLabel('Müzik').setEmoji('🎵').setStyle(ButtonStyle.Secondary),
      );

      const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId('role_18').setLabel('+18').setEmoji('🔞').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('role_camera').setLabel('Camera').setEmoji('📷').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('role_streamer').setLabel('Streamer').setEmoji('🎥').setStyle(ButtonStyle.Primary),
      );

      await roleCh.send({ embeds: [panelEmbed], components: [row1, row2] });
    }

    await interaction.editReply({ content: '✅ Welcome ve Role-Select kanalları güncellendi!' });
  },
};

export default command;
