import cron from 'node-cron';
import { EmbedBuilder, TextChannel, Guild, User } from 'discord.js';
import type { ClutchClient } from '../client.js';
import { dbPool } from '../../database/connection.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('GlobalLeaderboardPanel');

const CHANNEL_ID = '1523300783876083753';

export class GlobalLeaderboardPanel {
  static init(client: ClutchClient) {
    logger.info('Initializing Global Leaderboard Panel (Premium Edition)...');

    // Run on startup after 10 seconds
    setTimeout(() => {
      this.updateAll(client).catch(e => logger.error('Startup leaderboard update failed:', e));
    }, 10000);

    // Run every day at 00:00
    cron.schedule('0 0 * * *', async () => {
      logger.info('Running daily global leaderboard update...');
      await this.updateAll(client);
    });
  }

  private static async updateAll(client: ClutchClient) {
    const channel = await client.channels.fetch(CHANNEL_ID).catch(() => null) as TextChannel;
    if (!channel) {
      logger.error(`Channel ${CHANNEL_ID} not found for Global Leaderboard.`);
      return;
    }

    const guild = channel.guild;
    await guild.members.fetch(); // Ensure role cache is fully populated

    // 1. Fetch DB Data (Faceit & Fastcup)
    let faceitTop: any[] = [];
    let fastcupTop: any[] = [];

    try {
      const conn = await dbPool.getConnection();
      try {
        const fRows = await conn.query('SELECT discord_id, faceit_elo, faceit_level, faceit_username FROM users WHERE faceit_elo > 0 ORDER BY faceit_elo DESC LIMIT 10');
        if (fRows) faceitTop = fRows;

        const fcRows = await conn.query('SELECT discord_id, fastcup_skill, fastcup_level, fastcup_url FROM users WHERE fastcup_skill IS NOT NULL ORDER BY fastcup_skill DESC LIMIT 10');
        if (fcRows) fastcupTop = fcRows;
      } finally {
        conn.release();
      }
    } catch (e) {
      logger.error('DB Error fetching leaderboards:', e);
    }

    // 2. Fetch Role Data (Premier & MM)
    const premierMembers = guild.members.cache.filter(m => m.roles.cache.some(r => r.name.startsWith('CS2 Premier | ')));
    const sortedPremier = premierMembers.sort((a, b) => {
      const aRole = a.roles.cache.filter(r => r.name.startsWith('CS2 Premier | ')).sort((r1, r2) => r2.position - r1.position).first();
      const bRole = b.roles.cache.filter(r => r.name.startsWith('CS2 Premier | ')).sort((r1, r2) => r2.position - r1.position).first();
      return (bRole?.position || 0) - (aRole?.position || 0);
    }).first(10);

    const mmMembers = guild.members.cache.filter(m => m.roles.cache.some(r => r.name.startsWith('CS 2 | ')));
    const sortedMM = mmMembers.sort((a, b) => {
      const aRole = a.roles.cache.filter(r => r.name.startsWith('CS 2 | ')).sort((r1, r2) => r2.position - r1.position).first();
      const bRole = b.roles.cache.filter(r => r.name.startsWith('CS 2 | ')).sort((r1, r2) => r2.position - r1.position).first();
      return (bRole?.position || 0) - (aRole?.position || 0);
    }).first(10);

    // Formatting helper
    const getRankIcon = (index: number) => {
      if (index === 0) return '🥇';
      if (index === 1) return '🥈';
      if (index === 2) return '🥉';
      return '🏅';
    };

    // --- Build FACEIT Embed ---
    let faceitDesc = '';
    let faceitThumb = '';
    for (let i = 0; i < faceitTop.length; i++) {
      const u = faceitTop[i];
      if (i === 0) {
        const topUser = await client.users.fetch(u.discord_id).catch(() => null);
        if (topUser) faceitThumb = topUser.displayAvatarURL({ size: 256 });
      }
      faceitDesc += `${getRankIcon(i)} **#${i + 1}** <@${u.discord_id}>\n╰ 🔸 **ELO:** ${u.faceit_elo} | 🔸 **Level:** ${u.faceit_level} | 🔸 **Faceit:** [${u.faceit_username || 'Link'}](https://faceit.com/en/players/${u.faceit_username})\n\n`;
    }
    if (!faceitDesc) faceitDesc = '*No players found.*';

    const embedFaceit = new EmbedBuilder()
      .setColor('#FF5500')
      .setTitle('🟧 FACEIT ALL-TIME TOP 10')
      .setDescription(faceitDesc);
    if (faceitThumb) embedFaceit.setThumbnail(faceitThumb);

    // --- Build PREMIER Embed ---
    let premierDesc = '';
    let premierThumb = '';
    for (let i = 0; i < sortedPremier.length; i++) {
      const m = sortedPremier[i];
      if (!m) continue;
      if (i === 0) premierThumb = m.user.displayAvatarURL({ size: 256 });
      const r = m.roles.cache.filter(rl => rl.name.startsWith('CS2 Premier | ')).sort((r1, r2) => r2.position - r1.position).first();
      premierDesc += `${getRankIcon(i)} **#${i + 1}** <@${m.id}>\n╰ 🔸 **Rank:** ${r ? r.name.replace('CS2 Premier | ', '') : 'Unknown'}\n\n`;
    }
    if (!premierDesc) premierDesc = '*No players found.*';

    const embedPremier = new EmbedBuilder()
      .setColor('#00E5FF')
      .setTitle('🌐 PREMIER ALL-TIME TOP 10')
      .setDescription(premierDesc);
    if (premierThumb) embedPremier.setThumbnail(premierThumb);

    // --- Build MM Embed ---
    let mmDesc = '';
    let mmThumb = '';
    for (let i = 0; i < sortedMM.length; i++) {
      const m = sortedMM[i];
      if (!m) continue;
      if (i === 0) mmThumb = m.user.displayAvatarURL({ size: 256 });
      const r = m.roles.cache.filter(rl => rl.name.startsWith('CS 2 | ')).sort((r1, r2) => r2.position - r1.position).first();
      mmDesc += `${getRankIcon(i)} **#${i + 1}** <@${m.id}>\n╰ 🔸 **Rank:** ${r ? r.name.replace('CS 2 | ', '') : 'Unknown'}\n\n`;
    }
    if (!mmDesc) mmDesc = '*No players found.*';

    const embedMM = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle('🏆 CS2 MM ALL-TIME TOP 10')
      .setDescription(mmDesc);
    if (mmThumb) embedMM.setThumbnail(mmThumb);

    // --- Build FASTCUP Embed ---
    let fastcupDesc = '';
    let fastcupThumb = '';
    for (let i = 0; i < fastcupTop.length; i++) {
      const u = fastcupTop[i];
      if (i === 0) {
        const topUser = await client.users.fetch(u.discord_id).catch(() => null);
        if (topUser) fastcupThumb = topUser.displayAvatarURL({ size: 256 });
      }
      const pUrl = u.fastcup_url || 'https://fastcup.net';
      const shortProfileName = pUrl.split('/').pop() || 'Profile';
      fastcupDesc += `${getRankIcon(i)} **#${i + 1}** <@${u.discord_id}>\n╰ 🔸 **Skill:** ${u.fastcup_skill} | 🔸 **Level:** ${u.fastcup_level} | 🔸 **Profile:** [${shortProfileName}](${pUrl})\n\n`;
    }
    if (!fastcupDesc) fastcupDesc = '*No players found.*';

    const embedFastcup = new EmbedBuilder()
      .setColor('#4287f5')
      .setTitle('🔵 FASTCUP ALL-TIME TOP 10')
      .setDescription(fastcupDesc)
      .setFooter({ text: 'Last Updated', iconURL: client.user?.displayAvatarURL() })
      .setTimestamp();
    if (fastcupThumb) embedFastcup.setThumbnail(fastcupThumb);

    // Post or Edit logic
    await this.syncMessage(channel, 'lb_msg_faceit', { embeds: [embedFaceit] });
    await this.syncMessage(channel, 'lb_msg_premier', { embeds: [embedPremier] });
    await this.syncMessage(channel, 'lb_msg_mm', { embeds: [embedMM] });
    await this.syncMessage(channel, 'lb_msg_fastcup', { embeds: [embedFastcup] });

    logger.info('Global leaderboard panels updated successfully.');
  }

  private static async syncMessage(channel: TextChannel, dbKey: string, payload: any) {
    let msgId = null;
    try {
      const conn = await dbPool.getConnection();
      try {
        const rows = await conn.query('SELECT setting_value FROM bot_settings WHERE setting_key = ?', [dbKey]);
        if (rows && rows.length > 0) msgId = rows[0].setting_value;
      } finally {
        conn.release();
      }
    } catch (e) {}

    if (msgId) {
      try {
        const msg = await channel.messages.fetch(msgId);
        await msg.edit(payload);
        return;
      } catch (e) {
        // Fall through to create new if message deleted
      }
    }

    const newMsg = await channel.send(payload);
    try {
      const conn = await dbPool.getConnection();
      try {
        await conn.query('INSERT INTO bot_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?', [dbKey, newMsg.id, newMsg.id]);
      } finally {
        conn.release();
      }
    } catch (e) {
      logger.error(`Failed to save ${dbKey} msg id to DB:`, e);
    }
  }
}
