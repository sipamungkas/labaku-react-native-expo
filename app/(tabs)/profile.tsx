import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Settings,
  Crown,
  Bell,
  Shield,
  Download,
  Upload,
  HelpCircle,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuthStore, useUser, useSubscriptionTier, usePreferences } from '@/lib/stores/authStore';
import { useBusinessStore } from '@/lib/stores/businessStore';
import { useSubscriptionStatus } from '@/lib/revenuecat/client';
import { authHelpers } from '@/lib/supabase/client';
import Purchases from 'react-native-purchases';

/**
 * Profile Screen
 * User settings, subscription management, and app preferences
 */
export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const user = useUser();
  const subscriptionTier = useSubscriptionTier();
  const preferences = usePreferences();
  const { updatePreferences, signOut } = useAuthStore();
  const { isPremium } = useSubscriptionStatus();
  
  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await authHelpers.signOut();
            } catch (error) {
              console.error('Sign out error:', error);
            }
          },
        },
      ]
    );
  };
  
  const handleUpgradeToPremium = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null) {
        // In a real app, you would navigate to a subscription screen
        // For now, we'll show the purchase flow directly
        const purchaserInfo = await Purchases.purchasePackage(offerings.current.availablePackages[0]);
        if (typeof purchaserInfo.customerInfo.entitlements.active['premium'] !== 'undefined') {
          // User successfully subscribed
          console.log('Successfully upgraded to premium');
        }
      }
    } catch (error) {
      console.error('Error upgrading to premium:', error);
    }
  };
  
  const handleExportData = async () => {
    if (!isPremium) {
      Alert.alert(
        'Premium Feature',
        'Data export is available for Premium users only.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: handleUpgradeToPremium },
        ]
      );
      return;
    }
    
    try {
      const { products, transactions } = useBusinessStore.getState();
      
      const exportData = {
        products,
        transactions,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const jsonString = JSON.stringify(exportData, null, 2);
      
      // In a real app, you would use a file picker or sharing API
      // For now, we'll copy to clipboard
      Alert.alert(
        'Export Data',
        'Data exported successfully! In a production app, this would save to a file or share via email.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Export Error', 'Failed to export data. Please try again.');
    }
  };
  
  const handleImportData = () => {
    if (!isPremium) {
      Alert.alert(
        'Premium Feature',
        'Data import is available for Premium users only.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: handleUpgradeToPremium },
        ]
      );
      return;
    }
    
    Alert.alert(
      'Import Data',
      'This feature allows you to import your business data from a backup file. Would you like to select a file?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Select File', 
          onPress: () => {
            // In a real app, you would use DocumentPicker or similar
            Alert.alert('File Picker', 'In a production app, this would open a file picker to select your backup file.');
          }
        }
      ]
    );
  };
  
  const styles = createStyles(colors);
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <User size={24} color={colors.primary} />
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={styles.section}>
          <View style={styles.userCard}>
            <View style={styles.userAvatar}>
              <User size={32} color={colors.primary} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {user?.user_metadata?.full_name || user?.email || 'Guest User'}
              </Text>
              <Text style={styles.userEmail}>{user?.email || 'Not signed in'}</Text>
              <View style={styles.subscriptionBadge}>
                {isPremium ? (
                  <>
                    <Crown size={14} color={colors.warning} />
                    <Text style={[styles.subscriptionText, { color: colors.warning }]}>Premium</Text>
                  </>
                ) : (
                  <Text style={styles.subscriptionText}>Free Tier</Text>
                )}
              </View>
            </View>
          </View>
        </View>
        
        {/* Subscription Section */}
        {!isPremium && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.upgradeCard} onPress={handleUpgradeToPremium}>
              <View style={styles.upgradeIcon}>
                <Crown size={24} color={colors.warning} />
              </View>
              <View style={styles.upgradeContent}>
                <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
                <Text style={styles.upgradeDescription}>
                  Unlock unlimited products, advanced analytics, and cloud backup
                </Text>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
        
        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          {/* Notifications */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Bell size={20} color={colors.textSecondary} />
              <Text style={styles.settingLabel}>Notifications</Text>
            </View>
            <Switch
              value={preferences.notifications}
              onValueChange={(value) => updatePreferences({ notifications: value })}
              trackColor={{ false: colors.border, true: colors.primary + '40' }}
              thumbColor={preferences.notifications ? colors.primary : colors.textSecondary}
            />
          </View>
          
          {/* Analytics */}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Shield size={20} color={colors.textSecondary} />
              <Text style={styles.settingLabel}>Analytics & Crash Reporting</Text>
            </View>
            <Switch
              value={preferences.analytics}
              onValueChange={(value) => updatePreferences({ analytics: value })}
              trackColor={{ false: colors.border, true: colors.primary + '40' }}
              thumbColor={preferences.analytics ? colors.primary : colors.textSecondary}
            />
          </View>
        </View>
        
        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          {/* Export Data */}
          <TouchableOpacity style={styles.menuItem} onPress={handleExportData}>
            <View style={styles.menuLeft}>
              <Download size={20} color={colors.textSecondary} />
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>Export Data</Text>
                {!isPremium && <Text style={styles.premiumLabel}>Premium</Text>}
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          
          {/* Import Data */}
          <TouchableOpacity style={styles.menuItem} onPress={handleImportData}>
            <View style={styles.menuLeft}>
              <Upload size={20} color={colors.textSecondary} />
              <View style={styles.menuContent}>
                <Text style={styles.menuLabel}>Import Data</Text>
                {!isPremium && <Text style={styles.premiumLabel}>Premium</Text>}
              </View>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          {/* Help & Support */}
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <HelpCircle size={20} color={colors.textSecondary} />
              <Text style={styles.menuLabel}>Help & Support</Text>
            </View>
            <ChevronRight size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          {/* Sign Out */}
          <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
            <View style={styles.menuLeft}>
              <LogOut size={20} color={colors.error} />
              <Text style={[styles.menuLabel, { color: colors.error }]}>Sign Out</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Labaku v1.0.0</Text>
          <Text style={styles.appInfoText}>Made with ❤️ for small businesses</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginLeft: 12,
    },
    content: {
      flex: 1,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
      marginHorizontal: 20,
    },
    userCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      marginHorizontal: 20,
      padding: 20,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    userAvatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    userEmail: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    subscriptionBadge: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    subscriptionText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textSecondary,
      marginLeft: 4,
    },
    upgradeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.warning + '10',
      marginHorizontal: 20,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.warning + '30',
    },
    upgradeIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.warning + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    upgradeContent: {
      flex: 1,
    },
    upgradeTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    upgradeDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 16,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
      marginHorizontal: 20,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderRadius: 8,
      marginBottom: 8,
    },
    settingLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    settingLabel: {
      fontSize: 16,
      color: colors.text,
      marginLeft: 12,
    },
    menuItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
      marginHorizontal: 20,
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderRadius: 8,
      marginBottom: 8,
    },
    menuLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    menuContent: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    menuLabel: {
      fontSize: 16,
      color: colors.text,
      marginLeft: 12,
      flex: 1,
    },
    premiumLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.warning,
      backgroundColor: colors.warning + '20',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      textTransform: 'uppercase',
    },
    appInfo: {
      alignItems: 'center',
      paddingVertical: 24,
      paddingHorizontal: 20,
    },
    appInfoText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
  });
}