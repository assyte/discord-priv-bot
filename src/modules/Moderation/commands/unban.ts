import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import type { BotCommand } from '../../../types/index.js';
import { createEmbed, errorEmbed } from '../../../utils/embeds.js';
import { COLORS, EMOJIS } from '../../../utils/constants.js';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Bir üyenin yasağını kaldır')
    .addStringOption(opt =>
      opt.setName('id').setDescription('Yasaklı üyenin ID\'si').setRequired(true))
    .addStringOption(opt =>
      opt.setName('sebep').setDescription('Sebep').setRequired(false).setMaxLength(500))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  guildOnly: true,
  cooldown: 5,

  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    await interaction.deferReply();

    const targetId = interaction.options.getString('id', true);
    const reason = interaction.options.getString('sebep') || 'Sebep belirtilmemiş';

    try {
      await interaction.guild!.bans.fetch(targetId);
    } catch {
      await interaction.editReply({ embeds: [errorEmbed('Bu ID\'ye ait bir yasak bulunamadı.')] });
      return;
    }

    await interaction.guild!.members.unban(targetId, reason);

    const embed = createEmbed({
      title: `${EMOJIS.success} Yasan Kaldırıldı`,
      color: COLORS.success,
      fields: [
        { name: 'Üye ID', value: targetId, inline: false },
        { name: 'Sebep', value: reason, inline: false },
        { name: 'Yetkili', value: interaction.user.toString(), inline: true },
      ],
    });

    await interaction.editReply({ embeds: [embed] });
  },
};

export default command;
