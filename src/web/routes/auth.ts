import { Router } from 'express';
import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { Strategy as SteamStrategy } from 'passport-steam';
import { config } from 'dotenv';
import axios from 'axios';
import { Logger } from '../../utils/logger.js';
import { dbPool } from '../../database/connection.js';
import { assignVerifiedRoles } from '../../bot/services/roleManager.js';

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
  // Discord datasını session'da geçici tut
  (req.session as any).tempDiscord = req.user;
  next();
}, passport.authenticate('steam'));

router.get('/steam/callback', passport.authenticate('steam', {
  failureRedirect: '/'
}), (req, res) => {
  // Steam dönüşü req.user Steam bilgisini alır, önceki Discord datasını birleştirelim
  const steamData = req.user as any;
  const discordData = (req.session as any).tempDiscord;
  
  if (!discordData) return res.redirect('/');

  req.login({ ...discordData, steamId64: steamData.steamId64 }, (err) => {
    if (err) return res.redirect('/');
    res.redirect('/auth/step3');
  });
});

router.get('/step3', (req, res) => {
  if (!req.user || !(req.user as any).steamId64) return res.redirect('/auth/step2');
  res.render('step3', { user: req.user, error: null });
});

router.post('/faceit', async (req, res) => {
  const user = req.user as any;
  if (!user || !user.steamId64) return res.redirect('/');

  const faceitUsername = req.body.faceit_username;
  if (!faceitUsername) return res.render('step3', { user, error: 'Lütfen FACEIT kullanıcı adınızı girin.' });

  try {
    // Faceit API'ye istek at
    const response = await axios.get(`https://open.faceit.com/data/v4/players?nickname=${faceitUsername}&game=cs2`, {
      headers: { 'Authorization': `Bearer ${process.env.FACEIT_API_KEY}` }
    });

    const faceitData = response.data;
    const faceitId = faceitData.player_id;
    const cs2Data = faceitData.games.cs2;
    const faceitElo = cs2Data.faceit_elo;
    const faceitLevel = cs2Data.skill_level;

    // Steam eşleşme kontrolü (Opsiyonel ama güvenlik için çok önemli)
    // Eğer FACEIT API'den gelen Steam ID ile bizim login olduğumuz Steam ID uyuşmuyorsa reddet!
    // Faceit API genelde steam_id_64 döner.
    const faceitSteamId = faceitData.platforms?.steam;
    if (faceitSteamId && faceitSteamId !== user.steamId64) {
      return res.render('step3', { user, error: 'Bu FACEIT hesabı, giriş yaptığınız Steam hesabına bağlı değil!' });
    }

    // MariaDB'ye Kayıt (veya Güncelleme)
    const conn = await dbPool.getConnection();
    try {
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

      logger.info(`${user.username} (${user.discordId}) başarıyla FACEIT doğrulamasını tamamladı. (Level: ${faceitLevel})`);
      
      // Bot'a Discord Rolünü verme emri gönder
      await assignVerifiedRoles(user.discordId, faceitLevel);

    } finally {
      conn.release();
    }

    req.login({ ...user, faceitUsername, faceitElo, faceitLevel }, (err) => {
      res.render('success', { user: req.user, guildId: process.env.GUILD_ID });
    });

  } catch (error: any) {
    logger.error('Faceit API Hatası:', error.response?.data || error.message);
    const errorMsg = error.response?.status === 404 
      ? 'FACEIT kullanıcısı bulunamadı.' 
      : 'API Hatası. Lütfen daha sonra tekrar deneyin.';
    res.render('step3', { user, error: errorMsg });
  }
});

export default router;
