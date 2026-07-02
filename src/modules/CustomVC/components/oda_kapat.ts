import { EmbedBuilder } from 'discord.js';
import type { ButtonInteraction } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import { getChannelData, deleteChannels } from '../utils/odaManager.js';

export const customId = 'oda_kapat';

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

  const embed = new EmbedBuilder()
    .setColor(0x2B2D31)
    .setDescription('Odan kapatılıyor...')
    .setFooter({ text: 'dev by assyte' });
    
  await interaction.editReply({ embeds: [embed] });
  
  // Odayı sil
  await deleteChannels(data.voiceChannelId, interaction.guild);
}
