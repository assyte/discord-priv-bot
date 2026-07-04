import cron from 'node-cron';
import axios from 'axios';
import { Guild, ActivityType } from 'discord.js';
import { getClient } from '../client.js';
import { dbPool } from '../../database/connection.js';
import { ActivityChannelManager } from './activityChannelManager.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('ActivityTracker');

const CS2_APP_ID = '730';
const CS16_APP_ID = '10';

interface SteamInfo {
  personaName: string;
  gameId: string | null;
}

export function startActivityTracker() {
  cron.schedule('*/5 * * * *', async () => {
    logger.info('Activity tracker running...');
    let conn: any;
    try {
      conn = await dbPool.getConnection();

      const users = await conn.query(
        'SELECT discord_id, steam_id_64, faceit_username, faceit_elo, faceit_level, fastcup_level, fastcup_skill FROM users WHERE is_verified = 1'
      );

      const guild = getClient().guilds.cache.get(process.env.GUILD_ID!) as Guild | undefined;

      // 1. Steam API — batch activity check
      const steamActivity = await checkSteamActivity(users);

      // 2. Discord Presence — cached check
      const discordActivity = guild ? checkDiscordPresence(guild, users) : new Map<string, 'cs2' | 'cs16'>();

      // 3. Build panel data
      const activeCs2: { id: string; username: string; extraInfo?: string }[] = [];
      const activeCs16: { id: string; username: string; extraInfo?: string }[] = [];
      const faceitData: { id: string; username: string; extraInfo?: string }[] = [];
      const fastcupData: { id: string; username: string; extraInfo?: string }[] = [];

      for (const user of users) {
        const steamInfo = user.steam_id_64 ? steamActivity.get(user.steam_id_64) : undefined;
        const discordGame = discordActivity.get(user.discord_id);

        if (steamInfo?.gameId === CS2_APP_ID || discordGame === 'cs2') {
          activeCs2.push({
            id: user.discord_id,
            username: steamInfo?.personaName ?? 'Unknown'
          });
        }

        if (steamInfo?.gameId === CS16_APP_ID || discordGame === 'cs16') {
          activeCs16.push({
            id: user.discord_id,
            username: steamInfo?.personaName ?? 'Unknown'
          });
        }

        if (user.faceit_username) {
          faceitData.push({
            id: user.discord_id,
            username: user.faceit_username,
            extraInfo: `Level ${user.faceit_level} · ${user.faceit_elo} ELO`
          });
        }

        if (user.fastcup_level) {
          fastcupData.push({
            id: user.discord_id,
            username: `<@${user.discord_id}>`,
            extraInfo: `Rank ${user.fastcup_level} · ${user.fastcup_skill} Skill`
          });
        }
      }

      // 4. Update all 4 panels in parallel
      await Promise.all([
        ActivityChannelManager.updatePanel('cs2', activeCs2),
        ActivityChannelManager.updatePanel('cs16', activeCs16),
        ActivityChannelManager.updatePanel('faceit', faceitData),
        ActivityChannelManager.updatePanel('fastcup', fastcupData)
      ]);

      logger.info(`Tracker done — CS2:${activeCs2.length} CS16:${activeCs16.length} Faceit:${faceitData.length} Fastcup:${fastcupData.length}`);
    } catch (error) {
      logger.error('Activity tracker error:', error);
    } finally {
      if (conn) conn.release();
    }
  });
}

async function checkSteamActivity(users: any[]): Promise<Map<string, SteamInfo>> {
  const map = new Map<string, SteamInfo>();
  const apiKey = process.env.STEAM_API_KEY;
  if (!apiKey) return map;

  const steamIds = [...new Set(users.map(u => u.steam_id_64).filter(Boolean))] as string[];
  if (steamIds.length === 0) return map;

  for (let i = 0; i < steamIds.length; i += 100) {
    const batch = steamIds.slice(i, i + 100);
    try {
      const { data } = await axios.get('https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/', {
        params: { key: apiKey, steamids: batch.join(',') },
        timeout: 10000
      });
      for (const p of data?.response?.players ?? []) {
        map.set(p.steamid, { personaName: p.personaname ?? 'Unknown', gameId: p.gameid ?? null });
      }
    } catch (err: any) {
      logger.error('Steam API error:', err);
    }
  }

  return map;
}

function checkDiscordPresence(guild: Guild, users: any[]): Map<string, 'cs2' | 'cs16'> {
  const map = new Map<string, 'cs2' | 'cs16'>();

  for (const u of users) {
    const member = guild.members.cache.get(u.discord_id);
    if (!member?.presence) continue;

    for (const activity of member.presence.activities) {
      if (activity.type !== ActivityType.Playing) continue;
      const name = activity.name.toLowerCase();

      if (name.includes('counter-strike 2') || name.includes('cs2') || name.includes('csgo')) {
        map.set(u.discord_id, 'cs2');
        break;
      }

      if (name.includes('counter-strike 1.6') || name.includes('cs 1.6') || name.includes('counter-strike: 1.6')) {
        map.set(u.discord_id, 'cs16');
        break;
      }
    }
  }

  return map;
}
