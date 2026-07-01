import { SlashCommandBuilder, PermissionFlagsBits, ChannelType, OverwriteType } from 'discord.js';
import type { ChatInputCommandInteraction, TextChannel, VoiceChannel } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import type { BotCommand } from '../../../types/index.js';
import { createEmbed, errorEmbed } from '../../../utils/embeds.js';
import { COLORS, EMOJIS } from '../../../utils/constants.js';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Kanalı kilit')
    .addChannelOption(opt =>
      opt.setName('kanal').setDescription('Kilitlenecek kanal (varsayılan: bu kanal)').setRequired(false))
    .addStringOption(opt =>
      opt.setName('sebep').setDescription('Kilit sebebi').setRequired(false).setMaxLength(200))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  guildOnly: true,
  cooldown: 5,

  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    await interaction.deferReply({ ephemeral: true });

    const targetChannel = (interaction.options.getChannel('kanal') || interaction.channel) as TextChannel | VoiceChannel;
    const reason = interaction.options.getString('sebep') || 'Belirtilmemiş';

    if (!targetChannel || !targetChannel.isTextBased()) {
      await interaction.editReply({ embeds: [errorEmbed('Geçersiz kanal.')] });
      return;
    }

    await targetChannel.permissionOverwrites.edit(interaction.guild!.roles.everyone, {
      SendMessages: false,
      AddReactions: false,
    });

    const embed = createEmbed({
      title: `${EMOJIS.warning} Kanal Kilitlendi`,
      color: COLORS.warning,
      description: `${targetChannel} kanalı kilitlendi.`,
      fields: [{ name: 'Sebep', value: reason, inline: false }],
    });

    await interaction.editReply({ embeds: [embed] });
  },
};

export default command;

export const unlockCommand: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Kanalın kilidini aç')
    .addChannelOption(opt =>
      opt.setName('kanal').setDescription('Kilidi açılacak kanal').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  guildOnly: true,
  cooldown: 5,

  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    await interaction.deferReply({ ephemeral: true });

    const targetChannel = (interaction.options.getChannel('kanal') || interaction.channel) as TextChannel | VoiceChannel;

    if (!targetChannel || !targetChannel.isTextBased()) {
      await interaction.editReply({ embeds: [errorEmbed('Geçersiz kanal.')] });
      return;
    }

    await targetChannel.permissionOverwrites.edit(interaction.guild!.roles.everyone, {
      SendMessages: null,
      AddReactions: null,
    });

    const embed = createEmbed({
      title: `${EMOJIS.success} Kanal Kilidi Açıldı`,
      color: COLORS.success,
      description: `${targetChannel} kanalının kilidi açıldı.`,
    });

    await interaction.editReply({ embeds: [embed] });
  },
};
