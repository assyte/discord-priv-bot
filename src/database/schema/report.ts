import { pgTable, serial, varchar, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const reports = pgTable('reports', {
  id: serial('id').primaryKey(),
  guildId: varchar('guild_id', { length: 20 }).notNull(),
  reporterId: varchar('reporter_id', { length: 20 }).notNull(),
  targetId: varchar('target_id', { length: 20 }).notNull(),
  reason: text('reason').notNull(),
  channelId: varchar('channel_id', { length: 20 }),
  messageId: varchar('message_id', { length: 20 }),
  evidenceUrl: varchar('evidence_url', { length: 500 }),

  status: varchar('status', { length: 20 }).default('beklemede'),
  assignedMod: varchar('assigned_mod', { length: 20 }),
  resolution: text('resolution'),
  resolvedAt: timestamp('resolved_at'),

  createdAt: timestamp('created_at').defaultNow(),
});
