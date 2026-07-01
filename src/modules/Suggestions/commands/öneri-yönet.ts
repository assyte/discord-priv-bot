import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import type { BotCommand } from '../../../types/index.js';
import { SuggestionService } from '../services/suggestionService.js';
import { createEmbed, errorEmbed, successEmbed } from '../../../utils/embeds.js';
import { COLORS, EMOJIS } from '../../../utils/constants.js';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('öneri-yönet')
    .setDescription('Önerileri yönet (Admin)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
      sub.setName('incele')
        .setDescription('Bir öneriyi beklemeden çıkar')
        .addIntegerOption(opt =>
          opt.setName('id').setDescription('Öneri ID').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('kabul')
        .setDescription('Bir öneriyi kabul et')
        .addIntegerOption(opt =>
          opt.setName('id').setDescription('Öneri ID').setRequired(true))
        .addStringOption(opt =>
          opt.setName('cevap').setDescription('Admin cevabı').setRequired(false)))
    .addSubcommand(sub =>
      sub.setName('reddet')
        .setDescription('Bir öneriyi reddet')
        .addIntegerOption(opt =>
          opt.setName('id').setDescription('Öneri ID').setRequired(true))
        .addStringOption(opt =>
          opt.setName('sebep').setDescription('Reddetme sebebi').setRequired(false)))
    .addSubcommand(sub =>
      sub.setName('istatistik')
        .setDescription('Öneri istatistiklerini göster')),

  guildOnly: true,

  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    await interaction.deferReply();

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'istatistik') {
      const stats = await SuggestionService.getStats(interaction.guild!.id);
      const embed = createEmbed({
        title: `${EMOJIS.suggestion} Öneri İstatistikleri`,
        color: COLORS.info,
        fields: [
          { name: 'Toplam', value: stats.total.toString(), inline: true },
          { name: '⏳ Beklemede', value: stats.pending.toString(), inline: true },
          { name: '🔍 İnceleniyor', value: stats.reviewing.toString(), inline: true },
          { name: '✅ Kabul', value: stats.accepted.toString(), inline: true },
          { name: '❌ Red', value: stats.rejected.toString(), inline: true },
        ],
      });
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const id = interaction.options.getInteger('id', true);
    const suggestion = await SuggestionService.get(id, interaction.guild!.id);

    if (!suggestion) {
      await interaction.editReply({ embeds: [errorEmbed(`#${id} numaralı öneri bulunamadı.`)] });
      return;
    }

    let status: string;
    let response: string | undefined;
    let embedTitle: string;

    switch (subcommand) {
      case 'incele':
        status = 'değerlendiriliyor';
        embedTitle = `${EMOJIS.info} Öneri #${id} İnceleniyor`;
        break;
      case 'kabul':
        status = 'kabul';
        response = interaction.options.getString('cevap') || undefined;
        embedTitle = `${EMOJIS.success} Öneri #${id} Kabul Edildi`;
        break;
      case 'reddet':
        status = 'red';
        response = interaction.options.getString('sebep') || undefined;
        embedTitle = `${EMOJIS.error} Öneri #${id} Reddedildi`;
        break;
      default:
        return;
    }

    await SuggestionService.updateStatus(id, interaction.guild!.id, status, response, interaction.user.id);

    const embed = createEmbed({
      title: embedTitle,
      color: status === 'kabul' ? COLORS.success : status === 'red' ? COLORS.danger : COLORS.warning,
      fields: [
        { name: 'Başlık', value: suggestion.title, inline: false },
        { name: 'Yeni Durum', value: status, inline: true },
        { name: 'Yetkili', value: interaction.user.toString(), inline: true },
      ],
    });

    if (response) {
      embed.addFields({ name: 'Cevap', value: response, inline: false });
    }

    await interaction.editReply({ embeds: [embed] });

    if (suggestion.messageId && suggestion.channelId) {
      try {
        const channel = interaction.guild!.channels.cache.get(suggestion.channelId);
        if (channel?.isTextBased()) {
          const msg = await channel.messages.fetch(suggestion.messageId);
          await msg.edit({
            embeds: [createEmbed({
              title: `💡 Öneri #${id}`,
              color: status === 'kabul' ? COLORS.success : COLORS.danger,
              fields: [
                { name: 'Başlık', value: suggestion.title, inline: false },
                { name: 'Durum', value: status, inline: true },
                { name: 'Yetkili Cevabı', value: response || 'Belirtilmemiş', inline: false },
              ],
            })],
          });
        }
      } catch {
        // Mesaj silinmiş veya kanal bulunamıyor
      }
    }
  },
};

export default command;
