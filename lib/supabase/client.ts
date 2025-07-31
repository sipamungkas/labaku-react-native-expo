import { createClient } from '@supabase/supabase-js';
import { ENV, logEnvironmentStatus } from '../config/env';
import { useAuthStore } from '../stores/authStore';

/**
 * Supabase Client Configuration
 * Handles authentication and backend services
 */

// Create Supabase client
export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
  auth: {
    // Enable automatic token refresh
    autoRefreshToken: true,
    // Persist session in secure storage
    persistSession: true,
    // Detect session from URL (useful for email confirmations)
    detectSessionInUrl: false,
  },
});

/**
 * Initialize Supabase authentication listener
 * This should be called once when the app starts
 */
export function initializeAuth() {
  // Log environment status in development
  logEnvironmentStatus();
  
  // Listen for auth state changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    const authStore = useAuthStore.getState();
    
    console.log('🔐 Auth state changed:', event, session?.user?.email || 'No user');
    
    switch (event) {
      case 'INITIAL_SESSION':
        // Set initial session on app start
        authStore.setSession(session);
        break;
        
      case 'SIGNED_IN':
        // User signed in
        authStore.setSession(session);
        console.log('✅ User signed in:', session?.user?.email);
        break;
        
      case 'SIGNED_OUT':
        // User signed out
        authStore.signOut();
        console.log('👋 User signed out');
        break;
        
      case 'TOKEN_REFRESHED':
        // Token was refreshed
        authStore.setSession(session);
        console.log('🔄 Token refreshed for:', session?.user?.email);
        break;
        
      case 'USER_UPDATED':
        // User profile was updated
        authStore.setSession(session);
        console.log('📝 User updated:', session?.user?.email);
        break;
        
      default:
        console.log('🔍 Unhandled auth event:', event);
    }
  });
}

/**
 * Authentication helper functions
 */
export const authHelpers = {
  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string, userData?: { fullName?: string }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: userData?.fullName,
          app_version: ENV.APP_VERSION,
        },
      },
    });
    
    if (error) {
      console.error('❌ Sign up error:', error.message);
      throw error;
    }
    
    return data;
  },
  
  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('❌ Sign in error:', error.message);
      throw error;
    }
    
    return data;
  },
  
  /**
   * Sign out current user
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ Sign out error:', error.message);
      throw error;
    }
    
    console.log('✅ Successfully signed out');
  },
  
  /**
   * Reset password
   */
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'labaku://reset-password',
    });
    
    if (error) {
      console.error('❌ Password reset error:', error.message);
      throw error;
    }
    
    console.log('✅ Password reset email sent to:', email);
  },
  
  /**
   * Update user profile
   */
  async updateProfile(updates: {
    email?: string;
    password?: string;
    data?: Record<string, any>;
  }) {
    const { data, error } = await supabase.auth.updateUser(updates);
    
    if (error) {
      console.error('❌ Profile update error:', error.message);
      throw error;
    }
    
    return data;
  },
  
  /**
   * Get current session
   */
  async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Get session error:', error.message);
      throw error;
    }
    
    return session;
  },
  
  /**
   * Get current user
   */
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('❌ Get user error:', error.message);
      throw error;
    }
    
    return user;
  },
};

/**
 * Database helper functions
 * These will be used for syncing local data with Supabase
 */
export const dbHelpers = {
  /**
   * Sync user profile data
   */
  async syncUserProfile(userId: string) {
    // This will be implemented when we add user profiles table
    console.log('🔄 Syncing user profile for:', userId);
  },
  
  /**
   * Backup local data to Supabase
   */
  async backupData(data: any) {
    // This will be implemented for premium users
    console.log('☁️ Backing up data to cloud...');
  },
  
  /**
   * Restore data from Supabase
   */
  async restoreData(userId: string) {
    // This will be implemented for premium users
    console.log('📥 Restoring data from cloud for:', userId);
  },
};

// Export the client as default
export default supabase;