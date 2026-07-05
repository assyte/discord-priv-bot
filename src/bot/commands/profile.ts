import { SlashCommandBuilder, EmbedBuilder, ChatInputCommandInteraction, User } from 'discord.js';
import axios from 'axios';
import { dbPool } from '../../database/connection.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('ProfileCommand');

export default {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('CLUTCH.GG Profilini ve İstatistiklerini Gösterir')
    .addUserOption(option => 
      option.setName('user')
      .setDescription('Profiline bakmak istediğiniz kullanıcı (Boş bırakırsanız kendi profiliniz)')
      .setRequired(false)),
  
  guildOnly: true,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.deferReply();

    const targetUser: User = interaction.options.getUser('user') || interaction.user;

    try {
      const conn = await dbPool.getConnection();
      let userData: any = null;
      let rankVoice = 0;
      let rankMessage = 0;
      let rankClutch = 0;

      try {
        const rows = await conn.query('SELECT * FROM users WHERE discord_id = ?', [targetUser.id]);
        if (rows && rows.length > 0) {
          userData = rows[0];

          // Calculate ranks
          const voiceRows = await conn.query('SELECT COUNT(*) as rank FROM users WHERE voice_minutes > ?', [userData.voice_minutes]);
          rankVoice = Number(voiceRows[0].rank) + 1;

          const msgRows = await conn.query('SELECT COUNT(*) as rank FROM users WHERE message_count > ?', [userData.message_count]);
          rankMessage = Number(msgRows[0].rank) + 1;

          const clutchRows = await conn.query('SELECT COUNT(*) as rank FROM users WHERE clutch_score > ?', [userData.clutch_score]);
          rankClutch = Number(clutchRows[0].rank) + 1;
        }
      } finally {
        conn.release();
      }

      const member = await interaction.guild?.members.fetch(targetUser.id).catch(() => null);

      if (!userData) {
        // Fallback to Discord Roles if they have Verified role
        const VERIFIED_ROLE_ID = process.env.ROLE_VERIFIED || '1522961865595158611';
        
        if (member && member.roles.cache.has(VERIFIED_ROLE_ID)) {
          // Dynamically find their faceit and fastcup levels based on roles
          let detectedFaceitLevel = null;
          let detectedFastcupLevel = null;

          const ROLE_MAP: Record<number, string> = {
            0: '1522991993519603852',
            1: process.env.ROLE_LEVEL_1 || '',
            2: process.env.ROLE_LEVEL_2 || '',
            3: process.env.ROLE_LEVEL_3 || '',
            4: process.env.ROLE_LEVEL_4 || '',
            5: process.env.ROLE_LEVEL_5 || '',
            6: process.env.ROLE_LEVEL_6 || '',
            7: process.env.ROLE_LEVEL_7 || '',
            8: process.env.ROLE_LEVEL_8 || '',
            9: process.env.ROLE_LEVEL_9 || '',
            10: process.env.ROLE_LEVEL_10 || '',
          };

          const FASTCUP_ROLE_MAP: Record<string, string> = {
            'S': process.env.ROLE_FASTCUP_S || '',
            'A': process.env.ROLE_FASTCUP_A || '',
            'B': process.env.ROLE_FASTCUP_B || '',
            'C': process.env.ROLE_FASTCUP_C || '',
            'D': process.env.ROLE_FASTCUP_D || '',
            'E': process.env.ROLE_FASTCUP_E || '',
            'F': process.env.ROLE_FASTCUP_F || '',
            'G': process.env.ROLE_FASTCUP_G || '',
          };

          for (const [lvl, roleId] of Object.entries(ROLE_MAP)) {
            if (roleId && member.roles.cache.has(roleId)) {
              detectedFaceitLevel = parseInt(lvl);
              break;
            }
          }

          for (const [lvl, roleId] of Object.entries(FASTCUP_ROLE_MAP)) {
            if (roleId && member.roles.cache.has(roleId)) {
              detectedFastcupLevel = lvl;
              break;
            }
          }

          userData = {
            faceit_id: null,
            faceit_username: detectedFaceitLevel !== null ? 'Role Based' : 'N/A',
            faceit_elo: 'N/A',
            faceit_level: detectedFaceitLevel,
            fastcup_url: detectedFastcupLevel !== null ? 'Role Based' : null,
            fastcup_skill: 'N/A',
            fastcup_level: detectedFastcupLevel,
            message_count: 0,
            voice_minutes: 0,
            clutch_score: 0
          };
        } else {
          return interaction.editReply({ content: `❌ ${targetUser.username} henüz sisteme kayıt olmamış!` });
        }
      }

      // Fetch Faceit Stats (Last 20 Matches Win Rate & Overall HS)
      let winRate = 'N/A';
      let hsRatio = 'N/A';

      try {
        if (userData.faceit_id && !userData.faceit_id.startsWith('st_') && !userData.faceit_id.startsWith('fc_')) {
          const statsRes = await axios.get(`https://open.faceit.com/data/v4/players/${userData.faceit_id}/stats/cs2`, {
            headers: { Authorization: `Bearer ${process.env.FACEIT_API_KEY}` }
          });
          const lifetime = statsRes.data.lifetime;
          
          if (lifetime) {
            if (lifetime['Recent Results']) {
              const results = lifetime['Recent Results'];
              const wins = results.filter((r: string) => r === '1').length;
              winRate = `${Math.round((wins / results.length) * 100)}%`;
            }
            if (lifetime['Average Headshots %']) {
              hsRatio = `${lifetime['Average Headshots %']}%`;
            }
          }
        }
      } catch (err: any) {
        logger.error(`Faceit stats fetch error for ${userData.faceit_id}:`, err.message);
      }

      const avatar = targetUser.displayAvatarURL({ size: 256 });
      
      // Attempt to get banner (Requires force fetching user to get banner)
      const fullUser = await interaction.client.users.fetch(targetUser.id, { force: true }).catch(() => targetUser);
      // If no banner, use a premium default gradient or faceit banner
      const banner = fullUser.bannerURL({ size: 512, extension: 'png' }) || 'https://i.imgur.com/vHq0A6C.png'; 

      const faceitInfo = userData.faceit_username !== 'N/A' && userData.faceit_id && !userData.faceit_id.startsWith('st_') && !userData.faceit_id.startsWith('fc_') 
        ? `${userData.faceit_elo} ELO (Lv. ${userData.faceit_level})`
        : 'Unranked / Not Linked';

      const fastcupInfo = userData.fastcup_url 
        ? `${userData.fastcup_skill} (Lv. ${userData.fastcup_level})`
        : 'Unranked / Not Linked';

      const embed = new EmbedBuilder()
        .setAuthor({ name: `💎 ${targetUser.username}'s Premium Profile`, iconURL: avatar })
        .setThumbnail(avatar)
        .setImage(banner)
        .setColor('#2B2D31')
        .setDescription(`>>> 🎮 **Player Identity:** <@${targetUser.id}>\n🌐 **Status:** Official CLUTCH.GG Member`)
        .addFields(
          { name: '🔥 GLOBAL RANKS', value: `\`\`\`\nFACEIT  :: ${faceitInfo}\nFASTCUP :: ${fastcupInfo}\n\`\`\``, inline: false },
          { name: '📊 RECENT PERFORMANCE (CS2)', value: `\`\`\`\nWin Rate (Last 20) :: ${winRate}\nHeadshot Average   :: ${hsRatio}\n\`\`\``, inline: false },
          { name: '🏆 WEEKLY SERVER RANKINGS', value: `**💬 Message Rank:** #${rankMessage} *( ${userData.message_count} msj )*\n**🎙️ Voice Rank:** #${rankVoice} *( ${Math.floor(userData.voice_minutes / 60)}h ${userData.voice_minutes % 60}m )*\n**🎬 Clutch Rank:** #${rankClutch} *( ${userData.clutch_score} Fire Votes )*`, inline: false }
        )
        .setFooter({ text: 'CLUTCH.GG Premium Analytics', iconURL: interaction.client.user?.displayAvatarURL() })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (err) {
      logger.error('Profile Command Error:', err);
      await interaction.editReply({ content: '❌ Profil bilgileri getirilirken bir hata oluştu.' });
    }
  }
};
