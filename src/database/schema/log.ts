import { pgTable, serial, varchar, text, timestamp, jsonb } from 'drizzle-orm/pg-core';

export const logs = pgTable('logs', {
  id: serial('id').primaryKey(),
  guildId: varchar('guild_id', { length: 20 }).notNull(),
  type: varchar('type', { length: 30 }).notNull(),
  targetId: varchar('target_id', { length: 20 }),
  moderatorId: varchar('moderator_id', { length: 20 }),
  reason: text('reason'),
  changes: jsonb('changes'),
  oldData: jsonb('old_data'),
  newData: jsonb('new_data'),
  createdAt: timestamp('created_at').defaultNow(),
});
