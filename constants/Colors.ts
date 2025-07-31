/**
 * Labaku Design System - Modern Minimalist Color Palette
 * Primary theme: Soft Green with clean, accessible colors
 */

// Soft Green Color Palette
const softGreen = {
  50: '#f0fdf4',   // Very light green background
  100: '#dcfce7',  // Light green background
  200: '#bbf7d0',  // Soft green accent
  300: '#86efac',  // Medium soft green
  400: '#4ade80',  // Primary soft green
  500: '#22c55e',  // Main brand green
  600: '#16a34a',  // Darker green
  700: '#15803d',  // Deep green
  800: '#166534',  // Very deep green
  900: '#14532d',  // Darkest green
};

// Neutral Colors for Minimalist Design
const neutral = {
  50: '#fafafa',
  100: '#f5f5f5',
  200: '#e5e5e5',
  300: '#d4d4d4',
  400: '#a3a3a3',
  500: '#737373',
  600: '#525252',
  700: '#404040',
  800: '#262626',
  900: '#171717',
};

// Semantic Colors
const semantic = {
  success: softGreen[500],
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
};

export const Colors = {
  light: {
    // Primary Colors
    primary: softGreen[500],
    primaryLight: softGreen[400],
    primaryDark: softGreen[600],
    
    // Background Colors
    background: '#ffffff',
    backgroundSecondary: neutral[50],
    backgroundTertiary: softGreen[50],
    
    // Text Colors
    text: neutral[900],
    textSecondary: neutral[600],
    textTertiary: neutral[400],
    textOnPrimary: '#ffffff',
    
    // Border Colors
    border: neutral[200],
    borderLight: neutral[100],
    borderFocus: softGreen[400],
    
    // Component Colors
    card: '#ffffff',
    cardShadow: 'rgba(0, 0, 0, 0.05)',
    input: '#ffffff',
    inputBorder: neutral[300],
    
    // Navigation
    tint: softGreen[500],
    icon: neutral[500],
    tabIconDefault: neutral[400],
    tabIconSelected: softGreen[500],
    tabBackground: '#ffffff',
    
    // Semantic Colors
    success: semantic.success,
    warning: semantic.warning,
    error: semantic.error,
    info: semantic.info,
    
    // Status Colors
    successBackground: softGreen[100],
    warningBackground: '#fef3c7',
    errorBackground: '#fee2e2',
    infoBackground: '#dbeafe',
  },
  dark: {
    // Primary Colors
    primary: softGreen[400],
    primaryLight: softGreen[300],
    primaryDark: softGreen[500],
    
    // Background Colors
    background: neutral[900],
    backgroundSecondary: neutral[800],
    backgroundTertiary: neutral[800],
    
    // Text Colors
    text: neutral[100],
    textSecondary: neutral[300],
    textTertiary: neutral[500],
    textOnPrimary: neutral[900],
    
    // Border Colors
    border: neutral[700],
    borderLight: neutral[800],
    borderFocus: softGreen[400],
    
    // Component Colors
    card: neutral[800],
    cardShadow: 'rgba(0, 0, 0, 0.3)',
    input: neutral[800],
    inputBorder: neutral[600],
    
    // Navigation
    tint: softGreen[400],
    icon: neutral[400],
    tabIconDefault: neutral[500],
    tabIconSelected: softGreen[400],
    tabBackground: neutral[900],
    
    // Semantic Colors
    success: softGreen[400],
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa',
    
    // Status Colors
    successBackground: softGreen[900],
    warningBackground: '#78350f',
    errorBackground: '#7f1d1d',
    infoBackground: '#1e3a8a',
  },
};

// Design Tokens
export const DesignTokens = {
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
  },
};
