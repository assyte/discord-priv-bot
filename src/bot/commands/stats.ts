import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { dbPool } from '../../database/connection.js';
import axios from 'axios';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('StatsCommand');

export default {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('FACEIT istatistiklerinizi gösterir.')
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

      // FACEIT API'den anlık veri çekelim
      const response = await axios.get(`https://open.faceit.com/data/v4/players/${userDb.faceit_id}`, {
        headers: { 'Authorization': `Bearer ${process.env.FACEIT_API_KEY}` }
      });
      
      const faceitData = response.data;
      const cs2Data = faceitData.games.cs2;

      // Sadece profil değil genel K/D oranları için stats api'ye de bakabiliriz:
      const statsResponse = await axios.get(`https://open.faceit.com/data/v4/players/${userDb.faceit_id}/stats/cs2`, {
        headers: { 'Authorization': `Bearer ${process.env.FACEIT_API_KEY}` }
      });
      const lifetime = statsResponse.data.lifetime;

      const embed = new EmbedBuilder()
        .setColor('#D4AF37')
        .setTitle(`🏆 ${faceitData.nickname} | CS2 İstatistikleri`)
        .setThumbnail(faceitData.avatar || targetUser.displayAvatarURL())
        .addFields(
          { name: 'ELO', value: `📈 ${cs2Data.faceit_elo}`, inline: true },
          { name: 'Level', value: `⭐ ${cs2Data.skill_level}`, inline: true },
          { name: 'Bölge', value: `🌍 ${faceitData.country.toUpperCase()}`, inline: true },
          { name: 'Maçlar', value: `🎮 ${lifetime.Matches}`, inline: true },
          { name: 'K/D Oranı', value: `💀 ${lifetime['Average K/D Ratio']}`, inline: true },
          { name: 'Win Rate', value: `🏅 ${lifetime['Win Rate %']}%`, inline: true },
          { name: 'Son 5 Maç', value: `${lifetime['Recent Results'].map((r: string) => r === '1' ? '🟩' : '🟥').join(' ')}`, inline: false }
        )
        .setURL(faceitData.faceit_url.replace('{lang}', 'en'))
        .setFooter({ text: 'FACEITLUTCH by Clutch.gg', iconURL: interaction.client.user?.displayAvatarURL() });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      logger.error('Stats komutu hatası:', error);
      await interaction.editReply({ content: 'İstatistikler çekilirken bir hata oluştu veya FACEIT API yanıt vermiyor.' });
    } finally {
      if (conn) conn.release();
    }
  }
};
