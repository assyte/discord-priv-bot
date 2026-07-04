import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { dbPool } from '../../database/connection.js';
import axios from 'axios';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('StatsCommand');

export default {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Displays your FACEIT statistics.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to view stats for (leave empty for your own profile)')
    ),
  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();
    
    const targetUser = interaction.options.getUser('user') || interaction.user;
    
    let conn: any;
    try {
      conn = await dbPool.getConnection();
      const rows = await conn.query('SELECT * FROM users WHERE discord_id = ?', [targetUser.id]);
      
      if (!rows || rows.length === 0) {
        return interaction.editReply({
          content: `${targetUser.username} has not verified their FACEIT account via Clutch.gg yet.`
        });
      }

      const userDb = rows[0];

      // Fetch live data from FACEIT API
      const response = await axios.get(`https://open.faceit.com/data/v4/players/${userDb.faceit_id}`, {
        headers: { 'Authorization': `Bearer ${process.env.FACEIT_API_KEY}` }
      });
      
      const faceitData = response.data;
      const cs2Data = faceitData.games.cs2;

      // We could also query stats API for K/D ratios:
      const statsResponse = await axios.get(`https://open.faceit.com/data/v4/players/${userDb.faceit_id}/stats/cs2`, {
        headers: { 'Authorization': `Bearer ${process.env.FACEIT_API_KEY}` }
      });
      const lifetime = statsResponse.data.lifetime;

      const embed = new EmbedBuilder()
        .setColor('#D4AF37')
        .setTitle(`🏆 ${faceitData.nickname} | CS2 Stats`)
        .setThumbnail(faceitData.avatar || targetUser.displayAvatarURL())
        .addFields(
          { name: 'ELO', value: `📈 ${cs2Data.faceit_elo}`, inline: true },
          { name: 'Level', value: `⭐ ${cs2Data.skill_level}`, inline: true },
          { name: 'Region', value: `🌍 ${faceitData.country.toUpperCase()}`, inline: true },
          { name: 'Matches', value: `🎮 ${lifetime.Matches}`, inline: true },
          { name: 'K/D Ratio', value: `💀 ${lifetime['Average K/D Ratio']}`, inline: true },
          { name: 'Win Rate', value: `🏅 ${lifetime['Win Rate %']}%`, inline: true },
          { name: 'Last 5', value: `${lifetime['Recent Results'].map((r: string) => r === '1' ? '🟩' : '🟥').join(' ')}`, inline: false }
        )
        .setURL(faceitData.faceit_url.replace('{lang}', 'en'))
        .setFooter({ text: 'FACEITLUTCH by Clutch.gg', iconURL: interaction.client.user?.displayAvatarURL() });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
    logger.error('Stats command error:', error);
    await interaction.editReply({ content: 'An error occurred while fetching stats, or the FACEIT API is not responding.' });
    } finally {
      if (conn) conn.release();
    }
  }
};
