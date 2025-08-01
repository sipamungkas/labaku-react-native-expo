import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Package, Search, Filter, Edit3, Trash2, Tag } from 'lucide-react-native';
import Purchases from 'react-native-purchases';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useProducts, useBusinessStore } from '@/lib/stores/businessStore';
import { useSubscriptionTier } from '@/lib/revenuecat/client';
import { useSubscriptionLimits } from '@/lib/subscription/limits.tsx';
import UpgradePromptModal from '@/components/subscription/UpgradePromptModal';
import ProductFormModal from '@/components/forms/ProductFormModal';

/**
 * Products Screen
 * Displays and manages product inventory with enhanced features
 */
export default function ProductsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const products = useProducts();
  const { addProduct, updateProduct, deleteProduct } = useBusinessStore();
  const { tier, isPremium } = useSubscriptionTier();
  const { checkLimit, getUpgradePrompt } = useSubscriptionLimits('current-user-id'); // TODO: Get actual user ID
  
  // State for search and filtering
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [showFilters, setShowFilters] = React.useState(false);
  
  // Modal states
  const [isProductModalVisible, setIsProductModalVisible] = React.useState(false);
  const [isUpgradeModalVisible, setIsUpgradeModalVisible] = React.useState(false);
  const [editingProduct, setEditingProduct] = React.useState<any>(null);
  const [upgradePromptData, setUpgradePromptData] = React.useState<any>(null);
  
  // Get unique categories
  const categories = React.useMemo(() => {
    const uniqueCategories = [...new Set(products.map(p => p.category))];
    return ['all', ...uniqueCategories];
  }, [products]);
  
  // Filter products based on search and category
  const filteredProducts = React.useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);
  
  const handleAddProduct = async () => {
    // Check subscription limits
    const limitResult = await checkLimit('products');
    
    if (!limitResult.allowed) {
      const promptData = getUpgradePrompt('products', limitResult.currentCount, limitResult.limit);
      setUpgradePromptData(promptData);
      setIsUpgradeModalVisible(true);
      return;
    }
    
    // Show warning if near limit
    if (limitResult.isNearLimit && !isPremium) {
      Alert.alert(
        'Approaching Limit',
        `You have ${limitResult.remaining} product slots remaining. Consider upgrading to Premium for unlimited products.`,
        [
          { text: 'Continue', onPress: () => setIsProductModalVisible(true) },
          { text: 'Upgrade', onPress: () => setIsUpgradeModalVisible(true) },
        ]
      );
      return;
    }
    
    setEditingProduct(null);
    setIsProductModalVisible(true);
  };
  
  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setIsProductModalVisible(true);
  };
  
  const handleDeleteProduct = (product: any) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteProduct(product.id),
        },
      ]
    );
  };
  
  const handleCloseProductModal = () => {
    setIsProductModalVisible(false);
    setEditingProduct(null);
  };
  
  const handleCloseUpgradeModal = () => {
    setIsUpgradeModalVisible(false);
    setUpgradePromptData(null);
  };
  
  const styles = createStyles(colors);
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Package size={24} color={colors.primary} />
            <Text style={styles.headerTitle}>Products</Text>
          </View>
          <TouchableOpacity style={styles.searchButton}>
            <Search size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={16} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity 
            style={[styles.filterButton, showFilters && styles.filterButtonActive]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} color={showFilters ? colors.primary : colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        {/* Category Filter */}
        {showFilters && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryFilter}
            contentContainerStyle={styles.categoryFilterContent}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryChip,
                  selectedCategory === category && styles.categoryChipActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryChipText,
                  selectedCategory === category && styles.categoryChipTextActive
                ]}>
                  {category === 'all' ? 'All Categories' : category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{filteredProducts.length}</Text>
            <Text style={styles.statLabel}>Showing</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{products.filter(p => p.isActive).length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{products.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          {!isPremium && (
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.warning }]}>50</Text>
              <Text style={styles.statLabel}>Limit</Text>
            </View>
          )}
        </View>
      </View>
      
      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {products.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Products Yet</Text>
            <Text style={styles.emptyDescription}>
              Start building your inventory by adding your first product.
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddProduct}>
              <Plus size={20} color={colors.background} />
              <Text style={styles.emptyButtonText}>Add First Product</Text>
            </TouchableOpacity>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Search size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Products Found</Text>
            <Text style={styles.emptyDescription}>
              Try adjusting your search or filter criteria.
            </Text>
          </View>
        ) : (
          <View style={styles.productList}>
            {filteredProducts.map((product) => (
              <View key={product.id} style={styles.productCard}>
                <View style={styles.productHeader}>
                  <View style={styles.productTitleContainer}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <View style={styles.categoryTag}>
                      <Tag size={12} color={colors.primary} />
                      <Text style={styles.categoryTagText}>{product.category}</Text>
                    </View>
                  </View>
                  <View style={styles.productActions}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleEditProduct(product)}
                    >
                      <Edit3 size={16} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleDeleteProduct(product)}
                    >
                      <Trash2 size={16} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.productStatusContainer}>
                  <View style={[styles.statusBadge, product.isActive ? styles.activeBadge : styles.inactiveBadge]}>
                    <Text style={[styles.statusText, product.isActive ? styles.activeText : styles.inactiveText]}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
                
                {product.description && (
                  <Text style={styles.productDescription}>{product.description}</Text>
                )}
                
                <View style={styles.productDetails}>
                  <View style={styles.productDetailItem}>
                    <Text style={styles.productDetailLabel}>Unit</Text>
                    <Text style={styles.productDetailValue}>{product.unit}</Text>
                  </View>
                  <View style={styles.productDetailItem}>
                    <Text style={styles.productDetailLabel}>Stock</Text>
                    <Text style={styles.productDetailValue}>0 {product.unit}</Text>
                  </View>
                </View>
                
                <View style={styles.productPricing}>
                  <View style={styles.priceItem}>
                    <Text style={styles.priceLabel}>Selling Price</Text>
                    <Text style={styles.priceValue}>Rp {product.currentPrice.toLocaleString('id-ID')}</Text>
                  </View>
                  <View style={styles.priceItem}>
                    <Text style={styles.priceLabel}>Cost Price</Text>
                    <Text style={styles.costValue}>Rp {product.costPrice.toLocaleString('id-ID')}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
      
      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddProduct}>
        <Plus size={24} color={colors.background} />
      </TouchableOpacity>
      
      {/* Product Form Modal */}
      <ProductFormModal
        visible={isProductModalVisible}
        onClose={handleCloseProductModal}
        editingProduct={editingProduct}
      />
      
      {/* Upgrade Prompt Modal */}
      <UpgradePromptModal
        visible={isUpgradeModalVisible}
        onClose={handleCloseUpgradeModal}
        promptData={upgradePromptData}
        showFeatureComparison={true}
      />
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
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    },
    searchInputContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
    },
    filterButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.background,
    },
    filterButtonActive: {
      backgroundColor: colors.primary + '20',
    },
    categoryFilter: {
      marginBottom: 16,
    },
    categoryFilterContent: {
      paddingHorizontal: 4,
      gap: 8,
    },
    categoryChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    categoryChipText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    categoryChipTextActive: {
      color: colors.background,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.primary,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
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
    productList: {
      padding: 16,
    },
    productCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    productHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    productTitleContainer: {
      flex: 1,
      marginRight: 12,
    },
    productName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    categoryTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    categoryTagText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '500',
    },
    productActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      padding: 6,
      borderRadius: 6,
      backgroundColor: colors.background,
    },
    productStatusContainer: {
      marginBottom: 8,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    activeBadge: {
      backgroundColor: colors.success + '20',
    },
    inactiveBadge: {
      backgroundColor: colors.textSecondary + '20',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
    },
    activeText: {
      color: colors.success,
    },
    inactiveText: {
      color: colors.textSecondary,
    },
    productDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 12,
      lineHeight: 18,
    },
    productDetails: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    productDetailItem: {
      flex: 1,
    },
    productDetailLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    productDetailValue: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    productPricing: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    priceItem: {
      flex: 1,
    },
    priceLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    priceValue: {
      fontSize: 16,
      color: colors.primary,
      fontWeight: '600',
    },
    costValue: {
      fontSize: 16,
      color: colors.text,
      fontWeight: '600',
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