import { EmbedBuilder } from 'discord.js';
import type { ButtonInteraction } from 'discord.js';
import type { Client } from '../../../client/Client.js';

export const prefix = 'duo_iptal_';

export async function execute(interaction: ButtonInteraction, client: Client) {
  if (!interaction.guild) {
    await interaction.reply({ content: 'Bu buton sunucuda kullanilmalidir.', ephemeral: true });
    return;
  }

  const ownerId = interaction.customId.replace('duo_iptal_', '');

  if (interaction.user.id !== ownerId) {
    await interaction.reply({ content: 'Bu ilanı sadece sahibi iptal edebilir.', ephemeral: true });
    return;
  }

  const msg = await interaction.channel?.messages.fetch(interaction.message.id).catch(() => null);
  if (!msg) {
    await interaction.reply({ content: 'İlan bulunamadı.', ephemeral: true });
    return;
  }

  await msg.delete().catch(() => {});

  const iptalEmbed = new EmbedBuilder()
    .setColor(0x2B2D31)
    .setTitle('İlan Kapatıldı')
    .setDescription([
      `${interaction.user.toString()}`,
      '',
      'İlan sahibi tarafından lfg (oyuncu arama) kaydı kapatıldı.',
    ].join('\n'))
    .setFooter({ text: 'Kafadan Tayfa' })
    .setTimestamp();

  await interaction.reply({ embeds: [iptalEmbed], ephemeral: false });
}
