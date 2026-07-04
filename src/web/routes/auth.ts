import { Router } from 'express';
import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { Strategy as SteamStrategy } from 'passport-steam';
import { config } from 'dotenv';
import axios from 'axios';
import { Logger } from '../../utils/logger.js';
import { dbPool } from '../../database/connection.js';
import { assignVerifiedRoles, assignSteamVerifiedRole, assignFastcupRoles, sendVerificationLogPanel } from '../../bot/services/roleManager.js';

config();

const logger = new Logger('AuthRoutes');
const router = Router();

passport.serializeUser((user: any, done) => {
  done(null, user);
});

passport.deserializeUser((obj: any, done) => {
  done(null, obj);
});

if (process.env.DISCORD_CLIENT_SECRET) {
  passport.use(new DiscordStrategy({
    clientID: process.env.CLIENT_ID!,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    callbackURL: `https://${process.env.DOMAIN || 'localhost:3000'}/auth/discord/callback`,
    scope: ['identify', 'guilds', 'guilds.join']
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      return done(null, { discordId: profile.id, username: profile.username, avatar: profile.avatar });
    } catch (err) {
      return done(err);
    }
  }));
}

if (process.env.STEAM_API_KEY) {
  passport.use(new SteamStrategy({
    returnURL: `https://${process.env.DOMAIN || 'localhost:3000'}/auth/steam/callback`,
    realm: `https://${process.env.DOMAIN || 'localhost:3000'}/`,
    apiKey: process.env.STEAM_API_KEY
  }, async (identifier: string, profile: any, done: any) => {
    try {
      const steamId64 = identifier.split('/').pop();
      return done(null, { steamId64, displayName: profile.displayName });
    } catch (err) {
      return done(err);
    }
  }));
}

// ==========================================
// ROUTES
// ==========================================

router.get('/discord', passport.authenticate('discord'));

router.get('/discord/callback', passport.authenticate('discord', {
  failureRedirect: '/'
}), (req, res) => {
  res.redirect('/auth/step2');
});

router.get('/step2', (req, res) => {
  if (!req.user || !(req.user as any).discordId) return res.redirect('/');
  res.render('step2', { user: req.user });
});

router.get('/steam', (req, res, next) => {
  if (!req.user || !(req.user as any).discordId) return res.redirect('/');
  // Store Discord data temporarily in session
  (req.session as any).tempDiscord = req.user;
  next();
}, passport.authenticate('steam'));

router.get('/steam/callback', (req, res, next) => {
  logger.info('Steam callback hit. Session ID: ' + req.sessionID);
  logger.info('Session contents: ' + JSON.stringify(req.session));
  next();
}, passport.authenticate('steam', {
  failureRedirect: '/?error=steam_failed',
  keepSessionInfo: true
}), (req, res) => {
  // Steam callback gets steam data in req.user; merge with previous Discord data
  const steamData = req.user as any;
  const discordData = (req.session as any).tempDiscord;
  
  logger.info('Steam Auth Success. SteamData: ' + JSON.stringify(steamData));
  logger.info('DiscordData from session: ' + JSON.stringify(discordData));

  if (!discordData) {
      logger.error('Discord data missing from session!');
      return res.redirect('/?error=missing_discord');
  }

  req.login({ ...discordData, steamId64: steamData.steamId64 }, (err) => {
    if (err) {
        logger.error('Login error after Steam: ' + err);
        return res.redirect('/?error=login_error');
    }
    logger.info('Login successful, redirecting to step3');
    res.redirect('/auth/step3');
  });
});

router.get('/step3', (req, res) => {
  if (!req.user || !(req.user as any).steamId64) return res.redirect('/auth/step2');
  res.render('step3', { user: req.user, error: null });
});

