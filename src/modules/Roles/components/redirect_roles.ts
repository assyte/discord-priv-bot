import type { ButtonInteraction } from 'discord.js';
import type { Client } from '../../../client/Client.js';

export const customId = 'redirect_roles';

export async function execute(interaction: ButtonInteraction, client: Client) {
  await interaction.reply({
    content: '🎭 Go to <#role-select> to select your roles!',
    ephemeral: true,
  });
}
