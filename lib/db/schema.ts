import { pgTable, text, timestamp, doublePrecision, serial } from 'drizzle-orm/pg-core';

export const performanceMetrics = pgTable('performance_metrics', {
  id: serial('id').primaryKey(),
  componentName: text('component_name').notNull(),
  metricName: text('metric_name').notNull(),
  value: doublePrecision('value').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
});

export const invoices = pgTable('invoices', {
  id: serial('id').primaryKey(),
  number: text('number').notNull(),
  clientName: text('client_name').notNull(),
  amount: doublePrecision('amount').notNull(),
  status: text('status').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