router.post('/complete', async (req, res) => {
  const user = req.user as any;
  if (!user || !user.steamId64) return res.redirect('/');

  let faceitUsername = req.body.faceit_username?.trim();
  let fastcupUrl = req.body.fastcup_url?.trim();

  // If both are empty, they'll just be Steam Verified.
  // So we don't throw an error, just let them proceed.

  let faceitId = null, faceitElo = 1000, faceitLevel = 1;
  let fastcupId = null, fastcupSkill = 1000, fastcupLevel = 'E';

  try {
    // 1. FACEIT PROCESSING (If provided)
    if (faceitUsername) {
      logger.info('Querying Faceit API for: ' + faceitUsername);
      const response = await axios.get(`https://open.faceit.com/data/v4/players?nickname=${faceitUsername}&game=cs2`, {
        headers: { 'Authorization': `Bearer ${process.env.FACEIT_API_KEY}` }
      });
      const faceitData = response.data;
      const faceitSteamId = faceitData.steam_id_64 || faceitData.platforms?.steam;
      
      logger.info('faceitData.steam_id_64: ' + faceitData.steam_id_64);
      logger.info('faceitData.platforms?.steam: ' + faceitData.platforms?.steam);
      logger.info('user.steamId64: ' + user.steamId64);

      if (faceitData.steam_id_64 && String(faceitData.steam_id_64) !== String(user.steamId64)) {
        return res.render('step3', { user, error: 'The FACEIT account you entered is not linked to your Steam account!' });
      } else if (!faceitData.steam_id_64 && faceitSteamId && String(faceitSteamId) !== String(user.steamId64)) {
        // Fallback
      }

      faceitId = faceitData.player_id;
      const cs2Data = faceitData.games?.cs2 || {};
      faceitElo = cs2Data.faceit_elo || 1000;
      let tempLevel = cs2Data.skill_level || 1;

      try {
        const statsRes = await axios.get(`https://open.faceit.com/data/v4/players/${faceitId}/stats/cs2`, {
          headers: { 'Authorization': `Bearer ${process.env.FACEIT_API_KEY}` }
        });
        const totalMatches = parseInt(statsRes.data.lifetime?.Matches || '0');
        if (totalMatches < 10) {
          tempLevel = 0;
        }
      } catch (err) {
        tempLevel = 0; // Returns 404 if no matches played
      }
      
      faceitLevel = tempLevel;
    }

    // 2. FASTCUP PROCESSING (If provided)
    if (fastcupUrl) {
      const { scrapeFastcupProfile } = await import('../services/fastcupScraper.js');
      const fData = await scrapeFastcupProfile(fastcupUrl);
      fastcupId = fData.fastcupId;
      fastcupSkill = fData.skill;
      fastcupLevel = fData.level;
    }

    // 3. DATABASE RECORD
    const conn = await dbPool.getConnection();
    try {
      if (faceitUsername && fastcupUrl) {
        await conn.query(`
          INSERT INTO users (discord_id, steam_id_64, faceit_id, faceit_username, faceit_elo, faceit_level, fastcup_url, fastcup_id, fastcup_skill, fastcup_level, is_verified)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
          ON DUPLICATE KEY UPDATE 
            steam_id_64 = VALUES(steam_id_64),
            faceit_id = VALUES(faceit_id),
            faceit_username = VALUES(faceit_username),
            faceit_elo = VALUES(faceit_elo),
            faceit_level = VALUES(faceit_level),
            fastcup_url = VALUES(fastcup_url),
            fastcup_id = VALUES(fastcup_id),
            fastcup_skill = VALUES(fastcup_skill),
            fastcup_level = VALUES(fastcup_level),
            is_verified = 1
        `, [user.discordId, user.steamId64, faceitId, faceitUsername, faceitElo, faceitLevel, fastcupUrl, fastcupId, fastcupSkill, fastcupLevel]);
      } 
      else if (faceitUsername) {
        // Faceit only
        await conn.query(`
          INSERT INTO users (discord_id, steam_id_64, faceit_id, faceit_username, faceit_elo, faceit_level, is_verified)
          VALUES (?, ?, ?, ?, ?, ?, 1)
          ON DUPLICATE KEY UPDATE 
            steam_id_64 = VALUES(steam_id_64),
            faceit_id = VALUES(faceit_id),
            faceit_username = VALUES(faceit_username),
            faceit_elo = VALUES(faceit_elo),
            faceit_level = VALUES(faceit_level),
            is_verified = 1
        `, [user.discordId, user.steamId64, faceitId, faceitUsername, faceitElo, faceitLevel]);
      } 
      else if (fastcupUrl) {
        // Fastcup only (Faceit empty)
        // NOTE: faceit_id is NOT NULL UNIQUE, so we assign a dummy value
        const dummyFaceitId = `fc_${fastcupId}`;
        await conn.query(`
          INSERT INTO users (discord_id, steam_id_64, faceit_id, faceit_username, fastcup_url, fastcup_id, fastcup_skill, fastcup_level, is_verified)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
          ON DUPLICATE KEY UPDATE 
            steam_id_64 = VALUES(steam_id_64),
            fastcup_url = VALUES(fastcup_url),
            fastcup_id = VALUES(fastcup_id),
            fastcup_skill = VALUES(fastcup_skill),
            fastcup_level = VALUES(fastcup_level),
            is_verified = 1
        `, [user.discordId, user.steamId64, dummyFaceitId, 'N/A', fastcupUrl, fastcupId, fastcupSkill, fastcupLevel]);
      }

      logger.info(`${user.username} (${user.discordId}) completed verification.`);
      
      // DISCORD ROL ATAMALARI
      await assignSteamVerifiedRole(user.discordId);

      if (faceitUsername) {
        await assignVerifiedRoles(user.discordId, faceitLevel);
      }
      if (fastcupUrl) {
        await assignFastcupRoles(user.discordId, fastcupLevel);
      }

      await sendVerificationLogPanel(
        user.discordId,
        user.steamId64,
        faceitUsername ? { username: faceitUsername, level: faceitLevel, elo: faceitElo } : null,
        fastcupUrl ? { url: fastcupUrl, level: fastcupLevel, skill: fastcupSkill } : null
      );

    } finally {
      conn.release();
    }

    req.login({ ...user, faceitUsername, faceitElo, faceitLevel, fastcupUrl, fastcupLevel }, (err) => {
      res.render('success', { 
        user: req.user, 
        guildId: process.env.GUILD_ID,
        faceitUsername,
        fastcupUrl 
      });
    });

  } catch (error: any) {
    if (error.response) {
      logger.error('Faceit/Fastcup API Error (HTTP ' + error.response.status + '): ' + JSON.stringify(error.response.data));
    } else {
      logger.error('System Error: ' + error.stack);
    }
    const errorMsg = error.message === 'Invalid Fastcup URL format'
      ? 'Invalid Fastcup Profile URL! Please enter your full profile link (e.g. https://cs.fastcup.net/id12345) or leave it blank.'
      : (error.response?.status === 404 
        ? 'User not found. Please check your username.' 
        : 'API or System Error. Please try again later.');
    res.render('step3', { user, error: errorMsg });
  }
});

