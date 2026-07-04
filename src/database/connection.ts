import mariadb from 'mariadb';
import { config } from 'dotenv';
import { Logger } from '../utils/logger.js';

config();

const logger = new Logger('Database');

export const dbPool = mariadb.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'supersecret',
  database: process.env.DB_NAME || 'faceitlutch_db',
  connectionLimit: 10,
  charset: 'utf8mb4'
});

export async function initDatabase() {
  let conn: any;
  try {
    conn = await dbPool.getConnection();
    
    // 1. User Information Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        discord_id VARCHAR(20) NOT NULL PRIMARY KEY,
        steam_id_64 VARCHAR(17) NOT NULL UNIQUE,
        faceit_id VARCHAR(50) NOT NULL UNIQUE,
        faceit_username VARCHAR(32) NOT NULL,
        faceit_elo INT NOT NULL DEFAULT 1000,
        faceit_level INT NOT NULL DEFAULT 1,
        fastcup_url VARCHAR(255) DEFAULT NULL,
        fastcup_id VARCHAR(50) DEFAULT NULL UNIQUE,
        fastcup_skill INT DEFAULT 1000,
        fastcup_level VARCHAR(2) DEFAULT 'E',
        is_verified TINYINT(1) NOT NULL DEFAULT 0,
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_faceit_elo (faceit_elo),
        INDEX idx_steam (steam_id_64)
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    // Quick migration: add columns if missing
    try {
      await conn.query('ALTER TABLE users ADD COLUMN fastcup_url VARCHAR(255) DEFAULT NULL');
      await conn.query('ALTER TABLE users ADD COLUMN fastcup_id VARCHAR(50) DEFAULT NULL UNIQUE');
      await conn.query('ALTER TABLE users ADD COLUMN fastcup_skill INT DEFAULT 1000');
      await conn.query('ALTER TABLE users ADD COLUMN fastcup_level VARCHAR(2) DEFAULT "E"');
      logger.info('Fastcup columns added successfully.');
    } catch (e: any) {
      if (e.code !== 'ER_DUP_FIELDNAME') {
        logger.error('Error adding Fastcup columns: ' + e.message);
      }
    }

    // 2. Live Hub Matches & Lobby Tracking Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS active_matches (
        match_id VARCHAR(50) NOT NULL PRIMARY KEY,
        hub_id VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL,
        team_a_name VARCHAR(64) NOT NULL,
        team_b_name VARCHAR(64) NOT NULL,
        team_a_captain VARCHAR(20),
        team_b_captain VARCHAR(20),
        voice_channel_a VARCHAR(20) DEFAULT NULL,
        voice_channel_b VARCHAR(20) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    // 3. Match Players Mapping Table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS match_players (
        id INT AUTO_INCREMENT PRIMARY KEY,
        match_id VARCHAR(50) NOT NULL,
        discord_id VARCHAR(20) NOT NULL,
        team CHAR(1) NOT NULL,
        FOREIGN KEY (match_id) REFERENCES active_matches(match_id) ON DELETE CASCADE,
        FOREIGN KEY (discord_id) REFERENCES users(discord_id) ON DELETE CASCADE
      ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    logger.info('MariaDB connection successful and tables verified.');
  } catch (err) {
    logger.error('Database connection or setup error:', err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}
