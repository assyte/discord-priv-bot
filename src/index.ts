import { config } from 'dotenv';
import { Logger } from './utils/logger.js';
import { initDatabase } from './database/connection.js';
import { startBot } from './bot/client.js';
import { startWeb } from './web/server.js';
import { startWorkers } from './workers/eloSynchronizer.js';

config();

const logger = new Logger('Main');

async function bootstrap() {
  try {
    logger.info('FACEITLUTCH sistemi başlatılıyor...');
    
    // 1. Veritabanını Başlat (Tabloları kontrol et)
    await initDatabase();
    
    // 2. Web Sunucusunu Başlat
    await startWeb();
    
    // 3. Discord Botunu Başlat
    await startBot();
    
    // 4. Arka plan işçilerini (Cron Jobs) Başlat
    startWorkers();

    logger.info('Sistem başarıyla aktif edildi.');
  } catch (error) {
    logger.error('Sistem başlatılırken kritik bir hata oluştu:', error);
    process.exit(1);
  }
}

bootstrap();
