import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import type { BotCommand } from '../../../types/index.js';
import { SuggestionService } from '../services/suggestionService.js';
import { createEmbed, errorEmbed } from '../../../utils/embeds.js';
import { COLORS, EMOJIS } from '../../../utils/constants.js';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('öneri')
    .setDescription('Yeni bir özellik öner')
    .addStringOption(option =>
      option.setName('başlık')
        .setDescription('Öneri başlığı')
        .setRequired(true)
        .setMaxLength(100))
    .addStringOption(option =>
      option.setName('açıklama')
        .setDescription('Öneri detayı')
        .setRequired(true)
        .setMaxLength(2000))
    .addStringOption(option =>
      option.setName('kategori')
        .setDescription('Kategori')
        .setRequired(false)
        .addChoices(
          { name: '🛡 Moderasyon', value: 'moderasyon' },
          { name: '🔒 Guard', value: 'guard' },
          { name: '📝 Kayıt', value: 'kayıt' },
          { name: '🎭 Rol', value: 'rol' },
          { name: '📨 Davet', value: 'davet' },
          { name: '🎉 Eğlence', value: 'eğlence' },
          { name: '⚙️ Diğer', value: 'diğer' },
        )),

  guildOnly: true,
  cooldown: 120,

  async execute(interaction: ChatInputCommandInteraction, client: Client) {
    await interaction.deferReply({ ephemeral: true });

    const title = interaction.options.getString('başlık', true);
    const description = interaction.options.getString('açıklama', true);
    const category = interaction.options.getString('kategori') || 'diğer';

    const suggestion = await SuggestionService.create({
      guildId: interaction.guild!.id,
      authorId: interaction.user.id,
      title,
      description,
      category,
    });

    if (!suggestion) {
      await interaction.editReply({ embeds: [errorEmbed('Bir hata oluştu. Lütfen daha sonra tekrar dene.')] });
      return;
    }

    const embed = createEmbed({
      title: `${EMOJIS.suggestion} Yeni Öneri #${suggestion.id}`,
      color: COLORS.info,
      fields: [
        { name: 'Başlık', value: title, inline: false },
        { name: 'Açıklama', value: description, inline: false },
        { name: 'Kategori', value: category, inline: true },
        { name: 'Durum', value: '⏳ Beklemede', inline: true },
      ],
      author: { name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() },
      footer: 'Oy vermek için tepki ekleniyor...',
    });

    await interaction.editReply({
      embeds: [createEmbed({
        title: `${EMOJIS.success} Öneri Gönderildi`,
        description: `Önerin başarıyla kaydedildi! #**${suggestion.id}**\n\nTopluluk oylamaya başlayacak.`,
        color: COLORS.success,
      })],
    });

    try {
      const guildConfig = (await import('../../../database/connection.js')).Database.getInstance().db;
      const config = await guildConfig.query.guilds.findFirst({
        where: (g: any, { eq }: any) => eq(g.id, interaction.guild!.id),
      });

      if (config?.suggestionChannel) {
        const channel = interaction.guild!.channels.cache.get(config.suggestionChannel);
        if (channel?.isTextBased()) {
          const msg = await channel.send({ embeds: [embed] });
          await msg.react('✅');
          await msg.react('❌');
          await SuggestionService.addMessageId(suggestion.id, msg.id, channel.id);
        }
      }
    } catch {
      // Öneri kanalı yapılandırılmamış
    }
  },
};

export default command;
