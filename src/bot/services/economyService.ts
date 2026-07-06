import { dbPool } from '../../database/connection.js';
import { Logger } from '../../utils/logger.js';
import { Client, Guild, TextChannel, VoiceChannel, CategoryChannel, ChannelType, OverwriteResolvable } from 'discord.js';

const logger = new Logger('EconomyService');

export class EconomyService {
  /**
   * Adds coins to a user's balance. Returns the new balance or null if user not found.
   */
  static async addCoins(discordId: string, amount: number): Promise<number | null> {
    if (amount === 0) return null;
    let conn;
    try {
      conn = await dbPool.getConnection();
      await conn.query(`
        UPDATE users 
        SET clutch_coins = clutch_coins + ? 
        WHERE discord_id = ?
      `, [amount, discordId]);

      const rows = await conn.query(`SELECT clutch_coins FROM users WHERE discord_id = ?`, [discordId]);
      if (rows && rows.length > 0) {
        return rows[0].clutch_coins;
      }
      return null;
    } catch (err) {
      logger.error('Error adding coins:', err);
      return null;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Subtracts coins from a user. Returns true if successful, false if insufficient funds or error.
   */
  static async subtractCoins(discordId: string, amount: number): Promise<boolean> {
    if (amount <= 0) return false;
    let conn;
    try {
      conn = await dbPool.getConnection();
      
      const rows = await conn.query(`SELECT clutch_coins FROM users WHERE discord_id = ?`, [discordId]);
      if (!rows || rows.length === 0) return false;
      
      if (rows[0].clutch_coins < amount) return false;

      await conn.query(`
        UPDATE users 
        SET clutch_coins = clutch_coins - ? 
        WHERE discord_id = ?
      `, [amount, discordId]);
      return true;
    } catch (err) {
      logger.error('Error subtracting coins:', err);
      return false;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Gets a user's coin balance.
   */
  static async getBalance(discordId: string): Promise<number> {
    let conn;
    try {
      conn = await dbPool.getConnection();
      const rows = await conn.query(`SELECT clutch_coins FROM users WHERE discord_id = ?`, [discordId]);
      if (rows && rows.length > 0) {
        return rows[0].clutch_coins || 0;
      }
      return 0;
    } catch (err) {
      logger.error('Error getting balance:', err);
      return 0;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Records a reputation point given by one user to another.
   * Returns true if successful, false if cooldown hasn't passed (24h).
   */
  static async giveReputation(senderId: string, receiverId: string): Promise<boolean> {
    let conn;
    try {
      conn = await dbPool.getConnection();
      
      // Check cooldown (1 rep to ANYONE per 24 hours, or maybe 1 rep to SPECIFIC person per 24 hours?)
      // Let's implement: sender can give rep to anyone, but only once per 12 hours total.
      const lastRepRows = await conn.query(`
        SELECT created_at FROM reputations 
        WHERE sender_id = ? 
        ORDER BY created_at DESC LIMIT 1
      `, [senderId]);

      if (lastRepRows && lastRepRows.length > 0) {
        const lastRepTime = new Date(lastRepRows[0].created_at).getTime();
        const twelveHoursMs = 12 * 60 * 60 * 1000;
        if (Date.now() - lastRepTime < twelveHoursMs) {
          return false; // Cooldown active
        }
      }

      // Record the rep
      await conn.query(`
        INSERT INTO reputations (sender_id, receiver_id) 
        VALUES (?, ?)
      `, [senderId, receiverId]);

      // Give 50 coins to receiver
      await this.addCoins(receiverId, 50);
      return true;
    } catch (err) {
      logger.error('Error giving reputation:', err);
      return false;
    } finally {
      if (conn) conn.release();
    }
  }

  /**
   * Grants an active perk to a user (e.g., VIP Room or Colored Role) and logs it.
   */
  static async grantPerk(discordId: string, perkType: string, entityId: string, durationHours: number): Promise<void> {
    let conn;
    try {
      conn = await dbPool.getConnection();
      // Calculate expiration
      const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);
      
      await conn.query(`
        INSERT INTO active_perks (discord_id, perk_type, entity_id, expires_at)
        VALUES (?, ?, ?, ?)
      `, [discordId, perkType, entityId, expiresAt]);
    } catch (err) {
      logger.error('Error granting perk:', err);
    } finally {
      if (conn) conn.release();
    }
  }
}
