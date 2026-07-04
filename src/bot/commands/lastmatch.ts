import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { dbPool } from '../../database/connection.js';
import axios from 'axios';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('LastMatchCommand');

export default {
  data: new SlashCommandBuilder()
    .setName('lastmatch')
    .setDescription('Shows details of your last FACEIT CS2 match.')
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

      // Fetch user's match history (last 1 match)
      const historyRes = await axios.get(`https://open.faceit.com/data/v4/players/${userDb.faceit_id}/history?game=cs2&offset=0&limit=1`, {
        headers: { 'Authorization': `Bearer ${process.env.FACEIT_API_KEY}` }
      });

      if (historyRes.data.items.length === 0) {
        return interaction.editReply({ content: 'This user has no FACEIT CS2 match history yet.' });
      }

      const matchId = historyRes.data.items[0].match_id;

      // Fetch match details
      const matchStatsRes = await axios.get(`https://open.faceit.com/data/v4/matches/${matchId}/stats`, {
        headers: { 'Authorization': `Bearer ${process.env.FACEIT_API_KEY}` }
      });

      const matchData = matchStatsRes.data.rounds[0];
      const allPlayers = [...matchData.teams[0].players, ...matchData.teams[1].players];
      const playerStats = allPlayers.find((p: any) => p.player_id === userDb.faceit_id);

      if (!playerStats) {
        return interaction.editReply({ content: 'Could not find player in last match data.' });
      }

      const pStats = playerStats.player_stats;
      const isWin = pStats.Result === '1';

      const embed = new EmbedBuilder()
        .setColor(isWin ? '#2e7d32' : '#d32f2f')
        .setTitle(`🎮 Last Match Summary | ${userDb.faceit_username}`)
        .setDescription(`**Map:** ${matchData.round_stats.Map} | **Score:** ${matchData.round_stats.Score}`)
        .addFields(
          { name: 'Result', value: isWin ? 'Victory' : 'Defeat', inline: true },
          { name: 'K/D/A', value: `${pStats.Kills} / ${pStats.Deaths} / ${pStats.Assists}`, inline: true },
          { name: 'K/D Ratio', value: `${pStats['K/D Ratio']}`, inline: true },
          { name: 'Headshots', value: `🎯 ${pStats.Headshots} (${pStats['Headshots %']}%)`, inline: true },
          { name: 'MVP', value: `⭐ ${pStats.MVPs}`, inline: true },
          { name: 'Score (Kills)', value: `🔥 ${pStats.Kills}`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'FACEITLUTCH', iconURL: interaction.client.user?.displayAvatarURL() });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
    logger.error('Lastmatch error:', error);
    await interaction.editReply({ content: 'An error occurred while fetching match stats.' });
    } finally {
      if (conn) conn.release();
    }
  }
};
