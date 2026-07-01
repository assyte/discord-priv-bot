import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

export function createSuggestionModal() {
  const modal = new ModalBuilder()
    .setCustomId('suggestion_modal')
    .setTitle('Yeni Özellik Önerisi');

  const titleInput = new TextInputBuilder()
    .setCustomId('suggestion_title')
    .setLabel('Öneri Başlığı')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Kısa ve açıklayıcı bir başlık...')
    .setMinLength(5)
    .setMaxLength(100)
    .setRequired(true);

  const descInput = new TextInputBuilder()
    .setCustomId('suggestion_description')
    .setLabel('Öneri Detayı')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Özelliği detaylı açıkla, nasıl çalışmalı?')
    .setMinLength(20)
    .setMaxLength(2000)
    .setRequired(true);

  const categoryInput = new TextInputBuilder()
    .setCustomId('suggestion_category')
    .setLabel('Kategori')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('moderasyon / guard / kayıt / rol / eğlence / diğer')
    .setMaxLength(20)
    .setRequired(false);

  const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput);
  const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(descInput);
  const thirdRow = new ActionRowBuilder<TextInputBuilder>().addComponents(categoryInput);

  modal.addComponents(firstRow, secondRow, thirdRow);
  return modal;
}
