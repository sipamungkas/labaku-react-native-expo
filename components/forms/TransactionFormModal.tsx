import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { X, Calendar, Package, Hash, FileText } from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  useProducts,
  useBusinessStore,
  Transaction,
  Product,
} from '@/lib/stores/businessStore';
import { useSubscriptionTier } from '@/lib/stores/authStore';

interface TransactionFormModalProps {
  visible: boolean;
  onClose: () => void;
  transaction?: Transaction | null;
  onSave?: (transaction: Partial<Transaction>) => void;
}

interface FormData {
  productId: string;
  quantityIn: string;
  quantityOut: string;
  date: string;
  notes: string;
}

export default function TransactionFormModal({
  visible,
  onClose,
  transaction,
  onSave,
}: TransactionFormModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const products = useProducts();
  const subscriptionTier = useSubscriptionTier();
  const { addTransaction, updateTransaction, getTransactions } = useBusinessStore();

  const [formData, setFormData] = useState<FormData>({
    productId: '',
    quantityIn: '',
    quantityOut: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (transaction) {
      // Editing existing transaction
      setFormData({
        productId: transaction.productId.toString(),
        quantityIn: transaction.quantityIn?.toString() || '0',
        quantityOut: transaction.quantityOut?.toString() || '0',
        date: transaction.date || new Date().toISOString().split('T')[0],
        notes: transaction.notes || '',
      });
      
      const product = products.find(p => p.id === transaction.productId.toString());
      setSelectedProduct(product || null);
    } else {
      // Reset form for new transaction
      resetForm();
    }
  }, [transaction, visible, products]);

  const resetForm = () => {
    setFormData({
      productId: '',
      quantityIn: '',
      quantityOut: '',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    });
    setSelectedProduct(null);
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setFormData(prev => ({
      ...prev,
      productId: product.id,
    }));
    setShowProductPicker(false);
  };

  const validateForm = (): string | null => {
    if (!formData.productId) return 'Please select a product';
    
    const quantityIn = parseFloat(formData.quantityIn) || 0;
    const quantityOut = parseFloat(formData.quantityOut) || 0;
    
    if (quantityIn < 0 || quantityOut < 0) return 'Quantities cannot be negative';
    if (quantityIn === 0 && quantityOut === 0) return 'Please enter at least one quantity (in or out)';
    if (!formData.date) return 'Please select a date';
    
    // Check transaction limits for free tier
    if (subscriptionTier === 'free' && !transaction) {
      const currentTransactions = getTransactions();
      if (currentTransactions.length >= 100) {
        return 'Free tier is limited to 100 transactions. Upgrade to Premium for unlimited transactions.';
      }
    }
    
    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      Alert.alert('Validation Error', validationError);
      return;
    }

    setIsLoading(true);
    
    try {
      const quantityIn = parseFloat(formData.quantityIn) || 0;
      const quantityOut = parseFloat(formData.quantityOut) || 0;

      const transactionData = {
        productId: parseInt(formData.productId),
        quantityIn,
        quantityOut,
        date: formData.date,
        notes: formData.notes.trim() || undefined,
      };

      if (transaction) {
        // Update existing transaction
        updateTransaction(transaction.id, transactionData);
      } else {
        // Add new transaction
        addTransaction(transactionData);
      }

      if (onSave) {
        onSave(transactionData);
      }

      onClose();
  } catch {
      Alert.alert('Error', 'Failed to save transaction. Please try again.');
  } finally {
      setIsLoading(false);
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
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>
              {transaction ? 'Edit Transaction' : 'Add Transaction'}
            </Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

          {/* Product Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Product *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowProductPicker(true)}
            >
              <Package size={20} color={colors.textSecondary} />
              <Text style={[styles.pickerButtonText, !selectedProduct && styles.placeholderText]}>
                {selectedProduct ? selectedProduct.name : 'Select a product'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quantity In */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quantity In</Text>
            <View style={styles.inputContainer}>
              <Hash size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Enter quantity received"
                placeholderTextColor={colors.textSecondary}
                value={formData.quantityIn.toString()}
                onChangeText={(text) => setFormData(prev => ({ ...prev, quantityIn: parseFloat(text) || 0 }))}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Quantity Out */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quantity Out</Text>
            <View style={styles.inputContainer}>
              <Hash size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="Enter quantity sold/used"
                placeholderTextColor={colors.textSecondary}
                value={formData.quantityOut.toString()}
                onChangeText={(text) => setFormData(prev => ({ ...prev, quantityOut: parseFloat(text) || 0 }))}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Date */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Date *</Text>
            <View style={styles.inputContainer}>
              <Calendar size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textSecondary}
                value={formData.date}
                onChangeText={(text) => setFormData(prev => ({ ...prev, date: text }))}
              />
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <View style={styles.inputContainer}>
              <FileText size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="Add notes (optional)"
                placeholderTextColor={colors.textSecondary}
                value={formData.notes}
                onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.disabledButton]}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Text style={styles.saveButtonText}>
              {isLoading ? 'Saving...' : transaction ? 'Update' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Product Picker Modal */}
        <Modal
          visible={showProductPicker}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowProductPicker(false)}
        >
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Product</Text>
              <TouchableOpacity onPress={() => setShowProductPicker(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerContent}>
              {products.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  style={styles.pickerItem}
                  onPress={() => handleProductSelect(product)}
                >
                  <Text style={styles.pickerItemText}>{product.name}</Text>
                  <Text style={styles.pickerItemSubtext}>
                    Stock: {product.stock || 0}
                  </Text>
                </TouchableOpacity>
              ))}
              {products.length === 0 && (
                <View style={styles.emptyPicker}>
                  <Text style={styles.emptyPickerText}>No products available</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </Modal>


      </KeyboardAvoidingView>
    </Modal>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
    headerLeft: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: 8,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    section: {
      marginVertical: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },

    pickerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      borderRadius: 8,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pickerButtonText: {
      flex: 1,
      marginLeft: 12,
      fontSize: 16,
      color: colors.text,
    },
    placeholderText: {
      color: colors.textSecondary,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      borderRadius: 8,
      paddingHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    input: {
      flex: 1,
      marginLeft: 12,
      paddingVertical: 16,
      fontSize: 16,
      color: colors.text,
    },
    notesInput: {
      paddingTop: 16,
      paddingBottom: 16,
      textAlignVertical: 'top',
    },

    footer: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 16,
      alignItems: 'center',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    saveButton: {
      flex: 1,
      paddingVertical: 16,
      alignItems: 'center',
      borderRadius: 8,
      backgroundColor: colors.primary,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.background,
    },
    disabledButton: {
      opacity: 0.6,
    },
    pickerContainer: {
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
    pickerContent: {
      flex: 1,
      paddingHorizontal: 20,
    },
    pickerItem: {
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pickerItemText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
    },
    pickerItemSubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    emptyPicker: {
      paddingVertical: 40,
      alignItems: 'center',
    },
    emptyPickerText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
  });
}