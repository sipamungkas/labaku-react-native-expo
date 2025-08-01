import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import {
  Search,
  Filter,
  Plus,
  Package,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useBusinessStore, Product } from '@/lib/stores/businessStore';
import { useSubscriptionTier } from '@/lib/stores/authStore';

interface ProductManagementProps {
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
}

type SortOption = 'name' | 'stock' | 'category' | 'created';
type FilterOption = 'all' | 'low-stock' | 'out-of-stock' | 'active' | 'inactive';

const PRODUCT_CATEGORIES = [
  'Electronics',
  'Clothing',
  'Food & Beverage',
  'Health & Beauty',
  'Home & Garden',
  'Sports & Outdoors',
  'Books & Media',
  'Automotive',
  'Office Supplies',
  'Other',
];

export default function ProductManagement({ onAddProduct, onEditProduct }: ProductManagementProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { products, getStock, deleteProduct } = useBusinessStore();
  const tier = useSubscriptionTier();
  const isPremium = tier === 'premium';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [showBulkActions, setShowBulkActions] = useState(false);


  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter(product => {
      // Search filter
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.barcode?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Category filter
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      
      // Status filter
      const stock = getStock(product.id);
      let matchesFilter = true;
      
      switch (filterBy) {
        case 'low-stock':
          matchesFilter = stock > 0 && stock <= 10;
          break;
        case 'out-of-stock':
          matchesFilter = stock === 0;
          break;
        case 'active':
          matchesFilter = product.isActive;
          break;
        case 'inactive':
          matchesFilter = !product.isActive;
          break;
        default:
          matchesFilter = true;
      }
      
      return matchesSearch && matchesCategory && matchesFilter;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'stock':
          return getStock(b.id) - getStock(a.id);
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, searchQuery, selectedCategory, sortBy, filterBy, getStock]);

  const handleDeleteProduct = (productId: string) => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteProduct(productId),
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
      'Delete Products',
      `Are you sure you want to delete ${selectedProducts.length} products? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            selectedProducts.forEach(productId => deleteProduct(productId));
            setSelectedProducts([]);
            setShowBulkActions(false);
          },
        },
      ]
    );
  };

  const toggleProductSelection = (productId: string) => {
    if (!isPremium) {
      Alert.alert(
        'Premium Feature',
        'Bulk selection is available for Premium users only.',
        [{ text: 'OK' }]
      );
      return;
    }

    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', color: colors.error };
    if (stock <= 10) return { label: 'Low Stock', color: colors.warning };
    return { label: 'In Stock', color: colors.success };
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Product Management</Text>
          <TouchableOpacity style={styles.addButton} onPress={onAddProduct}>
            <Plus size={20} color={colors.background} />
            <Text style={styles.addButtonText}>Add Product</Text>
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
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
            {/* Category Filter */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryFilter}>
              <TouchableOpacity
                style={[
                  styles.categoryChip,
                  selectedCategory === 'all' && styles.categoryChipActive,
                ]}
                onPress={() => setSelectedCategory('all')}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    selectedCategory === 'all' && styles.categoryChipTextActive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {PRODUCT_CATEGORIES.map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category && styles.categoryChipActive,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === category && styles.categoryChipTextActive,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Sort and Filter Options */}
            <View style={styles.sortFilterRow}>
              <View style={styles.sortContainer}>
                <Text style={styles.filterLabel}>Sort by:</Text>
                <TouchableOpacity
                  style={styles.sortButton}
                  onPress={() => {
                    const options: SortOption[] = ['name', 'stock', 'category', 'created'];
                    const currentIndex = options.indexOf(sortBy);
                    const nextIndex = (currentIndex + 1) % options.length;
                    setSortBy(options[nextIndex]);
                  }}
                >
                  <Text style={styles.sortButtonText}>
                    {sortBy === 'name' ? 'Name' :
                     sortBy === 'stock' ? 'Stock' :
                     sortBy === 'category' ? 'Category' : 'Created'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.filterContainer}>
                <Text style={styles.filterLabel}>Filter:</Text>
                <TouchableOpacity
                  style={styles.filterOptionButton}
                  onPress={() => {
                    const options: FilterOption[] = ['all', 'low-stock', 'out-of-stock', 'active', 'inactive'];
                    const currentIndex = options.indexOf(filterBy);
                    const nextIndex = (currentIndex + 1) % options.length;
                    setFilterBy(options[nextIndex]);
                  }}
                >
                  <Text style={styles.filterOptionText}>
                    {filterBy === 'all' ? 'All' :
                     filterBy === 'low-stock' ? 'Low Stock' :
                     filterBy === 'out-of-stock' ? 'Out of Stock' :
                     filterBy === 'active' ? 'Active' : 'Inactive'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Bulk Actions */}
        {isPremium && selectedProducts.length > 0 && (
          <View style={styles.bulkActionsContainer}>
            <Text style={styles.bulkActionsText}>
              {selectedProducts.length} product{selectedProducts.length > 1 ? 's' : ''} selected
            </Text>
            <TouchableOpacity style={styles.bulkDeleteButton} onPress={handleBulkDelete}>
              <Trash2 size={16} color={colors.error} />
              <Text style={styles.bulkDeleteText}>Delete Selected</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Product List */}
      <ScrollView style={styles.productList} showsVerticalScrollIndicator={false}>
        {filteredAndSortedProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No products found</Text>
            <Text style={styles.emptyDescription}>
              {searchQuery || selectedCategory !== 'all' || filterBy !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Start by adding your first product'}
            </Text>
          </View>
        ) : (
          filteredAndSortedProducts.map(product => {
            const stock = getStock(product.id);
            const stockStatus = getStockStatus(stock);
            const isSelected = selectedProducts.includes(product.id);

            return (
              <TouchableOpacity
                key={product.id}
                style={[
                  styles.productCard,
                  isSelected && styles.productCardSelected,
                ]}
                onPress={() => isPremium ? toggleProductSelection(product.id) : onEditProduct(product)}
                onLongPress={() => toggleProductSelection(product.id)}
              >
                {isPremium && (
                  <View style={styles.selectionIndicator}>
                    {isSelected ? (
                      <CheckCircle size={20} color={colors.primary} />
                    ) : (
                      <View style={styles.selectionCircle} />
                    )}
                  </View>
                )}

                <View style={styles.productInfo}>
                  <View style={styles.productHeader}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <View style={styles.productActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => onEditProduct(product)}
                      >
                        <Edit3 size={16} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDeleteProduct(product.id)}
                      >
                        <Trash2 size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {product.description && (
                    <Text style={styles.productDescription} numberOfLines={2}>
                      {product.description}
                    </Text>
                  )}

                  <View style={styles.productDetails}>
                    <View style={styles.productMeta}>
                      {product.barcode && (
                        <Text style={styles.productSku}>Barcode: {product.barcode}</Text>
                      )}
                      {product.category && (
                        <Text style={styles.productCategory}>{product.category}</Text>
                      )}
                    </View>

                    <View style={styles.stockInfo}>
                      <Text style={[styles.stockText, { color: stockStatus.color }]}>
                        {stock} {product.unit || 'pcs'}
                      </Text>
                      <Text style={[styles.stockStatus, { color: stockStatus.color }]}>
                        {stockStatus.label}
                      </Text>
                    </View>
                  </View>

                  {!product.isActive && (
                    <View style={styles.inactiveIndicator}>
                      <AlertTriangle size={14} color={colors.warning} />
                      <Text style={styles.inactiveText}>Inactive</Text>
                    </View>
                  )}
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
    categoryFilter: {
      marginBottom: 12,
    },
    categoryChip: {
      backgroundColor: colors.background,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginRight: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    categoryChipText: {
      fontSize: 12,
      color: colors.text,
      fontWeight: '500',
    },
    categoryChipTextActive: {
      color: colors.background,
    },
    sortFilterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sortContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    filterContainer: {
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
    filterOptionButton: {
      backgroundColor: colors.background,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterOptionText: {
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
    productList: {
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
    productCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    productCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '05',
    },
    selectionIndicator: {
      marginRight: 12,
      marginTop: 2,
    },
    selectionCircle: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.border,
    },
    productInfo: {
      flex: 1,
    },
    productHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    productName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      marginRight: 12,
    },
    productActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      padding: 4,
    },
    productDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
      lineHeight: 18,
    },
    productDetails: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
    },
    productMeta: {
      flex: 1,
    },
    productSku: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    productCategory: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '500',
    },
    stockInfo: {
      alignItems: 'flex-end',
    },
    stockText: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 2,
    },
    stockStatus: {
      fontSize: 12,
      fontWeight: '500',
    },
    inactiveIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
      gap: 4,
    },
    inactiveText: {
      fontSize: 12,
      color: colors.warning,
      fontWeight: '500',
    },
  });
}