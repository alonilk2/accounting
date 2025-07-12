import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  MenuItem,
  Box,
  Stack,
  Divider,
  Typography,
  InputAdornment,
} from '@mui/material';
import { useUIStore } from '../../stores';
import { ModernButton } from '../ui';
import type { Item } from '../../types/entities';

interface ItemFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (itemData: Omit<Item, 'id' | 'companyId' | 'createdAt' | 'updatedAt' | 'cost' | 'price'>) => Promise<void>;
  item?: Item | null;
  loading?: boolean;
}

const ItemFormDialog = ({ open, onClose, onSave, item, loading = false }: ItemFormDialogProps) => {
  const { language } = useUIStore();
  
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    nameHebrew: '',
    description: '',
    category: '',
    unit: 'piece',
    costPrice: 0,
    sellPrice: 0,
    currentStockQty: 0,
    reorderPoint: 0,
    maxStockLevel: 0,
    itemType: 'Product',
    isInventoryTracked: true,
    isActive: true,
    isSellable: true,
    isPurchasable: true,
    weight: 0,
    volume: 0,
    barcode: '',
    imageUrl: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (item) {
      setFormData({
        sku: item.sku,
        name: item.name,
        nameHebrew: item.nameHebrew || '',
        description: item.description || '',
        category: item.category || '',
        unit: item.unit,
        costPrice: item.costPrice,
        sellPrice: item.sellPrice,
        currentStockQty: item.currentStockQty,
        reorderPoint: item.reorderPoint,
        maxStockLevel: item.maxStockLevel,
        itemType: item.itemType,
        isInventoryTracked: item.isInventoryTracked,
        isActive: item.isActive,
        isSellable: item.isSellable,
        isPurchasable: item.isPurchasable,
        weight: item.weight || 0,
        volume: item.volume || 0,
        barcode: item.barcode || '',
        imageUrl: item.imageUrl || '',
      });
    } else {
      // Reset form for new item
      setFormData({
        sku: '',
        name: '',
        nameHebrew: '',
        description: '',
        category: '',
        unit: 'piece',
        costPrice: 0,
        sellPrice: 0,
        currentStockQty: 0,
        reorderPoint: 0,
        maxStockLevel: 0,
        itemType: 'Product',
        isInventoryTracked: true,
        isActive: true,
        isSellable: true,
        isPurchasable: true,
        weight: 0,
        volume: 0,
        barcode: '',
        imageUrl: '',
      });
    }
    setErrors({});
  }, [item, open]);

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.sku.trim()) {
      newErrors.sku = language === 'he' ? 'מק״ט חובה' : 'SKU is required';
    }
    if (!formData.name.trim()) {
      newErrors.name = language === 'he' ? 'שם המוצר חובה' : 'Product name is required';
    }
    if (formData.sellPrice < 0) {
      newErrors.sellPrice = language === 'he' ? 'מחיר מכירה לא יכול להיות שלילי' : 'Sell price cannot be negative';
    }
    if (formData.costPrice < 0) {
      newErrors.costPrice = language === 'he' ? 'מחיר עלות לא יכול להיות שלילי' : 'Cost price cannot be negative';
    }
    if (formData.currentStockQty < 0) {
      newErrors.currentStockQty = language === 'he' ? 'כמות במלאי לא יכולה להיות שלילית' : 'Stock quantity cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const unitOptions = [
    { value: 'piece', label: language === 'he' ? 'יחידה' : 'Piece' },
    { value: 'kg', label: language === 'he' ? 'קילוגרם' : 'Kilogram' },
    { value: 'liter', label: language === 'he' ? 'ליטר' : 'Liter' },
    { value: 'meter', label: language === 'he' ? 'מטר' : 'Meter' },
    { value: 'box', label: language === 'he' ? 'קופסה' : 'Box' },
    { value: 'pack', label: language === 'he' ? 'אריזה' : 'Pack' },
  ];

  const itemTypeOptions = [
    { value: 'Product', label: language === 'he' ? 'מוצר' : 'Product' },
    { value: 'Service', label: language === 'he' ? 'שירות' : 'Service' },
    { value: 'Assembly', label: language === 'he' ? 'מוצר מורכב' : 'Assembly' },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {item 
          ? (language === 'he' ? 'עריכת מוצר' : 'Edit Item')
          : (language === 'he' ? 'מוצר חדש' : 'New Item')
        }
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 2 }}>
          {/* Basic Information */}
          <Box>
            <Typography variant="h6" color="primary" gutterBottom>
              {language === 'he' ? 'מידע בסיסי' : 'Basic Information'}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label={language === 'he' ? 'מק״ט' : 'SKU'}
                  value={formData.sku}
                  onChange={(e) => handleChange('sku', e.target.value)}
                  error={!!errors.sku}
                  helperText={errors.sku}
                  required
                />
                <TextField
                  fullWidth
                  label={language === 'he' ? 'שם המוצר' : 'Product Name'}
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  error={!!errors.name}
                  helperText={errors.name}
                  required
                />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  label={language === 'he' ? 'שם בעברית' : 'Hebrew Name'}
                  value={formData.nameHebrew}
                  onChange={(e) => handleChange('nameHebrew', e.target.value)}
                />
                <TextField
                  fullWidth
                  label={language === 'he' ? 'קטגוריה' : 'Category'}
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                />
              </Box>
              
              <TextField
                fullWidth
                multiline
                rows={3}
                label={language === 'he' ? 'תיאור' : 'Description'}
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            </Stack>
          </Box>

          {/* Pricing */}
          <Box>
            <Typography variant="h6" color="primary" gutterBottom>
              {language === 'he' ? 'תמחור' : 'Pricing'}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                select
                label={language === 'he' ? 'יחידת מידה' : 'Unit of Measure'}
                value={formData.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
                sx={{ minWidth: 150 }}
              >
                {unitOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
              
              <TextField
                fullWidth
                type="number"
                label={language === 'he' ? 'מחיר עלות' : 'Cost Price'}
                value={formData.costPrice}
                onChange={(e) => handleChange('costPrice', parseFloat(e.target.value) || 0)}
                error={!!errors.costPrice}
                helperText={errors.costPrice}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                }}
              />
              
              <TextField
                fullWidth
                type="number"
                label={language === 'he' ? 'מחיר מכירה' : 'Sell Price'}
                value={formData.sellPrice}
                onChange={(e) => handleChange('sellPrice', parseFloat(e.target.value) || 0)}
                error={!!errors.sellPrice}
                helperText={errors.sellPrice}
                InputProps={{
                  startAdornment: <InputAdornment position="start">₪</InputAdornment>,
                }}
              />
            </Box>
          </Box>

          {/* Inventory */}
          <Box>
            <Typography variant="h6" color="primary" gutterBottom>
              {language === 'he' ? 'מלאי' : 'Inventory'}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                type="number"
                label={language === 'he' ? 'כמות במלאי' : 'Current Stock'}
                value={formData.currentStockQty}
                onChange={(e) => handleChange('currentStockQty', parseFloat(e.target.value) || 0)}
                error={!!errors.currentStockQty}
                helperText={errors.currentStockQty}
              />
              
              <TextField
                fullWidth
                type="number"
                label={language === 'he' ? 'נקודת הזמנה מחדש' : 'Reorder Point'}
                value={formData.reorderPoint}
                onChange={(e) => handleChange('reorderPoint', parseFloat(e.target.value) || 0)}
              />
              
              <TextField
                fullWidth
                type="number"
                label={language === 'he' ? 'מלאי מקסימלי' : 'Max Stock Level'}
                value={formData.maxStockLevel}
                onChange={(e) => handleChange('maxStockLevel', parseFloat(e.target.value) || 0)}
              />
            </Box>
          </Box>

          {/* Additional Properties */}
          <Box>
            <Typography variant="h6" color="primary" gutterBottom>
              {language === 'he' ? 'מאפיינים נוספים' : 'Additional Properties'}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  select
                  label={language === 'he' ? 'סוג מוצר' : 'Item Type'}
                  value={formData.itemType}
                  onChange={(e) => handleChange('itemType', e.target.value)}
                  sx={{ minWidth: 150 }}
                >
                  {itemTypeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
                
                <TextField
                  fullWidth
                  label={language === 'he' ? 'ברקוד' : 'Barcode'}
                  value={formData.barcode}
                  onChange={(e) => handleChange('barcode', e.target.value)}
                />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  type="number"
                  label={language === 'he' ? 'משקל (ק״ג)' : 'Weight (kg)'}
                  value={formData.weight}
                  onChange={(e) => handleChange('weight', parseFloat(e.target.value) || 0)}
                />
                
                <TextField
                  fullWidth
                  type="number"
                  label={language === 'he' ? 'נפח (ליטר)' : 'Volume (L)'}
                  value={formData.volume}
                  onChange={(e) => handleChange('volume', parseFloat(e.target.value) || 0)}
                />
              </Box>
              
              <TextField
                fullWidth
                label={language === 'he' ? 'קישור לתמונה' : 'Image URL'}
                value={formData.imageUrl}
                onChange={(e) => handleChange('imageUrl', e.target.value)}
              />
            </Stack>
          </Box>

          {/* Settings */}
          <Box>
            <Typography variant="h6" color="primary" gutterBottom>
              {language === 'he' ? 'הגדרות' : 'Settings'}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) => handleChange('isActive', e.target.checked)}
                  />
                }
                label={language === 'he' ? 'פעיל' : 'Active'}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isInventoryTracked}
                    onChange={(e) => handleChange('isInventoryTracked', e.target.checked)}
                  />
                }
                label={language === 'he' ? 'מעקב מלאי' : 'Track Inventory'}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isSellable}
                    onChange={(e) => handleChange('isSellable', e.target.checked)}
                  />
                }
                label={language === 'he' ? 'ניתן למכירה' : 'Sellable'}
              />
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPurchasable}
                    onChange={(e) => handleChange('isPurchasable', e.target.checked)}
                  />
                }
                label={language === 'he' ? 'ניתן לרכישה' : 'Purchasable'}
              />
            </Box>
          </Box>
        </Stack>
      </DialogContent>
      
      <DialogActions>
        <ModernButton onClick={onClose} color="inherit">
          {language === 'he' ? 'ביטול' : 'Cancel'}
        </ModernButton>
        <ModernButton 
          onClick={handleSubmit} 
          variant="primary" 
          loading={loading}
        >
          {language === 'he' ? 'שמירה' : 'Save'}
        </ModernButton>
      </DialogActions>
    </Dialog>
  );
};

export default ItemFormDialog;
