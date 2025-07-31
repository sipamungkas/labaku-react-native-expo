import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Business Data Store
 * Manages products, vendors, transactions, and business analytics
 */

export interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  currentPrice: number;
  costPrice: number;
  vendorId: string;
  barcode?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  type: 'purchase' | 'sale' | 'adjustment';
  productId: string;
  vendorId?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockSummary {
  productId: string;
  currentStock: number;
  lastUpdated: string;
}

export interface BusinessState {
  // Data
  products: Product[];
  vendors: Vendor[];
  transactions: Transaction[];
  stockSummary: StockSummary[];
  
  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  
  // Actions - Products
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  getProduct: (id: string) => Product | undefined;
  getProductsByVendor: (vendorId: string) => Product[];
  
  // Actions - Vendors
  addVendor: (vendor: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateVendor: (id: string, updates: Partial<Vendor>) => void;
  deleteVendor: (id: string) => void;
  getVendor: (id: string) => Vendor | undefined;
  
  // Actions - Transactions
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  getTransactionsByProduct: (productId: string) => Transaction[];
  getTransactionsByDateRange: (startDate: string, endDate: string) => Transaction[];
  
  // Actions - Stock
  updateStock: (productId: string, quantity: number) => void;
  getStock: (productId: string) => number;
  getLowStockProducts: (threshold?: number) => Product[];
  
  // Actions - Analytics
  getTotalRevenue: (startDate?: string, endDate?: string) => number;
  getTotalProfit: (startDate?: string, endDate?: string) => number;
  getTopSellingProducts: (limit?: number) => Product[];
  
  // Actions - General
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  clearAllData: () => void;
}

// Helper function to generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Helper function to get current timestamp
const getCurrentTimestamp = () => new Date().toISOString();

export const useBusinessStore = create<BusinessState>()(
  persist(
    (set, get) => ({
      // Initial state
      products: [],
      vendors: [],
      transactions: [],
      stockSummary: [],
      isLoading: false,
      isRefreshing: false,
      
      // Product actions
      addProduct: (productData) => {
        const newProduct: Product = {
          ...productData,
          id: generateId(),
          createdAt: getCurrentTimestamp(),
          updatedAt: getCurrentTimestamp(),
        };
        
        set((state) => ({
          products: [...state.products, newProduct],
          stockSummary: [
            ...state.stockSummary,
            {
              productId: newProduct.id,
              currentStock: 0,
              lastUpdated: getCurrentTimestamp(),
            },
          ],
        }));
      },
      
      updateProduct: (id, updates) => {
        set((state) => ({
          products: state.products.map((product) =>
            product.id === id
              ? { ...product, ...updates, updatedAt: getCurrentTimestamp() }
              : product
          ),
        }));
      },
      
      deleteProduct: (id) => {
        set((state) => ({
          products: state.products.filter((product) => product.id !== id),
          stockSummary: state.stockSummary.filter((stock) => stock.productId !== id),
          transactions: state.transactions.filter((transaction) => transaction.productId !== id),
        }));
      },
      
      getProduct: (id) => {
        return get().products.find((product) => product.id === id);
      },
      
      getProductsByVendor: (vendorId) => {
        return get().products.filter((product) => product.vendorId === vendorId);
      },
      
      // Vendor actions
      addVendor: (vendorData) => {
        const newVendor: Vendor = {
          ...vendorData,
          id: generateId(),
          createdAt: getCurrentTimestamp(),
          updatedAt: getCurrentTimestamp(),
        };
        
        set((state) => ({
          vendors: [...state.vendors, newVendor],
        }));
      },
      
      updateVendor: (id, updates) => {
        set((state) => ({
          vendors: state.vendors.map((vendor) =>
            vendor.id === id
              ? { ...vendor, ...updates, updatedAt: getCurrentTimestamp() }
              : vendor
          ),
        }));
      },
      
      deleteVendor: (id) => {
        set((state) => ({
          vendors: state.vendors.filter((vendor) => vendor.id !== id),
          // Note: Products referencing this vendor should be handled separately
        }));
      },
      
      getVendor: (id) => {
        return get().vendors.find((vendor) => vendor.id === id);
      },
      
      // Transaction actions
      addTransaction: (transactionData) => {
        const newTransaction: Transaction = {
          ...transactionData,
          id: generateId(),
          createdAt: getCurrentTimestamp(),
          updatedAt: getCurrentTimestamp(),
        };
        
        set((state) => {
          // Update stock based on transaction type
          const stockUpdate = state.stockSummary.map((stock) => {
            if (stock.productId === newTransaction.productId) {
              let newStock = stock.currentStock;
              
              switch (newTransaction.type) {
                case 'purchase':
                  newStock += newTransaction.quantity;
                  break;
                case 'sale':
                  newStock -= newTransaction.quantity;
                  break;
                case 'adjustment':
                  newStock = newTransaction.quantity; // Direct adjustment
                  break;
              }
              
              return {
                ...stock,
                currentStock: Math.max(0, newStock),
                lastUpdated: getCurrentTimestamp(),
              };
            }
            return stock;
          });
          
          return {
            transactions: [...state.transactions, newTransaction],
            stockSummary: stockUpdate,
          };
        });
      },
      
      updateTransaction: (id, updates) => {
        set((state) => ({
          transactions: state.transactions.map((transaction) =>
            transaction.id === id
              ? { ...transaction, ...updates, updatedAt: getCurrentTimestamp() }
              : transaction
          ),
        }));
      },
      
      deleteTransaction: (id) => {
        set((state) => ({
          transactions: state.transactions.filter((transaction) => transaction.id !== id),
        }));
      },
      
      getTransactionsByProduct: (productId) => {
        return get().transactions.filter((transaction) => transaction.productId === productId);
      },
      
      getTransactionsByDateRange: (startDate, endDate) => {
        return get().transactions.filter((transaction) => {
          const transactionDate = new Date(transaction.createdAt);
          return transactionDate >= new Date(startDate) && transactionDate <= new Date(endDate);
        });
      },
      
      // Stock actions
      updateStock: (productId, quantity) => {
        set((state) => ({
          stockSummary: state.stockSummary.map((stock) =>
            stock.productId === productId
              ? {
                  ...stock,
                  currentStock: Math.max(0, quantity),
                  lastUpdated: getCurrentTimestamp(),
                }
              : stock
          ),
        }));
      },
      
      getStock: (productId) => {
        const stock = get().stockSummary.find((stock) => stock.productId === productId);
        return stock?.currentStock || 0;
      },
      
      getLowStockProducts: (threshold = 10) => {
        const { products, stockSummary } = get();
        return products.filter((product) => {
          const stock = stockSummary.find((s) => s.productId === product.id);
          return (stock?.currentStock || 0) <= threshold;
        });
      },
      
      // Analytics actions
      getTotalRevenue: (startDate, endDate) => {
        const transactions = startDate && endDate
          ? get().getTransactionsByDateRange(startDate, endDate)
          : get().transactions;
          
        return transactions
          .filter((t) => t.type === 'sale')
          .reduce((total, t) => total + t.totalAmount, 0);
      },
      
      getTotalProfit: (startDate, endDate) => {
        const { transactions, products } = get();
        const filteredTransactions = startDate && endDate
          ? get().getTransactionsByDateRange(startDate, endDate)
          : transactions;
          
        return filteredTransactions
          .filter((t) => t.type === 'sale')
          .reduce((total, t) => {
            const product = products.find((p) => p.id === t.productId);
            const profit = product ? (t.unitPrice - product.costPrice) * t.quantity : 0;
            return total + profit;
          }, 0);
      },
      
      getTopSellingProducts: (limit = 5) => {
        const { transactions, products } = get();
        const salesData = transactions
          .filter((t) => t.type === 'sale')
          .reduce((acc, t) => {
            acc[t.productId] = (acc[t.productId] || 0) + t.quantity;
            return acc;
          }, {} as Record<string, number>);
          
        return Object.entries(salesData)
          .sort(([, a], [, b]) => b - a)
          .slice(0, limit)
          .map(([productId]) => products.find((p) => p.id === productId)!)
          .filter(Boolean);
      },
      
      // General actions
      setLoading: (isLoading) => set({ isLoading }),
      setRefreshing: (isRefreshing) => set({ isRefreshing }),
      
      clearAllData: () => {
        set({
          products: [],
          vendors: [],
          transactions: [],
          stockSummary: [],
          isLoading: false,
          isRefreshing: false,
        });
      },
    }),
    {
      name: 'labaku-business-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Selectors for common use cases
export const useProducts = () => useBusinessStore((state) => state.products);
export const useVendors = () => useBusinessStore((state) => state.vendors);
export const useTransactions = () => useBusinessStore((state) => state.transactions);
export const useStockSummary = () => useBusinessStore((state) => state.stockSummary);
export const useIsLoading = () => useBusinessStore((state) => state.isLoading);
export const useIsRefreshing = () => useBusinessStore((state) => state.isRefreshing);

// Helper hooks
export const useProductCount = () => useBusinessStore((state) => state.products.length);
export const useVendorCount = () => useBusinessStore((state) => state.vendors.length);
export const useTransactionCount = () => useBusinessStore((state) => state.transactions.length);