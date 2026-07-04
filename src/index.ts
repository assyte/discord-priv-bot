import { config } from 'dotenv';
import { Logger } from './utils/logger.js';
import { initDatabase } from './database/connection.js';
import { startBot } from './bot/client.js';
import { startWeb } from './web/server.js';
import { startWorkers } from './workers/eloSynchronizer.js';
import { startActivityTracker } from './bot/services/activityTracker.js';

config();

const logger = new Logger('Main');

async function bootstrap() {
  try {
    logger.info('Starting FACEITLUTCH system...');
    
    // 1. Initialize database (verify tables)
    await initDatabase();
    
    // 2. Start web server
    await startWeb();
    
    // 3. Start Discord bot
    await startBot();
    
    // 4. Start background workers (Cron Jobs)
    startWorkers();
    startActivityTracker();

    logger.info('System activated successfully.');
  } catch (error) {
    logger.error('Critical error during system startup:', error);
    process.exit(1);
  }
}

bootstrap();
