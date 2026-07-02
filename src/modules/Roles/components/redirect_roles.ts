import { EmbedBuilder } from 'discord.js';
import type { ButtonInteraction } from 'discord.js';
import type { Client } from '../../../client/Client.js';

const DARK = 0x2B2D31;

export const customId = 'redirect_roles';

export async function execute(interaction: ButtonInteraction, client: Client) {
  if (!interaction.guild) return;
  await interaction.deferReply({ ephemeral: true });
  const rolAl = interaction.guild.channels.cache.find(c => c.name === 'rol-al');
  if (rolAl) {
    const embed = new EmbedBuilder()
      .setColor(DARK)
      .setDescription(`${rolAl.toString()} kanalina giderek rol secebilirsin!`)
      .setFooter({ text: 'dev by assyte' });
    await interaction.editReply({ embeds: [embed] });
  } else {
    const embed = new EmbedBuilder()
      .setColor(DARK)
      .setDescription('Rol kanali bulunamadi.')
      .setFooter({ text: 'dev by assyte' });
    await interaction.editReply({ embeds: [embed] });
  }
}
