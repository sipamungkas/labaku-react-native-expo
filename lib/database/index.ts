import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from './migrations/migrations';
import * as schema from './schema';

/**
 * Labaku Database Connection
 * SQLite database with Drizzle ORM for local data persistence
 */

// Database configuration
const DATABASE_NAME = 'labaku.db';
const DATABASE_VERSION = 1;

// Open SQLite database
const expoDb = openDatabaseSync(DATABASE_NAME);

// Create Drizzle database instance
export const db = drizzle(expoDb, { schema });

// Guard to prevent multiple database initializations
let databaseInitialized = false;

// Database initialization function
export async function initializeDatabase() {
  // Prevent repeated initialization
  if (databaseInitialized) {
    console.log('Database already initialized, skipping...');
    return true;
  }
  
  try {
    console.log('Initializing Labaku database...');
    
    // Run migrations
    await migrate(db, migrations);
    
    databaseInitialized = true;
    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

// Database utility functions
export class DatabaseManager {
  static async resetDatabase() {
    try {
      // Drop all tables and recreate
      await expoDb.execAsync(`
        DROP TABLE IF EXISTS app_settings;
        DROP TABLE IF EXISTS stock_summary;
        DROP TABLE IF EXISTS transactions;
        DROP TABLE IF EXISTS product_price_history;
        DROP TABLE IF EXISTS products;
        DROP TABLE IF EXISTS vendors;
        DROP TABLE IF EXISTS local_users;
      `);
      
      // Reinitialize
      await initializeDatabase();
      console.log('Database reset successfully');
    } catch (error) {
      console.error('Failed to reset database:', error);
      throw error;
    }
  }
  
  static async getDatabaseInfo() {
    try {
      const result = await expoDb.getAllAsync(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name NOT LIKE 'sqlite_%'
        ORDER BY name;
      `);
      return result;
    } catch (error) {
      console.error('Failed to get database info:', error);
      return [];
    }
  }
  
  static async getTableRowCount(tableName: string) {
    try {
      const result = await expoDb.getFirstAsync(`SELECT COUNT(*) as count FROM ${tableName}`);
      return (result as any)?.count || 0;
    } catch (error) {
      console.error(`Failed to get row count for ${tableName}:`, error);
      return 0;
    }
  }
}

// Export schema for use in other files
export * from './schema';
export { expoDb };