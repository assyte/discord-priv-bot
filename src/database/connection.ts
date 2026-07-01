import { Pool } from 'pg';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Logger } from '../utils/logger.js';
import * as schema from './schema/index.js';

export type DbInstance = NodePgDatabase<typeof schema>;

export class Database {
  private static instance: Database;
  private pool: Pool;
  public db: DbInstance;
  private logger: Logger;

  private constructor() {
    this.logger = new Logger('Database');

    this.pool = new Pool({
      host: process.env.POSTGRES_HOST || 'localhost',
      port: Number(process.env.POSTGRES_PORT) || 5432,
      database: process.env.POSTGRES_DB || 'discord_bot',
      user: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    this.pool.on('error', (err) => {
      this.logger.error('PostgreSQL bağlantı hatası:', err);
    });

    this.db = drizzle(this.pool, { schema }) as DbInstance;
  }

  static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  async connect(): Promise<void> {
    try {
      await this.pool.connect();
      this.logger.info('PostgreSQL bağlantısı başarılı');
    } catch (error) {
      this.logger.error('PostgreSQL bağlantı hatası:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.pool.end();
    this.logger.info('PostgreSQL bağlantısı kapatıldı');
  }

  getPool(): Pool {
    return this.pool;
  }
}
