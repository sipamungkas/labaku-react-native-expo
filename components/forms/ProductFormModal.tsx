import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { X, Package, Save, DollarSign } from 'lucide-react-native';
import { useBusinessStore, useVendors } from '../../lib/stores/businessStore';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

interface ProductFormModalProps {
  visible: boolean;
  onClose: () => void;
  editingProduct?: any;
}

const PRODUCT_CATEGORIES = [
  'Electronics',
  'Clothing',
  'Food & Beverages',
  'Health & Beauty',
  'Home & Garden',
  'Sports & Outdoors',
  'Books & Media',
  'Automotive',
  'Office Supplies',
  'General',
];

const PRODUCT_UNITS = [
  'pcs',
  'kg',
  'gram',
  'liter',
  'ml',
  'meter',
  'cm',
  'box',
  'pack',
  'bottle',
  'bag',
  'roll',
];

export default function ProductFormModal({
  visible,
  onClose,
  editingProduct,
}: ProductFormModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { addProduct, updateProduct } = useBusinessStore();
  const vendors = useVendors();
  
  const [formData, setFormData] = React.useState({
    name: '',
    description: '',
    category: 'General',
    unit: 'pcs',
    currentPrice: '',
    costPrice: '',
    vendorId: '',
    isActive: true,
  });
  
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  
  // Reset form when modal opens/closes or editing product changes
  React.useEffect(() => {
    if (visible) {
      if (editingProduct) {
        setFormData({
          name: editingProduct.name || '',
          description: editingProduct.description || '',
          category: editingProduct.category || 'General',
          unit: editingProduct.unit || 'pcs',
          currentPrice: editingProduct.currentPrice?.toString() || '',
          costPrice: editingProduct.costPrice?.toString() || '',
          vendorId: editingProduct.vendorId || '',
          isActive: editingProduct.isActive ?? true,
        });
      } else {
        setFormData({
          name: '',
          description: '',
          category: 'General',
          unit: 'pcs',
          currentPrice: '',
          costPrice: '',
          vendorId: vendors.length > 0 ? vendors[0].id : '',
          isActive: true,
        });
      }
      setErrors({});
    }
  }, [visible, editingProduct, vendors]);
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    
    if (!formData.currentPrice || isNaN(Number(formData.currentPrice)) || Number(formData.currentPrice) <= 0) {
      newErrors.currentPrice = 'Valid selling price is required';
    }
    
    if (!formData.costPrice || isNaN(Number(formData.costPrice)) || Number(formData.costPrice) <= 0) {
      newErrors.costPrice = 'Valid cost price is required';
    }
    
    if (Number(formData.costPrice) > Number(formData.currentPrice)) {
      newErrors.costPrice = 'Cost price cannot be higher than selling price';
    }
    
    if (!formData.vendorId && vendors.length > 0) {
      newErrors.vendorId = 'Please select a vendor';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    try {
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category: formData.category,
        unit: formData.unit,
        currentPrice: Number(formData.currentPrice),
        costPrice: Number(formData.costPrice),
        vendorId: formData.vendorId,
        isActive: formData.isActive,
      };
      
      if (editingProduct) {
        updateProduct(editingProduct.id, productData);
      } else {
        addProduct(productData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      Alert.alert('Error', 'Failed to save product. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
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
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Package size={24} color={colors.primary} />
            <Text style={styles.headerTitle}>
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Product Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              placeholder="Enter product name"
              placeholderTextColor={colors.textSecondary}
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
              maxLength={100}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>
          
          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Enter product description (optional)"
              placeholderTextColor={colors.textSecondary}
              value={formData.description}
              onChangeText={(value) => updateFormData('description', value)}
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </View>
          
          {/* Category and Unit Row */}
          <View style={styles.row}>
            <View style={[styles.formGroup, styles.halfWidth]}>
              <Text style={styles.label}>Category *</Text>
              <View style={styles.pickerContainer}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryScroll}
                >
                  {PRODUCT_CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryChip,
                        formData.category === category && styles.categoryChipSelected
                      ]}
                      onPress={() => updateFormData('category', category)}
                    >
                      <Text style={[
                        styles.categoryChipText,
                        formData.category === category && styles.categoryChipTextSelected
                      ]}>
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            
            <View style={[styles.formGroup, styles.halfWidth]}>
              <Text style={styles.label}>Unit *</Text>
              <View style={styles.pickerContainer}>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.unitScroll}
                >
                  {PRODUCT_UNITS.map((unit) => (
                    <TouchableOpacity
                      key={unit}
                      style={[
                        styles.unitChip,
                        formData.unit === unit && styles.unitChipSelected
                      ]}
                      onPress={() => updateFormData('unit', unit)}
                    >
                      <Text style={[
                        styles.unitChipText,
                        formData.unit === unit && styles.unitChipTextSelected
                      ]}>
                        {unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
          
          {/* Pricing Section */}
          <View style={styles.pricingSection}>
            <Text style={styles.sectionTitle}>Pricing Information</Text>
            
            <View style={styles.row}>
              <View style={[styles.formGroup, styles.halfWidth]}>
                <Text style={styles.label}>Cost Price (Rp) *</Text>
                <View style={styles.priceInputContainer}>
                  <DollarSign size={16} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.priceInput, errors.costPrice && styles.inputError]}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    value={formData.costPrice}
                    onChangeText={(value) => updateFormData('costPrice', value.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                  />
                </View>
                {errors.costPrice && <Text style={styles.errorText}>{errors.costPrice}</Text>}
              </View>
              
              <View style={[styles.formGroup, styles.halfWidth]}>
                <Text style={styles.label}>Selling Price (Rp) *</Text>
                <View style={styles.priceInputContainer}>
                  <DollarSign size={16} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.priceInput, errors.currentPrice && styles.inputError]}
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                    value={formData.currentPrice}
                    onChangeText={(value) => updateFormData('currentPrice', value.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                  />
                </View>
                {errors.currentPrice && <Text style={styles.errorText}>{errors.currentPrice}</Text>}
              </View>
            </View>
            
            {/* Profit Margin Display */}
            {formData.costPrice && formData.currentPrice && (
              <View style={styles.profitMarginContainer}>
                <Text style={styles.profitMarginLabel}>Profit Margin:</Text>
                <Text style={styles.profitMarginValue}>
                  Rp {(Number(formData.currentPrice) - Number(formData.costPrice)).toLocaleString('id-ID')} 
                  ({(((Number(formData.currentPrice) - Number(formData.costPrice)) / Number(formData.currentPrice)) * 100).toFixed(1)}%)
                </Text>
              </View>
            )}
          </View>
          
          {/* Vendor Selection */}
          {vendors.length > 0 && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Vendor</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.vendorScroll}
              >
                {vendors.map((vendor) => (
                  <TouchableOpacity
                    key={vendor.id}
                    style={[
                      styles.vendorChip,
                      formData.vendorId === vendor.id && styles.vendorChipSelected
                    ]}
                    onPress={() => updateFormData('vendorId', vendor.id)}
                  >
                    <Text style={[
                      styles.vendorChipText,
                      formData.vendorId === vendor.id && styles.vendorChipTextSelected
                    ]}>
                      {vendor.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {errors.vendorId && <Text style={styles.errorText}>{errors.vendorId}</Text>}
            </View>
          )}
          
          {/* Active Status */}
          <View style={styles.formGroup}>
            <View style={styles.switchContainer}>
              <View>
                <Text style={styles.label}>Product Status</Text>
                <Text style={styles.switchDescription}>
                  {formData.isActive ? 'Product is active and available for sale' : 'Product is inactive and hidden from sales'}
                </Text>
              </View>
              <Switch
                value={formData.isActive}
                onValueChange={(value) => updateFormData('isActive', value)}
                trackColor={{ false: colors.border, true: colors.primary + '40' }}
                thumbColor={formData.isActive ? colors.primary : colors.textSecondary}
              />
            </View>
          </View>
        </ScrollView>
        
        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Save size={16} color="white" />
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : editingProduct ? 'Update' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    formGroup: {
      marginBottom: 20,
    },
    label: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    inputError: {
      borderColor: colors.error,
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    errorText: {
      fontSize: 12,
      color: colors.error,
      marginTop: 4,
    },
    row: {
      flexDirection: 'row',
      gap: 12,
    },
    halfWidth: {
      flex: 1,
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.surface,
      paddingVertical: 8,
    },
    categoryScroll: {
      paddingHorizontal: 8,
    },
    categoryChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.background,
      marginRight: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryChipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    categoryChipText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    categoryChipTextSelected: {
      color: 'white',
    },
    unitScroll: {
      paddingHorizontal: 8,
    },
    unitChip: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      backgroundColor: colors.background,
      marginRight: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    unitChipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    unitChipText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    unitChipTextSelected: {
      color: 'white',
    },
    pricingSection: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    priceInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.background,
    },
    priceInput: {
      flex: 1,
      paddingVertical: 12,
      paddingLeft: 8,
      fontSize: 16,
      color: colors.text,
    },
    profitMarginContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    profitMarginLabel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    profitMarginValue: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.success,
    },
    vendorScroll: {
      paddingVertical: 8,
    },
    vendorChip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: colors.background,
      marginRight: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    vendorChipSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    vendorChipText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    vendorChipTextSelected: {
      color: 'white',
    },
    switchContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
    },
    switchDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    actions: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      paddingBottom: 34,
      paddingTop: 20,
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 16,
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
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 16,
      borderRadius: 8,
      backgroundColor: colors.primary,
      gap: 8,
    },
    saveButtonDisabled: {
      backgroundColor: colors.textSecondary,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: 'white',
    },
  });
}