import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

export function createReportModal(targetId: string) {
  const modal = new ModalBuilder()
    .setCustomId(`report_modal_${targetId}`)
    .setTitle('Üye Raporla');

  const reasonInput = new TextInputBuilder()
    .setCustomId('report_reason')
    .setLabel('Rapor sebebi')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder('Bu üyeyi neden raporluyorsun? Detaylı açıkla...')
    .setMinLength(10)
    .setMaxLength(1000)
    .setRequired(true);

  const evidenceInput = new TextInputBuilder()
    .setCustomId('report_evidence')
    .setLabel('Kanıt (varsa)')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Ekran görüntüsü bağlantısı veya mesaj ID')
    .setRequired(false);

  const firstRow = new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput);
  const secondRow = new ActionRowBuilder<TextInputBuilder>().addComponents(evidenceInput);

  modal.addComponents(firstRow, secondRow);
  return modal;
}
