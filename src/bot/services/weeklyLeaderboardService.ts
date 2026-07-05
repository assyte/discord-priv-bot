import cron from 'node-cron';
import { EmbedBuilder, TextChannel, Guild } from 'discord.js';
import { getClient } from '../client.js';
import { dbPool } from '../../database/connection.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('WeeklyLeaderboardService');

const CHANNEL_ID = '1523303339016720384';

export class WeeklyLeaderboardService {
  static init() {
    logger.info('Initializing Weekly Leaderboard Service...');

    // Run every Sunday at 23:59
    cron.schedule('59 23 * * 0', async () => {
      logger.info('Running weekly leaderboard calculation...');
      await this.runLeaderboard();
    });
  }

  static async runLeaderboard() {
    const client = getClient();
    const guild = client.guilds.cache.get(process.env.GUILD_ID!);
    if (!guild) return;

    try {
      const conn = await dbPool.getConnection();
      let topEloGainer: any = null;
      let topTalker: any = null;
      let topVoicer: any = null;
      let topClutcher: any = null;

      try {
        // 1. Top ELO Gainer
        const eloRows = await conn.query(`
          SELECT discord_id, faceit_username, (faceit_elo - faceit_elo_start_of_week) as elo_gain
          FROM users 
          WHERE faceit_elo_start_of_week IS NOT NULL
          ORDER BY elo_gain DESC LIMIT 1
        `);
        if (eloRows && eloRows.length > 0) topEloGainer = eloRows[0];

        // 2. Top Talker (Messages)
        const msgRows = await conn.query('SELECT discord_id, message_count FROM users ORDER BY message_count DESC LIMIT 1');
        if (msgRows && msgRows.length > 0) topTalker = msgRows[0];

        // 3. Top Voice (Minutes)
        const voiceRows = await conn.query('SELECT discord_id, voice_minutes FROM users ORDER BY voice_minutes DESC LIMIT 1');
        if (voiceRows && voiceRows.length > 0) topVoicer = voiceRows[0];

        // 4. Top Clutcher
        const clutchRows = await conn.query('SELECT discord_id, clutch_score FROM users ORDER BY clutch_score DESC LIMIT 1');
        if (clutchRows && clutchRows.length > 0) topClutcher = clutchRows[0];

        // RESET weekly stats
        await conn.query('UPDATE users SET faceit_elo_start_of_week = faceit_elo, message_count = 0, voice_minutes = 0, clutch_score = 0');
      } finally {
        conn.release();
      }

      // Find channel
      let channel = await client.channels.fetch(CHANNEL_ID).catch(() => null) as TextChannel;
      if (!channel) {
         logger.error(`Weekly Leaderboard Channel ${CHANNEL_ID} not found.`);
         return;
      }

      // Find or create Hunter of Week role
      let hunterRole = guild.roles.cache.find(r => r.name === 'Hunter of Week');
      if (!hunterRole) {
        hunterRole = await guild.roles.create({
          name: 'Hunter of Week',
          color: '#FFD700',
          hoist: true, // Show separately
          reason: 'Created for weekly leaderboard winner'
        });
      }

      // Remove role from previous winners
      guild.members.cache.filter(m => m.roles.cache.has(hunterRole!.id)).forEach(async m => {
        await m.roles.remove(hunterRole!);
      });

      // Prepare premium embed description
      let desc = 'The weekly stats have been reset. Here are the absolute legends of this week!\n\n';

      if (topEloGainer && topEloGainer.elo_gain > 0) {
        desc += `📈 **Hunter of the Week (Max ELO Gained)**\n╰ <@${topEloGainer.discord_id}> *(+${topEloGainer.elo_gain} ELO)*\n\n`;
        
        // Give the role to the top ELO gainer
        const member = await guild.members.fetch(topEloGainer.discord_id).catch(() => null);
        if (member) {
          await member.roles.add(hunterRole);
        }
      } else {
        desc += `📈 **Hunter of the Week (Max ELO Gained)**\n╰ *No players gained ELO this week.*\n\n`;
      }

      if (topTalker && topTalker.message_count > 0) {
        desc += `💬 **Chatterbox of the Week (Most Messages)**\n╰ <@${topTalker.discord_id}> *(${topTalker.message_count} Messages)*\n\n`;
      } else {
        desc += `💬 **Chatterbox of the Week (Most Messages)**\n╰ *No messages were sent this week.*\n\n`;
      }

      if (topVoicer && topVoicer.voice_minutes > 0) {
        const hrs = Math.floor(topVoicer.voice_minutes / 60);
        const mins = topVoicer.voice_minutes % 60;
        desc += `🗣️ **Voice of the Week (Most Voice Activity)**\n╰ <@${topVoicer.discord_id}> *(${hrs}h ${mins}m)*\n\n`;
      } else {
        desc += `🗣️ **Voice of the Week (Most Voice Activity)**\n╰ *No voice activity this week.*\n\n`;
      }

      if (topClutcher && topClutcher.clutch_score > 0) {
        desc += `🎬 **Clutch Master of the Week (Most Voted Clutch)**\n╰ <@${topClutcher.discord_id}> *(${topClutcher.clutch_score} Fire Reactions)*\n\n`;
      } else {
        desc += `🎬 **Clutch Master of the Week (Most Voted Clutch)**\n╰ *No clutches were voted this week.*\n\n`;
      }

      const embed = new EmbedBuilder()
        .setTitle('🏆 WEEKLY LEADERBOARD WINNERS 🏆')
        .setColor('#FFD700')
        .setDescription(desc)
        .setThumbnail(guild.iconURL({ size: 256 }) || null)
        .setFooter({ text: 'Stats will reset every Sunday at midnight.', iconURL: client.user?.displayAvatarURL() })
        .setTimestamp();

      await channel.send({ content: '@everyone 🌟 **The Weekly Leaders have been announced!**', embeds: [embed] });

    } catch (err) {
      logger.error('Error in runLeaderboard:', err);
    }
  }
}
