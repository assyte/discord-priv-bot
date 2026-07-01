import { pgTable, serial, varchar, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core';

export const infractions = pgTable('infractions', {
  id: serial('id').primaryKey(),
  guildId: varchar('guild_id', { length: 20 }).notNull(),
  userId: varchar('user_id', { length: 20 }).notNull(),
  moderatorId: varchar('moderator_id', { length: 20 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  reason: text('reason'),
  duration: integer('duration'),
  active: boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  expiresAt: timestamp('expires_at'),
});
