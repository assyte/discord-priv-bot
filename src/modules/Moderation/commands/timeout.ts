import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { ChatInputCommandInteraction, GuildMemberRoleManager } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import type { BotCommand } from '../../../types/index.js';
import { PunishmentHandler } from '../utils/punishmentHandler.js';
import { createEmbed, errorEmbed } from '../../../utils/embeds.js';
import { COLORS, EMOJIS } from '../../../utils/constants.js';
import { formatDuration } from '../../../utils/formatters.js';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Bir üyeye zaman aşımı uygula')
    .addUserOption(opt =>
      opt.setName('üye').setDescription('Üye').setRequired(true))
    .addStringOption(opt =>
      opt.setName('süre').setDescription('Süre (örn: 10m, 1h, 1d)').setRequired(true))
    .addStringOption(opt =>
      opt.setName('sebep').setDescription('Sebep').setRequired(false).setMaxLength(500))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  guildOnly: true,
  cooldown: 5,
  category: 'Moderasyon',

  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    await interaction.deferReply();

    const target = interaction.options.getUser('üye', true);
    const rawDuration = interaction.options.getString('süre', true);
    const reason = interaction.options.getString('sebep') || 'Sebep belirtilmemiş';

    if (target.id === interaction.user.id) {
      await interaction.editReply({ embeds: [errorEmbed('Kendine timeout uygulayamazsın.')] });
      return;
    }

    const member = await interaction.guild!.members.fetch(target.id).catch(() => null);
    if (!member) {
      await interaction.editReply({ embeds: [errorEmbed('Üye bulunamadı.')] });
      return;
    }

    if (member.roles.highest.position >= (interaction.member!.roles as GuildMemberRoleManager).highest.position) {
      await interaction.editReply({ embeds: [errorEmbed(`Bu üyeyi timeout'a atamazsın.`)] });
      return;
    }

    const durationMs = parseDuration(rawDuration);
    if (!durationMs || durationMs < 10000) {
      await interaction.editReply({ embeds: [errorEmbed('Geçersiz süre. Örn: `10m`, `1h`, `1d`')] });
      return;
    }

    await member.timeout(durationMs, reason);
    await PunishmentHandler.create({
      guildId: interaction.guild!.id,
      userId: target.id,
      moderatorId: interaction.user.id,
      type: 'timeout',
      reason,
      duration: Math.floor(durationMs / 1000),
    });

    const embed = createEmbed({
      title: `${EMOJIS.warn} Timeout Uygulandı`,
      color: COLORS.warning,
      fields: [
        { name: 'Üye', value: `${target} (${target.id})`, inline: false },
        { name: 'Süre', value: formatDuration(durationMs), inline: true },
        { name: 'Sebep', value: reason, inline: false },
        { name: 'Yetkili', value: interaction.user.toString(), inline: true },
      ],
    });

    await interaction.editReply({ embeds: [embed] });
  },
};

export default command;

function parseDuration(input: string): number | null {
  const match = input.match(/^(\d+)([smhd])$/);
  if (!match) return null;
  const value = parseInt(match[1]!);
  const unit = match[2]!;
  const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return value * (multipliers[unit] ?? 0);
}
