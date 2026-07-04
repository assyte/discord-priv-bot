import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { dbPool } from '../../database/connection.js';
import axios from 'axios';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('LastMatchCommand');

export default {
  data: new SlashCommandBuilder()
    .setName('lastmatch')
    .setDescription('Son FACEIT CS2 maçınızın detaylarını gösterir.')
    .addUserOption(option => 
      option.setName('user')
      .setDescription('İstatistiklerine bakmak istediğiniz kullanıcı (Boş bırakırsanız kendi profiliniz)')
      .setRequired(false)
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
          content: `${targetUser.username} henüz Clutch.gg üzerinden FACEIT hesabını doğrulamamış.`
        });
      }

      const userDb = rows[0];

      // Kullanıcının maç geçmişini çek (Son 1 maç)
      const historyRes = await axios.get(`https://open.faceit.com/data/v4/players/${userDb.faceit_id}/history?game=cs2&offset=0&limit=1`, {
        headers: { 'Authorization': `Bearer ${process.env.FACEIT_API_KEY}` }
      });

      if (historyRes.data.items.length === 0) {
        return interaction.editReply({ content: 'Bu kullanıcının henüz FACEIT CS2 maç geçmişi bulunmuyor.' });
      }

      const matchId = historyRes.data.items[0].match_id;

      // Maç detaylarını çek
      const matchStatsRes = await axios.get(`https://open.faceit.com/data/v4/matches/${matchId}/stats`, {
        headers: { 'Authorization': `Bearer ${process.env.FACEIT_API_KEY}` }
      });

      const matchData = matchStatsRes.data.rounds[0];
      const allPlayers = [...matchData.teams[0].players, ...matchData.teams[1].players];
      const playerStats = allPlayers.find((p: any) => p.player_id === userDb.faceit_id);

      if (!playerStats) {
        return interaction.editReply({ content: 'Son maç verilerinde oyuncu bulunamadı.' });
      }

      const pStats = playerStats.player_stats;
      const isWin = pStats.Result === '1';

      const embed = new EmbedBuilder()
        .setColor(isWin ? '#2e7d32' : '#d32f2f')
        .setTitle(`🎮 Son Maç Özeti | ${userDb.faceit_username}`)
        .setDescription(`**Harita:** ${matchData.round_stats.Map} | **Skor:** ${matchData.round_stats.Score}`)
        .addFields(
          { name: 'Sonuç', value: isWin ? '🏆 Galibiyet' : '💀 Mağlubiyet', inline: true },
          { name: 'K/D/A', value: `${pStats.Kills} / ${pStats.Deaths} / ${pStats.Assists}`, inline: true },
          { name: 'K/D Oranı', value: `${pStats['K/D Ratio']}`, inline: true },
          { name: 'Headshots', value: `🎯 ${pStats.Headshots} (${pStats['Headshots %']}%)`, inline: true },
          { name: 'MVP', value: `⭐ ${pStats.MVPs}`, inline: true },
          { name: 'Puan (Kills)', value: `🔥 ${pStats.Kills}`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'FACEITLUTCH', iconURL: interaction.client.user?.displayAvatarURL() });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      logger.error('Lastmatch hatası:', error);
      await interaction.editReply({ content: 'Maç istatistikleri çekilirken bir hata oluştu.' });
    } finally {
      if (conn) conn.release();
    }
  }
};
