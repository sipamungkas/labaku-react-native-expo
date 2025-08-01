import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Share,
} from 'react-native';
import {
  TrendingUp,
  Package,
  DollarSign,
  Users,
  BarChart3,
  PieChart,
  Download,
  Star,
  Clock,
  ShoppingCart,
} from 'lucide-react-native';
import { LineChart, BarChart, PieChart as RNPieChart } from 'react-native-chart-kit';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useBusinessStore, Vendor, Product } from '@/lib/stores/businessStore';
import { useSubscriptionTier } from '@/lib/stores/authStore';
import { format, parseISO, subDays, isWithinInterval } from 'date-fns';

type PeriodOption = '7d' | '30d' | '3m' | '1y';
type MetricType = 'purchases' | 'products' | 'performance' | 'trends';

interface VendorMetrics {
  vendor: Vendor;
  totalPurchases: number;
  totalAmount: number;
  productCount: number;
  averageOrderValue: number;
  lastOrderDate: string | null;
  daysSinceLastOrder: number;
  purchaseFrequency: number;
  topProducts: {
    product: Product;
    quantity: number;
    amount: number;
  }[];
  monthlyTrend: {
    month: string;
    amount: number;
    orders: number;
  }[];
  performanceScore: number;
}

export default function VendorAnalytics() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { vendors, products, transactions } = useBusinessStore();
  const { isPremium } = useSubscriptionTier();
  
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('30d');
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('performance');
  const [selectedVendor, setSelectedVendor] = useState<string | null>(null);

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 40;

  const periodDays = useMemo(() => ({
    '7d': 7,
    '30d': 30,
    '3m': 90,
    '1y': 365,
  }), []);

  const vendorMetrics = useMemo(() => {
    const now = new Date();
    const periodStart = subDays(now, periodDays[selectedPeriod]);
    
    return vendors.map(vendor => {
      const vendorProducts = products.filter(p => p.vendorId === vendor.id);
      const vendorTransactions = transactions.filter(t => {
        const product = products.find(p => p.id === t.productId);
        const transactionDate = parseISO(t.createdAt);
        return product?.vendorId === vendor.id && 
               t.type === 'purchase' &&
               isWithinInterval(transactionDate, { start: periodStart, end: now });
      });

      const totalAmount = vendorTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
      const totalPurchases = vendorTransactions.length;
      const averageOrderValue = totalPurchases > 0 ? totalAmount / totalPurchases : 0;
      
      const lastTransaction = vendorTransactions
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      
      const daysSinceLastOrder = lastTransaction 
        ? Math.floor((now.getTime() - parseISO(lastTransaction.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        : Infinity;
      
      const purchaseFrequency = totalPurchases / periodDays[selectedPeriod];
      
      // Top products by quantity
      const productStats = vendorProducts.map(product => {
        const productTransactions = vendorTransactions.filter(t => t.productId === product.id);
        const quantity = productTransactions.reduce((sum, t) => sum + t.quantity, 0);
        const amount = productTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
        return { product, quantity, amount };
      }).sort((a, b) => b.quantity - a.quantity).slice(0, 3);

      // Monthly trend (last 6 months)
      const monthlyTrend = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = subDays(now, i * 30);
        const monthEnd = subDays(now, (i - 1) * 30);
        const monthTransactions = vendorTransactions.filter(t => {
          const date = parseISO(t.createdAt);
          return isWithinInterval(date, { start: monthStart, end: monthEnd });
        });
        
        monthlyTrend.push({
          month: format(monthStart, 'MMM'),
          amount: monthTransactions.reduce((sum, t) => sum + t.totalAmount, 0),
          orders: monthTransactions.length,
        });
      }

      // Performance score (0-100)
      let performanceScore = 0;
      if (totalAmount > 0) performanceScore += 30;
      if (daysSinceLastOrder < 30) performanceScore += 25;
      if (purchaseFrequency > 0.1) performanceScore += 20;
      if (vendorProducts.length > 2) performanceScore += 15;
      if (averageOrderValue > 100000) performanceScore += 10;

      return {
        vendor,
        totalPurchases,
        totalAmount,
        productCount: vendorProducts.length,
        averageOrderValue,
        lastOrderDate: lastTransaction?.createdAt || null,
        daysSinceLastOrder,
        purchaseFrequency,
        topProducts: productStats,
        monthlyTrend,
        performanceScore,
      } as VendorMetrics;
    }).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [vendors, products, transactions, selectedPeriod, periodDays]);

  const topVendors = vendorMetrics.slice(0, 5);

  const exportVendorReport = async () => {
    if (!isPremium) {
      Alert.alert(
        'Premium Feature',
        'Export functionality is available for Premium users only.',
        [{ text: 'OK' }]
      );
      return;
    }

    const reportData = vendorMetrics.map(vm => ({
      vendor: vm.vendor.name,
      totalPurchases: vm.totalPurchases,
      totalAmount: vm.totalAmount,
      productCount: vm.productCount,
      averageOrderValue: vm.averageOrderValue,
      daysSinceLastOrder: vm.daysSinceLastOrder,
      performanceScore: vm.performanceScore,
    }));

    const csvContent = [
      'Vendor,Total Purchases,Total Amount,Product Count,Average Order Value,Days Since Last Order,Performance Score',
      ...reportData.map(row => 
        `${row.vendor},${row.totalPurchases},${row.totalAmount},${row.productCount},${row.averageOrderValue},${row.daysSinceLastOrder},${row.performanceScore}`
      )
    ].join('\n');

    try {
      await Share.share({
        message: `Vendor Performance Report (${selectedPeriod})\n\n${csvContent}`,
        title: 'Vendor Performance Report',
      });
    } catch {
      Alert.alert('Error', 'Failed to export report');
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return colors.success;
    if (score >= 60) return colors.warning;
    return colors.error;
  };

  const formatCurrency = (amount: number) => {
    return `Rp ${amount.toLocaleString('id-ID')}`;
  };

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => colors.text,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: colors.primary,
    },
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Vendor Analytics</Text>
          {isPremium && (
            <TouchableOpacity style={styles.exportButton} onPress={exportVendorReport}>
              <Download size={16} color={colors.primary} />
              <Text style={styles.exportButtonText}>Export</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Period Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodSelector}>
          {[
            { key: '7d', label: '7 Days' },
            { key: '30d', label: '30 Days' },
            { key: '3m', label: '3 Months' },
            { key: '1y', label: '1 Year' },
          ].map(period => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period.key as PeriodOption)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period.key && styles.periodButtonTextActive,
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Metric Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.metricSelector}>
          {[
            { key: 'performance', label: 'Performance', icon: Star },
            { key: 'purchases', label: 'Purchases', icon: ShoppingCart },
            { key: 'products', label: 'Products', icon: Package },
            { key: 'trends', label: 'Trends', icon: TrendingUp },
          ].map(metric => {
            const IconComponent = metric.icon;
            return (
              <TouchableOpacity
                key={metric.key}
                style={[
                  styles.metricButton,
                  selectedMetric === metric.key && styles.metricButtonActive,
                ]}
                onPress={() => setSelectedMetric(metric.key as MetricType)}
              >
                <IconComponent 
                  size={16} 
                  color={selectedMetric === metric.key ? colors.background : colors.textSecondary} 
                />
                <Text
                  style={[
                    styles.metricButtonText,
                    selectedMetric === metric.key && styles.metricButtonTextActive,
                  ]}
                >
                  {metric.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overview Cards */}
        <View style={styles.overviewContainer}>
          <View style={styles.overviewCard}>
            <Users size={20} color={colors.primary} />
            <Text style={styles.overviewLabel}>Active Vendors</Text>
            <Text style={styles.overviewValue}>{vendorMetrics.filter(v => v.totalPurchases > 0).length}</Text>
          </View>
          
          <View style={styles.overviewCard}>
            <DollarSign size={20} color={colors.success} />
            <Text style={styles.overviewLabel}>Total Purchases</Text>
            <Text style={styles.overviewValue}>
              {formatCurrency(vendorMetrics.reduce((sum, v) => sum + v.totalAmount, 0))}
            </Text>
          </View>
          
          <View style={styles.overviewCard}>
            <Package size={20} color={colors.warning} />
            <Text style={styles.overviewLabel}>Avg Performance</Text>
            <Text style={styles.overviewValue}>
              {Math.round(vendorMetrics.reduce((sum, v) => sum + v.performanceScore, 0) / vendorMetrics.length || 0)}%
            </Text>
          </View>
        </View>

        {/* Performance Chart */}
        {selectedMetric === 'performance' && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Vendor Performance Scores</Text>
            {topVendors.length > 0 ? (
              <BarChart
                data={{
                  labels: topVendors.map(v => v.vendor.name.substring(0, 8)),
                  datasets: [{
                    data: topVendors.map(v => v.performanceScore),
                  }],
                }}
                width={chartWidth}
                height={220}
                chartConfig={chartConfig}
                style={styles.chart}
                showValuesOnTopOfBars
              />
            ) : (
              <View style={styles.emptyChart}>
                <BarChart3 size={48} color={colors.textSecondary} />
                <Text style={styles.emptyChartText}>No performance data available</Text>
              </View>
            )}
          </View>
        )}

        {/* Purchase Trends Chart */}
        {selectedMetric === 'trends' && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Purchase Trends (Top Vendor)</Text>
            {topVendors.length > 0 && topVendors[0].monthlyTrend.some(m => m.amount > 0) ? (
              <LineChart
                data={{
                  labels: topVendors[0].monthlyTrend.map(m => m.month),
                  datasets: [{
                    data: topVendors[0].monthlyTrend.map(m => m.amount || 0),
                  }],
                }}
                width={chartWidth}
                height={220}
                chartConfig={chartConfig}
                style={styles.chart}
                bezier
              />
            ) : (
              <View style={styles.emptyChart}>
                <TrendingUp size={48} color={colors.textSecondary} />
                <Text style={styles.emptyChartText}>No trend data available</Text>
              </View>
            )}
          </View>
        )}

        {/* Purchase Distribution */}
        {selectedMetric === 'purchases' && (
          <View style={styles.chartContainer}>
            <Text style={styles.chartTitle}>Purchase Distribution</Text>
            {topVendors.length > 0 && topVendors.some(v => v.totalAmount > 0) ? (
              <RNPieChart
                data={topVendors.filter(v => v.totalAmount > 0).map((vendor, index) => ({
                  name: vendor.vendor.name,
                  population: vendor.totalAmount,
                  color: `hsl(${(index * 360) / topVendors.length}, 70%, 50%)`,
                  legendFontColor: colors.text,
                  legendFontSize: 12,
                }))}
                width={chartWidth}
                height={220}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                style={styles.chart}
              />
            ) : (
              <View style={styles.emptyChart}>
                <PieChart size={48} color={colors.textSecondary} />
                <Text style={styles.emptyChartText}>No purchase data available</Text>
              </View>
            )}
          </View>
        )}

        {/* Vendor List */}
        <View style={styles.vendorListContainer}>
          <Text style={styles.sectionTitle}>Vendor Performance</Text>
          {vendorMetrics.length === 0 ? (
            <View style={styles.emptyState}>
              <Users size={64} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>No vendors found</Text>
              <Text style={styles.emptyDescription}>
                Add vendors to see their performance analytics
              </Text>
            </View>
          ) : (
            vendorMetrics.map(vendorData => (
              <TouchableOpacity
                key={vendorData.vendor.id}
                style={[
                  styles.vendorCard,
                  selectedVendor === vendorData.vendor.id && styles.vendorCardSelected,
                ]}
                onPress={() => setSelectedVendor(
                  selectedVendor === vendorData.vendor.id ? null : vendorData.vendor.id
                )}
              >
                <View style={styles.vendorHeader}>
                  <View style={styles.vendorInfo}>
                    <Text style={styles.vendorName}>{vendorData.vendor.name}</Text>
                    <Text style={styles.vendorContact}>{vendorData.vendor.contact}</Text>
                  </View>
                  
                  <View style={styles.vendorMetrics}>
                    <View style={[
                      styles.performanceScore,
                      { backgroundColor: getPerformanceColor(vendorData.performanceScore) + '20' }
                    ]}>
                      <Text style={[
                        styles.performanceScoreText,
                        { color: getPerformanceColor(vendorData.performanceScore) }
                      ]}>
                        {vendorData.performanceScore}%
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.vendorStats}>
                  <View style={styles.statItem}>
                    <ShoppingCart size={14} color={colors.textSecondary} />
                    <Text style={styles.statLabel}>Purchases</Text>
                    <Text style={styles.statValue}>{vendorData.totalPurchases}</Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <DollarSign size={14} color={colors.textSecondary} />
                    <Text style={styles.statLabel}>Total</Text>
                    <Text style={styles.statValue}>{formatCurrency(vendorData.totalAmount)}</Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Package size={14} color={colors.textSecondary} />
                    <Text style={styles.statLabel}>Products</Text>
                    <Text style={styles.statValue}>{vendorData.productCount}</Text>
                  </View>
                  
                  <View style={styles.statItem}>
                    <Clock size={14} color={colors.textSecondary} />
                    <Text style={styles.statLabel}>Last Order</Text>
                    <Text style={styles.statValue}>
                      {vendorData.daysSinceLastOrder === Infinity 
                        ? 'Never' 
                        : `${vendorData.daysSinceLastOrder}d ago`}
                    </Text>
                  </View>
                </View>

                {/* Expanded Details */}
                {selectedVendor === vendorData.vendor.id && (
                  <View style={styles.vendorDetails}>
                    <View style={styles.detailSection}>
                      <Text style={styles.detailTitle}>Top Products</Text>
                      {vendorData.topProducts.length > 0 ? (
                        vendorData.topProducts.map(productData => (
                          <View key={productData.product.id} style={styles.productItem}>
                            <Text style={styles.productName}>{productData.product.name}</Text>
                            <Text style={styles.productStats}>
                              {productData.quantity} units • {formatCurrency(productData.amount)}
                            </Text>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.noDataText}>No products purchased</Text>
                      )}
                    </View>
                    
                    <View style={styles.detailSection}>
                      <Text style={styles.detailTitle}>Key Metrics</Text>
                      <View style={styles.metricsGrid}>
                        <View style={styles.metricItem}>
                          <Text style={styles.metricLabel}>Avg Order Value</Text>
                          <Text style={styles.metricValue}>
                            {formatCurrency(vendorData.averageOrderValue)}
                          </Text>
                        </View>
                        <View style={styles.metricItem}>
                          <Text style={styles.metricLabel}>Purchase Frequency</Text>
                          <Text style={styles.metricValue}>
                            {vendorData.purchaseFrequency.toFixed(2)}/day
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
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
    exportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    exportButtonText: {
      color: colors.primary,
      fontWeight: '500',
      fontSize: 14,
    },
    periodSelector: {
      marginBottom: 12,
    },
    periodButton: {
      backgroundColor: colors.background,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    periodButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    periodButtonText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    periodButtonTextActive: {
      color: colors.background,
    },
    metricSelector: {
      marginTop: 8,
    },
    metricButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 16,
      marginRight: 8,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 6,
    },
    metricButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    metricButtonText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    metricButtonTextActive: {
      color: colors.background,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    overviewContainer: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 24,
    },
    overviewCard: {
      flex: 1,
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    overviewLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 8,
      marginBottom: 4,
      textAlign: 'center',
    },
    overviewValue: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      textAlign: 'center',
    },
    chartContainer: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chartTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    chart: {
      borderRadius: 8,
    },
    emptyChart: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyChartText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 12,
    },
    vendorListContainer: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
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
    vendorCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    vendorCardSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primary + '05',
    },
    vendorHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    vendorInfo: {
      flex: 1,
    },
    vendorName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    vendorContact: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    vendorMetrics: {
      alignItems: 'flex-end',
    },
    performanceScore: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    performanceScoreText: {
      fontSize: 12,
      fontWeight: '600',
    },
    vendorStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      marginTop: 2,
      marginBottom: 2,
    },
    statValue: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.text,
    },
    vendorDetails: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    detailSection: {
      marginBottom: 16,
    },
    detailTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    productItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
    },
    productName: {
      fontSize: 12,
      color: colors.text,
      flex: 1,
    },
    productStats: {
      fontSize: 10,
      color: colors.textSecondary,
    },
    noDataText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    metricsGrid: {
      flexDirection: 'row',
      gap: 16,
    },
    metricItem: {
      flex: 1,
    },
    metricLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    metricValue: {
      fontSize: 12,
      fontWeight: '500',
      color: colors.text,
    },
  });
}