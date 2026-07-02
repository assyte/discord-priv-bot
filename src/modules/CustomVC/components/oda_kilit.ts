import { EmbedBuilder } from 'discord.js';
import type { ButtonInteraction, VoiceChannel } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import { getChannelData } from '../utils/odaManager.js';

const DARK = 0x2B2D31;
export const customId = 'oda_kilit';

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
  const isLocked = currentPerms?.deny.has('Connect');

  try {
    if (isLocked) {
      // Kilidi aç
      await voice.permissionOverwrites.edit(interaction.guild.id, { Connect: true });
      const embed = new EmbedBuilder()
        .setColor(DARK)
        .setDescription('🔓 Odanın kilidi **açıldı**. Artık herkes katılabilir.')
        .setFooter({ text: 'dev by assyte' });
      await interaction.editReply({ embeds: [embed] });
    } else {
      // Kilitle
      await voice.permissionOverwrites.edit(interaction.guild.id, { Connect: false });
      const embed = new EmbedBuilder()
        .setColor(DARK)
        .setDescription('🔒 Odan **kilitlendi**. Sadece sana ve izin verdiklerine açık.')
        .setFooter({ text: 'dev by assyte' });
      await interaction.editReply({ embeds: [embed] });
    }
  } catch (err) {
    await interaction.editReply({ content: 'İzinler güncellenirken hata oluştu.' });
  }
}
