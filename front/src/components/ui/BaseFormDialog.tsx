import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Alert,
  CircularProgress,
  Typography
} from '@mui/material';
import { dialogStyles, buttonStyles } from '../styles/formStyles';

interface BaseFormDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  onSave?: () => void;
  loading?: boolean;
  error?: string;
  saveText?: string;
  cancelText?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  language?: 'he' | 'en';
}

/**
 * Reusable form dialog component that provides consistent layout and behavior
 * Reduces code duplication across CRUD dialogs
 */
export const BaseFormDialog: React.FC<BaseFormDialogProps> = ({
  open,
  onClose,
  title,
  children,
  onSave,
  loading = false,
  error,
  saveText,
  cancelText,
  maxWidth = 'md',
  language = 'he'
}) => {
  const defaultSaveText = language === 'he' ? 'שמור' : 'Save';
  const defaultCancelText = language === 'he' ? 'ביטול' : 'Cancel';

  return (
    <Dialog 
      open={open} 
      onClose={!loading ? onClose : undefined}
      maxWidth={maxWidth} 
      fullWidth 
      sx={dialogStyles}
    >
      <DialogTitle sx={{ 
        fontSize: '1.5rem', 
        fontWeight: 600, 
        color: 'text.primary', 
        pb: 2,
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`
      }}>
        {title}
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => {}}>
            {error}
          </Alert>
        )}
        
        {loading ? (
          <Box sx={{ 
            display: "flex", 
            justifyContent: "center", 
            alignItems: "center", 
            minHeight: 200, 
            flexDirection: "column", 
            gap: 2 
          }}>
            <CircularProgress size={48} />
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
              {language === 'he' ? 'טוען...' : 'Loading...'}
            </Typography>
          </Box>
        ) : (
          children
        )}
      </DialogContent>
      
      <DialogActions sx={{ p: 3, gap: 2, borderTop: (theme) => `1px solid ${theme.palette.divider}` }}>
        <Button 
          variant="outlined" 
          onClick={onClose}
          disabled={loading}
          sx={buttonStyles.secondary}
        >
          {cancelText || defaultCancelText}
        </Button>
        
        {onSave && (
          <Button 
            variant="contained" 
            onClick={onSave}
            disabled={loading}
            sx={buttonStyles.primary}
          >
            {saveText || defaultSaveText}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default BaseFormDialog;