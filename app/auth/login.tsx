import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react-native';

import { Colors, DesignTokens } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { authHelpers } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/stores/authStore';

/**
 * Login Screen
 * User authentication with email and password
 */
export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const setLoading = useAuthStore((state) => state.setLoading);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      setLoading(true);
      
      await authHelpers.signIn(email.trim(), password);
      
      // Navigation will be handled by auth state change
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'An error occurred during login');
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue managing your business
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <Mail size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <Lock size={20} color={colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={colors.textSecondary} />
                  ) : (
                    <Eye size={20} color={colors.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity style={styles.forgotPassword} disabled={isLoading}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/auth/register" asChild>
              <TouchableOpacity disabled={isLoading}>
                <Text style={styles.footerLink}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: DesignTokens.spacing.lg,
    },
    header: {
      alignItems: 'center',
      marginBottom: DesignTokens.spacing.xxl,
    },
    title: {
      fontSize: DesignTokens.fontSize.xxxl,
      fontWeight: DesignTokens.fontWeight.bold,
      color: colors.text,
      marginBottom: DesignTokens.spacing.sm,
    },
    subtitle: {
      fontSize: DesignTokens.fontSize.base,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
    },
    form: {
      marginBottom: DesignTokens.spacing.xl,
    },
    inputContainer: {
      marginBottom: DesignTokens.spacing.lg,
    },
    inputLabel: {
      fontSize: DesignTokens.fontSize.sm,
      fontWeight: DesignTokens.fontWeight.medium,
      color: colors.text,
      marginBottom: DesignTokens.spacing.sm,
    },
    inputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.input,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      borderRadius: DesignTokens.borderRadius.lg,
      paddingHorizontal: DesignTokens.spacing.md,
      height: 56,
    },
    inputIcon: {
      marginRight: DesignTokens.spacing.sm,
    },
    textInput: {
      flex: 1,
      fontSize: DesignTokens.fontSize.base,
      color: colors.text,
      paddingVertical: 0,
    },
    eyeButton: {
      padding: DesignTokens.spacing.xs,
    },
    forgotPassword: {
      alignSelf: 'flex-end',
      marginBottom: DesignTokens.spacing.xl,
    },
    forgotPasswordText: {
      fontSize: DesignTokens.fontSize.sm,
      color: colors.primary,
      fontWeight: DesignTokens.fontWeight.medium,
    },
    loginButton: {
      backgroundColor: colors.primary,
      borderRadius: DesignTokens.borderRadius.lg,
      height: 56,
      justifyContent: 'center',
      alignItems: 'center',
      ...DesignTokens.shadows.sm,
    },
    loginButtonDisabled: {
      opacity: 0.6,
    },
    loginButtonText: {
      fontSize: DesignTokens.fontSize.base,
      fontWeight: DesignTokens.fontWeight.semibold,
      color: colors.textOnPrimary,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
    },
    footerText: {
      fontSize: DesignTokens.fontSize.sm,
      color: colors.textSecondary,
    },
    footerLink: {
      fontSize: DesignTokens.fontSize.sm,
      color: colors.primary,
      fontWeight: DesignTokens.fontWeight.semibold,
    },
  });
}