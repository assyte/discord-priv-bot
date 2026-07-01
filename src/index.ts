import 'dotenv/config';
import { Logger } from './utils/logger.js';
import { Database } from './database/connection.js';
import { Client } from './client/Client.js';

const logger = new Logger('Bootstrap');

async function main() {
  logger.info('Bot başlatılıyor...');

  const database = Database.getInstance();
  await database.connect();

  const client = Client.getInstance();
  await client.login(process.env.BOT_TOKEN!);
}

main().catch((error) => {
  logger.error('Kritik hata, bot kapatılıyor:', error);
  process.exit(1);
});
