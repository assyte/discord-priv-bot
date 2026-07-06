import { Client, Guild } from 'discord.js';
import { dbPool } from '../../database/connection.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger('PerkExpirationWorker');

export class PerkExpirationWorker {
  static init(client: Client) {
    // Run every 5 minutes
    setInterval(() => this.checkExpirations(client), 5 * 60 * 1000);
    logger.info('PerkExpirationWorker initialized (runs every 5m)');
  }

  private static async checkExpirations(client: Client) {
    let conn;
    try {
      conn = await dbPool.getConnection();
      
      const expired = await conn.query(`
        SELECT id, discord_id, perk_type, entity_id 
        FROM active_perks 
        WHERE expires_at <= NOW()
      `);

      if (!expired || expired.length === 0) return;

      const guildId = process.env.GUILD_ID || '1264110767641464844';
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) return;

      for (const row of expired) {
        try {
          if (row.perk_type === 'vip_room') {
            // entity_id is channel ID
            const channel = await guild.channels.fetch(row.entity_id).catch(() => null);
            if (channel) {
              await channel.delete('VIP Room expired');
              logger.info(`Deleted expired VIP room ${row.entity_id} for ${row.discord_id}`);
            }
          } else if (row.perk_type === 'colored_role') {
            // entity_id is role ID
            const role = await guild.roles.fetch(row.entity_id).catch(() => null);
            if (role) {
              await role.delete('Colored Role expired');
              logger.info(`Deleted expired Colored Role ${row.entity_id} for ${row.discord_id}`);
            }
          } else if (row.perk_type === 'hoisted_role') {
            // entity_id is role ID. Here we just remove the role from the user.
            const member = await guild.members.fetch(row.discord_id).catch(() => null);
            if (member) {
              await member.roles.remove(row.entity_id, 'Hoisted Role expired').catch(() => {});
              logger.info(`Removed expired Hoisted Role from ${row.discord_id}`);
            }
          }

          // Delete record
          await conn.query(`DELETE FROM active_perks WHERE id = ?`, [row.id]);
        } catch (err) {
          logger.error(`Error processing expired perk ${row.id}:`, err);
        }
      }
    } catch (err) {
      logger.error('Error checking perk expirations:', err);
    } finally {
      if (conn) conn.release();
    }
  }
}
