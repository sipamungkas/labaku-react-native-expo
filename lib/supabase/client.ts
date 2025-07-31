import { createClient, Session } from '@supabase/supabase-js';
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

// Guard to prevent multiple auth listeners
let authListenerInitialized = false;

/**
 * Clear all stored sessions (useful for debugging)
 */
export async function clearAllStoredSessions() {
  try {
    await supabase.auth.signOut();
    const authStore = useAuthStore.getState();
    authStore.clearAllSessions();
    console.log('🧹 All sessions cleared');
  } catch (error) {
    console.error('❌ Error clearing sessions:', error);
  }
}

/**
 * Validate if a session is still valid
 * @param session The session to validate
 * @returns True if the session is valid, false otherwise
 */
async function isValidSession(session: Session | null): Promise<boolean> {
  if (!session) return false;
  
  try {
    // Check if token exists and is not expired
    const now = Math.floor(Date.now() / 1000);
    if (!session.access_token || !session.expires_at || session.expires_at <= now) {
      console.log('❌ Session token expired or missing');
      return false;
    }
    
    // Verify user exists and is valid
    const { data, error } = await supabase.auth.getUser(session.access_token);
    if (error || !data.user) {
      console.log('❌ Session user validation failed:', error?.message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Session validation error:', error);
    return false;
  }
}

/**
 * Initialize Supabase authentication listener
 * This should be called once when the app starts
 */
export function initializeAuth() {
  // Prevent multiple auth listeners
  if (authListenerInitialized) {
    return;
  }
  authListenerInitialized = true;
  
  // Set up auth state change listener
  console.log("🔄 Setting up auth state change listener...");
  
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      console.log(`🔔 Auth event: ${event}`);
      
      // Update auth store with session
      const authStore = useAuthStore.getState();
      
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
         authStore.setSession(session);
       } else if (event === 'INITIAL_SESSION') {
         // For initial session, validate it before accepting
         if (session && await isValidSession(session)) {
           console.log('✅ Valid session restored');
           authStore.setSession(session);
         } else {
           console.log('❌ Invalid or expired session detected');
           // Clear invalid session
           await supabase.auth.signOut();
           authStore.clearAllSessions();
         }
      } else if (event === 'SIGNED_OUT') {
        authStore.signOut();
      } else if (event === 'USER_UPDATED') {
        // User profile was updated
        authStore.setSession(session);
        console.log('📝 User updated:', session?.user?.email);
      } else {
        console.log('🔍 Unhandled auth event:', event);
      }
    }
  );
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