import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { dbPool } from '../../database/connection.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('LeaderboardCommand');

export default {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Sunucudaki en yüksek FACEIT ELO\'suna sahip oyuncuları listeler.'),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    let conn;
    try {
      conn = await dbPool.getConnection();
      const rows = await conn.query(`
        SELECT discord_id, faceit_username, faceit_elo, faceit_level 
        FROM users 
        WHERE is_verified = 1 
        ORDER BY faceit_elo DESC 
        LIMIT 10
      `);

      if (!rows || rows.length === 0) {
        return interaction.editReply({ content: 'Liderlik tablosu henüz boş. Kimse kayıt olmamış!' });
      }

      const embed = new EmbedBuilder()
        .setColor('#D4AF37')
        .setTitle('🏆 CLUTCH.GG ELO LİDERLİK TABLOSU 🏆')
        .setDescription('Sunucumuzun en iyi 10 CS2 oyuncusu:')
        .setTimestamp()
        .setFooter({ text: 'FACEITLUTCH', iconURL: interaction.client.user?.displayAvatarURL() });

      let leaderboardText = '';
      rows.forEach((user: any, index: number) => {
        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅';
        leaderboardText += `${medal} **#${index + 1}** | **${user.faceit_username}** - ⭐ Lvl ${user.faceit_level} | **${user.faceit_elo} ELO** (<@${user.discord_id}>)\n`;
      });

      embed.addFields({ name: '\u200B', value: leaderboardText });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      logger.error('Leaderboard hatası:', error);
      await interaction.editReply({ content: 'Liderlik tablosu çekilirken bir hata oluştu.' });
    } finally {
      if (conn) conn.release();
    }
  }
};
