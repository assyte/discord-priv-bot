import { EmbedBuilder } from 'discord.js';
import type { ButtonInteraction, VoiceChannel } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import { getChannelData } from '../utils/odaManager.js';

const DARK = 0x2B2D31;
export const customId = 'oda_gizle';

export async function execute(interaction: ButtonInteraction, client: Client) {
  if (!interaction.guild || !interaction.channel) return;
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

  const currentPerms = voice.permissionOverwrites.cache.get(interaction.guild.id);
  const isHidden = currentPerms?.deny.has('ViewChannel');

  try {
    if (isHidden) {
      // Göster
      await voice.permissionOverwrites.edit(interaction.guild.id, { ViewChannel: true });
      const embed = new EmbedBuilder()
        .setColor(DARK)
        .setDescription('👁️ Odan artık **Görünür**. Herkes odayı görebilir.')
        .setFooter({ text: 'dev by assyte' });
      await interaction.editReply({ embeds: [embed] });
    } else {
      // Gizle
      await voice.permissionOverwrites.edit(interaction.guild.id, { ViewChannel: false });
      const embed = new EmbedBuilder()
        .setColor(DARK)
        .setDescription('👻 Odan **Gizlendi**. Sadece içerideki üyeler ve yöneticiler görebilir.')
        .setFooter({ text: 'dev by assyte' });
      await interaction.editReply({ embeds: [embed] });
    }
  } catch (err) {
    await interaction.editReply({ content: 'İzinler güncellenirken hata oluştu.' });
  }
}
