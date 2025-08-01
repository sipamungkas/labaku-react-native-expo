import React from 'react';
import { databaseService } from '../database/service';
import { useSubscriptionTier } from '../stores/authStore';

/**
 * Subscription Limits and Feature Gating
 * Enforces tier-based restrictions and provides upgrade prompts
 */

// Free tier limits
export const FREE_TIER_LIMITS = {
  vendors: 5,
  products: 50,
  transactions: 100,
} as const;

// Premium tier limits (unlimited)
export const PREMIUM_TIER_LIMITS = {
  vendors: Infinity,
  products: Infinity,
  transactions: Infinity,
} as const;

export type FeatureType = 'vendors' | 'products' | 'transactions';

export interface LimitCheckResult {
  allowed: boolean;
  currentCount: number;
  limit: number;
  remaining: number;
  isAtLimit: boolean;
  isNearLimit: boolean; // 80% of limit reached
}

export interface UpgradePromptData {
  title: string;
  message: string;
  feature: FeatureType;
  currentCount: number;
  limit: number;
}

/**
 * Subscription Limits Service
 */
class SubscriptionLimitsService {
  /**
   * Check if user can perform an action based on their subscription tier
   */
  async checkLimit(
    userId: string,
    feature: FeatureType,
    tier: 'free' | 'premium' = 'free'
  ): Promise<LimitCheckResult> {
    try {
      // Premium users have unlimited access
      if (tier === 'premium') {
        return {
          allowed: true,
          currentCount: 0,
          limit: Infinity,
          remaining: Infinity,
          isAtLimit: false,
          isNearLimit: false,
        };
      }

      // Get current counts from database
      const stats = await databaseService.getDatabaseStats(userId);
      const currentCount = stats[feature] || 0;
      const limit = FREE_TIER_LIMITS[feature];
      const remaining = Math.max(0, limit - currentCount);
      const isAtLimit = currentCount >= limit;
      const isNearLimit = currentCount >= limit * 0.8;

      return {
        allowed: !isAtLimit,
        currentCount,
        limit,
        remaining,
        isAtLimit,
        isNearLimit,
      };
    } catch (error) {
      console.error('Error checking subscription limit:', error);
      // Default to not allowed on error for safety
      return {
        allowed: false,
        currentCount: 0,
        limit: FREE_TIER_LIMITS[feature],
        remaining: 0,
        isAtLimit: true,
        isNearLimit: true,
      };
    }
  }

  /**
   * Get upgrade prompt data for a specific feature
   */
  getUpgradePrompt(feature: FeatureType, currentCount: number, limit: number): UpgradePromptData {
    const prompts = {
      vendors: {
        title: 'Vendor Limit Reached',
        message: `You've reached the free tier limit of ${limit} vendors. Upgrade to Premium to add unlimited vendors and unlock advanced features.`,
      },
      products: {
        title: 'Product Limit Reached',
        message: `You've reached the free tier limit of ${limit} products. Upgrade to Premium to manage unlimited products with advanced inventory features.`,
      },
      transactions: {
        title: 'Transaction Limit Reached',
        message: `You've reached the free tier limit of ${limit} transactions. Upgrade to Premium for unlimited transaction history and advanced analytics.`,
      },
    };

    return {
      ...prompts[feature],
      feature,
      currentCount,
      limit,
    };
  }

  /**
   * Get warning message when approaching limit
   */
  getWarningMessage(feature: FeatureType, remaining: number, limit: number): string {
    const warnings = {
      vendors: `You have ${remaining} vendor slots remaining out of ${limit}. Consider upgrading to Premium for unlimited vendors.`,
      products: `You have ${remaining} product slots remaining out of ${limit}. Upgrade to Premium for unlimited products.`,
      transactions: `You have ${remaining} transactions remaining out of ${limit}. Upgrade to Premium for unlimited transaction history.`,
    };

    return warnings[feature];
  }

  /**
   * Check multiple features at once
   */
  async checkAllLimits(
    userId: string,
    tier: 'free' | 'premium' = 'free'
  ): Promise<Record<FeatureType, LimitCheckResult>> {
    const features: FeatureType[] = ['vendors', 'products', 'transactions'];
    const results: Record<FeatureType, LimitCheckResult> = {} as any;

    for (const feature of features) {
      results[feature] = await this.checkLimit(userId, feature, tier);
    }

    return results;
  }

