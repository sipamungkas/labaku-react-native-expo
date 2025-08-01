import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Plus,
  Users,
  Edit3,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Search,
  X,
} from 'lucide-react-native';

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  useVendors,
  useBusinessStore,
  Vendor,
} from '@/lib/stores/businessStore';
import { useSubscriptionTier } from '@/lib/stores/authStore';
import { premiumHelpers } from '@/lib/revenuecat/client';

/**
 * Vendors Screen
 * Manages vendor information and relationships
 */
export default function VendorsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const vendors = useVendors();
  const subscriptionTier = useSubscriptionTier();
  const {
    addVendor,
    updateVendor,
    deleteVendor,
    getProductsByVendor,
  } = useBusinessStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
  });

  // Filter vendors based on search query
  const filteredVendors = vendors.filter((vendor) =>
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vendor.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddVendor = () => {
    // Check vendor limit for free tier
    if (subscriptionTier === 'free' && vendors.length >= 5) {
      Alert.alert(
        'Upgrade Required',
        'Free tier is limited to 5 vendors. Upgrade to Premium for unlimited vendors.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => console.log('Navigate to upgrade') },
        ]
      );
      return;
    }

    setEditingVendor(null);
    setFormData({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
    });
    setIsModalVisible(true);
  };

  const handleEditVendor = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      contactPerson: vendor.contactPerson || '',
      phone: vendor.phone || '',
      email: vendor.email || '',
      address: vendor.address || '',
    });
    setIsModalVisible(true);
  };

  const handleDeleteVendor = (vendor: Vendor) => {
    const associatedProducts = getProductsByVendor(vendor.id);
    
    if (associatedProducts.length > 0) {
      Alert.alert(
        'Cannot Delete Vendor',
        `This vendor has ${associatedProducts.length} associated product(s). Please remove or reassign these products first.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Vendor',
      `Are you sure you want to delete "${vendor.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteVendor(vendor.id),
        },
      ]
    );
  };

  const handleSaveVendor = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Vendor name is required');
      return;
    }

    if (editingVendor) {
      updateVendor(editingVendor.id, {
        name: formData.name.trim(),
        contactPerson: formData.contactPerson.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
      });
    } else {
      addVendor({
        name: formData.name.trim(),
        contactPerson: formData.contactPerson.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        isActive: true,
      });
    }

    setIsModalVisible(false);
  };

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Users size={24} color={colors.primary} />
            <Text style={styles.headerTitle}>Vendors</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.vendorCount}>
              {vendors.length}{subscriptionTier === 'free' ? '/5' : ''}
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search vendors..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredVendors.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No vendors found' : 'No Vendors Yet'}
            </Text>
            <Text style={styles.emptyDescription}>
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Add your first vendor to start managing your supplier relationships.'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity style={styles.emptyButton} onPress={handleAddVendor}>
                <Plus size={20} color={colors.background} />
                <Text style={styles.emptyButtonText}>Add First Vendor</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.vendorList}>
            {filteredVendors.map((vendor) => {
              const productCount = getProductsByVendor(vendor.id).length;
              
              return (
                <View key={vendor.id} style={styles.vendorCard}>
                  <View style={styles.vendorHeader}>
                    <View style={styles.vendorInfo}>
                      <Text style={styles.vendorName}>{vendor.name}</Text>
                      <Text style={styles.productCount}>
                        {productCount} product{productCount !== 1 ? 's' : ''}
                      </Text>
                    </View>
                    <View style={styles.vendorActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleEditVendor(vendor)}
                      >
                        <Edit3 size={16} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDeleteVendor(vendor)}
                      >
                        <Trash2 size={16} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Contact Information */}
                  <View style={styles.vendorDetails}>
                    {vendor.contactPerson && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Contact:</Text>
                        <Text style={styles.detailValue}>{vendor.contactPerson}</Text>
                      </View>
                    )}
                    {vendor.phone && (
                      <View style={styles.detailRow}>
                        <Phone size={14} color={colors.textSecondary} />
                        <Text style={styles.detailValue}>{vendor.phone}</Text>
                      </View>
                    )}
                    {vendor.email && (
                      <View style={styles.detailRow}>
                        <Mail size={14} color={colors.textSecondary} />
                        <Text style={styles.detailValue}>{vendor.email}</Text>
                      </View>
                    )}
                    {vendor.address && (
                      <View style={styles.detailRow}>
                        <MapPin size={14} color={colors.textSecondary} />
                        <Text style={styles.detailValue}>{vendor.address}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={handleAddVendor}>
        <Plus size={24} color={colors.background} />
      </TouchableOpacity>

      {/* Add/Edit Vendor Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContent}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingVendor ? 'Edit Vendor' : 'Add New Vendor'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsModalVisible(false)}
              >
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              {/* Vendor Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Vendor Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter vendor name"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                />
              </View>

              {/* Contact Person */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Contact Person</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter contact person name"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.contactPerson}
                  onChangeText={(text) => setFormData({ ...formData, contactPerson: text })}
                />
              </View>

              {/* Phone */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Phone Number</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter phone number"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.phone}
                  onChangeText={(text) => setFormData({ ...formData, phone: text })}
                  keyboardType="phone-pad"
                />
              </View>

              {/* Email */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Enter email address"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Address */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Address</Text>
                <TextInput
                  style={[styles.formInput, styles.textArea]}
                  placeholder="Enter vendor address"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.address}
                  onChangeText={(text) => setFormData({ ...formData, address: text })}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveVendor}>
                <Text style={styles.saveButtonText}>
                  {editingVendor ? 'Update' : 'Add'} Vendor
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
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
    headerRight: {
      alignItems: 'flex-end',
    },
    vendorCount: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: 8,
      paddingHorizontal: 12,
      height: 40,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
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
    vendorList: {
      padding: 16,
    },
    vendorCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    vendorHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    vendorInfo: {
      flex: 1,
    },
    vendorName: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    productCount: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    vendorActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      padding: 8,
      borderRadius: 6,
      backgroundColor: colors.background,
    },
    vendorDetails: {
      gap: 8,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    detailLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      minWidth: 60,
    },
    detailValue: {
      fontSize: 14,
      color: colors.textSecondary,
      flex: 1,
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
    // Modal Styles
    modalContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    modalContent: {
      flex: 1,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    modalForm: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    formGroup: {
      marginBottom: 20,
    },
    formLabel: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    },
    formInput: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    modalActions: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    saveButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      backgroundColor: colors.primary,
      alignItems: 'center',
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.background,
    },
  });
}