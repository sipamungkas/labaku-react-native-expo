import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Receipt, TrendingUp, TrendingDown, RotateCcw, Filter } from 'lucide-react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useTransactions, useBusinessStore, Transaction } from '@/lib/stores/businessStore';

/**
 * Transactions Screen
 * Displays and manages business transactions
 */
export default function TransactionsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const transactions = useTransactions();
  const { addTransaction, getTotalRevenue } = useBusinessStore();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'purchase' | 'sale' | 'adjustment'>('all');
  
  // Filter transactions based on selected filter
  const filteredTransactions = transactions.filter(transaction => {
    if (selectedFilter === 'all') return true;
    return transaction.type === selectedFilter;
  });
  
  // Calculate stats
  const totalRevenue = getTotalRevenue();
  const totalPurchases = transactions
    .filter(t => t.type === 'purchase')
    .reduce((sum, t) => sum + t.totalAmount, 0);
  const totalSales = transactions
    .filter(t => t.type === 'sale')
    .reduce((sum, t) => sum + t.totalAmount, 0);
  
  const handleAddTransaction = () => {
    // For demo purposes, add a sample transaction
    const transactionTypes: Transaction['type'][] = ['purchase', 'sale', 'adjustment'];
    const randomType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
    
    addTransaction({
      type: randomType,
      productId: 'sample-product',
      vendorId: randomType === 'purchase' ? 'sample-vendor' : undefined,
      quantity: Math.floor(Math.random() * 10) + 1,
      unitPrice: Math.floor(Math.random() * 50000) + 10000,
      totalAmount: 0, // Will be calculated
      notes: `Sample ${randomType} transaction`,
    });
  };
  
  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'purchase':
        return <TrendingDown size={16} color={colors.error} />;
      case 'sale':
        return <TrendingUp size={16} color={colors.success} />;
      case 'adjustment':
        return <RotateCcw size={16} color={colors.warning} />;
    }
  };
  
  const getTransactionColor = (type: Transaction['type']) => {
    switch (type) {
      case 'purchase':
        return colors.error;
      case 'sale':
        return colors.success;
      case 'adjustment':
        return colors.warning;
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const styles = createStyles(colors);
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Receipt size={24} color={colors.primary} />
            <Text style={styles.headerTitle}>Transactions</Text>
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>Rp {totalRevenue.toLocaleString('id-ID')}</Text>
            <Text style={styles.statLabel}>Total Revenue</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{transactions.length}</Text>
            <Text style={styles.statLabel}>Total Transactions</Text>
          </View>
        </View>
        
        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          {(['all', 'purchase', 'sale', 'adjustment'] as const).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                selectedFilter === filter && styles.activeFilterTab,
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  selectedFilter === filter && styles.activeFilterTabText,
                ]}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Receipt size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>
              {selectedFilter === 'all' ? 'No Transactions Yet' : `No ${selectedFilter} transactions`}
            </Text>
            <Text style={styles.emptyDescription}>
              {selectedFilter === 'all'
                ? 'Start recording your business transactions to track your performance.'
                : `No ${selectedFilter} transactions found. Try a different filter.`}
            </Text>
            {selectedFilter === 'all' && (
              <TouchableOpacity style={styles.emptyButton} onPress={handleAddTransaction}>
                <Plus size={20} color={colors.background} />
                <Text style={styles.emptyButtonText}>Add First Transaction</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.transactionList}>
            {filteredTransactions.map((transaction) => (
              <TouchableOpacity key={transaction.id} style={styles.transactionCard}>
                <View style={styles.transactionHeader}>
                  <View style={styles.transactionLeft}>
                    <View style={styles.transactionIcon}>
                      {getTransactionIcon(transaction.type)}
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionType}>
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </Text>
                      <Text style={styles.transactionDate}>
                        {formatDate(transaction.createdAt)} • {formatTime(transaction.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text
                      style={[
                        styles.transactionAmount,
                        { color: getTransactionColor(transaction.type) },
                      ]}
                    >
                      {transaction.type === 'purchase' ? '-' : '+'}
                      Rp {transaction.totalAmount.toLocaleString('id-ID')}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.transactionDetails}>
                  <View style={styles.transactionDetailRow}>
                    <Text style={styles.transactionDetailLabel}>Quantity:</Text>
                    <Text style={styles.transactionDetailValue}>{transaction.quantity}</Text>
                  </View>
                  <View style={styles.transactionDetailRow}>
                    <Text style={styles.transactionDetailLabel}>Unit Price:</Text>
                    <Text style={styles.transactionDetailValue}>
                      Rp {transaction.unitPrice.toLocaleString('id-ID')}
                    </Text>
                  </View>
                  {transaction.notes && (
                    <View style={styles.transactionDetailRow}>
                      <Text style={styles.transactionDetailLabel}>Notes:</Text>
                      <Text style={styles.transactionDetailValue}>{transaction.notes}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
      
      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddTransaction}>
        <Plus size={24} color={colors.background} />
      </TouchableOpacity>
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
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginLeft: 12,
    },
    filterButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 16,
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.primary,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
    },
    filterTabs: {
      flexDirection: 'row',
      backgroundColor: colors.background,
      borderRadius: 8,
      padding: 4,
    },
    filterTab: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      alignItems: 'center',
    },
    activeFilterTab: {
      backgroundColor: colors.primary,
    },
    filterTabText: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    activeFilterTabText: {
      color: colors.background,
    },
    content: {
      flex: 1,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
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
    transactionList: {
      padding: 16,
    },
    transactionCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    transactionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
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
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    transactionInfo: {
      flex: 1,
    },
    transactionType: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    transactionDate: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    transactionRight: {
      alignItems: 'flex-end',
    },
    transactionAmount: {
      fontSize: 16,
      fontWeight: '700',
    },
    transactionDetails: {
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    transactionDetailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    transactionDetailLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    transactionDetailValue: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    fab: {
      position: 'absolute',
      bottom: 24,
      right: 24,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 8,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
  });
}