import { EmbedBuilder } from 'discord.js';
import type { ModalSubmitInteraction, VoiceChannel } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import { getChannelData } from '../utils/odaManager.js';

export const customId = 'oda_isim_modal';

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

  let newName = interaction.fields.getTextInputValue('oda_yeni_isim').trim();
  if (!newName.endsWith('-oda')) newName += '-oda';

  try {
    await voice.setName(newName, `${interaction.user.tag} oda ismini degistirdi`);
    const embed = new EmbedBuilder()
      .setColor(0x2B2D31)
      .setDescription(`Oda ismin başarıyla **${newName}** olarak değiştirildi!`)
      .setFooter({ text: 'dev by assyte' });
    await interaction.editReply({ embeds: [embed] });
  } catch (err) {
    await interaction.editReply({ content: 'Kanal ismi değiştirilirken Discord API limitine takıldın. Lütfen biraz bekle.' });
  }
}
