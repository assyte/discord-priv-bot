import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import type { BotCommand } from '../../../types/index.js';
import { PunishmentHandler } from '../utils/punishmentHandler.js';
import { createEmbed, errorEmbed } from '../../../utils/embeds.js';
import { COLORS } from '../../../utils/constants.js';
import { formatDate } from '../../../utils/formatters.js';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('ceza-sorgula')
    .setDescription('Bir üyenin ceza geçmişini sorgula')
    .addUserOption(opt =>
      opt.setName('üye').setDescription('Sorgulanacak üye').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  guildOnly: true,
  cooldown: 5,

  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    await interaction.deferReply();

    const target = interaction.options.getUser('üye', true);
    const infractions = await PunishmentHandler.getMemberInfractions(interaction.guild!.id, target.id);

    if (infractions.length === 0) {
      await interaction.editReply({ embeds: [errorEmbed(`${target.tag} üyesinin hiç cezası bulunmuyor.`)] });
      return;
    }

    const typeEmojis: Record<string, string> = {
      ban: '🔨', kick: '👢', mute: '🔇', vmute: '🔇', uyarı: '⚠️', timeout: '⏱',
    };

    const fields = infractions.slice(0, 25).map(i => ({
      name: `#${i.id} ${typeEmojis[i.type] || '📋'} ${i.type.toUpperCase()}`,
      value: `**Sebep:** ${i.reason}\n**Yetkili:** \`${i.moderatorId}\`\n**Tarih:** ${formatDate(i.createdAt)}\n**Durum:** ${i.active ? '🟢 Aktif' : '🔴 Pasif'}`,
      inline: false,
    }));

    const activeCount = infractions.filter(i => i.active).length;

    const embed = createEmbed({
      title: `📋 Ceza Geçmişi — ${target.tag}`,
      color: COLORS.info,
      fields: [
        { name: 'Toplam Ceza', value: infractions.length.toString(), inline: true },
        { name: 'Aktif Ceza', value: activeCount.toString(), inline: true },
        ...fields,
      ],
      footer: `ID: ${target.id}`,
    });

    await interaction.editReply({ embeds: [embed] });
  },
};

export default command;
