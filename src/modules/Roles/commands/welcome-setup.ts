import { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import type { BotCommand } from '../../../types/index.js';
import { createEmbed } from '../../../utils/embeds.js';
import { COLORS } from '../../../utils/constants.js';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('welcome-setup')
    .setDescription('Karşılama mesajını ve rol butonlarını #welcome kanalına gönder')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  guildOnly: true,

  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild!;
    const welcomeChannel = guild.channels.cache.find(c => c.name === 'welcome');
    if (!welcomeChannel?.isTextBased()) {
      await interaction.editReply({ content: '❌ #welcome kanalı bulunamadı.' });
      return;
    }

    const embed = createEmbed({
      title: '✦ 𝐖𝐄𝐋𝐂𝐎𝐌𝐄 ✦',
      color: COLORS.success,
      description: [
        '> *18+ Private Community — No Drama, No Toxicity*',
        '',
        '**📍 Get Started:**',
        '1. Read <#kurallar>',
        '2. Click the buttons below to choose your roles',
        '3. Join the chat!',
        '',
        '**🌐 Language:**',
        '• Turkish channels are visible by default',
        '• Click 🌍 **Global** to also see English channels',
        '',
        '**📌 Rules:**',
        '• No drama, toxicity or fighting',
        '• Swearing allowed in text (not personal)',
        '• In voice: no swearing at religion/morality',
        '• Private rooms: no entry without permission',
      ].join('\n'),
      footer: { text: 'ᴅᴇᴠ ʙʏ ᴀꜱꜱʏᴛᴇ • premium bot' },
    });

    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId('role_global').setLabel('Global').setEmoji('🌍').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('role_oyun').setLabel('Oyun').setEmoji('🎮').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('role_muzik').setLabel('Müzik').setEmoji('🎵').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('role_18').setLabel('+18').setEmoji('🔞').setStyle(ButtonStyle.Danger),
    );

    await welcomeChannel.send({ embeds: [embed], components: [row1] });
    await interaction.editReply({ content: '✅ Karşılama mesajı ve rol butonları gönderildi!' });
  },
};

export default command;
