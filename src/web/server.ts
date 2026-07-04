import express from 'express';
import session from 'express-session';
import MySQLStoreFactory from 'express-mysql-session';
import passport from 'passport';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';
import { Logger } from '../utils/logger.js';
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logger = new Logger('WebServer');
const app = express();

export async function startWeb() {
  const port = process.env.PORT || 3000;

  // Middleware
  app.set('trust proxy', 1);
  app.use((req, res, next) => {
      logger.info(`[${req.method}] ${req.url}`);
      next();
  });
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, 'public')));
  
  // View Engine (EJS)
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  // Session
  const MySQLStore = MySQLStoreFactory(session as any);
  const sessionStore = new MySQLStore({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'supersecret',
    database: process.env.DB_NAME || 'faceitlutch_db',
    clearExpired: true,
    checkExpirationInterval: 900000,
    expiration: 86400000
  });

  app.use(session({
    name: 'clutch.sid',
    secret: process.env.SESSION_SECRET || 'fallback_secret',
    store: sessionStore as any,
    resave: false,
    saveUninitialized: false, // Don't save empty sessions to DB
    cookie: { 
        secure: true, 
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000
    }
  }));

  // Passport Init
  app.use(passport.initialize());
  app.use(passport.session());

  // Routes
  app.use('/auth', authRoutes);
  app.use('/api', apiRoutes);

  // Homepage redirect
  app.get('/', (req, res) => {
    if (req.user) {
      res.redirect('/dashboard');
    } else {
      res.render('index', { user: null });
    }
  });

  // Dashboard
  app.get('/dashboard', async (req, res) => {
    if (!req.user) return res.redirect('/');
    
    try {
      const { dbPool } = await import('../database/connection.js');
      const discordUser = req.user as any;
      
      const conn = await dbPool.getConnection();
      const rows = await conn.query('SELECT * FROM users WHERE discord_id = ?', [discordUser.id]);
      conn.release();
      
      const dbUser = rows[0] || null;
      res.render('dashboard', { user: discordUser, dbUser });
    } catch (err) {
      logger.error('Error loading dashboard:', err);
      res.redirect('/');
    }
  });

  return new Promise<void>((resolve) => {
    app.listen(port, () => {
      logger.info(`Web server running on http://localhost:${port} (or https://${process.env.DOMAIN})`);
      resolve();
    });
  });
}
