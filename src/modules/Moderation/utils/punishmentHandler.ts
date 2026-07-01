import { Database } from '../../../database/connection.js';
import { infractions } from '../../../database/schema/infraction.js';
import { members } from '../../../database/schema/member.js';
import { and, eq, sql } from 'drizzle-orm';
import { Logger } from '../../../utils/logger.js';

const logger = new Logger('PunishmentHandler');

export interface PunishmentOptions {
  guildId: string;
  userId: string;
  moderatorId: string;
  type: string;
  reason?: string;
  duration?: number;
}

export class PunishmentHandler {
  static async create(options: PunishmentOptions) {
    try {
      const db = Database.getInstance().db;

      const result = await db.insert(infractions).values({
        guildId: options.guildId,
        userId: options.userId,
        moderatorId: options.moderatorId,
        type: options.type,
        reason: options.reason || 'Belirtilmemiş',
        duration: options.duration || null,
        active: true,
        expiresAt: options.duration ? new Date(Date.now() + options.duration * 1000) : null,
      }).returning();

      if (options.type === 'uyarı') {
        await db.insert(members).values({
          id: options.userId,
          guildId: options.guildId,
          warnCount: 1,
        }).onConflictDoUpdate({
          target: [members.id, members.guildId],
          set: { warnCount: sql`members.warn_count + 1` },
        });
      }

      logger.info(`Ceza #${result[0]?.id} — ${options.type} — ${options.userId}`);
      return result[0];
    } catch (error) {
      logger.error('Ceza oluşturma hatası:', error);
      throw error;
    }
  }

  static async getMemberInfractions(guildId: string, userId: string) {
    try {
      const db = Database.getInstance().db;
      return db.query.infractions.findMany({
        where: and(
          eq(infractions.guildId, guildId),
          eq(infractions.userId, userId),
        ),
        orderBy: (i, { desc }) => desc(i.createdAt),
        limit: 50,
      });
    } catch (error) {
      logger.error('Ceza sorgulama hatası:', error);
      return [];
    }
  }

  static async getActiveInfractions(guildId: string, userId: string) {
    try {
      const db = Database.getInstance().db;
      return db.query.infractions.findMany({
        where: and(
          eq(infractions.guildId, guildId),
          eq(infractions.userId, userId),
          eq(infractions.active, true),
        ),
      });
    } catch {
      return [];
    }
  }

  static async deactivate(infractionId: number, guildId: string) {
    try {
      const db = Database.getInstance().db;
      await db.update(infractions)
        .set({ active: false })
        .where(and(eq(infractions.id, infractionId), eq(infractions.guildId, guildId)));
      logger.info(`Ceza #${infractionId} deaktif edildi`);
    } catch (error) {
      logger.error('Ceza deaktivasyon hatası:', error);
    }
  }

  static async getStats(guildId: string) {
    try {
      const db = Database.getInstance().db;
      const all = await db.query.infractions.findMany({
        where: eq(infractions.guildId, guildId),
      });

      return {
        total: all.length,
        bans: all.filter(i => i.type === 'ban').length,
        kicks: all.filter(i => i.type === 'kick').length,
        mutes: all.filter(i => i.type === 'mute').length,
        warns: all.filter(i => i.type === 'uyarı').length,
        timeouts: all.filter(i => i.type === 'timeout').length,
        active: all.filter(i => i.active).length,
      };
    } catch {
      return { total: 0, bans: 0, kicks: 0, mutes: 0, warns: 0, timeouts: 0, active: 0 };
    }
  }
}
