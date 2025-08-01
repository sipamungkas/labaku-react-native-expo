import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { X, Crown, Check, Zap } from 'lucide-react-native';
import { useSubscriptionTier } from '../../lib/revenuecat/client';
import { subscriptionLimits } from '../../lib/subscription/limits';
import type { UpgradePromptData } from '../../lib/subscription/limits';

interface UpgradePromptModalProps {
  visible: boolean;
  onClose: () => void;
  promptData?: UpgradePromptData;
  showFeatureComparison?: boolean;
}

export default function UpgradePromptModal({
  visible,
  onClose,
  promptData,
  showFeatureComparison = false,
}: UpgradePromptModalProps) {
  const tier = useSubscriptionTier();
  const isPremium = tier === 'premium';
  const [upgrading, setUpgrading] = React.useState(false);

  const featureComparison = subscriptionLimits.getFeatureComparison();
  const premiumFeatures = subscriptionLimits.getPremiumFeatures();

  const handleUpgrade = async () => {
    if (isPremium) {
      Alert.alert('Already Premium', 'You already have a Premium subscription!');
      return;
    }

    setUpgrading(true);
    try {
      // TODO: Implement RevenueCat purchase flow
      // This would typically call RevenueCat's purchase method
      Alert.alert(
        'Upgrade to Premium',
        'Premium upgrade functionality will be implemented with RevenueCat integration.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => console.log('Upgrade initiated') },
        ]
      );
    } catch (error) {
      console.error('Upgrade error:', error);
      Alert.alert('Error', 'Failed to initiate upgrade. Please try again.');
    } finally {
      setUpgrading(false);
    }
  };

  const handleRestorePurchases = async () => {
    try {
      // TODO: Implement RevenueCat restore purchases
      Alert.alert(
        'Restore Purchases',
        'Purchase restoration functionality will be implemented with RevenueCat integration.'
      );
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert('Error', 'Failed to restore purchases. Please try again.');
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Crown size={24} color="#10B981" />
            <Text style={styles.headerTitle}>Upgrade to Premium</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Limit Message */}
          {promptData && (
            <View style={styles.limitCard}>
              <View style={styles.limitHeader}>
                <Zap size={20} color="#F59E0B" />
                <Text style={styles.limitTitle}>{promptData.title}</Text>
              </View>
              <Text style={styles.limitMessage}>{promptData.message}</Text>
              <View style={styles.limitStats}>
                <Text style={styles.limitStatsText}>
                  Current: {promptData.currentCount} / {promptData.limit}
                </Text>
              </View>
            </View>
          )}

          {/* Premium Features */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>Premium Features</Text>
            {premiumFeatures.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Check size={16} color="#10B981" />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          {/* Feature Comparison */}
          {showFeatureComparison && (
            <View style={styles.comparisonSection}>
              <Text style={styles.sectionTitle}>Free vs Premium</Text>
              <View style={styles.comparisonTable}>
                <View style={styles.comparisonHeader}>
                  <Text style={styles.comparisonHeaderText}>Feature</Text>
                  <Text style={styles.comparisonHeaderText}>Free</Text>
                  <Text style={styles.comparisonHeaderText}>Premium</Text>
                </View>
                {Object.entries(featureComparison).map(([key, comparison]) => (
                  <View key={key} style={styles.comparisonRow}>
                    <Text style={styles.comparisonFeature}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </Text>
                    <Text style={styles.comparisonFree}>{comparison.free}</Text>
                    <Text style={styles.comparisonPremium}>{comparison.premium}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Pricing */}
          <View style={styles.pricingSection}>
            <Text style={styles.sectionTitle}>Simple Pricing</Text>
            <View style={styles.pricingCard}>
              <View style={styles.pricingHeader}>
                <Crown size={20} color="#10B981" />
                <Text style={styles.pricingTitle}>Premium</Text>
              </View>
              <Text style={styles.pricingPrice}>$9.99/month</Text>
              <Text style={styles.pricingDescription}>
                Unlock all features and grow your business without limits
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.upgradeButton, upgrading && styles.upgradeButtonDisabled]}
            onPress={handleUpgrade}
            disabled={upgrading}
          >
            <Crown size={20} color="white" />
            <Text style={styles.upgradeButtonText}>
              {upgrading ? 'Processing...' : 'Upgrade to Premium'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestorePurchases}
          >
            <Text style={styles.restoreButtonText}>Restore Purchases</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Maybe Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  limitCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  limitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  limitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
  },
  limitMessage: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
    marginBottom: 12,
  },
  limitStats: {
    backgroundColor: '#FEF9C3',
    borderRadius: 8,
    padding: 8,
  },
  limitStatsText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#92400E',
    textAlign: 'center',
  },
  featuresSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  comparisonSection: {
    marginTop: 24,
  },
  comparisonTable: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  comparisonHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  comparisonHeaderText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  comparisonRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  comparisonFeature: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  comparisonFree: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },
  comparisonPremium: {
    flex: 1,
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  pricingSection: {
    marginTop: 24,
    marginBottom: 20,
  },
  pricingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  pricingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pricingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
  },
  pricingPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  pricingDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  actions: {
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  upgradeButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  upgradeButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  upgradeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  restoreButtonText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontSize: 14,
  },
});