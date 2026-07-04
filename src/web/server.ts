import express from 'express';
import session from 'express-session';
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
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, 'public')));
  
  // View Engine (EJS)
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));

  // Session
  app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Geliştirme aşamasında false, HTTPS geçince true olacak
  }));

  // Passport Init
  app.use(passport.initialize());
  app.use(passport.session());

  // Routes
  app.use('/auth', authRoutes);
  app.use('/api', apiRoutes);

  // Ana Sayfa Yönlendirmesi
  app.get('/', (req, res) => {
    res.render('index', { user: req.user || null });
  });

  return new Promise<void>((resolve) => {
    app.listen(port, () => {
      logger.info(`Web sunucusu http://localhost:${port} (veya https://${process.env.DOMAIN}) üzerinde çalışıyor.`);
      resolve();
    });
  });
}
