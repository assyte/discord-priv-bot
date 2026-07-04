import cron from 'node-cron';
import axios from 'axios';
import { getClient } from '../client.js';
import { dbPool } from '../../database/connection.js';
import { Logger } from '../../utils/logger.js';
import { ActivityChannelManager } from './activityChannelManager.js';
import { assignVerifiedRoles, assignFastcupRoles } from './roleManager.js';

const logger = new Logger('ActivityTracker');

interface DbUser {
  discord_id: string;
  steam_id_64: string;
  faceit_id: string;
  faceit_username: string;
  faceit_level: number;
  fastcup_url: string;
  fastcup_level: string;
}

export class ActivityTracker {
  private static faceitSyncQueue: DbUser[] = [];
  private static fastcupSyncQueue: DbUser[] = [];

  static start() {
    logger.info('Starting ActivityTracker jobs...');

    // Panel Activity Updater (Every 2 minutes)
    cron.schedule('*/2 * * * *', async () => {
      try {
        await this.updateLivePanels();
      } catch (e) {
        logger.error('Error updating live panels:', e);
      }
    });

    // Faceit/Fastcup Level Syncer (Every 1 minute)
    cron.schedule('*/1 * * * *', async () => {
      try {
        await this.syncRanks();
      } catch (e) {
        logger.error('Error syncing ranks:', e);
      }
    });
  }

  private static async updateLivePanels() {
    const client = getClient();
    const guild = client.guilds.cache.get(process.env.GUILD_ID!);
    if (!guild) return;

    const conn = await dbPool.getConnection();
    const users: DbUser[] = await conn.query('SELECT discord_id, steam_id_64 FROM users WHERE is_verified = 1');
    conn.release();

    const activeCS2 = new Map<string, any>();
    const activeCS16 = new Map<string, any>();
    const activeFaceit = new Map<string, any>();
    const activeFastcup = new Map<string, any>();

    const discordMembers = await guild.members.fetch();

    // 1. Check Discord Presence
    for (const [memberId, member] of discordMembers) {
      if (member.user.bot || !member.presence) continue;
      
      let playingCS2 = false;
      let playingCS16 = false;
      let playingFaceit = false;
      let playingFastcup = false;
      
      let state = '';
      let details = '';
      let elapsed = '';

      for (const activity of member.presence.activities) {
        const name = activity.name?.toLowerCase() || '';
        const actState = activity.state || '';
        const actDetails = activity.details || '';
        const fullText = `${name} ${actState} ${actDetails}`.toLowerCase();

        const isCS2 = fullText.includes('counter-strike 2') || name === 'cs2';
        const isCS16 = fullText.includes('counter-strike 1.6') || name === 'counter-strike';
        const isFaceit = fullText.includes('faceit');
        const isFastcup = fullText.includes('fastcup');

        if (isCS2 || isCS16 || isFaceit || isFastcup) {
          if (isCS2) playingCS2 = true;
          if (isCS16) playingCS16 = true;
          if (isFaceit) playingFaceit = true;
          if (isFastcup) playingFastcup = true;

          state = actState;
          details = actDetails;

          if (activity.timestamps?.start) {
            const diffMs = Date.now() - activity.timestamps.start.getTime();
            const mins = Math.floor(diffMs / 60000);
            elapsed = mins > 0 ? `${mins}m` : '<1m';
          }
        }
      }

      const userData = { id: member.id, username: member.user.username, state, details, elapsed, source: 'discord' };

      if (playingCS2) activeCS2.set(member.id, userData);
      if (playingCS16) activeCS16.set(member.id, userData);
      if (playingFaceit) activeFaceit.set(member.id, userData);
      if (playingFastcup) activeFastcup.set(member.id, userData);
    }

    // 2. Check Steam API for Verified Users
    if (process.env.STEAM_API_KEY && users.length > 0) {
      const steamUsers = users.filter(u => u.steam_id_64);
      // Steam API accepts max 100 steam IDs per request
      for (let i = 0; i < steamUsers.length; i += 100) {
        const chunk = steamUsers.slice(i, i + 100);
        const steamIds = chunk.map(u => u.steam_id_64).join(',');
        
        try {
          const res = await axios.get(`http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${steamIds}`);
          const players = res.data.response?.players || [];
          
          for (const player of players) {
            const discordUser = chunk.find(u => u.steam_id_64 === player.steamid);
            if (!discordUser) continue;

            const discordId = discordUser.discord_id;
            const member = discordMembers.get(discordId);
            const username = member ? member.user.username : 'Unknown Player';

            const gameId = player.gameid;
            const gameInfo = player.gameextrainfo || '';
            const isPlayingCS2 = gameId === '730';
            const isPlayingCS16 = gameId === '10';
            const isPlayingFaceit = gameInfo.toLowerCase().includes('faceit');
            const isPlayingFastcup = gameInfo.toLowerCase().includes('fastcup');

            const userData = { id: discordId, username, state: gameInfo, details: '', elapsed: '', source: 'steam' };

            if (isPlayingCS2 && !activeCS2.has(discordId)) activeCS2.set(discordId, userData);
            if (isPlayingCS16 && !activeCS16.has(discordId)) activeCS16.set(discordId, userData);
            if (isPlayingFaceit && !activeFaceit.has(discordId)) activeFaceit.set(discordId, userData);
            if (isPlayingFastcup && !activeFastcup.has(discordId)) activeFastcup.set(discordId, userData);
          }
        } catch (err) {
          logger.error('Steam API error in ActivityTracker', err);
        }
      }
    }

    // 3. Update Panels
    await ActivityChannelManager.updatePanel('cs2', Array.from(activeCS2.values()));
    await ActivityChannelManager.updatePanel('cs16', Array.from(activeCS16.values()));
    await ActivityChannelManager.updatePanel('faceit', Array.from(activeFaceit.values()));
    await ActivityChannelManager.updatePanel('fastcup', Array.from(activeFastcup.values()));
  }

