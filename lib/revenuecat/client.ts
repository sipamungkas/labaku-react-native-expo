import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases';
import { ENV } from '../config/env';
import { useAuthStore } from '../stores/authStore';

/**
 * RevenueCat Configuration
 * Handles subscription management and premium features
 */

// Premium feature identifiers
export const PREMIUM_FEATURES = {
  UNLIMITED_PRODUCTS: 'unlimited_products',
  UNLIMITED_VENDORS: 'unlimited_vendors',
  ADVANCED_ANALYTICS: 'advanced_analytics',
  CLOUD_BACKUP: 'cloud_backup',
  EXPORT_DATA: 'export_data',
  PRIORITY_SUPPORT: 'priority_support',
} as const;

// Subscription product identifiers
export const SUBSCRIPTION_PRODUCTS = {
  MONTHLY: 'labaku_premium_monthly',
  YEARLY: 'labaku_premium_yearly',
} as const;

/**
 * Initialize RevenueCat
 * This should be called once when the app starts
 */
export async function initializeRevenueCat() {
  try {
    // Configure RevenueCat
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }
    
    // Initialize with API key
    await Purchases.configure({
      apiKey: ENV.REVENUECAT_API_KEY,
    });
    
    console.log('✅ RevenueCat initialized successfully');
    
    // Set up customer info listener
    Purchases.addCustomerInfoUpdateListener((customerInfo) => {
      console.log('💳 Customer info updated:', customerInfo.entitlements.active);
      updateSubscriptionStatus(customerInfo);
    });
    
    // Get initial customer info
    const customerInfo = await Purchases.getCustomerInfo();
    updateSubscriptionStatus(customerInfo);
    
  } catch (error) {
    console.error('❌ RevenueCat initialization failed:', error);
  }
}

/**
 * Update subscription status in auth store
 */
function updateSubscriptionStatus(customerInfo: CustomerInfo) {
  const authStore = useAuthStore.getState();
  
  // Check if user has any active premium entitlements
  const hasActivePremium = Object.keys(customerInfo.entitlements.active).length > 0;
  
  authStore.setSubscriptionTier(hasActivePremium ? 'premium' : 'free');
  
  if (__DEV__) {
    console.log('🔄 Subscription status updated:', hasActivePremium ? 'Premium' : 'Free');
    console.log('📋 Active entitlements:', Object.keys(customerInfo.entitlements.active));
  }
}

/**
 * RevenueCat helper functions
 */
export const subscriptionHelpers = {
  /**
   * Get available offerings
   */
  async getOfferings(): Promise<PurchasesOffering[]> {
    try {
      const offerings = await Purchases.getOfferings();
      return Object.values(offerings.all);
    } catch (error) {
      console.error('❌ Failed to get offerings:', error);
      throw error;
    }
  },
  
  /**
   * Get current offering (main subscription offering)
   */
  async getCurrentOffering(): Promise<PurchasesOffering | null> {
    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('❌ Failed to get current offering:', error);
      throw error;
    }
  },
  
  /**
   * Purchase a package
   */
  async purchasePackage(packageToPurchase: PurchasesPackage) {
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      
      console.log('✅ Purchase successful!');
      updateSubscriptionStatus(customerInfo);
      
      return customerInfo;
    } catch (error: any) {
      if (error.userCancelled) {
        console.log('🚫 User cancelled purchase');
        throw new Error('Purchase cancelled by user');
      } else {
        console.error('❌ Purchase failed:', error);
        throw error;
      }
    }
  },
  
  /**
   * Restore purchases
   */
  async restorePurchases() {
    try {
      const customerInfo = await Purchases.restorePurchases();
      
      console.log('🔄 Purchases restored');
      updateSubscriptionStatus(customerInfo);
      
      return customerInfo;
    } catch (error) {
      console.error('❌ Failed to restore purchases:', error);
      throw error;
    }
  },
  
  /**
   * Get customer info
   */
  async getCustomerInfo(): Promise<CustomerInfo> {
    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('❌ Failed to get customer info:', error);
      throw error;
    }
  },
  
  /**
   * Set user ID for RevenueCat
   */
  async setUserId(userId: string) {
    try {
      await Purchases.logIn(userId);
      console.log('✅ User ID set for RevenueCat:', userId);
    } catch (error) {
      console.error('❌ Failed to set user ID:', error);
      throw error;
    }
  },
  
  /**
   * Log out user from RevenueCat
   */
  async logOut() {
    try {
      await Purchases.logOut();
      console.log('✅ User logged out from RevenueCat');
    } catch (error) {
      console.error('❌ Failed to log out from RevenueCat:', error);
      throw error;
    }
  },
};

/**
 * Premium feature checks
 */
export const premiumHelpers = {
  /**
   * Check if user has premium subscription
   */
  isPremiumUser(): boolean {
    return useAuthStore.getState().subscriptionTier === 'premium';
  },
  
  /**
   * Check if user can add more products
   */
  canAddProducts(currentCount: number): boolean {
    if (this.isPremiumUser()) return true;
    return currentCount < ENV.FREE_TIER_PRODUCT_LIMIT;
  },
  
  /**
   * Check if user can add more vendors
   */
  canAddVendors(currentCount: number): boolean {
    if (this.isPremiumUser()) return true;
    return currentCount < ENV.FREE_TIER_VENDOR_LIMIT;
  },
  
  /**
   * Check if user can access advanced analytics
   */
  canAccessAdvancedAnalytics(): boolean {
    return this.isPremiumUser();
  },
  
  /**
   * Check if user can backup to cloud
   */
  canBackupToCloud(): boolean {
    return this.isPremiumUser();
  },
  
  /**
   * Check if user can export data
   */
  canExportData(): boolean {
    return this.isPremiumUser();
  },
  
  /**
   * Get remaining free tier limits
   */
  getFreeTierLimits(currentCounts: { products: number; vendors: number }) {
    if (this.isPremiumUser()) {
      return {
        products: { remaining: Infinity, limit: Infinity },
        vendors: { remaining: Infinity, limit: Infinity },
      };
    }
    
    return {
      products: {
        remaining: Math.max(0, ENV.FREE_TIER_PRODUCT_LIMIT - currentCounts.products),
        limit: ENV.FREE_TIER_PRODUCT_LIMIT,
      },
      vendors: {
        remaining: Math.max(0, ENV.FREE_TIER_VENDOR_LIMIT - currentCounts.vendors),
        limit: ENV.FREE_TIER_VENDOR_LIMIT,
      },
    };
  },
};

/**
 * Subscription status hook
 */
export function useSubscriptionStatus() {
  const subscriptionTier = useAuthStore((state) => state.subscriptionTier);
  
  return {
    isPremium: subscriptionTier === 'premium',
    isFree: subscriptionTier === 'free',
    tier: subscriptionTier,
  };
}

// Export default
export default Purchases;