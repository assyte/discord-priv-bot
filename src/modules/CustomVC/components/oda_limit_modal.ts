import { EmbedBuilder } from 'discord.js';
import type { ModalSubmitInteraction, VoiceChannel } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import { getChannelData } from '../utils/odaManager.js';

export const customId = 'oda_limit_modal';

export async function execute(interaction: ModalSubmitInteraction, client: Client) {
  if (!interaction.guild || !interaction.channelId) return;
  await interaction.deferReply({ ephemeral: true });

  const data = getChannelData(interaction.channelId);
  if (!data) {
    await interaction.editReply({ content: 'Oda verisi bulunamadı.' });
    return;
  }

  if (data.ownerId !== interaction.user.id) {
    await interaction.editReply({ content: 'Bu odayı yönetme yetkin yok.' });
    return;
  }

  const voice = interaction.guild.channels.cache.get(data.voiceChannelId) as VoiceChannel;
  if (!voice) {
    await interaction.editReply({ content: 'Ses kanalı bulunamadı.' });
    return;
  }

  const limitStr = interaction.fields.getTextInputValue('oda_yeni_limit').trim();
  const limit = parseInt(limitStr, 10);

  if (isNaN(limit) || limit < 0 || limit > 99) {
    await interaction.editReply({ content: 'Lütfen 0-99 arası geçerli bir sayı girin (0 = limitsiz).' });
    return;
  }

  try {
    await voice.setUserLimit(limit, `${interaction.user.tag} oda limitini degistirdi`);
    const embed = new EmbedBuilder()
      .setColor(0x2B2D31)
      .setDescription(limit === 0 ? '👥 Oda limiti **kaldırıldı** (Sınırsız).' : `👥 Oda limiti **${limit} kişi** olarak ayarlandı!`)
      .setFooter({ text: 'dev by assyte' });
    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    await interaction.editReply({ content: 'Limit değiştirilirken hata oluştu. Discord API sınırlarına takılmış olabilirsin.' });
  }
}
