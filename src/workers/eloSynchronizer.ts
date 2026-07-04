import cron from 'node-cron';
import axios from 'axios';
import { dbPool } from '../database/connection.js';
import { assignVerifiedRoles } from '../bot/services/roleManager.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger('EloSynchronizer');

export function startWorkers() {
  // Her 15 dakikada bir çalıştır
  cron.schedule('*/15 * * * *', async () => {
    logger.info('ELO Senkronizasyon işçisi çalışıyor...');
    let conn;
    try {
      conn = await dbPool.getConnection();
      // Sadece onaylanmış kullanıcıları çek
      const users = await conn.query('SELECT discord_id, faceit_id, faceit_elo, faceit_level FROM users WHERE is_verified = 1');
      
      let updatedCount = 0;

      for (const user of users) {
        try {
          const response = await axios.get(`https://open.faceit.com/data/v4/players/${user.faceit_id}`, {
            headers: { 'Authorization': `Bearer ${process.env.FACEIT_API_KEY}` }
          });
          
          const cs2Data = response.data.games.cs2;
          const newElo = cs2Data.faceit_elo;
          const newLevel = cs2Data.skill_level;

          if (newElo !== user.faceit_elo || newLevel !== user.faceit_level) {
            await conn.query('UPDATE users SET faceit_elo = ?, faceit_level = ? WHERE discord_id = ?', 
              [newElo, newLevel, user.discord_id]);
            
            updatedCount++;
            
            // Eğer seviye değiştiyse discord rolünü güncelle
            if (newLevel !== user.faceit_level) {
              await assignVerifiedRoles(user.discord_id, newLevel);
            }
          }
        } catch (apiErr) {
          logger.warn(`Faceit API Hatası (User: ${user.discord_id}):`, apiErr);
        }
      }

      logger.info(`Senkronizasyon tamamlandı. Toplam ${updatedCount} kullanıcının istatistikleri güncellendi.`);
    } catch (error) {
      logger.error('Senkronizasyon işçisinde kritik hata:', error);
    } finally {
      if (conn) conn.release();
    }
  });
}
