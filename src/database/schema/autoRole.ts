import { pgTable, serial, varchar, integer } from 'drizzle-orm/pg-core';

export const autoRoles = pgTable('auto_roles', {
  id: serial('id').primaryKey(),
  guildId: varchar('guild_id', { length: 20 }).notNull(),
  roleId: varchar('role_id', { length: 20 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  required: integer('required').default(0),
  priority: integer('priority').default(0),
});
