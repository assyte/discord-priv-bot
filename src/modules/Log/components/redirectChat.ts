import { EmbedBuilder } from 'discord.js';
import type { ButtonInteraction } from 'discord.js';
import type { Client } from '../../../client/Client.js';

const DARK = 0x2B2D31;

export const customId = 'redirect_chat';

export async function execute(interaction: ButtonInteraction, client: Client) {
  if (!interaction.guild) return;
  await interaction.deferReply({ ephemeral: true });

  const chat = interaction.guild.channels.cache.find(c => c.name === 'chat');
  if (chat) {
    const embed = new EmbedBuilder()
      .setColor(DARK)
      .setDescription(`${chat.toString()} kanalina gidebilirsin!`)
      .setFooter({ text: 'dev by assyte' });
    await interaction.editReply({ embeds: [embed] });
  } else {
    const embed = new EmbedBuilder()
      .setColor(DARK)
      .setDescription('Sohbet kanali bulunamadi.')
      .setFooter({ text: 'dev by assyte' });
    await interaction.editReply({ embeds: [embed] });
  }
}
