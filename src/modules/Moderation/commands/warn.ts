import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import type { BotCommand } from '../../../types/index.js';
import { PunishmentHandler } from '../utils/punishmentHandler.js';
import { createEmbed, errorEmbed } from '../../../utils/embeds.js';
import { COLORS, EMOJIS } from '../../../utils/constants.js';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('uyarı')
    .setDescription('Bir üyeye uyarı ver')
    .addUserOption(opt =>
      opt.setName('üye').setDescription('Uyarılacak üye').setRequired(true))
    .addStringOption(opt =>
      opt.setName('sebep').setDescription('Uyarı sebebi').setRequired(true).setMaxLength(500))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  guildOnly: true,
  cooldown: 3,
  category: 'Moderasyon',

  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    await interaction.deferReply();

    const target = interaction.options.getUser('üye', true);
    const reason = interaction.options.getString('sebep', true);

    if (target.id === interaction.user.id) {
      await interaction.editReply({ embeds: [errorEmbed('Kendini uyaramazsın.')] });
      return;
    }

    const infraction = await PunishmentHandler.create({
      guildId: interaction.guild!.id,
      userId: target.id,
      moderatorId: interaction.user.id,
      type: 'uyarı',
      reason,
    });

    const infractions = await PunishmentHandler.getMemberInfractions(interaction.guild!.id, target.id);
    const warnCount = infractions.filter(i => i.type === 'uyarı').length;

    const embed = createEmbed({
      title: `${EMOJIS.warn} Uyarı Verildi`,
      color: COLORS.warning,
      fields: [
        { name: 'Üye', value: `${target} (${target.id})`, inline: false },
        { name: 'Sebep', value: reason, inline: false },
        { name: 'Uyarı Sayısı', value: warnCount.toString(), inline: true },
        { name: 'Yetkili', value: interaction.user.toString(), inline: true },
      ],
      footer: `Ceza #${infraction?.id}`,
    });

    await interaction.editReply({ embeds: [embed] });

    // Otomatik mute at belirli uyarı sayısında
    if (warnCount >= 5) {
      const member = await interaction.guild!.members.fetch(target.id).catch(() => null);
      if (member) {
        await member.timeout(3600000, '5 uyarı limiti aşıldı — otomatik 1 saat mute');
      }
    }
  },
};

export default command;
