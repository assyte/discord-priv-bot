import { Database } from '../../../database/connection.js';
import { reports } from '../../../database/schema/report.js';
import { and, eq, desc } from 'drizzle-orm';
import { Logger } from '../../../utils/logger.js';

const logger = new Logger('ReportService');

export interface CreateReportOptions {
  guildId: string;
  reporterId: string;
  targetId: string;
  reason: string;
  channelId?: string;
  evidenceUrl?: string;
}

export class ReportService {
  static async createReport(options: CreateReportOptions) {
    try {
      const db = Database.getInstance().db;

      const existing = await db.select().from(reports)
        .where(and(
          eq(reports.guildId, options.guildId),
          eq(reports.reporterId, options.reporterId),
          eq(reports.targetId, options.targetId),
          eq(reports.status, 'beklemede'),
        ))
        .limit(1);

      if (existing.length > 0) return null;

      const [result] = await db.insert(reports).values({
        guildId: options.guildId,
        reporterId: options.reporterId,
        targetId: options.targetId,
        reason: options.reason,
        channelId: options.channelId,
        evidenceUrl: options.evidenceUrl,
      }).returning();

      logger.info(`Yeni rapor #${result?.id}: ${options.targetId}`);
      return result ?? null;
    } catch (error) {
      logger.error('Rapor oluşturma hatası:', error);
      throw error;
    }
  }

  static async getReport(reportId: number, guildId: string) {
    try {
      const db = Database.getInstance().db;
      const [result] = await db.select().from(reports)
        .where(and(eq(reports.id, reportId), eq(reports.guildId, guildId)))
        .limit(1);
      return result ?? null;
    } catch (error) {
      logger.error('Rapor sorgulama hatası:', error);
      return null;
    }
  }

  static async getPendingReports(guildId: string) {
    try {
      const db = Database.getInstance().db;
      return db.select().from(reports)
        .where(and(eq(reports.guildId, guildId), eq(reports.status, 'beklemede')))
        .orderBy(desc(reports.createdAt));
    } catch (error) {
      logger.error('Rapor listeleme hatası:', error);
      return [];
    }
  }

  static async updateReportStatus(
    reportId: number,
    guildId: string,
    status: string,
    resolution?: string,
    moderatorId?: string,
  ) {
    try {
      const db = Database.getInstance().db;
      const [result] = await db.update(reports)
        .set({
          status,
          resolution: resolution ?? null,
          assignedMod: moderatorId ?? null,
          resolvedAt: ['çözüldü', 'reddedildi'].includes(status) ? new Date() : null,
        })
        .where(and(eq(reports.id, reportId), eq(reports.guildId, guildId)))
        .returning();
      return result;
    } catch (error) {
      logger.error('Rapor güncelleme hatası:', error);
      throw error;
    }
  }

  static async addMessageId(reportId: number, messageId: string, channelId: string) {
    try {
      const db = Database.getInstance().db;
      await db.update(reports)
        .set({ messageId, channelId })
        .where(eq(reports.id, reportId));
    } catch (error) {
      logger.error('Rapor mesaj ID güncelleme hatası:', error);
    }
  }

  static async getStats(guildId: string) {
    try {
      const db = Database.getInstance().db;
      const all = await db.select().from(reports).where(eq(reports.guildId, guildId));

      return {
        total: all.length,
        pending: all.filter(r => r.status === 'beklemede').length,
        investigating: all.filter(r => r.status === 'inceleniyor').length,
        resolved: all.filter(r => r.status === 'çözüldü').length,
        rejected: all.filter(r => r.status === 'reddedildi').length,
      };
    } catch (error) {
      logger.error('Rapor istatistik hatası:', error);
      return { total: 0, pending: 0, investigating: 0, resolved: 0, rejected: 0 };
    }
  }
}
