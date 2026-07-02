import { pgTable, varchar, timestamp, integer } from 'drizzle-orm/pg-core';

export const customVc = pgTable('custom_vc', {
  channelId: varchar('channel_id', { length: 20 }).primaryKey(),
  ownerId: varchar('owner_id', { length: 20 }).notNull(),
  guildId: varchar('guild_id', { length: 20 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  lastActive: timestamp('last_active').defaultNow(),
});
