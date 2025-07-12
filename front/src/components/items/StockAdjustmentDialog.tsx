import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Alert,
  Box,
} from '@mui/material';
import { useUIStore } from '../../stores';
import { ModernButton } from '../ui';
import type { Item } from '../../types/entities';

interface StockAdjustmentDialogProps {
  open: boolean;
  onClose: () => void;
  onAdjust: (quantityChange: number, reason: string) => Promise<void>;
  item: Item | null;
  loading?: boolean;
}

const StockAdjustmentDialog = ({ open, onClose, onAdjust, item, loading = false }: StockAdjustmentDialogProps) => {
  const { language } = useUIStore();
  
  const [quantityChange, setQuantityChange] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleClose = () => {
    setQuantityChange(0);
    setReason('');
    setErrors({});
    onClose();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (quantityChange === 0) {
      newErrors.quantityChange = language === 'he' ? 'יש להזין כמות' : 'Quantity change is required';
    }
    if (!reason.trim()) {
      newErrors.reason = language === 'he' ? 'יש להזין סיבה' : 'Reason is required';
    }
    if (item && (item.currentStockQty + quantityChange) < 0) {
      newErrors.quantityChange = language === 'he' ? 'לא ניתן לקבל מלאי שלילי' : 'Cannot result in negative stock';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await onAdjust(quantityChange, reason);
      handleClose();
    } catch (error) {
      console.error('Error adjusting stock:', error);
    }
  };

  if (!item) return null;

  const newStock = item.currentStockQty + quantityChange;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {language === 'he' ? 'עדכון מלאי' : 'Stock Adjustment'}
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>{item.name}</strong> ({item.sku})
            </Typography>
            <Typography variant="body2">
              {language === 'he' ? 'מלאי נוכחי: ' : 'Current Stock: '}{item.currentStockQty} {item.unit}
            </Typography>
          </Alert>
          
          <TextField
            fullWidth
            type="number"
            label={language === 'he' ? 'שינוי בכמות' : 'Quantity Change'}
            value={quantityChange}
            onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              setQuantityChange(value);
              if (errors.quantityChange) {
                setErrors(prev => ({ ...prev, quantityChange: '' }));
              }
            }}
            error={!!errors.quantityChange}
            helperText={errors.quantityChange || (language === 'he' ? 'מספר חיובי להוספה, שלילי להפחתה' : 'Positive to add, negative to subtract')}
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            multiline
            rows={3}
            label={language === 'he' ? 'סיבה' : 'Reason'}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (errors.reason) {
                setErrors(prev => ({ ...prev, reason: '' }));
              }
            }}
            error={!!errors.reason}
            helperText={errors.reason}
            placeholder={language === 'he' ? 'למשל: ספירת מלאי, פגם, גניבה...' : 'e.g., Stock count, Damage, Theft...'}
            sx={{ mb: 2 }}
          />
          
          {quantityChange !== 0 && (
            <Alert severity={newStock < 0 ? "error" : newStock < item.reorderPoint ? "warning" : "success"}>
              <Typography variant="body2">
                {language === 'he' ? 'מלאי חדש: ' : 'New Stock: '}
                <strong>{newStock} {item.unit}</strong>
              </Typography>
              {newStock < 0 && (
                <Typography variant="body2" color="error">
                  {language === 'he' ? 'אזהרה: מלאי שלילי!' : 'Warning: Negative stock!'}
                </Typography>
              )}
              {newStock >= 0 && newStock < item.reorderPoint && (
                <Typography variant="body2" color="warning">
                  {language === 'he' ? 'אזהרה: מתחת לנקודת הזמנה מחדש!' : 'Warning: Below reorder point!'}
                </Typography>
              )}
            </Alert>
          )}
        </Box>
      </DialogContent>
      
      <DialogActions>
        <ModernButton onClick={handleClose} color="inherit">
          {language === 'he' ? 'ביטול' : 'Cancel'}
        </ModernButton>
        <ModernButton 
          onClick={handleSubmit} 
          variant="primary" 
          loading={loading}
        >
          {language === 'he' ? 'עדכן מלאי' : 'Update Stock'}
        </ModernButton>
      </DialogActions>
    </Dialog>
  );
};

export default StockAdjustmentDialog;
