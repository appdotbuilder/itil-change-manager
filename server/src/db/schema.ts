
import { serial, text, pgTable, timestamp, pgEnum } from 'drizzle-orm/pg-core';

// Define enums for PostgreSQL
export const changeStatusEnum = pgEnum('change_status', [
  'draft',
  'submitted',
  'approved',
  'rejected',
  'scheduled',
  'in_progress',
  'completed',
  'cancelled'
]);

export const changePriorityEnum = pgEnum('change_priority', [
  'low',
  'medium',
  'high',
  'critical'
]);

export const changeTypeEnum = pgEnum('change_type', [
  'standard',
  'normal',
  'emergency'
]);

export const changeRequestsTable = pgTable('change_requests', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  change_type: changeTypeEnum('change_type').notNull(),
  priority: changePriorityEnum('priority').notNull(),
  status: changeStatusEnum('status').notNull().default('draft'),
  requester_name: text('requester_name').notNull(),
  requester_email: text('requester_email').notNull(),
  business_justification: text('business_justification').notNull(),
  implementation_plan: text('implementation_plan').notNull(),
  rollback_plan: text('rollback_plan').notNull(),
  risk_assessment: text('risk_assessment'), // Nullable by default
  impact_assessment: text('impact_assessment'), // Nullable by default
  scheduled_start: timestamp('scheduled_start'), // Nullable by default
  scheduled_end: timestamp('scheduled_end'), // Nullable by default
  actual_start: timestamp('actual_start'), // Nullable by default
  actual_end: timestamp('actual_end'), // Nullable by default
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

// TypeScript types for the table schema
export type ChangeRequest = typeof changeRequestsTable.$inferSelect;
export type NewChangeRequest = typeof changeRequestsTable.$inferInsert;

// Export all tables for proper query building
export const tables = { 
  changeRequests: changeRequestsTable 
};
