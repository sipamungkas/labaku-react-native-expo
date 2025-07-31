import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

/**
 * Labaku Database Schema
 * SQLite database with Drizzle ORM for local data persistence
 */

// Local Users Table - Caches essential user information from Supabase and RevenueCat
export const localUsers = sqliteTable('local_users', {
  id: text('id').primaryKey().notNull(), // Corresponds to Supabase Auth user ID (UUID)
  email: text('email').unique().notNull(),
  tier: text('tier').notNull().default('free'), // 'free' or 'premium', updated from RevenueCat
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Vendors Table - Stores information about product vendors
export const vendors = sqliteTable('vendors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => localUsers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  contactInfo: text('contact_info'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Products Table - Stores details of each product
export const products = sqliteTable('products', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => localUsers.id, { onDelete: 'cascade' }),
  vendorId: integer('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  sku: text('sku'), // Stock Keeping Unit
  unit: text('unit').default('pcs'), // Unit of measurement (pcs, kg, liter, etc.)
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Product Price History Table - Stores historical purchase and selling prices
export const productPriceHistory = sqliteTable('product_price_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  effectiveDate: text('effective_date').notNull(), // YYYY-MM-DD format
  purchasePrice: real('purchase_price').notNull(),
  sellingPrice: real('selling_price').notNull(),
  notes: text('notes'), // Optional notes about price changes
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Transactions Table - Records daily stock movements and sales
export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => localUsers.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  date: text('date').notNull(), // YYYY-MM-DD format
  quantityIn: integer('quantity_in').notNull().default(0),
  quantityOut: integer('quantity_out').notNull().default(0),
  notes: text('notes'), // Optional transaction notes
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Stock Summary Table - Maintains current stock levels (calculated from transactions)
export const stockSummary = sqliteTable('stock_summary', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  productId: integer('product_id').unique().notNull().references(() => products.id, { onDelete: 'cascade' }),
  currentStock: integer('current_stock').notNull().default(0),
  lastUpdated: text('last_updated').default(sql`CURRENT_TIMESTAMP`),
});

// App Settings Table - Stores user preferences and app configuration
export const appSettings = sqliteTable('app_settings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull().references(() => localUsers.id, { onDelete: 'cascade' }),
  settingKey: text('setting_key').notNull(),
  settingValue: text('setting_value').notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Export types for TypeScript
export type LocalUser = typeof localUsers.$inferSelect;
export type NewLocalUser = typeof localUsers.$inferInsert;

export type Vendor = typeof vendors.$inferSelect;
export type NewVendor = typeof vendors.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type ProductPriceHistory = typeof productPriceHistory.$inferSelect;
export type NewProductPriceHistory = typeof productPriceHistory.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type StockSummary = typeof stockSummary.$inferSelect;
export type NewStockSummary = typeof stockSummary.$inferInsert;

export type AppSetting = typeof appSettings.$inferSelect;
export type NewAppSetting = typeof appSettings.$inferInsert;