import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Calendar,
  Package,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  ChevronDown,
  Calculator,
} from 'lucide-react-native';


import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  useBusinessStore,
  useProducts,
  useVendors,
  Transaction,

} from '@/lib/stores/businessStore';
import { useSubscriptionTier } from '@/lib/stores/authStore';

interface TransactionFormProps {
  visible: boolean;
  onClose: () => void;
  editingTransaction?: Transaction | null;
}

type TransactionType = 'purchase' | 'sale' | 'adjustment';

export default function TransactionForm({
  visible,
  onClose,
  editingTransaction,
}: TransactionFormProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const products = useProducts();
  const vendors = useVendors();
  const subscriptionTier = useSubscriptionTier();
  const { addTransaction, updateTransaction, getTransactions } = useBusinessStore();

  const [formData, setFormData] = useState({
    type: 'sale' as TransactionType,
    productId: '',
    vendorId: '',
    quantity: '',
    unitPrice: '',
    notes: '',
    date: new Date(),
  });

  const [showProductPicker, setShowProductPicker] = useState(false);
  const [showVendorPicker, setShowVendorPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [calculatedTotal, setCalculatedTotal] = useState(0);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (visible) {
      if (editingTransaction) {
        setFormData({
          type: editingTransaction.type,
          productId: editingTransaction.productId,
          vendorId: editingTransaction.vendorId || '',
          quantity: editingTransaction.quantity.toString(),
          unitPrice: editingTransaction.unitPrice.toString(),
          notes: editingTransaction.notes || '',
          date: new Date(editingTransaction.createdAt),
        });
      } else {
        setFormData({
          type: 'sale',
          productId: '',
          vendorId: '',
          quantity: '',
          unitPrice: '',
          notes: '',
          date: new Date(),
        });
      }
    }
  }, [visible, editingTransaction]);

  // Calculate total amount
  useEffect(() => {
    const quantity = parseFloat(formData.quantity) || 0;
    const unitPrice = parseFloat(formData.unitPrice) || 0;
    setCalculatedTotal(quantity * unitPrice);
  }, [formData.quantity, formData.unitPrice]);

  // Check transaction limits for free tier
  const checkTransactionLimits = () => {
    if (subscriptionTier === 'free') {
      const transactions = getTransactions();
      if (transactions.length >= 100) {
        Alert.alert(
          'Upgrade Required',
          'Free tier is limited to 100 transactions. Upgrade to Premium for unlimited transactions.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade', onPress: () => console.log('Navigate to upgrade') },
          ]
        );
        return false;
      }
    }
    return true;
  };

  const handleSave = () => {
    // Validation
    if (!formData.productId) {
      Alert.alert('Error', 'Please select a product');
      return;
    }

    if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    if (!formData.unitPrice || parseFloat(formData.unitPrice) <= 0) {
      Alert.alert('Error', 'Please enter a valid unit price');
      return;
    }

    if (formData.type === 'purchase' && !formData.vendorId) {
      Alert.alert('Error', 'Please select a vendor for purchase transactions');
      return;
    }

    // Check limits for new transactions
    if (!editingTransaction && !checkTransactionLimits()) {
      return;
    }

    const transactionData = {
      type: formData.type,
      productId: formData.productId,
      vendorId: formData.type === 'purchase' ? formData.vendorId : undefined,
      quantity: parseFloat(formData.quantity),
      unitPrice: parseFloat(formData.unitPrice),
      totalAmount: calculatedTotal,
      notes: formData.notes.trim() || undefined,
    };

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, transactionData);
    } else {
      addTransaction(transactionData);
    }

    onClose();
  };

  const getSelectedProduct = () => {
    return products.find((p) => p.id === formData.productId);
  };

  const getSelectedVendor = () => {
    return vendors.find((v) => v.id === formData.vendorId);
  };

  const getTransactionTypeIcon = (type: TransactionType) => {
    switch (type) {
      case 'purchase':
        return <TrendingDown size={16} color={colors.error} />;
      case 'sale':
        return <TrendingUp size={16} color={colors.success} />;
      case 'adjustment':
        return <RotateCcw size={16} color={colors.warning} />;
    }
  };



  const styles = createStyles(colors);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* Transaction Type */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Transaction Type *</Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setShowTypePicker(true)}
              >
                <View style={styles.pickerContent}>
                  {getTransactionTypeIcon(formData.type)}
                  <Text style={styles.pickerText}>
                    {formData.type.charAt(0).toUpperCase() + formData.type.slice(1)}
                  </Text>
                </View>
                <ChevronDown size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Product Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Product *</Text>
              <TouchableOpacity
                style={styles.picker}
                onPress={() => setShowProductPicker(true)}
              >
                <View style={styles.pickerContent}>
                  <Package size={16} color={colors.textSecondary} />
                  <Text style={styles.pickerText}>
                    {getSelectedProduct()?.name || 'Select Product'}
                  </Text>
                </View>
                <ChevronDown size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Vendor Selection (for purchases) */}
            {formData.type === 'purchase' && (
              <View style={styles.formGroup}>
                <Text style={styles.label}>Vendor *</Text>
                <TouchableOpacity
                  style={styles.picker}
                  onPress={() => setShowVendorPicker(true)}
                >
                  <View style={styles.pickerContent}>
                    <Package size={16} color={colors.textSecondary} />
                    <Text style={styles.pickerText}>
                      {getSelectedVendor()?.name || 'Select Vendor'}
                    </Text>
                  </View>
                  <ChevronDown size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            {/* Date */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Date *</Text>
              <View style={styles.inputContainer}>
                <Calendar size={16} color={colors.textSecondary} />
                <TextInput
                   style={styles.inputField}
                   placeholder="YYYY-MM-DD"
                   placeholderTextColor={colors.textSecondary}
                   value={formData.date.toISOString().split('T')[0]}
                   onChangeText={(text) => {
                     const date = new Date(text);
                     if (!isNaN(date.getTime())) {
                       setFormData({ ...formData, date });
                     }
                   }}
                 />
              </View>
            </View>

            {/* Quantity */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Quantity *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter quantity"
                placeholderTextColor={colors.textSecondary}
                value={formData.quantity}
                onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                keyboardType="numeric"
              />
            </View>

            {/* Unit Price */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Unit Price *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter unit price"
                placeholderTextColor={colors.textSecondary}
                value={formData.unitPrice}
                onChangeText={(text) => setFormData({ ...formData, unitPrice: text })}
                keyboardType="numeric"
              />
            </View>

            {/* Total Amount (calculated) */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Total Amount</Text>
              <View style={[styles.input, styles.calculatedField]}>
                <Calculator size={16} color={colors.textSecondary} />
                <Text style={styles.calculatedText}>
                  Rp {calculatedTotal.toLocaleString('id-ID')}
                </Text>
              </View>
            </View>

            {/* Notes */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add notes (optional)"
                placeholderTextColor={colors.textSecondary}
                value={formData.notes}
                onChangeText={(text) => setFormData({ ...formData, notes: text })}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>
                {editingTransaction ? 'Update' : 'Add'} Transaction
              </Text>
            </TouchableOpacity>
          </View>



          {/* Transaction Type Picker */}
          <Modal
            visible={showTypePicker}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowTypePicker(false)}
          >
            <SafeAreaView style={styles.pickerModal}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Transaction Type</Text>
                <TouchableOpacity onPress={() => setShowTypePicker(false)}>
                  <X size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.pickerList}>
                {(['sale', 'purchase', 'adjustment'] as TransactionType[]).map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.pickerOption}
                    onPress={() => {
                      setFormData({ ...formData, type });
                      setShowTypePicker(false);
                    }}
                  >
                    <View style={styles.pickerOptionContent}>
                      {getTransactionTypeIcon(type)}
                      <Text style={styles.pickerOptionText}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </SafeAreaView>
          </Modal>

          {/* Product Picker */}
          <Modal
            visible={showProductPicker}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowProductPicker(false)}
          >
            <SafeAreaView style={styles.pickerModal}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Product</Text>
                <TouchableOpacity onPress={() => setShowProductPicker(false)}>
                  <X size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.pickerList}>
                {products.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    style={styles.pickerOption}
                    onPress={() => {
                      setFormData({ ...formData, productId: product.id });
                      setShowProductPicker(false);
                    }}
                  >
                    <View style={styles.pickerOptionContent}>
                      <Package size={16} color={colors.textSecondary} />
                      <View>
                        <Text style={styles.pickerOptionText}>{product.name}</Text>
                        <Text style={styles.pickerOptionSubtext}>
                          Stock: {product.stock || 0}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </SafeAreaView>
          </Modal>

          {/* Vendor Picker */}
          <Modal
            visible={showVendorPicker}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowVendorPicker(false)}
          >
            <SafeAreaView style={styles.pickerModal}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Vendor</Text>
                <TouchableOpacity onPress={() => setShowVendorPicker(false)}>
                  <X size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.pickerList}>
                {vendors.map((vendor) => (
                  <TouchableOpacity
                    key={vendor.id}
                    style={styles.pickerOption}
                    onPress={() => {
                      setFormData({ ...formData, vendorId: vendor.id });
                      setShowVendorPicker(false);
                    }}
                  >
                    <View style={styles.pickerOptionContent}>
                      <Package size={16} color={colors.textSecondary} />
                      <View>
                        <Text style={styles.pickerOptionText}>{vendor.name}</Text>
                        <Text style={styles.pickerOptionSubtext}>
                          {vendor.email || vendor.phone || 'No contact info'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </SafeAreaView>
          </Modal>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      flex: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    form: {
      flex: 1,
      paddingHorizontal: 20,
    },
    formGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
       borderWidth: 1,
       borderColor: colors.border,
       borderRadius: 8,
       paddingHorizontal: 16,
       paddingVertical: 12,
       fontSize: 16,
       color: colors.text,
       backgroundColor: colors.background,
     },
     inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.background,
        gap: 8,
      },
      inputField: {
        flex: 1,
        fontSize: 16,
        color: colors.text,
        paddingVertical: 0,
      },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    picker: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.background,
    },
    pickerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    pickerText: {
      fontSize: 16,
      color: colors.text,
    },
    calculatedField: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.cardBackground,
    },
    calculatedText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    actions: {
      flexDirection: 'row',
      gap: 12,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
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
    pickerModal: {
      flex: 1,
      backgroundColor: colors.background,
    },
    pickerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pickerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    pickerList: {
      flex: 1,
    },
    pickerOption: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pickerOptionContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    pickerOptionText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    pickerOptionSubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
  });
}