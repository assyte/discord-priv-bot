import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import type { ButtonInteraction } from 'discord.js';
import type { Client } from '../../../client/Client.js';

export const customId = 'oda_limit';

export async function execute(interaction: ButtonInteraction, client: Client) {
  const modal = new ModalBuilder()
    .setCustomId('oda_limit_modal')
    .setTitle('Kullanici Limiti');

  const input = new TextInputBuilder()
    .setCustomId('oda_yeni_limit')
    .setLabel('Kullanici limiti (0 = sinirsiz)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('0-99')
    .setMinLength(1)
    .setMaxLength(2)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
  await interaction.showModal(modal);
}