  /**
   * Get features that are at or near their limits
   */
  async getFeaturesNearLimit(
    userId: string,
    tier: 'free' | 'premium' = 'free'
  ): Promise<{ atLimit: FeatureType[]; nearLimit: FeatureType[] }> {
    const allLimits = await this.checkAllLimits(userId, tier);
    
    const atLimit: FeatureType[] = [];
    const nearLimit: FeatureType[] = [];

    Object.entries(allLimits).forEach(([feature, result]) => {
      if (result.isAtLimit) {
        atLimit.push(feature as FeatureType);
      } else if (result.isNearLimit) {
        nearLimit.push(feature as FeatureType);
      }
    });

    return { atLimit, nearLimit };
  }

  /**
   * Get premium features list
   */
  getPremiumFeatures(): string[] {
    return [
      'Unlimited vendors, products, and transactions',
      'Advanced analytics and reporting',
      'Data export capabilities',
      'Priority customer support',
      'Cloud backup and sync',
      'Advanced inventory management',
      'Custom categories and tags',
      'Bulk operations',
      'Advanced search and filtering',
      'Multi-location support',
    ];
  }

  /**
   * Get feature comparison between free and premium
   */
  getFeatureComparison() {
    return {
      vendors: {
        free: `Up to ${FREE_TIER_LIMITS.vendors} vendors`,
        premium: 'Unlimited vendors',
      },
      products: {
        free: `Up to ${FREE_TIER_LIMITS.products} products`,
        premium: 'Unlimited products',
      },
      transactions: {
        free: `Up to ${FREE_TIER_LIMITS.transactions} transactions`,
        premium: 'Unlimited transaction history',
      },
      analytics: {
        free: 'Basic reports',
        premium: 'Advanced analytics & insights',
      },
      support: {
        free: 'Community support',
        premium: 'Priority customer support',
      },
      backup: {
        free: 'Local storage only',
        premium: 'Cloud backup & sync',
      },
    };
  }
}

// Export singleton instance
export const subscriptionLimits = new SubscriptionLimitsService();
export default subscriptionLimits;

/**
 * React Hook for checking subscription limits
 */
export function useSubscriptionLimits(userId: string) {
  const tier = useSubscriptionTier();
  const isPremium = tier === 'premium';

  const checkLimit = async (feature: FeatureType): Promise<LimitCheckResult> => {
    return await subscriptionLimits.checkLimit(userId, feature, tier);
  };

  const checkAllLimits = async (): Promise<Record<FeatureType, LimitCheckResult>> => {
    return await subscriptionLimits.checkAllLimits(userId, tier);
  };

  const getFeaturesNearLimit = async () => {
    return await subscriptionLimits.getFeaturesNearLimit(userId, tier);
  };

  const getUpgradePrompt = (feature: FeatureType, currentCount: number, limit: number) => {
    return subscriptionLimits.getUpgradePrompt(feature, currentCount, limit);
  };

  const getWarningMessage = (feature: FeatureType, remaining: number, limit: number) => {
    return subscriptionLimits.getWarningMessage(feature, remaining, limit);
  };

  return {
    tier,
    isPremium,
    checkLimit,
    checkAllLimits,
    getFeaturesNearLimit,
    getUpgradePrompt,
    getWarningMessage,
    premiumFeatures: subscriptionLimits.getPremiumFeatures(),
    featureComparison: subscriptionLimits.getFeatureComparison(),
  };
}

/**
 * Higher-order component for feature gating
 */
export function withSubscriptionGate<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  feature: FeatureType,
  fallbackComponent?: React.ComponentType<{ onUpgrade: () => void }>
) {
  return function GatedComponent(props: T & { userId: string; onUpgrade?: () => void }) {
    const { userId, onUpgrade, ...restProps } = props;
    const { checkLimit, isPremium } = useSubscriptionLimits(userId);
    const [isAllowed, setIsAllowed] = React.useState(true);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
      const checkAccess = async () => {
        if (isPremium) {
          setIsAllowed(true);
          setIsLoading(false);
          return;
        }

        try {
          const result = await checkLimit(feature);
          setIsAllowed(result.allowed);
        } catch (error) {
          console.error('Error checking feature access:', error);
          setIsAllowed(false);
        } finally {
          setIsLoading(false);
        }
      };

      checkAccess();
    }, [userId, feature, isPremium, checkLimit]);

    if (isLoading) {
      return null; // or loading component
    }

    if (!isAllowed) {
      if (fallbackComponent) {
        const FallbackComponent = fallbackComponent;
        return <FallbackComponent onUpgrade={onUpgrade || (() => {})} />;
      }
      return null;
    }

    return <WrappedComponent {...(restProps as T)} />;
  };
}