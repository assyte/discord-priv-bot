import { pgTable, serial, varchar, text, timestamp, integer } from 'drizzle-orm/pg-core';

export const suggestions = pgTable('suggestions', {
  id: serial('id').primaryKey(),
  guildId: varchar('guild_id', { length: 20 }).notNull(),
  authorId: varchar('author_id', { length: 20 }).notNull(),
  title: varchar('title', { length: 100 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 50 }),

  status: varchar('status', { length: 20 }).default('beklemede'),
  upvotes: integer('upvotes').default(0),
  downvotes: integer('downvotes').default(0),

  messageId: varchar('message_id', { length: 20 }),
  channelId: varchar('channel_id', { length: 20 }),

  adminResponse: text('admin_response'),
  respondedBy: varchar('responded_by', { length: 20 }),
  respondedAt: timestamp('responded_at'),

  createdAt: timestamp('created_at').defaultNow(),
});
