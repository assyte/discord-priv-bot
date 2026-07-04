import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { dbPool } from '../../database/connection.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('LeaderboardCommand');

export default {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Lists the players with the highest FACEIT ELO on the server.'),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    let conn: any;
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
        return interaction.editReply({ content: 'The leaderboard is empty. No one has registered yet!' });
      }

      const embed = new EmbedBuilder()
        .setColor('#D4AF37')
        .setTitle(' FACEIT ELO LEADERBOARD')
        .setDescription('Top 10 CS2 players on our server:')
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
    logger.error('Leaderboard error:', error);
    await interaction.editReply({ content: 'An error occurred while fetching the leaderboard.' });
    } finally {
      if (conn) conn.release();
    }
  }
};
