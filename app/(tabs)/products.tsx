import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Package, Search } from 'lucide-react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useProducts, useBusinessStore } from '@/lib/stores/businessStore';
import { premiumHelpers } from '@/lib/revenuecat/client';

/**
 * Products Screen
 * Displays and manages product inventory
 */
export default function ProductsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const products = useProducts();
  const { addProduct } = useBusinessStore();
  
  const handleAddProduct = () => {
    // Check if user can add more products
    if (!premiumHelpers.canAddProducts(products.length)) {
      Alert.alert(
        'Upgrade Required',
        `Free tier is limited to ${premiumHelpers.getFreeTierLimits({ products: products.length, vendors: 0 }).products.limit} products. Upgrade to Premium for unlimited products.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => console.log('Navigate to subscription') },
        ]
      );
      return;
    }
    
    // For now, add a sample product
    addProduct({
      name: `Product ${products.length + 1}`,
      description: 'Sample product description',
      category: 'General',
      unit: 'pcs',
      currentPrice: 10000,
      costPrice: 7500,
      vendorId: 'sample-vendor',
      isActive: true,
    });
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
        
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{products.length}</Text>
            <Text style={styles.statLabel}>Total Products</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{products.filter(p => p.isActive).length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{products.filter(p => !p.isActive).length}</Text>
            <Text style={styles.statLabel}>Inactive</Text>
          </View>
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
        ) : (
          <View style={styles.productList}>
            {products.map((product) => (
              <TouchableOpacity key={product.id} style={styles.productCard}>
                <View style={styles.productHeader}>
                  <Text style={styles.productName}>{product.name}</Text>
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
                    <Text style={styles.productDetailLabel}>Category</Text>
                    <Text style={styles.productDetailValue}>{product.category}</Text>
                  </View>
                  <View style={styles.productDetailItem}>
                    <Text style={styles.productDetailLabel}>Unit</Text>
                    <Text style={styles.productDetailValue}>{product.unit}</Text>
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
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
      
      {/* Floating Action Button */}
      {products.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={handleAddProduct}>
          <Plus size={24} color={colors.background} />
        </TouchableOpacity>
      )}
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
    searchButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.background,
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
    productName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      marginRight: 12,
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