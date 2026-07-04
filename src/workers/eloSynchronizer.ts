import cron from 'node-cron';
import axios from 'axios';
import { dbPool } from '../database/connection.js';
import { assignVerifiedRoles } from '../bot/services/roleManager.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger('EloSynchronizer');

export function startWorkers() {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    logger.info('ELO sync worker running...');
    let conn: any;
    try {
      conn = await dbPool.getConnection();
      // Only fetch verified users
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
            
            // Update Discord role if level changed
            if (newLevel !== user.faceit_level) {
              await assignVerifiedRoles(user.discord_id, newLevel);
            }
          }
        } catch (apiErr) {
          logger.warn(`Faceit API Error (User: ${user.discord_id}):`, apiErr);
        }
      }

      logger.info(`Sync complete. Updated stats for ${updatedCount} users.`);
    } catch (error) {
      logger.error('Critical error in sync worker:', error);
    } finally {
      if (conn) conn.release();
    }
  });
}