// Logout route
router.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err); }
    res.redirect('/');
  });
});

// Link accounts from dashboard
router.post('/dashboard/connect', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Your session has expired.' });
  }

  const { type, link } = req.body;
  const user = req.user as any;

  try {
    const conn = await dbPool.getConnection();
    
    if (type === 'faceit') {
      const faceitUsername = link.split('/').pop()?.trim() || '';
      
      const faceitRes = await axios.get(`https://open.faceit.com/data/v4/players?nickname=${faceitUsername}`, {
        headers: { 'Authorization': `Bearer ${process.env.FACEIT_API_KEY}` }
      });
      
      const faceitId = faceitRes.data.player_id;
      const cs2Data = faceitRes.data.games?.cs2 || {};
      const faceitElo = cs2Data.faceit_elo || 1000;
      let faceitLevel = cs2Data.skill_level || 1;
      
      try {
        const statsRes = await axios.get(`https://open.faceit.com/data/v4/players/${faceitId}/stats/cs2`, {
          headers: { 'Authorization': `Bearer ${process.env.FACEIT_API_KEY}` }
        });
        const totalMatches = parseInt(statsRes.data.lifetime?.Matches || '0');
        if (totalMatches < 10) {
          faceitLevel = 0;
        }
      } catch (err) {
        faceitLevel = 0;
      }
      
      await conn.query('UPDATE users SET faceit_id = ?, faceit_username = ?, faceit_level = ?, faceit_elo = ? WHERE discord_id = ?', [faceitId, faceitUsername, faceitLevel, faceitElo, user.id]);
      
      const { assignVerifiedRoles } = await import('../../bot/services/roleManager.js');
      await assignVerifiedRoles(user.id, faceitLevel);
      
    } else if (type === 'fastcup') {
      const { scrapeFastcupProfile } = await import('../services/fastcupScraper.js');
      const fcData = await scrapeFastcupProfile(link);
      
      await conn.query('UPDATE users SET fastcup_url = ?, fastcup_id = ?, fastcup_skill = ?, fastcup_level = ? WHERE discord_id = ?', 
        [link, fcData.fastcupId, fcData.skill, fcData.level, user.id]);
        
      const { assignFastcupRoles } = await import('../../bot/services/roleManager.js');
      await assignFastcupRoles(user.id, fcData.level);
    }
    
    conn.release();
    res.json({ success: true });
    
  } catch (error: any) {
    logger.error(`Dashboard connect error (${type}):`, error.message);
    res.status(500).json({ success: false, message: 'Connection failed. Please check the link you entered.' });
  }
});

export default router;
