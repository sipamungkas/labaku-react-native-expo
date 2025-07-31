import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import { User, Session } from '@supabase/supabase-js';

/**
 * Authentication Store
 * Manages user authentication state with Supabase integration
 */

export interface AuthState {
  // User state
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Authentication actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  signOut: () => void;
  clearAllSessions: () => void;
  
  // Subscription state
  subscriptionTier: 'free' | 'premium';
  setSubscriptionTier: (tier: 'free' | 'premium') => void;
  
  // User preferences
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    analytics: boolean;
  };
  updatePreferences: (preferences: Partial<AuthState['preferences']>) => void;
}

// Secure storage implementation for Zustand persist
const secureStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(name);
    } catch (error) {
      console.error('SecureStore getItem error:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(name, value);
    } catch (error) {
      console.error('SecureStore setItem error:', error);
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(name);
    } catch (error) {
      console.error('SecureStore removeItem error:', error);
    }
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: true,
      subscriptionTier: 'free',
      preferences: {
        theme: 'light',
        notifications: true,
        analytics: false,
      },
      
      // Actions
      setUser: (user) => {
        set({ 
          user, 
          isAuthenticated: !!user,
          isLoading: false 
        });
      },
      
      setSession: (session) => {
        set({ 
          session,
          user: session?.user || null,
          isAuthenticated: !!session?.user,
          isLoading: false 
        });
      },
      
      setLoading: (isLoading) => {
        set({ isLoading });
      },
      
      signOut: () => {
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
          subscriptionTier: 'free',
        });
      },
      
      clearAllSessions: () => {
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
      
      setSubscriptionTier: (subscriptionTier) => {
        set({ subscriptionTier });
      },
      
      updatePreferences: (newPreferences) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            ...newPreferences,
          },
        }));
      },
    }),
    {
      name: 'labaku-auth-storage',
      storage: createJSONStorage(() => secureStorage),
      partialize: (state) => ({
        // Only persist non-sensitive data
        subscriptionTier: state.subscriptionTier,
        preferences: state.preferences,
        // Don't persist user/session data for security
      }),
    }
  )
);

// Selectors for common use cases
export const useUser = () => useAuthStore((state) => state.user);
export const useSession = () => useAuthStore((state) => state.session);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useIsLoading = () => useAuthStore((state) => state.isLoading);
export const useSubscriptionTier = () => useAuthStore((state) => state.subscriptionTier);
export const usePreferences = () => useAuthStore((state) => state.preferences);

// Helper functions
export const getAuthState = () => useAuthStore.getState();
export const isUserPremium = () => useAuthStore.getState().subscriptionTier === 'premium';