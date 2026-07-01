import { Database } from '../../../database/connection.js';
import { suggestions } from '../../../database/schema/suggestion.js';
import { and, eq, desc } from 'drizzle-orm';
import { Logger } from '../../../utils/logger.js';

const logger = new Logger('SuggestionService');

export interface CreateSuggestionOptions {
  guildId: string;
  authorId: string;
  title: string;
  description: string;
  category?: string;
}

export class SuggestionService {
  static async create(options: CreateSuggestionOptions) {
    try {
      const db = Database.getInstance().db;

      const [result] = await db.insert(suggestions).values({
        guildId: options.guildId,
        authorId: options.authorId,
        title: options.title,
        description: options.description,
        category: options.category || 'diğer',
      }).returning();

      logger.info(`Yeni öneri #${result?.id}: ${options.title}`);
      return result ?? null;
    } catch (error) {
      logger.error('Öneri oluşturma hatası:', error);
      return null;
    }
  }

  static async get(suggestionId: number, guildId: string) {
    try {
      const db = Database.getInstance().db;
      const [result] = await db.select().from(suggestions)
        .where(and(eq(suggestions.id, suggestionId), eq(suggestions.guildId, guildId)))
        .limit(1);
      return result ?? null;
    } catch (error) {
      logger.error('Öneri sorgulama hatası:', error);
      return null;
    }
  }

  static async list(guildId: string, status?: string) {
    try {
      const db = Database.getInstance().db;
      const conditions = [eq(suggestions.guildId, guildId)];
      if (status) conditions.push(eq(suggestions.status, status));

      return db.select().from(suggestions)
        .where(and(...conditions))
        .orderBy(desc(suggestions.createdAt))
        .limit(50);
    } catch (error) {
      logger.error('Öneri listeleme hatası:', error);
      return [];
    }
  }

  static async updateStatus(
    suggestionId: number,
    guildId: string,
    status: string,
    adminResponse?: string,
    respondedBy?: string,
  ) {
    try {
      const db = Database.getInstance().db;
      const [result] = await db.update(suggestions)
        .set({
          status,
          adminResponse: adminResponse ?? null,
          respondedBy: respondedBy ?? null,
          respondedAt: new Date(),
        })
        .where(and(eq(suggestions.id, suggestionId), eq(suggestions.guildId, guildId)))
        .returning();
      return result ?? null;
    } catch (error) {
      logger.error('Öneri güncelleme hatası:', error);
      return null;
    }
  }

  static async vote(suggestionId: number, guildId: string, voteType: 'up' | 'down') {
    try {
      const db = Database.getInstance().db;
      const [suggestion] = await db.select().from(suggestions)
        .where(and(eq(suggestions.id, suggestionId), eq(suggestions.guildId, guildId)))
        .limit(1);

      if (!suggestion) return null;

      const updateData = voteType === 'up'
        ? { upvotes: (suggestion.upvotes || 0) + 1 }
        : { downvotes: (suggestion.downvotes || 0) + 1 };

      const [result] = await db.update(suggestions)
        .set(updateData)
        .where(eq(suggestions.id, suggestionId))
        .returning();

      return result ?? null;
    } catch (error) {
      logger.error('Öneri oylama hatası:', error);
      return null;
    }
  }

  static async addMessageId(suggestionId: number, messageId: string, channelId: string) {
    try {
      const db = Database.getInstance().db;
      await db.update(suggestions)
        .set({ messageId, channelId })
        .where(eq(suggestions.id, suggestionId));
    } catch (error) {
      logger.error('Öneri mesaj ID güncelleme hatası:', error);
    }
  }

  static async getStats(guildId: string) {
    try {
      const db = Database.getInstance().db;
      const all = await db.select().from(suggestions).where(eq(suggestions.guildId, guildId));

      return {
        total: all.length,
        pending: all.filter(s => s.status === 'beklemede').length,
        reviewing: all.filter(s => s.status === 'değerlendiriliyor').length,
        accepted: all.filter(s => s.status === 'kabul').length,
        rejected: all.filter(s => s.status === 'red').length,
      };
    } catch {
      return { total: 0, pending: 0, reviewing: 0, accepted: 0, rejected: 0 };
    }
  }
}
