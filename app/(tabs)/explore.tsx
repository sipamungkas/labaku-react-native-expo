import React, { useState, useMemo } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Dimensions } from 'react-native';
import {
  LineChart,
  PieChart,
  BarChart,
} from 'react-native-chart-kit';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useBusinessStore } from '@/lib/stores/businessStore';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

const screenWidth = Dimensions.get('window').width;

const COLORS = ['#10B981', '#059669', '#047857', '#065F46', '#064E3B'];

type ReportPeriod = '7d' | '30d' | '3m' | '1y';

export default function TabTwoScreen() {
  const colorScheme = useColorScheme();
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('30d');
  const { products, transactions, stockSummary, getStock } = useBusinessStore();



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

  return (
    <ScrollView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">Reports & Analytics</ThemedText>
        <ThemedText style={styles.subtitle}>Business performance insights</ThemedText>
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

      {/* Revenue Chart */}
      <ThemedView style={styles.chartContainer}>
        <ThemedText style={styles.chartTitle}>Revenue Trend</ThemedText>
        {revenueData.datasets[0].data.some(val => val > 0) ? (
          <LineChart
            data={revenueData}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: Colors[colorScheme ?? 'light'].card,
              backgroundGradientFrom: Colors[colorScheme ?? 'light'].card,
              backgroundGradientTo: Colors[colorScheme ?? 'light'].card,
              decimalPlaces: 0,
              color: (opacity = 1) => Colors[colorScheme ?? 'light'].primary,
              labelColor: (opacity = 1) => Colors[colorScheme ?? 'light'].text,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: "6",
                strokeWidth: "2",
                stroke: Colors[colorScheme ?? 'light'].primary
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
            <ThemedText style={styles.noDataText}>No revenue data for this period</ThemedText>
          </View>
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
