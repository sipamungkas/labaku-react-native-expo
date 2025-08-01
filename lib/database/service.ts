import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import migrations from './migrations/migrations';
import {
  localUsers,
  vendors,
  products,
  productPriceHistory,
  transactions,
  stockSummary,
  appSettings,
  type LocalUser,
  type NewLocalUser,
  type Vendor,
  type NewVendor,
  type Product,
  type NewProduct,
  type ProductPriceHistory,
  type NewProductPriceHistory,
  type Transaction,
  type NewTransaction,
  type StockSummary,
  type NewStockSummary,
  type AppSetting,
  type NewAppSetting,
} from './schema';

/**
 * Database Service Layer
 * Handles SQLite operations and data synchronization
 */

class DatabaseService {
  private db: ReturnType<typeof drizzle>;
  private isInitialized = false;

  constructor() {
    const expo = openDatabaseSync('labaku.db');
    this.db = drizzle(expo);
  }

  /**
   * Initialize database and run migrations
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Run migrations
      await migrate(this.db, migrations);
      this.isInitialized = true;
      console.log('✅ Database initialized successfully');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      throw new Error('Failed to initialize database');
    }
  }

  /**
   * Check if database is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  // ==================== USER OPERATIONS ====================

  /**
   * Create or update local user
   */
  async upsertUser(userData: NewLocalUser): Promise<LocalUser> {
    try {
      const existingUser = await this.db
        .select()
        .from(localUsers)
        .where(eq(localUsers.id, userData.id))
        .get();

      if (existingUser) {
        // Update existing user
        const [updatedUser] = await this.db
          .update(localUsers)
          .set({
            ...userData,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(localUsers.id, userData.id))
          .returning();
        return updatedUser;
      } else {
        // Create new user
        const [newUser] = await this.db
          .insert(localUsers)
          .values(userData)
          .returning();
        return newUser;
      }
    } catch (error) {
      console.error('Error upserting user:', error);
      throw new Error('Failed to save user data');
    }
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<LocalUser | null> {
    try {
      const user = await this.db
        .select()
        .from(localUsers)
        .where(eq(localUsers.id, userId))
        .get();
      return user || null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  /**
   * Update user subscription tier
   */
  async updateUserTier(userId: string, tier: 'free' | 'premium'): Promise<void> {
    try {
      await this.db
        .update(localUsers)
        .set({
          tier,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(localUsers.id, userId));
    } catch (error) {
      console.error('Error updating user tier:', error);
      throw new Error('Failed to update subscription tier');
    }
  }

  // ==================== VENDOR OPERATIONS ====================

  /**
   * Get all vendors for a user
   */
  async getVendors(userId: string): Promise<Vendor[]> {
    try {
      return await this.db
        .select()
        .from(vendors)
        .where(eq(vendors.userId, userId))
        .orderBy(asc(vendors.name));
    } catch (error) {
      console.error('Error getting vendors:', error);
      return [];
    }
  }

  /**
   * Create new vendor
   */
  async createVendor(vendorData: NewVendor): Promise<Vendor> {
    try {
      const [newVendor] = await this.db
        .insert(vendors)
        .values(vendorData)
        .returning();
      return newVendor;
    } catch (error) {
      console.error('Error creating vendor:', error);
      throw new Error('Failed to create vendor');
    }
  }

  /**
   * Update vendor
   */
  async updateVendor(vendorId: number, updates: Partial<NewVendor>): Promise<Vendor> {
    try {
      const [updatedVendor] = await this.db
        .update(vendors)
        .set({
          ...updates,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(vendors.id, vendorId))
        .returning();
      return updatedVendor;
    } catch (error) {
      console.error('Error updating vendor:', error);
      throw new Error('Failed to update vendor');
    }
  }

  /**
   * Delete vendor
   */
  async deleteVendor(vendorId: number): Promise<void> {
    try {
      await this.db
        .delete(vendors)
        .where(eq(vendors.id, vendorId));
    } catch (error) {
      console.error('Error deleting vendor:', error);
      throw new Error('Failed to delete vendor');
    }
  }

  // ==================== PRODUCT OPERATIONS ====================

  /**
   * Get all products for a user with latest prices
   */
  async getProducts(userId: string): Promise<(Product & { latestPrice?: ProductPriceHistory | null })[]> {
    try {
      const userProducts = await this.db
        .select()
        .from(products)
        .where(eq(products.userId, userId))
        .orderBy(asc(products.name));

      // Get latest prices for each product
      const productsWithPrices = await Promise.all(
        userProducts.map(async (product) => {
          const latestPrice = await this.getLatestProductPrice(product.id);
          return {
            ...product,
            latestPrice,
          };
        })
      );

      return productsWithPrices;
    } catch (error) {
      console.error('Error getting products:', error);
      return [];
    }
  }

  /**
   * Create new product with initial price
   */
  async createProduct(
    productData: NewProduct,
    initialPrice: { purchasePrice: number; sellingPrice: number; effectiveDate?: string }
  ): Promise<Product> {
    try {
      // Create product
      const [newProduct] = await this.db
        .insert(products)
        .values(productData)
        .returning();

      // Create initial price history
      await this.db
        .insert(productPriceHistory)
        .values({
          productId: newProduct.id,
          effectiveDate: initialPrice.effectiveDate || new Date().toISOString().split('T')[0],
          purchasePrice: initialPrice.purchasePrice,
          sellingPrice: initialPrice.sellingPrice,
        });

      // Initialize stock summary
      await this.db
        .insert(stockSummary)
        .values({
          productId: newProduct.id,
          currentStock: 0,
        });

      return newProduct;
    } catch (error) {
      console.error('Error creating product:', error);
      throw new Error('Failed to create product');
    }
  }

  /**
   * Update product
   */
  async updateProduct(productId: number, updates: Partial<NewProduct>): Promise<Product> {
    try {
      const [updatedProduct] = await this.db
        .update(products)
        .set({
          ...updates,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(products.id, productId))
        .returning();
      return updatedProduct;
    } catch (error) {
      console.error('Error updating product:', error);
      throw new Error('Failed to update product');
    }
  }

  /**
   * Delete product and related data
   */
  async deleteProduct(productId: number): Promise<void> {
    try {
      // Delete in order due to foreign key constraints
      await this.db.delete(stockSummary).where(eq(stockSummary.productId, productId));
      await this.db.delete(transactions).where(eq(transactions.productId, productId));
      await this.db.delete(productPriceHistory).where(eq(productPriceHistory.productId, productId));
      await this.db.delete(products).where(eq(products.id, productId));
    } catch (error) {
      console.error('Error deleting product:', error);
      throw new Error('Failed to delete product');
    }
  }

  /**
   * Get latest price for a product
   */
  async getLatestProductPrice(productId: number): Promise<ProductPriceHistory | null> {
    try {
      const latestPrice = await this.db
        .select()
        .from(productPriceHistory)
        .where(eq(productPriceHistory.productId, productId))
        .orderBy(desc(productPriceHistory.effectiveDate))
        .limit(1)
        .get();
      return latestPrice || null;
    } catch (error) {
      console.error('Error getting latest product price:', error);
      return null;
    }
  }

  /**
   * Update product prices
   */
  async updateProductPrices(
    productId: number,
    priceData: { purchasePrice: number; sellingPrice: number; effectiveDate?: string; notes?: string }
  ): Promise<ProductPriceHistory> {
    try {
      const [newPriceHistory] = await this.db
        .insert(productPriceHistory)
        .values({
          productId,
          effectiveDate: priceData.effectiveDate || new Date().toISOString().split('T')[0],
          purchasePrice: priceData.purchasePrice,
          sellingPrice: priceData.sellingPrice,
          notes: priceData.notes,
        })
        .returning();
      return newPriceHistory;
    } catch (error) {
      console.error('Error updating product prices:', error);
      throw new Error('Failed to update product prices');
    }
  }

  // ==================== TRANSACTION OPERATIONS ====================

  /**
   * Get all transactions for a user
   */
  async getTransactions(userId: string, limit?: number): Promise<Transaction[]> {
    try {
      const baseQuery = this.db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .orderBy(desc(transactions.createdAt));

      if (limit) {
        return await baseQuery.limit(limit);
      }

      return await baseQuery;
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  /**
   * Create new transaction and update stock
   */
  async createTransaction(transactionData: NewTransaction): Promise<Transaction> {
    try {
      // Create transaction
      const [newTransaction] = await this.db
        .insert(transactions)
        .values(transactionData)
        .returning();

      // Update stock summary
      await this.updateStockFromTransaction(newTransaction);

      return newTransaction;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw new Error('Failed to create transaction');
    }
  }

  /**
   * Update transaction
   */
  async updateTransaction(transactionId: number, updates: Partial<NewTransaction>): Promise<Transaction> {
    try {
      const [updatedTransaction] = await this.db
        .update(transactions)
        .set({
          ...updates,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(transactions.id, transactionId))
        .returning();
      return updatedTransaction;
    } catch (error) {
      console.error('Error updating transaction:', error);
      throw new Error('Failed to update transaction');
    }
  }

  /**
   * Delete transaction
   */
  async deleteTransaction(transactionId: number): Promise<void> {
    try {
      await this.db
        .delete(transactions)
        .where(eq(transactions.id, transactionId));
    } catch (error) {
      console.error('Error deleting transaction:', error);
      throw new Error('Failed to delete transaction');
    }
  }

  /**
   * Update stock summary based on transaction
   */
  private async updateStockFromTransaction(transaction: Transaction): Promise<void> {
    try {
      const currentStock = await this.db
        .select()
        .from(stockSummary)
        .where(eq(stockSummary.productId, transaction.productId))
        .get();

      const stockChange = transaction.quantityIn - transaction.quantityOut;
      const newStockLevel = (currentStock?.currentStock || 0) + stockChange;

      if (currentStock) {
        // Update existing stock
        await this.db
          .update(stockSummary)
          .set({
            currentStock: Math.max(0, newStockLevel),
            lastUpdated: new Date().toISOString(),
          })
          .where(eq(stockSummary.productId, transaction.productId));
      } else {
        // Create new stock entry
        await this.db
          .insert(stockSummary)
          .values({
            productId: transaction.productId,
            currentStock: Math.max(0, newStockLevel),
          });
      }
    } catch (error) {
      console.error('Error updating stock from transaction:', error);
      throw new Error('Failed to update stock levels');
    }
  }

  // ==================== STOCK OPERATIONS ====================

  /**
   * Get current stock for a product
   */
  async getProductStock(productId: number): Promise<number> {
    try {
      const stock = await this.db
        .select()
        .from(stockSummary)
        .where(eq(stockSummary.productId, productId))
        .get();
      return stock?.currentStock || 0;
    } catch (error) {
      console.error('Error getting product stock:', error);
      return 0;
    }
  }

  /**
   * Get all stock summaries for a user
   */
  async getStockSummaries(userId: string): Promise<StockSummary[]> {
    try {
      return await this.db
        .select({
          id: stockSummary.id,
          productId: stockSummary.productId,
          currentStock: stockSummary.currentStock,
          lastUpdated: stockSummary.lastUpdated,
        })
        .from(stockSummary)
        .innerJoin(products, eq(products.id, stockSummary.productId))
        .where(eq(products.userId, userId));
    } catch (error) {
      console.error('Error getting stock summaries:', error);
      return [];
    }
  }

  // ==================== ANALYTICS OPERATIONS ====================

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(userId: string, startDate?: string, endDate?: string) {
    try {
      let whereConditions = [eq(products.userId, userId)];
      
      if (startDate && endDate) {
        whereConditions.push(
          sql`${transactions.date} >= ${startDate}`,
          sql`${transactions.date} <= ${endDate}`
        );
      }

      const result = await this.db
        .select({
          totalRevenue: sql<number>`SUM(${transactions.quantityOut} * ${productPriceHistory.sellingPrice})`,
          totalTransactions: sql<number>`COUNT(*)`,
        })
        .from(transactions)
        .innerJoin(products, eq(products.id, transactions.productId))
        .innerJoin(productPriceHistory, eq(productPriceHistory.productId, products.id))
        .where(and(...whereConditions))
        .get();
        
      return {
        totalRevenue: result?.totalRevenue || 0,
        totalTransactions: result?.totalTransactions || 0,
      };
    } catch (error) {
      console.error('Error getting revenue analytics:', error);
      return { totalRevenue: 0, totalTransactions: 0 };
    }
  }

  // ==================== SETTINGS OPERATIONS ====================

  /**
   * Get app setting
   */
  async getSetting(userId: string, key: string): Promise<string | null> {
    try {
      const setting = await this.db
        .select()
        .from(appSettings)
        .where(
          and(
            eq(appSettings.userId, userId),
            eq(appSettings.settingKey, key)
          )
        )
        .get();
      return setting?.settingValue || null;
    } catch (error) {
      console.error('Error getting setting:', error);
      return null;
    }
  }

  /**
   * Set app setting
   */
  async setSetting(userId: string, key: string, value: string): Promise<void> {
    try {
      const existingSetting = await this.db
        .select()
        .from(appSettings)
        .where(
          and(
            eq(appSettings.userId, userId),
            eq(appSettings.settingKey, key)
          )
        )
        .get();

      if (existingSetting) {
        await this.db
          .update(appSettings)
          .set({
            settingValue: value,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(appSettings.id, existingSetting.id));
      } else {
        await this.db
          .insert(appSettings)
          .values({
            userId,
            settingKey: key,
            settingValue: value,
          });
      }
    } catch (error) {
      console.error('Error setting app setting:', error);
      throw new Error('Failed to save setting');
    }
  }

  // ==================== UTILITY OPERATIONS ====================

  /**
   * Clear all data for a user
   */
  async clearUserData(userId: string): Promise<void> {
    try {
      // Delete in order due to foreign key constraints
      await this.db.delete(appSettings).where(eq(appSettings.userId, userId));
      await this.db.delete(stockSummary)
        .where(sql`${stockSummary.productId} IN (
          SELECT ${products.id} FROM ${products} WHERE ${products.userId} = ${userId}
        )`);
      await this.db.delete(transactions).where(eq(transactions.userId, userId));
      await this.db.delete(productPriceHistory)
        .where(sql`${productPriceHistory.productId} IN (
          SELECT ${products.id} FROM ${products} WHERE ${products.userId} = ${userId}
        )`);
      await this.db.delete(products).where(eq(products.userId, userId));
      await this.db.delete(vendors).where(eq(vendors.userId, userId));
      await this.db.delete(localUsers).where(eq(localUsers.id, userId));
    } catch (error) {
      console.error('Error clearing user data:', error);
      throw new Error('Failed to clear user data');
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(userId: string) {
    try {
      const [vendorCount] = await this.db
        .select({ count: sql<number>`COUNT(*)` })
        .from(vendors)
        .where(eq(vendors.userId, userId));

      const [productCount] = await this.db
        .select({ count: sql<number>`COUNT(*)` })
        .from(products)
        .where(eq(products.userId, userId));

      const [transactionCount] = await this.db
        .select({ count: sql<number>`COUNT(*)` })
        .from(transactions)
        .where(eq(transactions.userId, userId));

      return {
        vendors: vendorCount?.count || 0,
        products: productCount?.count || 0,
        transactions: transactionCount?.count || 0,
      };
    } catch (error) {
      console.error('Error getting database stats:', error);
      return { vendors: 0, products: 0, transactions: 0 };
    }
  }
}

// Export singleton instance
export const databaseService = new DatabaseService();
export default databaseService;

// Export types for external use
export type {
  LocalUser,
  NewLocalUser,
  Vendor,
  NewVendor,
  Product,
  NewProduct,
  ProductPriceHistory,
  NewProductPriceHistory,
  Transaction,
  NewTransaction,
  StockSummary,
  NewStockSummary,
  AppSetting,
  NewAppSetting,
};