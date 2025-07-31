import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  DollarSign,
  AlertTriangle,
  Plus,
} from 'lucide-react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  useProducts,
  useVendors,
  useTransactions,
  useBusinessStore,
} from '@/lib/stores/businessStore';
import { useUser, useSubscriptionTier } from '@/lib/stores/authStore';
import { premiumHelpers } from '@/lib/revenuecat/client';

const { width } = Dimensions.get('window');

/**
 * Dashboard Screen
 * Main business overview and analytics
 */
export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const user = useUser();
  const subscriptionTier = useSubscriptionTier();
  const products = useProducts();
  const vendors = useVendors();
  const transactions = useTransactions();
  const {
    getTotalRevenue,
    getTotalProfit,
    getTopSellingProducts,
    getLowStockProducts,
  } = useBusinessStore();
  
  // Calculate metrics
  const totalRevenue = getTotalRevenue();
  const totalProfit = getTotalProfit();
  const topProducts = getTopSellingProducts(3);
  const lowStockProducts = getLowStockProducts(5);
  const recentTransactions = transactions.slice(-5).reverse();
  
  // Get current date info
  const currentDate = new Date();
  const greeting = getGreeting();
  const userName = user?.user_metadata?.full_name?.split(' ')[0] || 'there';
  
  function getGreeting() {
    const hour = currentDate.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }
  
  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };
  
  const styles = createStyles(colors);
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>{greeting},</Text>
              <Text style={styles.userName}>{userName}! 👋</Text>
            </View>
            <View style={styles.subscriptionBadge}>
              <Text style={styles.subscriptionText}>
                {subscriptionTier === 'premium' ? '👑 Premium' : '🆓 Free'}
              </Text>
            </View>
          </View>
          
          <Text style={styles.dateText}>
            {currentDate.toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </View>
        
        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <DollarSign size={20} color={colors.success} />
              </View>
              <Text style={styles.statValue}>{formatCurrency(totalRevenue)}</Text>
              <Text style={styles.statLabel}>Total Revenue</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <TrendingUp size={20} color={colors.primary} />
              </View>
              <Text style={styles.statValue}>{formatCurrency(totalProfit)}</Text>
              <Text style={styles.statLabel}>Total Profit</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Package size={20} color={colors.warning} />
              </View>
              <Text style={styles.statValue}>{products.length}</Text>
              <Text style={styles.statLabel}>Products</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Users size={20} color={colors.info} />
              </View>
              <Text style={styles.statValue}>{vendors.length}</Text>
              <Text style={styles.statLabel}>Vendors</Text>
            </View>
          </View>
        </View>
        
        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.alertCard}>
              <View style={styles.alertHeader}>
                <AlertTriangle size={20} color={colors.warning} />
                <Text style={styles.alertTitle}>Low Stock Alert</Text>
              </View>
              <Text style={styles.alertDescription}>
                {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''} running low on stock
              </Text>
              <TouchableOpacity style={styles.alertButton}>
                <Text style={styles.alertButtonText}>View Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <Plus size={24} color={colors.primary} />
              <Text style={styles.actionText}>Add Product</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard}>
              <TrendingUp size={24} color={colors.success} />
              <Text style={styles.actionText}>Record Sale</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard}>
              <TrendingDown size={24} color={colors.error} />
              <Text style={styles.actionText}>Add Purchase</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard}>
              <BarChart3 size={24} color={colors.info} />
              <Text style={styles.actionText}>View Reports</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Recent Transactions */}
        {recentTransactions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <TouchableOpacity>
                <Text style={styles.sectionLink}>View All</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.transactionsList}>
              {recentTransactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionItem}>
                  <View style={styles.transactionLeft}>
                    <View style={[
                      styles.transactionIcon,
                      {
                        backgroundColor: transaction.type === 'sale'
                          ? colors.success + '20'
                          : transaction.type === 'purchase'
                          ? colors.error + '20'
                          : colors.warning + '20'
                      }
                    ]}>
                      {transaction.type === 'sale' ? (
                        <TrendingUp size={16} color={colors.success} />
                      ) : transaction.type === 'purchase' ? (
                        <TrendingDown size={16} color={colors.error} />
                      ) : (
                        <Package size={16} color={colors.warning} />
                      )}
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionType}>
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {new Date(transaction.createdAt).toLocaleDateString('id-ID')}
                      </Text>
                    </View>
                  </View>
                  <Text style={[
                    styles.transactionAmount,
                    {
                      color: transaction.type === 'sale'
                        ? colors.success
                        : transaction.type === 'purchase'
                        ? colors.error
                        : colors.warning
                    }
                  ]}>
                    {transaction.type === 'purchase' ? '-' : '+'}
                    {formatCurrency(transaction.totalAmount)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Empty State */}
        {products.length === 0 && transactions.length === 0 && (
          <View style={styles.emptyState}>
            <Package size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>Welcome to Labaku!</Text>
            <Text style={styles.emptyDescription}>
              Start by adding your first product to begin managing your business inventory.
            </Text>
            <TouchableOpacity style={styles.emptyButton}>
              <Plus size={20} color={colors.background} />
              <Text style={styles.emptyButtonText}>Add First Product</Text>
            </TouchableOpacity>
          </View>
        )}
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
    content: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 20,
      paddingVertical: 20,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    greeting: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    userName: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
    },
    subscriptionBadge: {
      backgroundColor: colors.primary + '20',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
    subscriptionText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },
    dateText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    section: {
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    sectionLink: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '500',
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    statCard: {
      width: (width - 60) / 2,
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    statValue: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    alertCard: {
      backgroundColor: colors.warning + '10',
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.warning + '30',
    },
    alertHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    alertTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginLeft: 8,
    },
    alertDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    alertButton: {
      alignSelf: 'flex-start',
    },
    alertButtonText: {
      fontSize: 14,
      color: colors.warning,
      fontWeight: '500',
    },
    actionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    actionCard: {
      width: (width - 60) / 2,
      backgroundColor: colors.surface,
      padding: 20,
      borderRadius: 12,
      alignItems: 'center',
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionText: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginTop: 8,
      textAlign: 'center',
    },
    transactionsList: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    transactionItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    transactionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    transactionIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    transactionInfo: {
      flex: 1,
    },
    transactionType: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    transactionDate: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    transactionAmount: {
      fontSize: 14,
      fontWeight: '600',
    },
    emptyState: {
      alignItems: 'center',
      paddingHorizontal: 40,
      paddingVertical: 60,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
    emptyButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
    },
    emptyButtonText: {
      color: colors.background,
      fontWeight: '600',
      marginLeft: 8,
    },
  });
}
