import { getClient } from '../client.js';
import { dbPool } from '../../database/connection.js';
import { Logger } from '../../utils/logger.js';
import { ChannelType, VoiceChannel } from 'discord.js';

const logger = new Logger('VoiceMover');

export async function handleMatchReady(payload: any) {
  const matchId = payload.id;
  const hubId = payload.entity.id;
  const teamA = payload.teams[0];
  const teamB = payload.teams[1];

  let conn;
  try {
    conn = await dbPool.getConnection();
    
    // Maçı DB'ye kaydet
    await conn.query(`
      INSERT INTO active_matches (match_id, hub_id, status, team_a_name, team_b_name, team_a_captain, team_b_captain)
      VALUES (?, ?, 'READY', ?, ?, ?, ?)
    `, [matchId, hubId, teamA.name, teamB.name, teamA.leader, teamB.leader]);

    const client = getClient();
    const guild = client.guilds.cache.get(process.env.GUILD_ID!);
    if (!guild) return;

    // Geçici ses kanalları oluştur
    const channelA = await guild.channels.create({
      name: `Match ${matchId.substring(0,5)} - ${teamA.name}`,
      type: ChannelType.GuildVoice,
      userLimit: 5
    });

    const channelB = await guild.channels.create({
      name: `Match ${matchId.substring(0,5)} - ${teamB.name}`,
      type: ChannelType.GuildVoice,
      userLimit: 5
    });

    // DB'ye kanalları güncelle
    await conn.query(`UPDATE active_matches SET voice_channel_a = ?, voice_channel_b = ? WHERE match_id = ?`, 
      [channelA.id, channelB.id, matchId]);

    // Oyuncuları eşleştir ve DB'ye yaz
    const movePlayers = async (team: any, teamChar: string, voiceChannelId: string) => {
      for (const roster of team.roster) {
        const faceitId = roster.id;
        // Bu Faceit ID'sine sahip Discord kullanıcısını bul
        const rows = await conn.query('SELECT discord_id FROM users WHERE faceit_id = ?', [faceitId]);
        if (rows.length > 0) {
          const discordId = rows[0].discord_id;
          
          await conn.query('INSERT INTO match_players (match_id, discord_id, team) VALUES (?, ?, ?)', 
            [matchId, discordId, teamChar]);

          // Kullanıcı şu an sunucuda bir seste mi?
          const member = guild.members.cache.get(discordId);
          if (member && member.voice.channelId) {
            await member.voice.setChannel(voiceChannelId).catch(err => logger.error(`Kullanıcı taşınamadı: ${discordId}`, err));
            logger.info(`${member.user.tag} -> ${teamChar} takım odasına taşındı.`);
          }
        }
      }
    };

    await movePlayers(teamA, 'A', channelA.id);
    await movePlayers(teamB, 'B', channelB.id);

  } catch (error) {
    logger.error('handleMatchReady hatası:', error);
  } finally {
    if (conn) conn.release();
  }
}

export async function handleMatchFinished(payload: any) {
  const matchId = payload.id;
  
  let conn;
  try {
    conn = await dbPool.getConnection();
    const matchRows = await conn.query('SELECT * FROM active_matches WHERE match_id = ?', [matchId]);
    
    if (matchRows.length === 0) return;
    const match = matchRows[0];

    await conn.query('UPDATE active_matches SET status = ? WHERE match_id = ?', ['FINISHED', matchId]);

    const client = getClient();
    const guild = client.guilds.cache.get(process.env.GUILD_ID!);
    if (!guild) return;

    // Oyuncuları bekleme odasına (veya null'a) geri al
    const LOBBY_CHANNEL_ID = process.env.LOBBY_CHANNEL_ID; // İsteğe bağlı
    const players = await conn.query('SELECT discord_id FROM match_players WHERE match_id = ?', [matchId]);
    
    for (const p of players) {
      const member = guild.members.cache.get(p.discord_id);
      if (member && member.voice.channelId) {
        if (LOBBY_CHANNEL_ID) {
          await member.voice.setChannel(LOBBY_CHANNEL_ID).catch(() => {});
        } else {
          await member.voice.disconnect().catch(() => {});
        }
      }
    }

    // Odaları sil
    if (match.voice_channel_a) {
      const ch = guild.channels.cache.get(match.voice_channel_a);
      if (ch) await ch.delete().catch(() => {});
    }
    if (match.voice_channel_b) {
      const ch = guild.channels.cache.get(match.voice_channel_b);
      if (ch) await ch.delete().catch(() => {});
    }

  } catch (error) {
    logger.error('handleMatchFinished hatası:', error);
  } finally {
    if (conn) conn.release();
  }
}
