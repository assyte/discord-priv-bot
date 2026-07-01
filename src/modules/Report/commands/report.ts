import { SlashCommandBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import type { BotCommand } from '../../../types/index.js';
import { ReportService } from '../services/reportService.js';
import { createEmbed, errorEmbed, successEmbed } from '../../../utils/embeds.js';
import { COLORS, EMOJIS } from '../../../utils/constants.js';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('rapor')
    .setDescription('Bir üyeyi rapor et')
    .addUserOption(option =>
      option.setName('üye')
        .setDescription('Rapor edilecek üye')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('sebep')
        .setDescription('Rapor sebebi')
        .setRequired(true)
        .setMaxLength(1000))
    .addStringOption(option =>
      option.setName('kanıt')
        .setDescription('Kanıt bağlantısı (isteğe bağlı)')
        .setRequired(false))
    .addChannelOption(option =>
      option.setName('kanal')
        .setDescription('Olayın gerçekleştiği kanal')
        .setRequired(false)),

  guildOnly: true,
  cooldown: 30,
  category: 'Rapor',

  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    await interaction.deferReply({ ephemeral: true });

    const target = interaction.options.getUser('üye', true);
    const reason = interaction.options.getString('sebep', true);
    const evidence = interaction.options.getString('kanıt');
    const channel = interaction.options.getChannel('kanal');

    if (target.id === interaction.user.id) {
      await interaction.editReply({ embeds: [errorEmbed('Kendini rapor edemezsin.')] });
      return;
    }

    if (target.bot) {
      await interaction.editReply({ embeds: [errorEmbed('Botları rapor edemezsin.')] });
      return;
    }

    const report = await ReportService.createReport({
      guildId: interaction.guild!.id,
      reporterId: interaction.user.id,
      targetId: target.id,
      reason,
      channelId: channel?.id,
      evidenceUrl: evidence ?? undefined,
    });

    const reportId = report?.id ?? '?';

    const embed = createEmbed({
      title: `${EMOJIS.report} Rapor Gönderildi`,
      description: `Raporun başarıyla kaydedildi. Rapor numarası: **#${reportId}**`,
      color: COLORS.success,
      fields: [
        { name: 'Rapor Edilen', value: target.toString(), inline: true },
        { name: 'Sebep', value: reason, inline: false },
      ],
      footer: 'Yetkililer en kısa sürede inceleyecek.',
    });

    await interaction.editReply({ embeds: [embed] });

    const logEmbed = createEmbed({
      title: `${EMOJIS.report} Yeni Rapor`,
      color: COLORS.warning,
      fields: [
        { name: 'Rapor Eden', value: interaction.user.toString(), inline: true },
        { name: 'Rapor Edilen', value: target.toString(), inline: true },
        { name: 'Sebep', value: reason, inline: false },
        { name: 'Kanal', value: channel?.toString() || 'Belirtilmemiş', inline: true },
        { name: 'Rapor No', value: `#${reportId}`, inline: true },
      ],
      footer: `ID: ${interaction.user.id} → ${target.id}`,
    });

    if (evidence) {
      logEmbed.addFields({ name: 'Kanıt', value: evidence, inline: false });
    }

    try {
      const guildConfig = await import('../../../database/connection.js').then(m => {
        const db = m.Database.getInstance().db;
        return db.query.guilds.findFirst({
          where: (g: any, { eq }: any) => eq(g.id, interaction.guild!.id),
        });
      });

      if (guildConfig?.reportChannel) {
        const reportChannel = interaction.guild!.channels.cache.get(guildConfig.reportChannel);
        if (reportChannel?.isTextBased()) {
          const msg = await reportChannel.send({ embeds: [logEmbed] });
          if (report) await ReportService.addMessageId(report.id, msg.id, reportChannel.id);
        }
      }
    } catch {
      // Report kanalı yapılandırılmamış
    }
  },
};

export default command;
