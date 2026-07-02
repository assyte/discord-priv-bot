import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import type { ButtonInteraction } from 'discord.js';
import type { Client } from '../../../client/Client.js';

export const customId = 'oda_isim';

export async function execute(interaction: ButtonInteraction, client: Client) {
  const modal = new ModalBuilder()
    .setCustomId('oda_isim_modal')
    .setTitle('Kanal Ismini Degistir');

  const input = new TextInputBuilder()
    .setCustomId('oda_yeni_isim')
    .setLabel('Yeni kanal ismi (suffix: -oda)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('ornek: oyun-odasi')
    .setMinLength(2)
    .setMaxLength(32)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(input));
  await interaction.showModal(modal);
}
