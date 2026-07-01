import { pgTable, varchar, boolean, integer, jsonb, timestamp, text } from 'drizzle-orm/pg-core';

export const guilds = pgTable('guilds', {
  id: varchar('id', { length: 20 }).primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),

  guardEnabled: boolean('guard_enabled').default(true),
  antiRaidLimit: integer('anti_raid_limit').default(5),
  antiNukeEnabled: boolean('anti_nuke_enabled').default(true),
  whitelistRoles: text('whitelist_roles').array().default('{}'),

  registerChannel: varchar('register_channel', { length: 20 }),
  registerRole: varchar('register_role', { length: 20 }),
  registerEnabled: boolean('register_enabled').default(false),

  joinRoleId: varchar('join_role_id', { length: 20 }),

  logChannel: varchar('log_channel', { length: 20 }),
  modLogChannel: varchar('mod_log_channel', { length: 20 }),
  messageLogEnabled: boolean('message_log_enabled').default(false),
  memberLogEnabled: boolean('member_log_enabled').default(true),
  voiceLogEnabled: boolean('voice_log_enabled').default(false),

  reportChannel: varchar('report_channel', { length: 20 }),
  suggestionChannel: varchar('suggestion_channel', { length: 20 }),

  inviteTracking: boolean('invite_tracking').default(false),
  inviteRoles: jsonb('invite_roles').default('[]'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
