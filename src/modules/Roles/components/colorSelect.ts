import { type StringSelectMenuInteraction, EmbedBuilder } from 'discord.js';
import type { Client } from '../../../client/Client.js';
import { COLORS } from '../../../utils/constants.js';

export const customId = 'select_color_role';

export async function execute(interaction: StringSelectMenuInteraction, client: Client) {
  if (!interaction.guild) return;

  await interaction.deferReply({ ephemeral: true });

  try {
    const selectedRoleId = interaction.values[0]; // e.g. "role_id" or "none"
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const allColorRoleIds = interaction.component.options.map(o => o.value).filter(v => v !== 'none');

    // Remove all existing color roles from the user
    const rolesToRemove = member.roles.cache.filter(role => allColorRoleIds.includes(role.id));
    if (rolesToRemove.size > 0) {
      await member.roles.remove(rolesToRemove, 'Renk paneli - Yeni seçim');
    }

    if (selectedRoleId === 'none') {
      const embed = new EmbedBuilder()
        .setColor(COLORS.danger)
        .setDescription('🗑️ Tüm renk rolleriniz başarıyla temizlendi.')
        .setFooter({ text: 'Kafadan Tayfa Premium' });
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // Give the selected role
    const roleToGive = interaction.guild.roles.cache.get(selectedRoleId);
    if (!roleToGive) {
      await interaction.editReply({ content: '❌ Seçilen renk rolü sunucuda bulunamadı.' });
      return;
    }

    await member.roles.add(roleToGive, 'Renk paneli - Seçim');

    const embed = new EmbedBuilder()
      .setColor(roleToGive.color || COLORS.success)
      .setDescription(`✅ Renk rolünüz **${roleToGive.name}** olarak ayarlandı!`)
      .setFooter({ text: 'Kafadan Tayfa Premium' });

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    client.logger.error('Color select hatası:', error);
    await interaction.editReply({ content: '❌ Renk değiştirilirken bir hata oluştu.' }).catch(() => {});
  }
}
