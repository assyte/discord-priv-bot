import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import type { BotCommand } from '../../../types/index.js';
import { PunishmentHandler } from '../utils/punishmentHandler.js';
import { createEmbed, errorEmbed } from '../../../utils/embeds.js';
import { COLORS, EMOJIS } from '../../../utils/constants.js';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('ceza-kaldır')
    .setDescription('Bir ceza kaydını sil')
    .addIntegerOption(opt =>
      opt.setName('id').setDescription('Ceza ID').setRequired(true))
    .addStringOption(opt =>
      opt.setName('sebep').setDescription('Kaldırma sebebi').setRequired(false).setMaxLength(200))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  guildOnly: true,
  cooldown: 3,

  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    await interaction.deferReply();

    const infractionId = interaction.options.getInteger('id', true);
    const reason = interaction.options.getString('sebep') || 'Belirtilmemiş';

    await PunishmentHandler.deactivate(infractionId, interaction.guild!.id);

    const embed = createEmbed({
      title: `${EMOJIS.success} Ceza Kaldırıldı`,
      color: COLORS.success,
      fields: [
        { name: 'Ceza ID', value: `#${infractionId}`, inline: true },
        { name: 'Sebep', value: reason, inline: false },
        { name: 'Yetkili', value: interaction.user.toString(), inline: true },
      ],
    });

    await interaction.editReply({ embeds: [embed] });
  },
};

export default command;
