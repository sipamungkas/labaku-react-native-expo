import React, { useState, useMemo } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Dimensions, Alert, Share } from 'react-native';
import {
  LineChart,
  PieChart,
  BarChart,
} from 'react-native-chart-kit';
import { Download, TrendingUp, Users, Package2, DollarSign } from 'lucide-react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useBusinessStore } from '@/lib/stores/businessStore';
import { useSubscriptionTier } from '@/lib/stores/authStore';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, compareAsc } from 'date-fns';

const screenWidth = Dimensions.get('window').width;

const COLORS = ['#10B981', '#059669', '#047857', '#065F46', '#064E3B'];

type ReportPeriod = '7d' | '30d' | '3m' | '1y';

export default function TabTwoScreen() {
  const colorScheme = useColorScheme();
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('30d');
  const [selectedChart, setSelectedChart] = useState<'revenue' | 'profit' | 'vendors'>('revenue');
  const { products, transactions, vendors, stockSummary, getStock } = useBusinessStore();
  const tier = useSubscriptionTier();
  const isPremium = tier === 'premium';



  const getDateRange = (period: ReportPeriod) => {
    const now = new Date();
    switch (period) {
      case '7d':
        return { start: subDays(now, 7), end: now };
      case '30d':
        return { start: subDays(now, 30), end: now };
      case '3m':
        return { start: subDays(now, 90), end: now };
      case '1y':
        return { start: subDays(now, 365), end: now };
      default:
        return { start: subDays(now, 30), end: now };
    }
  };

  const filteredTransactions = useMemo(() => {
    const { start, end } = getDateRange(selectedPeriod);
    return transactions.filter(t => {
      const transactionDate = new Date(t.createdAt);
      return transactionDate >= start && transactionDate <= end;
    });
  }, [transactions, selectedPeriod]);

  const revenueData = useMemo(() => {
    const { start, end } = getDateRange(selectedPeriod);
    const days = eachDayOfInterval({ start, end });
    
    const dailyRevenue = days.map(day => {
      const dayTransactions = filteredTransactions.filter(t => 
        format(new Date(t.createdAt), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd') &&
        t.type === 'sale'
      );
      return dayTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
    });

    return {
      labels: days.map(day => format(day, selectedPeriod === '7d' ? 'EEE' : 'dd')),
      datasets: [{
        data: dailyRevenue.length > 0 ? dailyRevenue : [0],
      }],
    };
  }, [filteredTransactions, selectedPeriod]);

  const profitData = useMemo(() => {
    const { start, end } = getDateRange(selectedPeriod);
    const days = eachDayOfInterval({ start, end });
    
    const dailyProfit = days.map(day => {
      const dayTransactions = filteredTransactions.filter(t => 
        format(new Date(t.createdAt), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      );
      const revenue = dayTransactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.totalAmount, 0);
      const expenses = dayTransactions.filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.totalAmount, 0);
      return revenue - expenses;
    });

    return {
      labels: days.map(day => format(day, selectedPeriod === '7d' ? 'EEE' : 'dd')),
      datasets: [{
        data: dailyProfit.length > 0 ? dailyProfit : [0],
      }],
    };
  }, [filteredTransactions, selectedPeriod]);

  const vendorPerformanceData = useMemo(() => {
    const vendorTotals = filteredTransactions
      .filter(t => t.type === 'purchase')
      .reduce((acc, t) => {
        const product = products.find(p => p.id === t.productId);
        const vendor = vendors.find(v => v.id === product?.vendorId);
        const vendorName = vendor?.name || 'Unknown';
        acc[vendorName] = (acc[vendorName] || 0) + t.totalAmount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(vendorTotals)
      .map(([name, amount], index) => ({
        name: name.length > 10 ? name.substring(0, 10) + '...' : name,
        amount,
        color: COLORS[index % COLORS.length],
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [filteredTransactions, products, vendors]);

  const categoryData = useMemo(() => {
    const categoryTotals = filteredTransactions
      .filter(t => t.type === 'purchase')
      .reduce((acc, t) => {
        const product = products.find(p => p.id === t.productId);
        const category = product?.category || 'Other';
        acc[category] = (acc[category] || 0) + t.totalAmount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(categoryTotals)
      .map(([name, amount], index) => ({
        name,
        amount,
        color: COLORS[index % COLORS.length],
      }))
      .slice(0, 5); // Top 5 categories
  }, [filteredTransactions, products]);

  const totalRevenue = filteredTransactions
    .filter(t => t.type === 'sale')
    .reduce((sum, t) => sum + t.totalAmount, 0);

  const totalExpenses = filteredTransactions
    .filter(t => t.type === 'purchase')
    .reduce((sum, t) => sum + t.totalAmount, 0);

  const profit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  const periods: { key: ReportPeriod; label: string }[] = [
    { key: '7d', label: '7 Days' },
    { key: '30d', label: '30 Days' },
    { key: '3m', label: '3 Months' },
    { key: '1y', label: '1 Year' },
  ];

  const chartTypes = [
    { key: 'revenue' as const, label: 'Revenue', icon: DollarSign },
    { key: 'profit' as const, label: 'Profit', icon: TrendingUp },
    { key: 'vendors' as const, label: 'Vendors', icon: Users },
  ];

  const exportData = async () => {
    if (!isPremium) {
      Alert.alert(
        'Premium Feature',
        'Data export is available for Premium users only. Upgrade to access this feature.',
        [{ text: 'OK' }]
      );
      return;
    }

    const reportData = {
      period: selectedPeriod,
      totalRevenue,
      totalExpenses,
      profit,
      profitMargin: profitMargin.toFixed(1) + '%',
      generatedAt: new Date().toISOString(),
    };

    const csvContent = `Period,Total Revenue,Total Expenses,Net Profit,Profit Margin,Generated At\n${selectedPeriod},${totalRevenue},${totalExpenses},${profit},${profitMargin.toFixed(1)}%,${new Date().toLocaleDateString()}`;

    try {
      await Share.share({
        message: `Labaku Business Report\n\nPeriod: ${selectedPeriod}\nTotal Revenue: $${totalRevenue.toLocaleString()}\nTotal Expenses: $${totalExpenses.toLocaleString()}\nNet Profit: $${profit.toLocaleString()}\nProfit Margin: ${profitMargin.toFixed(1)}%\n\nGenerated on ${new Date().toLocaleDateString()}`,
        title: 'Business Report Export',
      });
    } catch (error) {
      Alert.alert('Export Error', 'Failed to export data. Please try again.');
    }
  };

  const getCurrentChartData = () => {
    switch (selectedChart) {
      case 'revenue':
        return revenueData;
      case 'profit':
        return profitData;
      case 'vendors':
        return vendorPerformanceData;
      default:
        return revenueData;
    }
  };

  const getChartTitle = () => {
    switch (selectedChart) {
      case 'revenue':
        return 'Revenue Trend';
      case 'profit':
        return 'Profit Trend';
      case 'vendors':
        return 'Top Vendors by Purchase Volume';
      default:
        return 'Revenue Trend';
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <ThemedView style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <ThemedText type="title">Reports & Analytics</ThemedText>
            <ThemedText style={styles.subtitle}>Business performance insights</ThemedText>
          </View>
          <TouchableOpacity
            style={[styles.exportButton, { backgroundColor: isPremium ? Colors[colorScheme ?? 'light'].primary : Colors[colorScheme ?? 'light'].border }]}
            onPress={exportData}
          >
            <Download size={16} color={isPremium ? '#FFFFFF' : Colors[colorScheme ?? 'light'].textSecondary} />
            <ThemedText style={[styles.exportButtonText, { color: isPremium ? '#FFFFFF' : Colors[colorScheme ?? 'light'].textSecondary }]}>
              Export
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>

      {/* Period Selector */}
      <ThemedView style={styles.periodSelector}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period.key}
            style={[
              styles.periodButton,
              {
                backgroundColor: selectedPeriod === period.key 
                  ? Colors[colorScheme ?? 'light'].primary 
                  : Colors[colorScheme ?? 'light'].card,
              },
            ]}
            onPress={() => setSelectedPeriod(period.key)}
          >
            <ThemedText
              style={[
                styles.periodButtonText,
                {
                  color: selectedPeriod === period.key 
                    ? '#FFFFFF' 
                    : Colors[colorScheme ?? 'light'].text,
                },
              ]}
            >
              {period.label}
            </ThemedText>
          </TouchableOpacity>
        ))}
      </ThemedView>

      {/* Chart Type Selector */}
      <ThemedView style={styles.chartTypeSelector}>
        {chartTypes.map((chart) => {
          const IconComponent = chart.icon;
          return (
            <TouchableOpacity
              key={chart.key}
              style={[
                styles.chartTypeButton,
                {
                  backgroundColor: selectedChart === chart.key 
                    ? Colors[colorScheme ?? 'light'].primary + '20' 
                    : Colors[colorScheme ?? 'light'].card,
                  borderColor: selectedChart === chart.key 
                    ? Colors[colorScheme ?? 'light'].primary 
                    : Colors[colorScheme ?? 'light'].border,
                },
              ]}
              onPress={() => setSelectedChart(chart.key)}
            >
              <IconComponent 
                size={16} 
                color={selectedChart === chart.key 
                  ? Colors[colorScheme ?? 'light'].primary 
                  : Colors[colorScheme ?? 'light'].textSecondary
                } 
              />
              <ThemedText
                style={[
                  styles.chartTypeButtonText,
                  {
                    color: selectedChart === chart.key 
                      ? Colors[colorScheme ?? 'light'].primary 
                      : Colors[colorScheme ?? 'light'].text,
                  },
                ]}
              >
                {chart.label}
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </ThemedView>

      {/* Key Metrics */}
      <ThemedView style={styles.metricsContainer}>
        <View style={[styles.metricCard, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
          <ThemedText style={styles.metricLabel}>Total Revenue</ThemedText>
          <ThemedText style={[styles.metricValue, { color: Colors[colorScheme ?? 'light'].primary }]}>
            ${totalRevenue.toLocaleString()}
          </ThemedText>
        </View>
        <View style={[styles.metricCard, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
          <ThemedText style={styles.metricLabel}>Total Expenses</ThemedText>
          <ThemedText style={[styles.metricValue, { color: '#FF6B6B' }]}>
            ${totalExpenses.toLocaleString()}
          </ThemedText>
        </View>
        <View style={[styles.metricCard, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
          <ThemedText style={styles.metricLabel}>Net Profit</ThemedText>
          <ThemedText style={[styles.metricValue, { color: profit >= 0 ? Colors[colorScheme ?? 'light'].primary : '#FF6B6B' }]}>
            ${profit.toLocaleString()}
          </ThemedText>
        </View>
        <View style={[styles.metricCard, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
          <ThemedText style={styles.metricLabel}>Profit Margin</ThemedText>
          <ThemedText style={[styles.metricValue, { color: profitMargin >= 0 ? Colors[colorScheme ?? 'light'].primary : '#FF6B6B' }]}>
            {profitMargin.toFixed(1)}%
          </ThemedText>
        </View>
      </ThemedView>

      {/* Dynamic Chart */}
      <ThemedView style={styles.chartContainer}>
        <ThemedText style={styles.chartTitle}>{getChartTitle()}</ThemedText>
        {selectedChart === 'vendors' ? (
          vendorPerformanceData.length > 0 ? (
            <PieChart
              data={vendorPerformanceData}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                color: (opacity = 1) => Colors[colorScheme ?? 'light'].primary,
                labelColor: (opacity = 1) => Colors[colorScheme ?? 'light'].text,
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 50]}
              absolute
            />
          ) : (
            <View style={styles.noDataContainer}>
              <ThemedText style={styles.noDataText}>No vendor data for this period</ThemedText>
            </View>
          )
        ) : (
          'datasets' in getCurrentChartData() && (getCurrentChartData() as any).datasets[0].data.some((val: number) => val > 0) ? (
            <LineChart
              data={getCurrentChartData() as any}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                backgroundColor: Colors[colorScheme ?? 'light'].card,
                backgroundGradientFrom: Colors[colorScheme ?? 'light'].card,
                backgroundGradientTo: Colors[colorScheme ?? 'light'].card,
                decimalPlaces: 0,
                color: (opacity = 1) => selectedChart === 'profit' 
                  ? ('datasets' in getCurrentChartData() && (getCurrentChartData() as any).datasets[0].data.some((val: number) => val < 0) ? '#FF6B6B' : Colors[colorScheme ?? 'light'].primary)
                  : Colors[colorScheme ?? 'light'].primary,
                labelColor: (opacity = 1) => Colors[colorScheme ?? 'light'].text,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: selectedChart === 'profit' 
                    ? ('datasets' in getCurrentChartData() && (getCurrentChartData() as any).datasets[0].data.some((val: number) => val < 0) ? '#FF6B6B' : Colors[colorScheme ?? 'light'].primary)
                    : Colors[colorScheme ?? 'light'].primary
                }
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
            />
          ) : (
            <View style={styles.noDataContainer}>
              <ThemedText style={styles.noDataText}>No {selectedChart} data for this period</ThemedText>
            </View>
          )
        )}
      </ThemedView>

      {/* Expense Categories */}
      {categoryData.length > 0 && (
        <ThemedView style={styles.chartContainer}>
          <ThemedText style={styles.chartTitle}>Top Expense Categories</ThemedText>
          <PieChart
            data={categoryData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              color: (opacity = 1) => Colors[colorScheme ?? 'light'].primary,
              labelColor: (opacity = 1) => Colors[colorScheme ?? 'light'].text,
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
            center={[10, 50]}
            absolute
          />
        </ThemedView>
      )}

      {/* Product Performance */}
      <ThemedView style={styles.chartContainer}>
        <ThemedText style={styles.chartTitle}>Product Inventory Status</ThemedText>
        <View style={styles.productStats}>
          <View style={[styles.statItem, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
            <ThemedText style={styles.statLabel}>Total Products</ThemedText>
            <ThemedText style={[styles.statValue, { color: Colors[colorScheme ?? 'light'].primary }]}>
              {products.length}
            </ThemedText>
          </View>
          <View style={[styles.statItem, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
            <ThemedText style={styles.statLabel}>Low Stock</ThemedText>
            <ThemedText style={[styles.statValue, { color: '#FF6B6B' }]}>
              {products.filter(p => getStock(p.id) <= 10).length}
            </ThemedText>
          </View>
          <View style={[styles.statItem, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
            <ThemedText style={styles.statLabel}>Out of Stock</ThemedText>
            <ThemedText style={[styles.statValue, { color: '#FF6B6B' }]}>
              {products.filter(p => getStock(p.id) === 0).length}
            </ThemedText>
          </View>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  subtitle: {
    opacity: 0.7,
    marginTop: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chartTypeSelector: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 8,
  },
  chartTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  chartTypeButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chartContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 12,
  },
  noDataContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    opacity: 0.5,
  },
  productStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
