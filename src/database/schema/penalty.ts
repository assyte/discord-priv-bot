import { pgTable, serial, varchar, integer, timestamp } from 'drizzle-orm/pg-core';

export const penalties = pgTable('penalties', {
  id: serial('id').primaryKey(),
  guildId: varchar('guild_id', { length: 20 }).notNull(),
  userId: varchar('user_id', { length: 20 }).notNull(),
  category: varchar('category', { length: 20 }).notNull(),
  count: integer('count').default(1),
  updatedAt: timestamp('updated_at').defaultNow(),
});
