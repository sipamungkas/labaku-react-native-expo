import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import {
  Search,
  Filter,
  Plus,
  TrendingUp,
  TrendingDown,
  Package,
  Edit3,
  Trash2,
  Calendar,
  DollarSign,
  User,
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useBusinessStore, Transaction } from '@/lib/stores/businessStore';
import { useSubscriptionTier } from '@/lib/stores/authStore';
import { format, parseISO, isWithinInterval, subDays, startOfDay, endOfDay } from 'date-fns';

interface TransactionManagementProps {
  onAddTransaction: () => void;
  onEditTransaction: (transaction: Transaction) => void;
}

type SortOption = 'date' | 'amount' | 'product' | 'type';
type FilterOption = 'all' | 'sale' | 'purchase' | 'adjustment' | 'today' | 'week' | 'month';

const TRANSACTION_CATEGORIES = [
  'Regular Sale',
  'Bulk Sale',
  'Wholesale',
  'Retail',
  'Online',
  'In-Store',
  'Return',
  'Exchange',
  'Damaged',
  'Expired',
  'Other',
];

export default function TransactionManagement({ onAddTransaction, onEditTransaction }: TransactionManagementProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { transactions, products, vendors, deleteTransaction } = useBusinessStore();
  const { isPremium } = useSubscriptionTier();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('date');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date } | null>(null);

  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions.filter(transaction => {
      // Search filter
      const product = products.find(p => p.id === transaction.productId);
      const vendor = vendors.find(v => v.id === product?.vendorId);
      
      const matchesSearch = 
        product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category filter
      const matchesCategory = selectedCategory === 'all' || transaction.category === selectedCategory;
      
      // Type/Date filter
      let matchesFilter = true;
      const transactionDate = parseISO(transaction.createdAt);
      const now = new Date();
      
      switch (filterBy) {
        case 'sale':
          matchesFilter = transaction.type === 'sale';
          break;
        case 'purchase':
          matchesFilter = transaction.type === 'purchase';
          break;
        case 'adjustment':
          matchesFilter = transaction.type === 'adjustment';
          break;
        case 'today':
          matchesFilter = isWithinInterval(transactionDate, {
            start: startOfDay(now),
            end: endOfDay(now),
          });
          break;
        case 'week':
          matchesFilter = isWithinInterval(transactionDate, {
            start: subDays(now, 7),
            end: now,
          });
          break;
        case 'month':
          matchesFilter = isWithinInterval(transactionDate, {
            start: subDays(now, 30),
            end: now,
          });
          break;
        default:
          matchesFilter = true;
      }
      
      // Custom date range filter (premium feature)
      if (dateRange && isPremium) {
        matchesFilter = matchesFilter && isWithinInterval(transactionDate, {
          start: startOfDay(dateRange.start),
          end: endOfDay(dateRange.end),
        });
      }
      
      return matchesSearch && matchesCategory && matchesFilter;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'amount':
          return b.totalAmount - a.totalAmount;
        case 'product':
          const productA = products.find(p => p.id === a.productId)?.name || '';
          const productB = products.find(p => p.id === b.productId)?.name || '';
          return productA.localeCompare(productB);
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

    return filtered;
  }, [transactions, products, vendors, searchQuery, selectedCategory, sortBy, filterBy, dateRange, isPremium]);

  const handleDeleteTransaction = (transactionId: string) => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? This will affect your inventory and reports.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteTransaction(transactionId),
        },
      ]
    );
  };

  const handleBulkDelete = () => {
    if (!isPremium) {
      Alert.alert(
        'Premium Feature',
        'Bulk operations are available for Premium users only.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Transactions',
      `Are you sure you want to delete ${selectedTransactions.length} transactions? This will affect your inventory and reports.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            selectedTransactions.forEach(transactionId => deleteTransaction(transactionId));
            setSelectedTransactions([]);
          },
        },
      ]
    );
  };

  const toggleTransactionSelection = (transactionId: string) => {
    if (!isPremium) {
      Alert.alert(
        'Premium Feature',
        'Bulk selection is available for Premium users only.',
        [{ text: 'OK' }]
      );
      return;
    }

    setSelectedTransactions(prev => 
      prev.includes(transactionId)
        ? prev.filter(id => id !== transactionId)
        : [...prev, transactionId]
    );
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <TrendingUp size={20} color={colors.success} />;
      case 'purchase':
        return <TrendingDown size={20} color={colors.error} />;
      case 'adjustment':
        return <Package size={20} color={colors.warning} />;
      default:
        return <Package size={20} color={colors.textSecondary} />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'sale':
        return colors.success;
      case 'purchase':
        return colors.error;
      case 'adjustment':
        return colors.warning;
      default:
        return colors.textSecondary;
    }
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  const getTotalsByType = () => {
    const sales = filteredAndSortedTransactions.filter(t => t.type === 'sale');
    const purchases = filteredAndSortedTransactions.filter(t => t.type === 'purchase');
    const adjustments = filteredAndSortedTransactions.filter(t => t.type === 'adjustment');
    
    return {
      sales: {
        count: sales.length,
        total: sales.reduce((sum, t) => sum + t.totalAmount, 0),
      },
      purchases: {
        count: purchases.length,
        total: purchases.reduce((sum, t) => sum + t.totalAmount, 0),
      },
      adjustments: {
        count: adjustments.length,
        total: adjustments.reduce((sum, t) => sum + t.totalAmount, 0),
      },
    };
  };

  const totals = getTotalsByType();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Transaction History</Text>
          <TouchableOpacity style={styles.addButton} onPress={onAddTransaction}>
            <Plus size={20} color={colors.background} />
            <Text style={styles.addButtonText}>Add Transaction</Text>
          </TouchableOpacity>
        </View>
        
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={styles.summaryCard}>
            <TrendingUp size={16} color={colors.success} />
            <Text style={styles.summaryLabel}>Sales</Text>
            <Text style={[styles.summaryValue, { color: colors.success }]}>
              {formatCurrency(totals.sales.total)}
            </Text>
            <Text style={styles.summaryCount}>{totals.sales.count} transactions</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <TrendingDown size={16} color={colors.error} />
            <Text style={styles.summaryLabel}>Purchases</Text>
            <Text style={[styles.summaryValue, { color: colors.error }]}>
              {formatCurrency(totals.purchases.total)}
            </Text>
            <Text style={styles.summaryCount}>{totals.purchases.count} transactions</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Package size={16} color={colors.warning} />
            <Text style={styles.summaryLabel}>Adjustments</Text>
            <Text style={[styles.summaryValue, { color: colors.warning }]}>
              {formatCurrency(totals.adjustments.total)}
            </Text>
            <Text style={styles.summaryCount}>{totals.adjustments.count} transactions</Text>
          </View>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Filters */}
        {showFilters && (
          <View style={styles.filtersContainer}>
            {/* Quick Filters */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickFilters}>
              {[
                { key: 'all', label: 'All' },
                { key: 'today', label: 'Today' },
                { key: 'week', label: 'This Week' },
                { key: 'month', label: 'This Month' },
                { key: 'sale', label: 'Sales' },
                { key: 'purchase', label: 'Purchases' },
                { key: 'adjustment', label: 'Adjustments' },
              ].map(filter => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.quickFilterChip,
                    filterBy === filter.key && styles.quickFilterChipActive,
                  ]}
                  onPress={() => setFilterBy(filter.key as FilterOption)}
                >
                  <Text
                    style={[
                      styles.quickFilterText,
                      filterBy === filter.key && styles.quickFilterTextActive,
                    ]}
                  >
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Sort Options */}
            <View style={styles.sortContainer}>
              <Text style={styles.filterLabel}>Sort by:</Text>
              <TouchableOpacity
                style={styles.sortButton}
                onPress={() => {
                  const options: SortOption[] = ['date', 'amount', 'product', 'type'];
                  const currentIndex = options.indexOf(sortBy);
                  const nextIndex = (currentIndex + 1) % options.length;
                  setSortBy(options[nextIndex]);
                }}
              >
                <Text style={styles.sortButtonText}>
                  {sortBy === 'date' ? 'Date' :
                   sortBy === 'amount' ? 'Amount' :
                   sortBy === 'product' ? 'Product' : 'Type'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bulk Actions */}
        {isPremium && selectedTransactions.length > 0 && (
          <View style={styles.bulkActionsContainer}>
            <Text style={styles.bulkActionsText}>
              {selectedTransactions.length} transaction{selectedTransactions.length > 1 ? 's' : ''} selected
            </Text>
            <TouchableOpacity style={styles.bulkDeleteButton} onPress={handleBulkDelete}>
              <Trash2 size={16} color={colors.error} />
              <Text style={styles.bulkDeleteText}>Delete Selected</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Transaction List */}
      <ScrollView style={styles.transactionList} showsVerticalScrollIndicator={false}>
        {filteredAndSortedTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No transactions found</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery || filterBy !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start by recording your first transaction'}
            </Text>
          </View>
        ) : (
          filteredAndSortedTransactions.map(transaction => {
            const product = products.find(p => p.id === transaction.productId);
            const vendor = vendors.find(v => v.id === product?.vendorId);
            const isSelected = selectedTransactions.includes(transaction.id);

            return (
              <TouchableOpacity
                key={transaction.id}
                style={[
                  styles.transactionCard,
                  isSelected && styles.transactionCardSelected,
                ]}
                onPress={() => isPremium ? toggleTransactionSelection(transaction.id) : onEditTransaction(transaction)}
                onLongPress={() => toggleTransactionSelection(transaction.id)}
              >
                <View style={styles.transactionLeft}>
                  <View style={[
                    styles.transactionIcon,
                    { backgroundColor: getTransactionColor(transaction.type) + '20' }
                  ]}>
                    {getTransactionIcon(transaction.type)}
                  </View>
                  
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionProduct}>
                      {product?.name || 'Unknown Product'}
                    </Text>
                    {vendor && (
                      <Text style={styles.transactionVendor}>
                        {vendor.name}
                      </Text>
                    )}
                    <Text style={styles.transactionDate}>
                      {format(parseISO(transaction.createdAt), 'MMM dd, yyyy HH:mm')}
                    </Text>
                    {transaction.notes && (
                      <Text style={styles.transactionNotes} numberOfLines={1}>
                        {transaction.notes}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.transactionRight}>
                  <Text style={[
                    styles.transactionAmount,
                    { color: getTransactionColor(transaction.type) }
                  ]}>
                    {transaction.type === 'purchase' ? '-' : '+'}
                    {formatCurrency(transaction.totalAmount)}
                  </Text>
                  
                  <Text style={styles.transactionQuantity}>
                    {transaction.quantity} {product?.unit || 'pcs'}
                  </Text>
                  
                  <View style={styles.transactionActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => onEditTransaction(transaction)}
                    >
                      <Edit3 size={14} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDeleteTransaction(transaction.id)}
                    >
                      <Trash2 size={14} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      padding: 20,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 6,
    },
    addButtonText: {
      color: colors.background,
      fontWeight: '600',
      fontSize: 14,
    },
    summaryContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    summaryCard: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
      marginBottom: 2,
    },
    summaryValue: {
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 2,
    },
    summaryCount: {
      fontSize: 10,
      color: colors.textSecondary,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      marginLeft: 8,
      fontSize: 16,
      color: colors.text,
    },
    filterButton: {
      padding: 4,
    },
    filtersContainer: {
      marginTop: 8,
    },
    quickFilters: {
      marginBottom: 12,
    },
    quickFilterChip: {
      backgroundColor: colors.background,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginRight: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    quickFilterChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    quickFilterText: {
      fontSize: 12,
      color: colors.text,
      fontWeight: '500',
    },
    quickFilterTextActive: {
      color: colors.background,
    },
    sortContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    filterLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    sortButton: {
      backgroundColor: colors.background,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sortButtonText: {
      fontSize: 12,
      color: colors.text,
      fontWeight: '500',
    },
    bulkActionsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.primary + '10',
      padding: 12,
      borderRadius: 8,
      marginTop: 8,
    },
    bulkActionsText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    bulkDeleteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    bulkDeleteText: {
      fontSize: 14,
      color: colors.error,
      fontWeight: '500',
    },
    transactionList: {
      flex: 1,
      padding: 20,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyTitle: {
      fontSize: 18,
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
    },
    transactionCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    transactionCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '05',
    },
    transactionLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    transactionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    transactionInfo: {
      flex: 1,
    },
    transactionProduct: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    transactionVendor: {
      fontSize: 12,
      color: colors.primary,
      marginBottom: 2,
    },
    transactionDate: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    transactionNotes: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    transactionRight: {
      alignItems: 'flex-end',
    },
    transactionAmount: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 2,
    },
    transactionQuantity: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 8,
    },
    transactionActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      padding: 4,
    },
  });
}