/**
 * Environment Configuration for Labaku
 * Manages Supabase, RevenueCat, and other service configurations
 */

// Environment variables with fallbacks for development
export const ENV = {
  // Supabase Configuration
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key',
  
  // RevenueCat Configuration
  REVENUECAT_API_KEY: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || 'your-revenuecat-key',
  
  // App Configuration
  APP_ENV: process.env.EXPO_PUBLIC_APP_ENV || 'development',
  APP_VERSION: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
  
  // Feature Flags
  ENABLE_ANALYTICS: process.env.EXPO_PUBLIC_ENABLE_ANALYTICS === 'true',
  ENABLE_CRASH_REPORTING: process.env.EXPO_PUBLIC_ENABLE_CRASH_REPORTING === 'true',
  
  // Free Tier Limits
  FREE_TIER_PRODUCT_LIMIT: 10,
  FREE_TIER_VENDOR_LIMIT: 5,
  FREE_TIER_TRANSACTION_HISTORY_DAYS: 30,
};

// Validation function to check if all required environment variables are set
export function validateEnvironment(): { isValid: boolean; missingVars: string[] } {
  const requiredVars = [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    'EXPO_PUBLIC_REVENUECAT_API_KEY',
  ];
  
  const missingVars = requiredVars.filter(varName => {
    const value = process.env[varName];
    return !value || value.includes('your-') || value === '';
  });
  
  return {
    isValid: missingVars.length === 0,
    missingVars,
  };
}

// Development helper to log configuration status
export function logEnvironmentStatus() {
  if (__DEV__) {
    const { isValid, missingVars } = validateEnvironment();
    
    console.log('🔧 Labaku Environment Configuration:');
    console.log(`   Environment: ${ENV.APP_ENV}`);
    console.log(`   Version: ${ENV.APP_VERSION}`);
    console.log(`   Supabase URL: ${ENV.SUPABASE_URL.substring(0, 30)}...`);
    console.log(`   Configuration Valid: ${isValid ? '✅' : '❌'}`);
    
    if (!isValid) {
      console.warn('⚠️  Missing environment variables:', missingVars);
      console.warn('   Please check your .env file or app.json configuration');
    }
  }
}

// Export types for TypeScript
export type AppEnvironment = 'development' | 'staging' | 'production';
export type FeatureFlag = keyof Pick<typeof ENV, 'ENABLE_ANALYTICS' | 'ENABLE_CRASH_REPORTING'>;