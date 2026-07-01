import { pgTable, varchar, boolean, timestamp, integer } from 'drizzle-orm/pg-core';

export const members = pgTable('members', {
  id: varchar('id', { length: 20 }).notNull(),
  guildId: varchar('guild_id', { length: 20 }).notNull(),
  username: varchar('username', { length: 32 }),
  displayName: varchar('display_name', { length: 32 }),

  registered: boolean('registered').default(false),
  registeredAt: timestamp('registered_at'),
  registererId: varchar('registerer_id', { length: 20 }),

  totalInvites: integer('total_invites').default(0),
  joinInviter: varchar('join_inviter', { length: 20 }),
  fakeInvites: integer('fake_invites').default(0),
  leftInvites: integer('left_invites').default(0),
  bonusInvites: integer('bonus_invites').default(0),

  lastMessageAt: timestamp('last_message_at'),
  joinAt: timestamp('join_at').defaultNow(),
  warnCount: integer('warn_count').default(0),

  primaryKey: { columns: ['id', 'guildId'] },
});
