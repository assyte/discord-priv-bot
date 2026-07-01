import type { ButtonInteraction } from 'discord.js';
import type { Client } from '../../../client/Client.js';

export const customId = 'role_global';

export async function execute(interaction: ButtonInteraction, client: Client) {
  if (!interaction.guild) return;
  await interaction.deferReply({ ephemeral: true });

  const role = interaction.guild.roles.cache.find(r => r.name === '🌍 Global');
  if (!role) {
    await interaction.editReply({ content: '❌ Rol bulunamadı.' });
    return;
  }

  const member = await interaction.guild.members.fetch(interaction.user.id);
  const hasRole = member.roles.cache.has(role.id);
  try {
    if (hasRole) {
      await member.roles.remove(role, 'Rol buton');
      await interaction.editReply({ content: '❌ **🌍 Global** rolü kaldırıldı.' });
    } else {
      await member.roles.add(role, 'Rol buton');
      await interaction.editReply({ content: '✅ **🌍 Global** rolü eklendi. English channels are now visible!' });
    }
  } catch {
    await interaction.editReply({ content: '❌ Rol değiştirilemedi.' });
  }
}
