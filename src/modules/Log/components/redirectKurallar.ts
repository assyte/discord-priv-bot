import { EmbedBuilder } from 'discord.js';
import type { ButtonInteraction } from 'discord.js';
import type { Client } from '../../../client/Client.js';

const DARK = 0x2B2D31;

export const customId = 'redirect_kurallar';

export async function execute(interaction: ButtonInteraction, client: Client) {
  if (!interaction.guild) return;
  await interaction.deferReply({ ephemeral: true });

  const kurallar = interaction.guild.channels.cache.find(c => c.name === 'kurallar');
  if (kurallar) {
    const embed = new EmbedBuilder()
      .setColor(DARK)
      .setDescription(`${kurallar.toString()} kanalina git ve kurallari okuyup onayla!`)
      .setFooter({ text: 'dev by assyte' });
    await interaction.editReply({ embeds: [embed] });
  } else {
    const embed = new EmbedBuilder()
      .setColor(DARK)
      .setDescription('Kurallar kanali bulunamadi.')
      .setFooter({ text: 'dev by assyte' });
    await interaction.editReply({ embeds: [embed] });
  }
}
