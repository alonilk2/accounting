import React, { useState } from 'react';
import {
  Fab,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Box,
  alpha,
  useTheme,
  Divider,
  Typography,
  Fade,
} from '@mui/material';
import {
  Add as AddIcon,
  Receipt as ReceiptIcon,
  Description as InvoiceIcon,
  ShoppingCart as PurchaseIcon,
  Payment as PaymentIcon,
  LocalShipping as ShippingIcon,
  Assignment as OrderIcon,
  RequestQuote as QuoteIcon,
  MonetizationOn as ReceiptPaymentIcon,
} from '@mui/icons-material';
import { useUIStore, useAIAssistantStore, useAuthStore } from '../../stores';
import InvoiceCreateDialog from '../invoices/InvoiceCreateDialog';
import { PurchaseInvoiceDialog } from '../purchasing/PurchaseInvoiceDialog';
import TaxInvoiceReceiptCreateDialog from '../taxInvoiceReceipts/TaxInvoiceReceiptCreateDialog';
import CreateQuoteDialog from '../quotes/CreateQuoteDialog';
import ReceiptCreateDialog from '../receipts/ReceiptCreateDialog';
import { useNavigate } from 'react-router-dom';

const DocumentCreationFab: React.FC = () => {
  const theme = useTheme();
  const { company } = useAuthStore();
  const { language } = useUIStore();
  const { isOpen: isAIOpen } = useAIAssistantStore();
  const navigate = useNavigate();
  const isRTL = language === 'he';
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showPurchaseInvoiceDialog, setShowPurchaseInvoiceDialog] = useState(false);
  const [showTaxInvoiceReceiptDialog, setShowTaxInvoiceReceiptDialog] = useState(false);
  const [showQuoteDialog, setShowQuoteDialog] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const actions = [
    {
      icon: <InvoiceIcon />,
      name: language === 'he' ? 'חשבונית חדשה' : 'New Invoice',
      onClick: () => {
        setShowInvoiceDialog(true);
        handleClose();
      },
    },
    {
      icon: <QuoteIcon />,
      name: language === 'he' ? 'הצעת מחיר' : 'Quote',
      onClick: () => {
        setShowQuoteDialog(true);
        handleClose();
      },
    },
    {
      icon: <OrderIcon />,
      name: language === 'he' ? 'הזמנה' : 'Sales Order',
      onClick: () => {
        navigate('/sales-orders?action=create&type=Confirmed');
        handleClose();
      },
    },
    {
      icon: <ShippingIcon />,
      name: language === 'he' ? 'תעודת משלוח' : 'Delivery Note',
      onClick: () => {
        navigate('/delivery-notes?action=create');
        handleClose();
      },
    },
    {
      icon: <ReceiptIcon />,
      name: language === 'he' ? 'חשבונית מס-קבלה' : 'Tax Invoice Receipt',
      onClick: () => {
        setShowTaxInvoiceReceiptDialog(true);
        handleClose();
      },
    },
    {
      icon: <ReceiptPaymentIcon />,
      name: language === 'he' ? 'קבלה' : 'Receipt',
      onClick: () => {
        setShowReceiptDialog(true);
        handleClose();
      },
    },
    {
      icon: <PurchaseIcon />,
      name: language === 'he' ? 'חשבונית רכש' : 'Purchase Invoice',
      onClick: () => {
        setShowPurchaseInvoiceDialog(true);
        handleClose();
      },
    },
    {
      icon: <PaymentIcon />,
      name: language === 'he' ? 'הזמנת רכש' : 'Purchase Order',
      onClick: () => {
        navigate('/purchases'); // Navigate to purchases page where purchase orders can be created
        handleClose();
      },
    },
  ];

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          bottom: 32, // אותה גובה כמו AI Assistant FAB
          ...(isRTL 
            ? { left: isAIOpen ? 496 : 108 } // אם AI פתוח - מחוץ לDrawer (420 + 76px), אחרת לצד AI FAB (108px)
            : { right: isAIOpen ? 496 : 108 }
          ),
          zIndex: 1200,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // אנימציה חלקה
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <Fab
            onClick={handleClick}
            title={language === 'he' ? 'צור מסמך חדש' : 'Create new document'}
            sx={{
              width: 64,
              height: 64,
              // Glass effect background
              background: theme.palette.mode === 'dark' 
                ? 'rgba(25, 118, 210, 0.15)'
                : 'rgba(25, 118, 210, 0.1)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${theme.palette.mode === 'dark' 
                ? 'rgba(25, 118, 210, 0.3)' 
                : 'rgba(25, 118, 210, 0.2)'}`,
              color: theme.palette.mode === 'dark' ? '#42a5f5' : '#1976d2',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 32px rgba(25, 118, 210, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                : '0 8px 32px rgba(25, 118, 210, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                background: theme.palette.mode === 'dark' 
                  ? 'rgba(25, 118, 210, 0.25)'
                  : 'rgba(25, 118, 210, 0.2)',
                transform: 'translateY(-4px) scale(1.05)',
                boxShadow: theme.palette.mode === 'dark'
                  ? '0 12px 40px rgba(25, 118, 210, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
                  : '0 12px 40px rgba(25, 118, 210, 0.3), inset 0 1px 0 rgba(255, 255, 255, 1)',
                border: `1px solid ${theme.palette.mode === 'dark' 
                  ? 'rgba(25, 118, 210, 0.5)' 
                  : 'rgba(25, 118, 210, 0.4)'}`,
              },
              '&:active': {
                transform: 'translateY(-2px) scale(1.02)',
              },
              // Glass shine effect
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                borderRadius: 'inherit',
                pointerEvents: 'none',
                opacity: 0.7,
                transition: 'opacity 0.3s ease',
              },
              // Additional glow on hover
              '&:hover::after': {
                content: '""',
                position: 'absolute',
                top: -2,
                left: -2,
                right: -2,
                bottom: -2,
                background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
                borderRadius: 'inherit',
                zIndex: -1,
                opacity: 0.1,
                filter: 'blur(4px)',
              },
            }}
          >
            <AddIcon sx={{ fontSize: 28 }} />
          </Fab>
          
          <Typography 
            variant="caption" 
            sx={{ 
              fontWeight: 600, 
              color: theme.palette.mode === 'dark' ? '#42a5f5' : '#1976d2',
              textAlign: 'center',
              fontSize: '0.75rem',
              lineHeight: 1,
              textShadow: theme.palette.mode === 'dark' 
                ? '0 1px 2px rgba(0,0,0,0.5)'
                : '0 1px 2px rgba(255,255,255,0.8)',
            }}
          >
            {language === 'he' ? 'צור מסמך' : 'Create'}
          </Typography>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
          TransitionComponent={Fade}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'center',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'center',
          }}
          PaperProps={{
            elevation: 0,
            sx: {
              overflow: 'visible',
              mb: 1, // margin bottom במקום margin top
              borderRadius: 3,
              minWidth: 220,
              // Glass effect for menu
              background: theme.palette.mode === 'dark' 
                ? 'rgba(18, 18, 18, 0.8)'
                : 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(20px)',
              border: `1px solid ${theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(0, 0, 0, 0.1)'}`,
              boxShadow: theme.palette.mode === 'dark'
                ? '0 12px 48px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                : '0 12px 48px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
              '&:after': { // after במקום before כדי שיהיה למטה
                content: '""',
                display: 'block',
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%) translateY(50%) rotate(45deg)',
                width: 10,
                height: 10,
                bgcolor: theme.palette.mode === 'dark' 
                  ? 'rgba(18, 18, 18, 0.8)'
                  : 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(20px)',
                zIndex: 0,
                border: `1px solid ${theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(0, 0, 0, 0.1)'}`,
              },
            },
          }}
        >
          <Box sx={{ py: 1 }}>
            <Typography 
              variant="overline" 
              sx={{ 
                px: 2, 
                color: 'text.secondary',
                fontWeight: 700,
                letterSpacing: '0.1em',
              }}
            >
              {language === 'he' ? 'מסמכים חדשים' : 'NEW DOCUMENTS'}
            </Typography>
            <Divider sx={{ my: 1 }} />
            {actions.map((action) => (
              <MenuItem
                key={action.name}
                onClick={action.onClick}
                sx={{
                  mx: 1,
                  my: 0.5,
                  borderRadius: 2,
                  minHeight: 48,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    background: alpha(theme.palette.primary.main, 0.12),
                    transform: 'translateX(4px)',
                    borderLeft: `3px solid ${theme.palette.primary.main}`,
                  },
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 36,
                  color: theme.palette.primary.main,
                }}>
                  {action.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={action.name}
                  sx={{
                    '& .MuiListItemText-primary': {
                      fontWeight: 500,
                      fontSize: '0.875rem',
                    },
                  }}
                />
              </MenuItem>
            ))}
          </Box>
        </Menu>
      </Box>

      {/* Dialogs */}
      <InvoiceCreateDialog
        open={showInvoiceDialog}
        onClose={() => setShowInvoiceDialog(false)}
        onSuccess={() => setShowInvoiceDialog(false)}
      />

      <CreateQuoteDialog
        open={showQuoteDialog}
        onClose={() => setShowQuoteDialog(false)}
        onSuccess={() => setShowQuoteDialog(false)}
        companyId={company?.id || 1}
      />

      <PurchaseInvoiceDialog
        open={showPurchaseInvoiceDialog}
        onClose={() => setShowPurchaseInvoiceDialog(false)}
        onSave={() => setShowPurchaseInvoiceDialog(false)}
      />

      <TaxInvoiceReceiptCreateDialog
        open={showTaxInvoiceReceiptDialog}
        onClose={() => setShowTaxInvoiceReceiptDialog(false)}
        onSuccess={() => setShowTaxInvoiceReceiptDialog(false)}
      />

      <ReceiptCreateDialog
        open={showReceiptDialog}
        onClose={() => setShowReceiptDialog(false)}
        onSuccess={() => setShowReceiptDialog(false)}
      />
    </>
  );
};

export default DocumentCreationFab;