  private static async syncRanks() {
    const conn = await dbPool.getConnection();
    
    // Repopulate queues if empty
    if (this.faceitSyncQueue.length === 0) {
      const users: DbUser[] = await conn.query('SELECT discord_id, faceit_id, faceit_username, faceit_level FROM users WHERE is_verified = 1 AND faceit_id IS NOT NULL');
      this.faceitSyncQueue = users;
    }
    if (this.fastcupSyncQueue.length === 0) {
      const users: DbUser[] = await conn.query('SELECT discord_id, fastcup_url, fastcup_level FROM users WHERE is_verified = 1 AND fastcup_url IS NOT NULL');
      this.fastcupSyncQueue = users;
    }

    // Process 20 Faceit users
    const faceitBatch = this.faceitSyncQueue.splice(0, 20);
    for (const user of faceitBatch) {
      try {
        const statsRes = await axios.get(`https://open.faceit.com/data/v4/players/${user.faceit_id}/stats/cs2`, {
          headers: { 'Authorization': `Bearer ${process.env.FACEIT_API_KEY}` }
        });
        const totalMatches = parseInt(statsRes.data.lifetime?.Matches || '0');
        
        let newLevel = 1;
        if (totalMatches < 10) {
          newLevel = 0;
        } else {
          const profileRes = await axios.get(`https://open.faceit.com/data/v4/players/${user.faceit_id}`, {
            headers: { 'Authorization': `Bearer ${process.env.FACEIT_API_KEY}` }
          });
          newLevel = profileRes.data.games?.cs2?.skill_level || profileRes.data.games?.csgo?.skill_level || 1;
        }

        if (newLevel !== user.faceit_level) {
          logger.info(`Level değişimi tespit edildi (${user.faceit_username}): ${user.faceit_level} -> ${newLevel}`);
          await conn.query('UPDATE users SET faceit_level = ? WHERE discord_id = ?', [newLevel, user.discord_id]);
          await assignVerifiedRoles(user.discord_id, newLevel);
        }
      } catch (err: any) {
        if (err.response?.status !== 404) {
          logger.error(`Faceit sync error for ${user.faceit_username}:`, err.message);
        }
      }
    }

    // Process 5 Fastcup users (Scraping is slower, process fewer at a time)
    const fastcupBatch = this.fastcupSyncQueue.splice(0, 5);
    for (const user of fastcupBatch) {
      try {
        const { scrapeFastcupProfile } = await import('../../web/services/fastcupScraper.js');
        const fcData = await scrapeFastcupProfile(user.fastcup_url);
        
        if (fcData.level && fcData.level !== user.fastcup_level) {
          logger.info(`Fastcup Rank değişimi tespit edildi: ${user.fastcup_level} -> ${fcData.level}`);
          await conn.query('UPDATE users SET fastcup_level = ? WHERE discord_id = ?', [fcData.level, user.discord_id]);
          await assignFastcupRoles(user.discord_id, fcData.level);
        }
      } catch (err: any) {
        logger.error(`Fastcup sync error for ${user.discord_id}:`, err.message);
      }
    }

    conn.release();
  }
}
