import { EmbedBuilder } from 'discord.js';
import type { ButtonInteraction } from 'discord.js';
import type { Client } from '../../../client/Client.js';

export const prefix = 'duo_katil_';

// Hızlı spam'i önlemek için (user bazlı)
const cooldowns = new Set<string>();

export async function execute(interaction: ButtonInteraction, client: Client) {
  if (!interaction.guild) {
    await interaction.reply({ content: 'Bu buton sunucuda kullanilmalidir.', ephemeral: true });
    return;
  }

  const ownerId = interaction.customId.replace('duo_katil_', '');

  if (interaction.user.id === ownerId) {
    await interaction.reply({ content: 'Kendi ilanına katılamazsın.', ephemeral: true });
    return;
  }

  const cooldownKey = `${interaction.user.id}-${interaction.message.id}`;
  if (cooldowns.has(cooldownKey)) {
    await interaction.reply({ content: 'Bu ilana zaten katılma isteği gönderdin.', ephemeral: true });
    return;
  }

  // Sahibini etiketleyerek kanala mesaj at
  const notifyEmbed = new EmbedBuilder()
    .setColor(0x2B2D31)
    .setDescription(`🎮 **Oyun Arkadaşı Bulundu!**\n\n${interaction.user.toString()}, ilanına katıldı ve seninle oynamak istiyor!`)
    .setThumbnail(interaction.user.displayAvatarURL())
    .setFooter({ text: 'Kafadan Tayfa Premium' });

  const channel = interaction.channel as import('discord.js').TextChannel;
  await channel?.send({
    content: `<@${ownerId}>`,
    embeds: [notifyEmbed]
  });

  cooldowns.add(cooldownKey);
  setTimeout(() => cooldowns.delete(cooldownKey), 60000); // 1 dakika sonra tekrar basabilir

  await interaction.reply({ content: 'İlan sahibine bildirim gönderildi!', ephemeral: true });
}
