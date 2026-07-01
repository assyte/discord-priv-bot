import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import type { BotCommand } from '../../../types/index.js';
import { PunishmentHandler } from '../utils/punishmentHandler.js';
import { createEmbed, errorEmbed } from '../../../utils/embeds.js';
import { COLORS, EMOJIS } from '../../../utils/constants.js';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bir üyeyi sunucudan yasakla')
    .addUserOption(opt =>
      opt.setName('üye').setDescription('Yasaklanacak üye').setRequired(true))
    .addStringOption(opt =>
      opt.setName('sebep').setDescription('Yasaklama sebebi').setRequired(false).setMaxLength(500))
    .addIntegerOption(opt =>
      opt.setName('sil').setDescription('Son mesajları sil (gün)').setRequired(false)
        .addChoices({ name: '1 gün', value: 1 }, { name: '7 gün', value: 7 }))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  guildOnly: true,
  cooldown: 5,

  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    await interaction.deferReply();

    const target = interaction.options.getUser('üye', true);
    const reason = interaction.options.getString('sebep') || 'Sebep belirtilmemiş';
    const deleteDays = interaction.options.getInteger('sil') || 0;

    if (target.id === interaction.user.id) {
      await interaction.editReply({ embeds: [errorEmbed('Kendini yasaklayamazsın.')] });
      return;
    }

    const member = await interaction.guild!.members.fetch(target.id).catch(() => null);
    if (member && member.roles.highest.position >= interaction.member!.roles.highest.position) {
      await interaction.editReply({ embeds: [errorEmbed('Bu üyeyi yasaklayamazsın — rolü senden yüksek.')] });
      return;
    }

    await interaction.guild!.members.ban(target, { reason, deleteMessageDays: deleteDays });
    await PunishmentHandler.create({
      guildId: interaction.guild!.id,
      userId: target.id,
      moderatorId: interaction.user.id,
      type: 'ban',
      reason,
    });

    const embed = createEmbed({
      title: `${EMOJIS.ban} Üye Yasaklandı`,
      color: COLORS.danger,
      fields: [
        { name: 'Üye', value: `${target} (${target.id})`, inline: false },
        { name: 'Sebep', value: reason, inline: false },
        { name: 'Yetkili', value: interaction.user.toString(), inline: true },
      ],
    });

    await interaction.editReply({ embeds: [embed] });
  },
};

export default command;
