import { pgTable, serial, varchar, integer, boolean, timestamp } from 'drizzle-orm/pg-core';

export const invites = pgTable('invites', {
  id: serial('id').primaryKey(),
  guildId: varchar('guild_id', { length: 20 }).notNull(),
  code: varchar('code', { length: 20 }).notNull(),
  inviterId: varchar('inviter_id', { length: 20 }).notNull(),
  inviteeId: varchar('invitee_id', { length: 20 }),
  uses: integer('uses').default(0),
  fake: boolean('fake').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  joinedAt: timestamp('joined_at'),
});
