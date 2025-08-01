import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import {
  TrendingUp,
  TrendingDown,
  Package,
  DollarSign,
  Users,
  Calendar,
  BarChart3,
  PieChart,
  Download,
  Star,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Award,
} from 'lucide-react-native';
import { LineChart, BarChart, PieChart as RNPieChart } from 'react-native-chart-kit';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useBusinessStore } from '@/lib/stores/businessStore';
import { useSubscriptionTier } from '@/lib/stores/authStore';
import { format, parseISO, subDays, isWithinInterval, startOfDay, endOfDay, differenceInDays } from 'date-fns';
import { Share } from 'react-native';

type InsightCategory = 'overview' | 'performance' | 'trends' | 'recommendations';
type TimeFrame = '7d' | '30d' | '3m' | '6m' | '1y';

interface BusinessMetric {
  label: string;
  value: string | number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
  icon: any;
}

interface Insight {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  description: string;
  action?: string;
  priority: 'high' | 'medium' | 'low';
}

interface Recommendation {
  id: string;
  category: 'inventory' | 'sales' | 'vendor' | 'financial';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  priority: number;
}

export default function BusinessInsights() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { products, vendors, transactions, getStock } = useBusinessStore();
  const tier = useSubscriptionTier();
  const isPremium = tier === 'premium';
  
  const [selectedCategory, setSelectedCategory] = useState<InsightCategory>('overview');
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>('30d');

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 40;

  const timeFrameDays = {
    '7d': 7,
    '30d': 30,
    '3m': 90,
    '6m': 180,
    '1y': 365,
  };

  const businessMetrics = useMemo(() => {
    const now = new Date();
    const currentPeriodStart = subDays(now, timeFrameDays[selectedTimeFrame]);
    const previousPeriodStart = subDays(currentPeriodStart, timeFrameDays[selectedTimeFrame]);
    
    // Current period transactions
    const currentTransactions = transactions.filter(t => {
      const date = parseISO(t.createdAt);
      return isWithinInterval(date, { start: currentPeriodStart, end: now });
    });
    
    // Previous period transactions
    const previousTransactions = transactions.filter(t => {
      const date = parseISO(t.createdAt);
      return isWithinInterval(date, { start: previousPeriodStart, end: currentPeriodStart });
    });
    
    const currentSales = currentTransactions.filter(t => t.type === 'sale');
    const currentPurchases = currentTransactions.filter(t => t.type === 'purchase');
    const previousSales = previousTransactions.filter(t => t.type === 'sale');
    const previousPurchases = previousTransactions.filter(t => t.type === 'purchase');
    
    const currentRevenue = currentSales.reduce((sum, t) => sum + t.totalAmount, 0);
    const currentCosts = currentPurchases.reduce((sum, t) => sum + t.totalAmount, 0);
    const currentProfit = currentRevenue - currentCosts;
    
    const previousRevenue = previousSales.reduce((sum, t) => sum + t.totalAmount, 0);
    const previousCosts = previousPurchases.reduce((sum, t) => sum + t.totalAmount, 0);
    const previousProfit = previousRevenue - previousCosts;
    
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };
    
    const getTrend = (change: number): 'up' | 'down' | 'stable' => {
      if (Math.abs(change) < 5) return 'stable';
      return change > 0 ? 'up' : 'down';
    };
    
    const lowStockProducts = products.filter(p => getStock(p.id) <= 10); // Using threshold of 10
    const activeVendors = vendors.filter(v => 
      currentTransactions.some(t => {
        const product = products.find(p => p.id === t.productId);
        return product?.vendorId === v.id;
      })
    );
    
    const metrics: BusinessMetric[] = [
      {
        label: 'Revenue',
        value: `Rp ${currentRevenue.toLocaleString('id-ID')}`,
        change: calculateChange(currentRevenue, previousRevenue),
        trend: getTrend(calculateChange(currentRevenue, previousRevenue)),
        color: colors.success,
        icon: DollarSign,
      },
      {
        label: 'Profit',
        value: `Rp ${currentProfit.toLocaleString('id-ID')}`,
        change: calculateChange(currentProfit, previousProfit),
        trend: getTrend(calculateChange(currentProfit, previousProfit)),
        color: currentProfit >= 0 ? colors.success : colors.error,
        icon: TrendingUp,
      },
      {
        label: 'Transactions',
        value: currentTransactions.length,
        change: calculateChange(currentTransactions.length, previousTransactions.length),
        trend: getTrend(calculateChange(currentTransactions.length, previousTransactions.length)),
        color: colors.primary,
        icon: BarChart3,
      },
      {
        label: 'Active Vendors',
        value: activeVendors.length,
        change: 0,
        trend: 'stable',
        color: colors.warning,
        icon: Users,
      },
      {
        label: 'Low Stock Items',
        value: lowStockProducts.length,
        change: 0,
        trend: lowStockProducts.length > 0 ? 'down' : 'stable',
        color: lowStockProducts.length > 0 ? colors.error : colors.success,
        icon: Package,
      },
      {
        label: 'Profit Margin',
        value: `${currentRevenue > 0 ? ((currentProfit / currentRevenue) * 100).toFixed(1) : 0}%`,
        change: calculateChange(
          currentRevenue > 0 ? (currentProfit / currentRevenue) * 100 : 0,
          previousRevenue > 0 ? (previousProfit / previousRevenue) * 100 : 0
        ),
        trend: getTrend(calculateChange(
          currentRevenue > 0 ? (currentProfit / currentRevenue) * 100 : 0,
          previousRevenue > 0 ? (previousProfit / previousRevenue) * 100 : 0
        )),
        color: colors.info,
        icon: Target,
      },
    ];
    
    return metrics;
  }, [transactions, products, vendors, selectedTimeFrame, colors]);

  const insights = useMemo(() => {
    const now = new Date();
    const insights: Insight[] = [];
    
    // Low stock alerts
    const lowStockProducts = products.filter(p => getStock(p.id) <= 10); // Using threshold of 10
    if (lowStockProducts.length > 0) {
      insights.push({
        id: 'low-stock',
        type: 'warning',
        title: `${lowStockProducts.length} products are low in stock`,
        description: `Products like ${lowStockProducts.slice(0, 2).map(p => p.name).join(', ')} need restocking.`,
        action: 'Restock now',
        priority: 'high',
      });
    }
    
    // Revenue trends
    const recentTransactions = transactions.filter(t => {
      const date = parseISO(t.createdAt);
      return isWithinInterval(date, { start: subDays(now, 7), end: now });
    });
    
    const weeklyRevenue = recentTransactions
      .filter(t => t.type === 'sale')
      .reduce((sum, t) => sum + t.totalAmount, 0);
    
    if (weeklyRevenue === 0) {
      insights.push({
        id: 'no-sales',
        type: 'error',
        title: 'No sales in the past week',
        description: 'Consider reviewing your marketing strategy or product offerings.',
        priority: 'high',
      });
    } else if (weeklyRevenue > 1000000) {
      insights.push({
        id: 'high-sales',
        type: 'success',
        title: 'Excellent sales performance!',
        description: `You've generated ${(weeklyRevenue / 1000000).toFixed(1)}M in revenue this week.`,
        priority: 'low',
      });
    }
    
    // Vendor performance
    const inactiveVendors = vendors.filter(vendor => {
      const lastTransaction = transactions
        .filter(t => {
          const product = products.find(p => p.id === t.productId);
          return product?.vendorId === vendor.id;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      
      if (!lastTransaction) return true;
      
      const daysSinceLastTransaction = differenceInDays(now, parseISO(lastTransaction.createdAt));
      return daysSinceLastTransaction > 30;
    });
    
    if (inactiveVendors.length > 0) {
      insights.push({
        id: 'inactive-vendors',
        type: 'info',
        title: `${inactiveVendors.length} vendors haven't been used recently`,
        description: 'Consider reviewing vendor relationships or removing inactive ones.',
        priority: 'medium',
      });
    }
    
    // Product diversity
    const activeProducts = products.filter(p => 
      recentTransactions.some(t => t.productId === p.id)
    );
    
    if (activeProducts.length < products.length * 0.5 && products.length > 5) {
      insights.push({
        id: 'product-diversity',
        type: 'warning',
        title: 'Low product diversity in sales',
        description: `Only ${activeProducts.length} out of ${products.length} products sold recently.`,
        priority: 'medium',
      });
    }
    
    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [transactions, products, vendors]);

  const recommendations = useMemo(() => {
    const recs: Recommendation[] = [];
    
    // Inventory recommendations
    const fastMovingProducts = products.filter(p => {
      const sales = transactions.filter(t => t.productId === p.id && t.type === 'sale');
      return sales.length > 5;
    });
    
    if (fastMovingProducts.length > 0) {
      recs.push({
        id: 'increase-fast-moving',
        category: 'inventory',
        title: 'Increase stock for fast-moving products',
        description: `Products like ${fastMovingProducts.slice(0, 2).map(p => p.name).join(', ')} are selling well. Consider increasing their stock levels.`,
        impact: 'high',
        effort: 'low',
        priority: 90,
      });
    }
    
    // Sales recommendations
    const lowPerformingProducts = products.filter(p => {
      const sales = transactions.filter(t => t.productId === p.id && t.type === 'sale');
      return sales.length === 0 && getStock(p.id) > 0;
    });
    
    if (lowPerformingProducts.length > 0) {
      recs.push({
        id: 'promote-slow-products',
        category: 'sales',
        title: 'Promote slow-moving products',
        description: `${lowPerformingProducts.length} products haven't sold. Consider promotions or bundling.`,
        impact: 'medium',
        effort: 'medium',
        priority: 70,
      });
    }
    
    // Vendor recommendations
    const topVendors = vendors.map(vendor => {
      const vendorTransactions = transactions.filter(t => {
        const product = products.find(p => p.id === t.productId);
        return product?.vendorId === vendor.id && t.type === 'purchase';
      });
      const totalAmount = vendorTransactions.reduce((sum, t) => sum + t.totalAmount, 0);
      return { vendor, totalAmount, transactionCount: vendorTransactions.length };
    }).sort((a, b) => b.totalAmount - a.totalAmount);
    
    if (topVendors.length > 0 && topVendors[0].totalAmount > 0) {
      recs.push({
        id: 'negotiate-top-vendor',
        category: 'vendor',
        title: 'Negotiate better terms with top vendor',
        description: `${topVendors[0].vendor.name} is your biggest supplier. Consider negotiating volume discounts.`,
        impact: 'high',
        effort: 'medium',
        priority: 85,
      });
    }
    
    // Financial recommendations
    const profitMargin = businessMetrics.find(m => m.label === 'Profit Margin');
    if (profitMargin && typeof profitMargin.value === 'string') {
      const margin = parseFloat(profitMargin.value.replace('%', ''));
      if (margin < 20) {
        recs.push({
          id: 'improve-margins',
          category: 'financial',
          title: 'Improve profit margins',
          description: `Current margin is ${margin.toFixed(1)}%. Consider optimizing pricing or reducing costs.`,
          impact: 'high',
          effort: 'high',
          priority: 80,
        });
      }
    }
    
    return recs.sort((a, b) => b.priority - a.priority);
  }, [products, transactions, vendors, businessMetrics]);

  const exportBusinessReport = async () => {
    if (!isPremium) {
      Alert.alert(
        'Premium Feature',
        'Business insights export is available for Premium users only.',
        [{ text: 'OK' }]
      );
      return;
    }

    const reportData = {
      period: selectedTimeFrame,
      generatedAt: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
      metrics: businessMetrics.map(m => ({
        label: m.label,
        value: m.value,
        change: `${m.change.toFixed(1)}%`,
        trend: m.trend,
      })),
      insights: insights.map(i => ({
        type: i.type,
        title: i.title,
        description: i.description,
        priority: i.priority,
      })),
      recommendations: recommendations.map(r => ({
        category: r.category,
        title: r.title,
        description: r.description,
        impact: r.impact,
        effort: r.effort,
      })),
    };

    try {
      await Share.share({
        message: `Business Insights Report\n\n${JSON.stringify(reportData, null, 2)}`,
        title: 'Business Insights Report',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export report');
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'error': return AlertTriangle;
      case 'info': return Zap;
      default: return Zap;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'success': return colors.success;
      case 'warning': return colors.warning;
      case 'error': return colors.error;
      case 'info': return colors.info;
      default: return colors.textSecondary;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'inventory': return Package;
      case 'sales': return TrendingUp;
      case 'vendor': return Users;
      case 'financial': return DollarSign;
      default: return Star;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return colors.success;
      case 'medium': return colors.warning;
      case 'low': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  const styles = createStyles(colors);

  if (!isPremium) {
    return (
      <View style={styles.premiumGate}>
        <Award size={64} color={colors.primary} />
        <Text style={styles.premiumTitle}>Business Insights</Text>
        <Text style={styles.premiumDescription}>
          Get detailed analytics, insights, and recommendations to grow your business.
        </Text>
        <Text style={styles.premiumFeatures}>
          • Advanced business metrics{"\n"}
          • AI-powered insights{"\n"}
          • Growth recommendations{"\n"}
          • Export capabilities
        </Text>
        <TouchableOpacity style={styles.upgradeButton}>
          <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Business Insights</Text>
          <TouchableOpacity style={styles.exportButton} onPress={exportBusinessReport}>
            <Download size={16} color={colors.primary} />
            <Text style={styles.exportButtonText}>Export</Text>
          </TouchableOpacity>
        </View>

        {/* Time Frame Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeFrameSelector}>
          {[
            { key: '7d', label: '7 Days' },
            { key: '30d', label: '30 Days' },
            { key: '3m', label: '3 Months' },
            { key: '6m', label: '6 Months' },
            { key: '1y', label: '1 Year' },
          ].map(timeFrame => (
            <TouchableOpacity
              key={timeFrame.key}
              style={[
                styles.timeFrameButton,
                selectedTimeFrame === timeFrame.key && styles.timeFrameButtonActive,
              ]}
              onPress={() => setSelectedTimeFrame(timeFrame.key as TimeFrame)}
            >
              <Text
                style={[
                  styles.timeFrameButtonText,
                  selectedTimeFrame === timeFrame.key && styles.timeFrameButtonTextActive,
                ]}
              >
                {timeFrame.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Category Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelector}>
          {[
            { key: 'overview', label: 'Overview', icon: BarChart3 },
            { key: 'performance', label: 'Performance', icon: TrendingUp },
            { key: 'trends', label: 'Trends', icon: Calendar },
            { key: 'recommendations', label: 'Recommendations', icon: Star },
          ].map(category => {
            const IconComponent = category.icon;
            return (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.key && styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(category.key as InsightCategory)}
              >
                <IconComponent 
                  size={16} 
                  color={selectedCategory === category.key ? colors.background : colors.textSecondary} 
                />
                <Text
                  style={[
                    styles.categoryButtonText,
                    selectedCategory === category.key && styles.categoryButtonTextActive,
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Overview */}
        {selectedCategory === 'overview' && (
          <>
            {/* Key Metrics */}
            <View style={styles.metricsGrid}>
              {businessMetrics.map((metric, index) => {
                const IconComponent = metric.icon;
                return (
                  <View key={index} style={styles.metricCard}>
                    <View style={styles.metricHeader}>
                      <IconComponent size={20} color={metric.color} />
                      <View style={[
                        styles.trendIndicator,
                        { backgroundColor: metric.color + '20' }
                      ]}>
                        {metric.trend === 'up' && <TrendingUp size={12} color={metric.color} />}
                        {metric.trend === 'down' && <TrendingDown size={12} color={metric.color} />}
                        {metric.trend === 'stable' && <Text style={[styles.trendText, { color: metric.color }]}>—</Text>}
                      </View>
                    </View>
                    <Text style={styles.metricLabel}>{metric.label}</Text>
                    <Text style={[styles.metricValue, { color: metric.color }]}>{metric.value}</Text>
                    {metric.change !== 0 && (
                      <Text style={[styles.metricChange, { color: metric.color }]}>
                        {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Quick Insights */}
            <View style={styles.insightsContainer}>
              <Text style={styles.sectionTitle}>Quick Insights</Text>
              {insights.slice(0, 3).map(insight => {
                const IconComponent = getInsightIcon(insight.type);
                return (
                  <View key={insight.id} style={styles.insightCard}>
                    <View style={styles.insightHeader}>
                      <IconComponent size={16} color={getInsightColor(insight.type)} />
                      <Text style={[styles.insightTitle, { color: getInsightColor(insight.type) }]}>
                        {insight.title}
                      </Text>
                    </View>
                    <Text style={styles.insightDescription}>{insight.description}</Text>
                    {insight.action && (
                      <TouchableOpacity style={styles.insightAction}>
                        <Text style={styles.insightActionText}>{insight.action}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* Recommendations */}
        {selectedCategory === 'recommendations' && (
          <View style={styles.recommendationsContainer}>
            <Text style={styles.sectionTitle}>Growth Recommendations</Text>
            {recommendations.map(rec => {
              const IconComponent = getCategoryIcon(rec.category);
              return (
                <View key={rec.id} style={styles.recommendationCard}>
                  <View style={styles.recommendationHeader}>
                    <View style={styles.recommendationIcon}>
                      <IconComponent size={16} color={colors.primary} />
                    </View>
                    <View style={styles.recommendationInfo}>
                      <Text style={styles.recommendationTitle}>{rec.title}</Text>
                      <Text style={styles.recommendationCategory}>{rec.category.toUpperCase()}</Text>
                    </View>
                    <View style={styles.recommendationMetrics}>
                      <View style={[styles.impactBadge, { backgroundColor: getImpactColor(rec.impact) + '20' }]}>
                        <Text style={[styles.impactText, { color: getImpactColor(rec.impact) }]}>
                          {rec.impact.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.recommendationDescription}>{rec.description}</Text>
                  <View style={styles.recommendationFooter}>
                    <Text style={styles.effortText}>Effort: {rec.effort}</Text>
                    <Text style={styles.priorityText}>Priority: {rec.priority}/100</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* All Insights */}
        {selectedCategory === 'performance' && (
          <View style={styles.allInsightsContainer}>
            <Text style={styles.sectionTitle}>All Insights</Text>
            {insights.map(insight => {
              const IconComponent = getInsightIcon(insight.type);
              return (
                <View key={insight.id} style={styles.insightCard}>
                  <View style={styles.insightHeader}>
                    <IconComponent size={16} color={getInsightColor(insight.type)} />
                    <Text style={[styles.insightTitle, { color: getInsightColor(insight.type) }]}>
                      {insight.title}
                    </Text>
                    <View style={[styles.priorityBadge, { backgroundColor: getInsightColor(insight.type) + '20' }]}>
                      <Text style={[styles.priorityText, { color: getInsightColor(insight.type) }]}>
                        {insight.priority.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.insightDescription}>{insight.description}</Text>
                  {insight.action && (
                    <TouchableOpacity style={styles.insightAction}>
                      <Text style={styles.insightActionText}>{insight.action}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
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
    premiumGate: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
      backgroundColor: colors.background,
    },
    premiumTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: colors.text,
      marginTop: 20,
      marginBottom: 12,
    },
    premiumDescription: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 24,
      marginBottom: 20,
    },
    premiumFeatures: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 30,
    },
    upgradeButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 32,
      paddingVertical: 12,
      borderRadius: 8,
    },
    upgradeButtonText: {
      color: colors.background,
      fontWeight: '600',
      fontSize: 16,
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
    timeFrameSelector: {
      marginBottom: 12,
    },
    timeFrameButton: {
      backgroundColor: colors.background,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    timeFrameButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    timeFrameButtonText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    timeFrameButtonTextActive: {
      color: colors.background,
    },
    categorySelector: {
      marginTop: 8,
    },
    categoryButton: {
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
    categoryButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    categoryButtonText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    categoryButtonTextActive: {
      color: colors.background,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 24,
    },
    metricCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      width: '48%',
    },
    metricHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    trendIndicator: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    trendText: {
      fontSize: 12,
      fontWeight: '600',
    },
    metricLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    metricValue: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 2,
    },
    metricChange: {
      fontSize: 12,
      fontWeight: '500',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    insightsContainer: {
      marginBottom: 24,
    },
    insightCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    insightHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      gap: 8,
    },
    insightTitle: {
      fontSize: 14,
      fontWeight: '600',
      flex: 1,
    },
    insightDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: 8,
    },
    insightAction: {
      alignSelf: 'flex-start',
    },
    insightActionText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '500',
    },
    priorityBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    priorityText: {
      fontSize: 10,
      fontWeight: '600',
    },
    recommendationsContainer: {
      marginBottom: 24,
    },
    recommendationCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    recommendationHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    recommendationIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    recommendationInfo: {
      flex: 1,
    },
    recommendationTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    recommendationCategory: {
      fontSize: 10,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    recommendationMetrics: {
      alignItems: 'flex-end',
    },
    impactBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
    },
    impactText: {
      fontSize: 10,
      fontWeight: '600',
    },
    recommendationDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: 8,
    },
    recommendationFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    effortText: {
      fontSize: 10,
      color: colors.textSecondary,
    },
    allInsightsContainer: {
      marginBottom: 24,
    },
  });
}