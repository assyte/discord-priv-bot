import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { ChatInputCommandInteraction, GuildMemberRoleManager } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import type { BotCommand } from '../../../types/index.js';
import { PunishmentHandler } from '../utils/punishmentHandler.js';
import { createEmbed, errorEmbed } from '../../../utils/embeds.js';
import { COLORS, EMOJIS } from '../../../utils/constants.js';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Bir üyeyi sunucudan at')
    .addUserOption(opt =>
      opt.setName('üye').setDescription('Atılacak üye').setRequired(true))
    .addStringOption(opt =>
      opt.setName('sebep').setDescription('Atılma sebebi').setRequired(false).setMaxLength(500))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  guildOnly: true,
  cooldown: 5,

  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    await interaction.deferReply();

    const target = interaction.options.getUser('üye', true);
    const reason = interaction.options.getString('sebep') || 'Sebep belirtilmemiş';

    if (target.id === interaction.user.id) {
      await interaction.editReply({ embeds: [errorEmbed('Kendini atamazsın.')] });
      return;
    }

    const member = await interaction.guild!.members.fetch(target.id).catch(() => null);
    if (!member) {
      await interaction.editReply({ embeds: [errorEmbed('Bu üye sunucuda bulunamadı.')] });
      return;
    }

    if (member.roles.highest.position >= (interaction.member!.roles as GuildMemberRoleManager).highest.position) {
      await interaction.editReply({ embeds: [errorEmbed('Bu üyeyi atamazsın — rolü senden yüksek.')] });
      return;
    }

    await member.kick(reason);
    await PunishmentHandler.create({
      guildId: interaction.guild!.id,
      userId: target.id,
      moderatorId: interaction.user.id,
      type: 'kick',
      reason,
    });

    const embed = createEmbed({
      title: `${EMOJIS.kick} Üye Atıldı`,
      color: COLORS.warning,
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
