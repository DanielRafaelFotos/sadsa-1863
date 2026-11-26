import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import type { Studio } from '../../shared/studio';
export * from './auth-schema';
export const studioSite = sqliteTable('studio_site', {
  id: text('id').primaryKey(),
  content: text('content', { mode: 'json' }).$type<Studio>().notNull(),
});
